import type { TransportData, EnergyData, FoodData, ShoppingData, CarbonBreakdown } from './types';

// kg CO2e per unit — sourced from EPA, IPCC, and Our World in Data
const EMISSION_FACTORS = {
  transport: {
    car: {
      gasoline: 0.404, // kg CO2e per mile
      hybrid: 0.200,
      electric: 0.095,
      diesel: 0.350,
      none: 0,
    },
    flight: {
      none: 0,
      short: 0.255,  // kg CO2e per mile (< 3hr)
      mixed: 0.220,
      long: 0.195,   // kg CO2e per mile (> 6hr, more efficient per mile)
    },
    publicTransit: 0.089, // kg CO2e per mile (average bus/rail mix)
  },
  energy: {
    electricity: 0.386,   // kg CO2e per kWh (US avg grid)
    naturalGas: 5.3,      // kg CO2e per therm
    renewableDiscount: 0.15, // factor: 85% reduction
  },
  food: {
    vegan: 1500,
    vegetarian: 1700,
    pescatarian: 2000,
    low_meat: 2500,
    average_meat: 3300,
    high_meat: 4500,
  },
  foodWaste: {
    minimal: 0.95,
    average: 1.0,
    significant: 1.15,
  },
  diet: {
    // additional beef penalty kg CO2e per serving/week/year
    beefPerServing: 72, // ~1kg beef = 99kg CO2e, serving ~0.25kg = ~25kg/year for 1x/week
    dairyPerServing: 8, // 1 dairy serving/day/year
  },
  shopping: {
    minimal: 500,
    average: 1200,
    frequent: 2500,
    clothingPerItem: 15,     // kg CO2e per clothing item
    electronicsPerItem: 300, // kg CO2e per electronic device
  },
};

const AVERAGE_ANNUAL_FLIGHT_MILES: Record<string, number> = {
  none: 0,
  short: 2000,
  mixed: 8000,
  long: 20000,
};

/**
 * Calculates annual transport emissions from car, flight, and public transit usage.
 * @param data - Transport inputs (car type, weekly miles, flight category, transit miles)
 * @returns Annual transport emissions in tonnes CO2e, rounded to 2 decimals
 */
export function calculateTransportEmissions(data: TransportData): number {
  const carFactor = EMISSION_FACTORS.transport.car[data.carType] ?? 0;
  const carAnnualMiles = data.carMilesPerWeek * 52;
  const carEmissions = carAnnualMiles * carFactor;

  const flightFactor = EMISSION_FACTORS.transport.flight[data.flightType] ?? 0;
  const annualFlightMiles = AVERAGE_ANNUAL_FLIGHT_MILES[data.flightType] ?? 0;
  const flightEmissions = annualFlightMiles * flightFactor;

  const transitEmissions = data.publicTransitMilesPerWeek * 52 * EMISSION_FACTORS.transport.publicTransit;

  return Math.round((carEmissions + flightEmissions + transitEmissions) / 1000 * 100) / 100; // return in tonnes
}

/**
 * Calculates annual per-person home energy emissions from electricity and natural gas.
 * Applies a renewable-energy discount, a home-size multiplier, then divides by household size.
 * @param data - Energy inputs (monthly kWh/therms, home size, household size, renewable flag)
 * @returns Annual per-person energy emissions in tonnes CO2e, rounded to 2 decimals
 */
export function calculateEnergyEmissions(data: EnergyData): number {
  let electricityEmissions = data.electricityKwhPerMonth * 12 * EMISSION_FACTORS.energy.electricity;
  if (data.renewableEnergy) {
    electricityEmissions *= EMISSION_FACTORS.energy.renewableDiscount;
  }

  const gasEmissions = data.naturalGasThermPerMonth * 12 * EMISSION_FACTORS.energy.naturalGas;

  const homeSizeMultiplier = { small: 0.75, medium: 1.0, large: 1.4 }[data.homeSize] ?? 1.0;
  const perPerson = (electricityEmissions + gasEmissions) * homeSizeMultiplier / data.householdSize;
  return Math.round(perPerson / 1000 * 100) / 100; // tonnes per person
}

/**
 * Calculates annual food & diet emissions from a diet baseline, adjusted for food waste,
 * local sourcing, and (for meat-eaters) beef and dairy consumption.
 * @param data - Food inputs (diet type, beef/dairy servings, waste level, local sourcing)
 * @returns Annual food emissions in tonnes CO2e, rounded to 2 decimals
 */
export function calculateFoodEmissions(data: FoodData): number {
  const baseDietKg = EMISSION_FACTORS.food[data.diet] ?? EMISSION_FACTORS.food.average_meat;

  const wasteFactor = EMISSION_FACTORS.foodWaste[data.foodWaste] ?? 1.0;

  const localFoodDiscount = {
    always: 0.85,
    often: 0.92,
    sometimes: 0.97,
    rarely: 1.0,
  }[data.localFood] ?? 1.0;

  const meatDiets = new Set(['low_meat', 'average_meat', 'high_meat']);
  const beefBonus = meatDiets.has(data.diet)
    ? data.beefServingsPerWeek * EMISSION_FACTORS.diet.beefPerServing
    : 0;
  const dairyBonus = data.dairyServingsPerDay * EMISSION_FACTORS.diet.dairyPerServing * 365;

  const adjusted = baseDietKg * wasteFactor * localFoodDiscount + beefBonus + dairyBonus;
  return Math.round(adjusted / 1000 * 100) / 100; // tonnes
}

/**
 * Calculates annual consumption emissions from general shopping, clothing, and electronics,
 * discounted by recycling habits.
 * @param data - Shopping inputs (frequency, clothing/electronics counts, recycling level)
 * @returns Annual shopping emissions in tonnes CO2e, rounded to 2 decimals
 */
export function calculateShoppingEmissions(data: ShoppingData): number {
  const baseKg = EMISSION_FACTORS.shopping[data.shoppingFrequency] ?? EMISSION_FACTORS.shopping.average;
  const clothingKg = data.clothingItemsPerMonth * 12 * EMISSION_FACTORS.shopping.clothingPerItem;
  const electronicsKg = data.newElectronicsPerYear * EMISSION_FACTORS.shopping.electronicsPerItem;

  const recyclingDiscount = {
    thorough: 0.85,
    moderate: 0.95,
    minimal: 1.0,
  }[data.recyclingHabits] ?? 1.0;

  const total = (baseKg + clothingKg + electronicsKg) * recyclingDiscount;
  return Math.round(total / 1000 * 100) / 100; // tonnes
}

/**
 * Aggregates all four emission categories into a complete annual carbon breakdown.
 * @returns A {@link CarbonBreakdown} with per-category tonnes and a summed total
 */
export function calculateFullBreakdown(
  transport: TransportData,
  energy: EnergyData,
  food: FoodData,
  shopping: ShoppingData
): CarbonBreakdown {
  const t = calculateTransportEmissions(transport);
  const e = calculateEnergyEmissions(energy);
  const f = calculateFoodEmissions(food);
  const s = calculateShoppingEmissions(shopping);
  return {
    transport: t,
    energy: e,
    food: f,
    shopping: s,
    total: Math.round((t + e + f + s) * 100) / 100,
  };
}

/** Per-capita annual CO2e averages (tonnes) for benchmarking. Source: Our World in Data / IEA. */
export const GLOBAL_AVERAGES = {
  world: 4.7,
  usa: 16.0,
  eu: 8.3,
  india: 1.9,
};

/**
 * Translates a carbon total into relatable real-world equivalences.
 * @param totalTonnes - Annual footprint in tonnes CO2e
 * @returns Equivalence figures (trees to offset, gas-car miles, flights, smartphone charges, etc.)
 */
export function getEquivalences(totalTonnes: number) {
  const kg = totalTonnes * 1000;
  return {
    treesNeeded: Math.round(totalTonnes * 45),           // ~45 trees per tonne/year
    milesDriven: Math.round(kg / 0.404),                 // gasoline car miles
    flightsNYtoLA: Math.round(totalTonnes / 0.56),       // NY-LA ~0.56 tonnes
    homeEnergyDays: Math.round(kg / 17.2),               // avg US home ~17.2 kg/day
    smartphoneCharges: Math.round(kg / 0.008),           // ~8g per charge
  };
}

/**
 * Maps a carbon total to a qualitative rating band (Excellent → Very High)
 * with an associated color, 0–100 score, and encouraging message.
 * @param totalTonnes - Annual footprint in tonnes CO2e
 */
export function getCarbonRating(totalTonnes: number): {
  label: string;
  color: string;
  score: number;
  message: string;
} {
  if (totalTonnes <= 2) return { label: 'Excellent', color: '#10b981', score: 95, message: 'Well below the sustainable target of 2t/year!' };
  if (totalTonnes <= 4) return { label: 'Good', color: '#22c55e', score: 80, message: 'Below the global average. Keep it up!' };
  if (totalTonnes <= 7) return { label: 'Average', color: '#f59e0b', score: 60, message: 'Near the global average. Room to improve.' };
  if (totalTonnes <= 12) return { label: 'High', color: '#f97316', score: 35, message: 'Above average. Focus on your biggest categories.' };
  return { label: 'Very High', color: '#ef4444', score: 15, message: 'Significant reduction needed. Start with transport and energy.' };
}

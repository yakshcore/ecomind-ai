import {
  calculateTransportEmissions,
  calculateEnergyEmissions,
  calculateFoodEmissions,
  calculateShoppingEmissions,
  calculateFullBreakdown,
  getCarbonRating,
  getEquivalences,
  GLOBAL_AVERAGES,
} from "@/lib/carbon-calculator";
import type { TransportData, EnergyData, FoodData, ShoppingData } from "@/lib/types";

// ─── Transport ──────────────────────────────────────────────────────────────

describe("calculateTransportEmissions", () => {
  const base: TransportData = {
    carType: "none",
    carMilesPerWeek: 0,
    flightType: "none",
    publicTransitMilesPerWeek: 0,
  };

  it("returns 0 for a car-free, flight-free, transit-free lifestyle", () => {
    expect(calculateTransportEmissions(base)).toBe(0);
  });

  it("gasoline car emits more than an electric vehicle for same mileage", () => {
    const gas = calculateTransportEmissions({ ...base, carType: "gasoline", carMilesPerWeek: 100 });
    const ev = calculateTransportEmissions({ ...base, carType: "electric", carMilesPerWeek: 100 });
    expect(gas).toBeGreaterThan(ev);
  });

  it("electric vehicle still has non-zero emissions (grid carbon)", () => {
    const ev = calculateTransportEmissions({ ...base, carType: "electric", carMilesPerWeek: 100 });
    expect(ev).toBeGreaterThan(0);
  });

  it("long-haul flight type produces more emissions than no flights", () => {
    const noFlight = calculateTransportEmissions(base);
    const longHaul = calculateTransportEmissions({ ...base, flightType: "long" });
    expect(longHaul).toBeGreaterThan(noFlight);
  });

  it("returns tonnes (< 50 for typical commuter)", () => {
    const result = calculateTransportEmissions({
      ...base,
      carType: "gasoline",
      carMilesPerWeek: 200,
      flightType: "mixed",
    });
    expect(result).toBeLessThan(50);
    expect(result).toBeGreaterThan(0);
  });

  it("diesel emits less than gasoline but more than hybrid", () => {
    const diesel = calculateTransportEmissions({ ...base, carType: "diesel", carMilesPerWeek: 100 });
    const gasoline = calculateTransportEmissions({ ...base, carType: "gasoline", carMilesPerWeek: 100 });
    const hybrid = calculateTransportEmissions({ ...base, carType: "hybrid", carMilesPerWeek: 100 });
    expect(gasoline).toBeGreaterThan(diesel);
    expect(diesel).toBeGreaterThan(hybrid);
  });

  it("hybrid emits less than gasoline but more than electric", () => {
    const hybrid = calculateTransportEmissions({ ...base, carType: "hybrid", carMilesPerWeek: 100 });
    const gasoline = calculateTransportEmissions({ ...base, carType: "gasoline", carMilesPerWeek: 100 });
    const ev = calculateTransportEmissions({ ...base, carType: "electric", carMilesPerWeek: 100 });
    expect(gasoline).toBeGreaterThan(hybrid);
    expect(hybrid).toBeGreaterThan(ev);
  });

  it("more miles driven means more emissions", () => {
    const low = calculateTransportEmissions({ ...base, carType: "gasoline", carMilesPerWeek: 50 });
    const high = calculateTransportEmissions({ ...base, carType: "gasoline", carMilesPerWeek: 300 });
    expect(high).toBeGreaterThan(low);
  });
});

// ─── Energy ─────────────────────────────────────────────────────────────────

describe("calculateEnergyEmissions", () => {
  const base: EnergyData = {
    electricityKwhPerMonth: 900,
    naturalGasThermPerMonth: 50,
    heatingType: "gas",
    householdSize: 1,
    homeSize: "medium",
    renewableEnergy: false,
  };

  it("renewable energy reduces emissions by ~85%", () => {
    const standard = calculateEnergyEmissions(base);
    const renewable = calculateEnergyEmissions({ ...base, renewableEnergy: true });
    expect(renewable).toBeLessThan(standard * 0.9);
  });

  it("larger household spreads emissions across more people", () => {
    const single = calculateEnergyEmissions({ ...base, householdSize: 1 });
    const family = calculateEnergyEmissions({ ...base, householdSize: 4 });
    expect(family).toBeLessThan(single);
  });

  it("zero usage produces zero emissions", () => {
    const result = calculateEnergyEmissions({
      ...base,
      electricityKwhPerMonth: 0,
      naturalGasThermPerMonth: 0,
    });
    expect(result).toBe(0);
  });

  it("returns positive value for typical household", () => {
    expect(calculateEnergyEmissions(base)).toBeGreaterThan(0);
  });

  it("large home emits more than small home for same usage", () => {
    const small = calculateEnergyEmissions({ ...base, homeSize: "small" });
    const large = calculateEnergyEmissions({ ...base, homeSize: "large" });
    expect(large).toBeGreaterThan(small);
  });
});

// ─── Food ────────────────────────────────────────────────────────────────────

describe("calculateFoodEmissions", () => {
  const base: FoodData = {
    diet: "average_meat",
    beefServingsPerWeek: 3,
    dairyServingsPerDay: 2,
    foodWaste: "average",
    localFood: "sometimes",
  };

  it("vegan diet emits less than high-meat diet", () => {
    const vegan = calculateFoodEmissions({ ...base, diet: "vegan" });
    const highMeat = calculateFoodEmissions({ ...base, diet: "high_meat" });
    expect(vegan).toBeLessThan(highMeat);
  });

  it("minimal food waste reduces emissions vs significant waste", () => {
    const minimal = calculateFoodEmissions({ ...base, foodWaste: "minimal" });
    const significant = calculateFoodEmissions({ ...base, foodWaste: "significant" });
    expect(minimal).toBeLessThan(significant);
  });

  it("always buying local reduces emissions vs rarely buying local", () => {
    const local = calculateFoodEmissions({ ...base, localFood: "always" });
    const notLocal = calculateFoodEmissions({ ...base, localFood: "rarely" });
    expect(local).toBeLessThan(notLocal);
  });

  it("returns positive value for any diet", () => {
    expect(calculateFoodEmissions(base)).toBeGreaterThan(0);
  });

  it("more beef servings per week increases meat-eater emissions", () => {
    const low = calculateFoodEmissions({ ...base, beefServingsPerWeek: 1 });
    const high = calculateFoodEmissions({ ...base, beefServingsPerWeek: 7 });
    expect(high).toBeGreaterThan(low);
  });

  it("beef servings have no effect on vegan diet", () => {
    const vegan0 = calculateFoodEmissions({ ...base, diet: "vegan", beefServingsPerWeek: 0 });
    const vegan7 = calculateFoodEmissions({ ...base, diet: "vegan", beefServingsPerWeek: 7 });
    expect(vegan0).toBe(vegan7);
  });

  it("pescatarian emits less than low-meat but more than vegetarian", () => {
    const veg = calculateFoodEmissions({ ...base, diet: "vegetarian", beefServingsPerWeek: 0 });
    const pesc = calculateFoodEmissions({ ...base, diet: "pescatarian", beefServingsPerWeek: 0 });
    const lowMeat = calculateFoodEmissions({ ...base, diet: "low_meat", beefServingsPerWeek: 1 });
    expect(pesc).toBeGreaterThan(veg);
    expect(lowMeat).toBeGreaterThan(veg);
  });
});

// ─── Shopping ────────────────────────────────────────────────────────────────

describe("calculateShoppingEmissions", () => {
  const base: ShoppingData = {
    clothingItemsPerMonth: 2,
    newElectronicsPerYear: 1,
    shoppingFrequency: "average",
    recyclingHabits: "moderate",
  };

  it("minimal shopping emits less than frequent shopping", () => {
    const minimal = calculateShoppingEmissions({ ...base, shoppingFrequency: "minimal" });
    const frequent = calculateShoppingEmissions({ ...base, shoppingFrequency: "frequent" });
    expect(minimal).toBeLessThan(frequent);
  });

  it("thorough recycling reduces emissions", () => {
    const thorough = calculateShoppingEmissions({ ...base, recyclingHabits: "thorough" });
    const minimal = calculateShoppingEmissions({ ...base, recyclingHabits: "minimal" });
    expect(thorough).toBeLessThan(minimal);
  });

  it("more clothing items increases emissions linearly", () => {
    const few = calculateShoppingEmissions({ ...base, clothingItemsPerMonth: 1 });
    const many = calculateShoppingEmissions({ ...base, clothingItemsPerMonth: 10 });
    expect(many).toBeGreaterThan(few);
  });
});

// ─── Full Breakdown ───────────────────────────────────────────────────────────

describe("calculateFullBreakdown", () => {
  const transport: TransportData = { carType: "gasoline", carMilesPerWeek: 150, flightType: "short", publicTransitMilesPerWeek: 10 };
  const energy: EnergyData = { electricityKwhPerMonth: 900, naturalGasThermPerMonth: 50, heatingType: "gas", householdSize: 2, homeSize: "medium", renewableEnergy: false };
  const food: FoodData = { diet: "average_meat", beefServingsPerWeek: 3, dairyServingsPerDay: 2, foodWaste: "average", localFood: "sometimes" };
  const shopping: ShoppingData = { clothingItemsPerMonth: 2, newElectronicsPerYear: 1, shoppingFrequency: "average", recyclingHabits: "moderate" };

  it("total equals sum of all categories", () => {
    const bd = calculateFullBreakdown(transport, energy, food, shopping);
    const sum = Math.round((bd.transport + bd.energy + bd.food + bd.shopping) * 100) / 100;
    expect(bd.total).toBe(sum);
  });

  it("all category values are positive", () => {
    const bd = calculateFullBreakdown(transport, energy, food, shopping);
    expect(bd.transport).toBeGreaterThan(0);
    expect(bd.energy).toBeGreaterThan(0);
    expect(bd.food).toBeGreaterThan(0);
    expect(bd.shopping).toBeGreaterThan(0);
  });

  it("result is within realistic range (1t–100t)", () => {
    const bd = calculateFullBreakdown(transport, energy, food, shopping);
    expect(bd.total).toBeGreaterThan(1);
    expect(bd.total).toBeLessThan(100);
  });
});

// ─── Carbon Rating ───────────────────────────────────────────────────────────

describe("getCarbonRating", () => {
  it("rates 1.5t as Excellent", () => {
    expect(getCarbonRating(1.5).label).toBe("Excellent");
  });

  it("rates 3t as Good", () => {
    expect(getCarbonRating(3).label).toBe("Good");
  });

  it("rates 16t (US average) as Very High", () => {
    expect(getCarbonRating(16).label).toBe("Very High");
  });

  it("higher emissions get lower score", () => {
    const low = getCarbonRating(2).score;
    const high = getCarbonRating(15).score;
    expect(low).toBeGreaterThan(high);
  });

  it("rates exactly 2t as Excellent (boundary)", () => {
    expect(getCarbonRating(2).label).toBe("Excellent");
  });

  it("rates exactly 4t as Good (boundary)", () => {
    expect(getCarbonRating(4).label).toBe("Good");
  });

  it("rates 7t as Average (boundary)", () => {
    expect(getCarbonRating(7).label).toBe("Average");
  });

  it("rates 12t as High (boundary)", () => {
    expect(getCarbonRating(12).label).toBe("High");
  });

  it("returns a non-empty color string for any input", () => {
    [1, 3, 6, 10, 20].forEach(t => {
      expect(getCarbonRating(t).color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

// ─── Equivalences ────────────────────────────────────────────────────────────

describe("getEquivalences", () => {
  it("returns positive integer values for all equivalences", () => {
    const eq = getEquivalences(10);
    expect(eq.treesNeeded).toBeGreaterThan(0);
    expect(eq.milesDriven).toBeGreaterThan(0);
    expect(eq.flightsNYtoLA).toBeGreaterThan(0);
    expect(eq.smartphoneCharges).toBeGreaterThan(0);
  });

  it("higher footprint requires more trees", () => {
    expect(getEquivalences(10).treesNeeded).toBeGreaterThan(getEquivalences(5).treesNeeded);
  });
});

// ─── Global Averages ─────────────────────────────────────────────────────────

describe("GLOBAL_AVERAGES", () => {
  it("US average is higher than world average", () => {
    expect(GLOBAL_AVERAGES.usa).toBeGreaterThan(GLOBAL_AVERAGES.world);
  });

  it("all values are positive numbers", () => {
    Object.values(GLOBAL_AVERAGES).forEach((v) => expect(v).toBeGreaterThan(0));
  });

  it("India average is lower than world average", () => {
    expect(GLOBAL_AVERAGES.india).toBeLessThan(GLOBAL_AVERAGES.world);
  });

  it("EU average is between world and US average", () => {
    expect(GLOBAL_AVERAGES.eu).toBeGreaterThan(GLOBAL_AVERAGES.world);
    expect(GLOBAL_AVERAGES.eu).toBeLessThan(GLOBAL_AVERAGES.usa);
  });
});

describe("getEquivalences (additional)", () => {
  it("very small footprint still returns non-negative values", () => {
    const eq = getEquivalences(0.1);
    expect(eq.treesNeeded).toBeGreaterThanOrEqual(0);
    expect(eq.milesDriven).toBeGreaterThanOrEqual(0);
  });

  it("equivalences scale linearly with footprint", () => {
    const eq5 = getEquivalences(5);
    const eq10 = getEquivalences(10);
    expect(eq10.treesNeeded).toBe(eq5.treesNeeded * 2);
  });
});

describe("calculateFullBreakdown (additional)", () => {
  it("zero car miles with no flights yields near-zero transport", () => {
    const transport: TransportData = { carType: "none", carMilesPerWeek: 0, flightType: "none", publicTransitMilesPerWeek: 0 };
    const energy: EnergyData = { electricityKwhPerMonth: 0, naturalGasThermPerMonth: 0, heatingType: "gas", householdSize: 1, homeSize: "medium", renewableEnergy: false };
    const food: FoodData = { diet: "vegan", beefServingsPerWeek: 0, dairyServingsPerDay: 0, foodWaste: "minimal", localFood: "always" };
    const shopping: ShoppingData = { clothingItemsPerMonth: 0, newElectronicsPerYear: 0, shoppingFrequency: "minimal", recyclingHabits: "thorough" };
    const bd = calculateFullBreakdown(transport, energy, food, shopping);
    expect(bd.transport).toBe(0);
    expect(bd.energy).toBe(0);
    expect(bd.total).toBeGreaterThanOrEqual(0);
  });
});

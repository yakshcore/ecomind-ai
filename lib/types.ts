export interface TransportData {
  carType: 'none' | 'gasoline' | 'hybrid' | 'electric' | 'diesel';
  carMilesPerWeek: number;
  flightsPerYear: number;
  flightType: 'none' | 'short' | 'mixed' | 'long';
  publicTransitMilesPerWeek: number;
}

export interface EnergyData {
  electricityKwhPerMonth: number;
  naturalGasThermPerMonth: number;
  heatingType: 'none' | 'electric' | 'gas' | 'oil' | 'heat_pump' | 'solar';
  householdSize: number;
  homeSize: 'small' | 'medium' | 'large';
  renewableEnergy: boolean;
}

export interface FoodData {
  diet: 'vegan' | 'vegetarian' | 'pescatarian' | 'low_meat' | 'average_meat' | 'high_meat';
  beefServingsPerWeek: number;
  dairyServingsPerDay: number;
  foodWaste: 'minimal' | 'average' | 'significant';
  localFood: 'always' | 'often' | 'sometimes' | 'rarely';
}

export interface ShoppingData {
  clothingItemsPerMonth: number;
  newElectronicsPerYear: number;
  shoppingFrequency: 'minimal' | 'average' | 'frequent';
  recyclingHabits: 'thorough' | 'moderate' | 'minimal';
}

export interface UserProfile {
  name: string;
  location: string;
  transport: TransportData;
  energy: EnergyData;
  food: FoodData;
  shopping: ShoppingData;
  createdAt: string;
  updatedAt: string;
}

export interface CarbonBreakdown {
  transport: number;
  energy: number;
  food: number;
  shopping: number;
  total: number;
}

export interface MonthlyEntry {
  month: string;
  total: number;
  transport: number;
  energy: number;
  food: number;
  shopping: number;
}

export interface Action {
  id: string;
  category: 'transport' | 'energy' | 'food' | 'shopping';
  title: string;
  description: string;
  annualSavingKg: number;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
  committed: boolean;
}

export interface AppState {
  profile: UserProfile | null;
  breakdown: CarbonBreakdown | null;
  history: MonthlyEntry[];
  actions: Action[];
  goals: { targetReductionPercent: number; targetYear: number };
  lastAnalysis: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

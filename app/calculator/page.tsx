'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TransportData, EnergyData, FoodData, ShoppingData, UserProfile } from '@/lib/types';
import { calculateFullBreakdown } from '@/lib/carbon-calculator';
import { saveProfile, saveBreakdown } from '@/lib/store';

const STEPS = ['Profile', 'Transport', 'Energy', 'Food', 'Shopping', 'Results'];

const defaultTransport: TransportData = {
  carType: 'gasoline', carMilesPerWeek: 100, flightsPerYear: 2,
  flightType: 'short', publicTransitMilesPerWeek: 20,
};
const defaultEnergy: EnergyData = {
  electricityKwhPerMonth: 900, naturalGasThermPerMonth: 50,
  heatingType: 'gas', householdSize: 2, homeSize: 'medium', renewableEnergy: false,
};
const defaultFood: FoodData = {
  diet: 'average_meat', beefServingsPerWeek: 3,
  dairyServingsPerDay: 2, foodWaste: 'average', localFood: 'sometimes',
};
const defaultShopping: ShoppingData = {
  clothingItemsPerMonth: 2, newElectronicsPerYear: 1,
  shoppingFrequency: 'average', recyclingHabits: 'moderate',
};

function Slider({ label, value, min, max, step, onChange, unit }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; unit: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-sm font-semibold text-emerald-400">{value} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} className="w-full" />
    </div>
  );
}

function Select({ label, value, options, onChange }: {
  label: string; value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-5">
      <label className="block text-sm text-slate-300 mb-2">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-white text-sm"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: '#1a1f3e' }}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <span className="text-sm text-slate-300">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition-colors relative ${checked ? 'bg-emerald-500' : 'bg-slate-600'}`}
      >
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );
}

export default function CalculatorPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [transport, setTransport] = useState<TransportData>(defaultTransport);
  const [energy, setEnergy] = useState<EnergyData>(defaultEnergy);
  const [food, setFood] = useState<FoodData>(defaultFood);
  const [shopping, setShopping] = useState<ShoppingData>(defaultShopping);
  const [loading, setLoading] = useState(false);

  const breakdown = step >= 4 ? calculateFullBreakdown(transport, energy, food, shopping) : null;

  function handleFinish() {
    if (!breakdown) return;
    setLoading(true);
    const profile: UserProfile = {
      name: name || 'Eco Warrior',
      location: location || 'United States',
      transport, energy, food, shopping,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveProfile(profile);
    saveBreakdown(breakdown);
    router.push('/dashboard');
  }

  const progress = (step / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen hero-bg py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            {STEPS.map((s, i) => (
              <span key={s} className={i <= step ? 'text-emerald-400 font-medium' : ''}>{s}</span>
            ))}
          </div>
          <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #10b981, #3b82f6)' }}
            />
          </div>
        </div>

        <div className="glass rounded-2xl p-8">
          {/* Step 0: Profile */}
          {step === 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to EcoMind</h2>
              <p className="text-slate-400 mb-6">Let&apos;s personalize your carbon analysis. Takes about 3 minutes.</p>
              <div className="mb-5">
                <label className="block text-sm text-slate-300 mb-2">Your Name</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full px-4 py-3 rounded-xl text-white text-sm"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm text-slate-300 mb-2">Location (Country / Region)</label>
                <input
                  type="text" value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. United States"
                  className="w-full px-4 py-3 rounded-xl text-white text-sm"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>
            </div>
          )}

          {/* Step 1: Transport */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">🚗 Transportation</h2>
              <p className="text-slate-400 mb-6">Transport is typically the largest slice of a personal footprint.</p>
              <Select
                label="Primary vehicle type"
                value={transport.carType}
                options={[
                  { value: 'none', label: 'No car / Bike only' },
                  { value: 'electric', label: 'Electric Vehicle' },
                  { value: 'hybrid', label: 'Hybrid' },
                  { value: 'gasoline', label: 'Gasoline / Petrol' },
                  { value: 'diesel', label: 'Diesel' },
                ]}
                onChange={v => setTransport(t => ({ ...t, carType: v as TransportData['carType'] }))}
              />
              {transport.carType !== 'none' && (
                <Slider label="Miles driven per week" value={transport.carMilesPerWeek}
                  min={0} max={500} step={10} unit="mi/wk"
                  onChange={v => setTransport(t => ({ ...t, carMilesPerWeek: v }))} />
              )}
              <Select
                label="How often do you fly?"
                value={transport.flightType}
                options={[
                  { value: 'none', label: 'Never' },
                  { value: 'short', label: 'Occasionally (short-haul, 1-2 flights/yr)' },
                  { value: 'mixed', label: 'Regularly (mixed, 3-5 flights/yr)' },
                  { value: 'long', label: 'Frequent flyer (long-haul, 6+ flights/yr)' },
                ]}
                onChange={v => setTransport(t => ({ ...t, flightType: v as TransportData['flightType'] }))}
              />
              <Slider label="Public transit miles per week" value={transport.publicTransitMilesPerWeek}
                min={0} max={200} step={5} unit="mi/wk"
                onChange={v => setTransport(t => ({ ...t, publicTransitMilesPerWeek: v }))} />
            </div>
          )}

          {/* Step 2: Energy */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">⚡ Home Energy</h2>
              <p className="text-slate-400 mb-6">Your home&apos;s energy use varies greatly by size, climate, and fuel source.</p>
              <Slider label="Monthly electricity usage" value={energy.electricityKwhPerMonth}
                min={0} max={2000} step={50} unit="kWh"
                onChange={v => setEnergy(e => ({ ...e, electricityKwhPerMonth: v }))} />
              <Slider label="Monthly natural gas usage" value={energy.naturalGasThermPerMonth}
                min={0} max={200} step={5} unit="therms"
                onChange={v => setEnergy(e => ({ ...e, naturalGasThermPerMonth: v }))} />
              <Slider label="People in your household" value={energy.householdSize}
                min={1} max={8} step={1} unit="people"
                onChange={v => setEnergy(e => ({ ...e, householdSize: v }))} />
              <Toggle label="I use renewable / green energy" checked={energy.renewableEnergy}
                onChange={v => setEnergy(e => ({ ...e, renewableEnergy: v }))} />
              <Select label="Home size"
                value={energy.homeSize}
                options={[
                  { value: 'small', label: 'Small (apartment / studio)' },
                  { value: 'medium', label: 'Medium (2-3 bedroom house)' },
                  { value: 'large', label: 'Large (4+ bedroom house)' },
                ]}
                onChange={v => setEnergy(e => ({ ...e, homeSize: v as EnergyData['homeSize'] }))} />
            </div>
          )}

          {/* Step 3: Food */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">🥗 Food & Diet</h2>
              <p className="text-slate-400 mb-6">What you eat is one of the most impactful personal choices for the climate.</p>
              <Select label="Describe your diet"
                value={food.diet}
                options={[
                  { value: 'vegan', label: 'Vegan' },
                  { value: 'vegetarian', label: 'Vegetarian' },
                  { value: 'pescatarian', label: 'Pescatarian (fish, no meat)' },
                  { value: 'low_meat', label: 'Flexitarian (meat 1-2x/week)' },
                  { value: 'average_meat', label: 'Omnivore (meat most days)' },
                  { value: 'high_meat', label: 'Meat with every meal' },
                ]}
                onChange={v => setFood(f => ({ ...f, diet: v as FoodData['diet'] }))}
              />
              {(food.diet === 'average_meat' || food.diet === 'high_meat' || food.diet === 'low_meat') && (
                <Slider label="Beef servings per week" value={food.beefServingsPerWeek}
                  min={0} max={14} step={1} unit="servings"
                  onChange={v => setFood(f => ({ ...f, beefServingsPerWeek: v }))} />
              )}
              <Select label="Food waste level"
                value={food.foodWaste}
                options={[
                  { value: 'minimal', label: 'Minimal — I barely waste any food' },
                  { value: 'average', label: 'Average — some waste occasionally' },
                  { value: 'significant', label: 'Significant — I throw away a lot' },
                ]}
                onChange={v => setFood(f => ({ ...f, foodWaste: v as FoodData['foodWaste'] }))} />
              <Select label="How often do you buy local / seasonal food?"
                value={food.localFood}
                options={[
                  { value: 'always', label: 'Always — farmers market every week' },
                  { value: 'often', label: 'Often — most produce is local' },
                  { value: 'sometimes', label: 'Sometimes — when convenient' },
                  { value: 'rarely', label: 'Rarely — mostly supermarket' },
                ]}
                onChange={v => setFood(f => ({ ...f, localFood: v as FoodData['localFood'] }))} />
            </div>
          )}

          {/* Step 4: Shopping */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">🛍️ Shopping & Consumption</h2>
              <p className="text-slate-400 mb-6">Manufactured goods account for a surprisingly large share of emissions.</p>
              <Select label="Overall shopping frequency"
                value={shopping.shoppingFrequency}
                options={[
                  { value: 'minimal', label: 'Minimal — buy only what I need' },
                  { value: 'average', label: 'Average — typical consumer' },
                  { value: 'frequent', label: 'Frequent — I love shopping' },
                ]}
                onChange={v => setShopping(s => ({ ...s, shoppingFrequency: v as ShoppingData['shoppingFrequency'] }))} />
              <Slider label="New clothing items per month" value={shopping.clothingItemsPerMonth}
                min={0} max={20} step={1} unit="items"
                onChange={v => setShopping(s => ({ ...s, clothingItemsPerMonth: v }))} />
              <Slider label="New electronics per year" value={shopping.newElectronicsPerYear}
                min={0} max={10} step={1} unit="devices"
                onChange={v => setShopping(s => ({ ...s, newElectronicsPerYear: v }))} />
              <Select label="Recycling habits"
                value={shopping.recyclingHabits}
                options={[
                  { value: 'thorough', label: 'Thorough — I recycle everything possible' },
                  { value: 'moderate', label: 'Moderate — I recycle most things' },
                  { value: 'minimal', label: 'Minimal — I rarely recycle' },
                ]}
                onChange={v => setShopping(s => ({ ...s, recyclingHabits: v as ShoppingData['recyclingHabits'] }))} />
            </div>
          )}

          {/* Step 5: Summary */}
          {step === 5 && breakdown && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Your Carbon Summary</h2>
              <p className="text-slate-400 mb-6">Here&apos;s what we calculated. Save it to unlock your AI analysis.</p>
              <div className="text-center mb-6">
                <div className="text-6xl font-bold gradient-text">{breakdown.total}t</div>
                <div className="text-slate-400 text-sm mt-1">CO₂e per year</div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { cat: '🚗 Transport', val: breakdown.transport },
                  { cat: '⚡ Energy', val: breakdown.energy },
                  { cat: '🥗 Food', val: breakdown.food },
                  { cat: '🛍️ Shopping', val: breakdown.shopping },
                ].map(({ cat, val }) => (
                  <div key={cat} className="rounded-xl p-4 text-center"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="text-xl font-bold text-white">{val}t</div>
                    <div className="text-xs text-slate-400 mt-1">{cat}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-slate-500 text-center mb-4">
                US avg: 16t &bull; World avg: 4.7t &bull; 2030 target: 2t
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-6 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white disabled:opacity-30"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              ← Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="px-8 py-3 rounded-xl font-semibold text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="px-8 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}
              >
                {loading ? 'Saving...' : 'Save & View Dashboard →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

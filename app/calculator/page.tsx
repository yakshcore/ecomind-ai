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

function Slider({ label, value, min, max, step, onChange, unit, id }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; unit: string; id: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex justify-between mb-2">
        <label htmlFor={id} className="text-sm text-slate-300">{label}</label>
        <span className="text-sm font-semibold text-emerald-400" aria-live="polite">
          {value} {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} ${unit}`}
      />
    </div>
  );
}

function Select({ label, value, options, onChange, id }: {
  label: string; value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void; id: string;
}) {
  return (
    <div className="mb-5">
      <label htmlFor={id} className="block text-sm text-slate-300 mb-2">{label}</label>
      <select
        id={id}
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

function Toggle({ label, checked, onChange, id }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; id: string;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <label htmlFor={id} className="text-sm text-slate-300 cursor-pointer">{label}</label>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-transparent ${checked ? 'bg-emerald-500' : 'bg-slate-600'}`}
        aria-label={label}
      >
        <span
          aria-hidden="true"
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-7' : 'left-1'}`}
        />
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
  const stepLabel = STEPS[step];

  return (
    <div className="min-h-screen hero-bg py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Progress */}
        <div className="mb-8" role="progressbar" aria-valuenow={step} aria-valuemin={0} aria-valuemax={STEPS.length - 1} aria-label={`Step ${step + 1} of ${STEPS.length}: ${stepLabel}`}>
          <div className="flex justify-between text-xs text-slate-500 mb-2" aria-hidden="true">
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

        <div className="glass rounded-2xl p-8" role="region" aria-label={`Step: ${stepLabel}`}>

          {/* Step 0: Profile */}
          {step === 0 && (
            <section aria-labelledby="step-profile-heading">
              <h1 id="step-profile-heading" className="text-2xl font-bold mb-2">Welcome to EcoMind</h1>
              <p className="text-slate-400 mb-6">Let&apos;s personalize your carbon analysis. Takes about 3 minutes.</p>
              <div className="mb-5">
                <label htmlFor="user-name" className="block text-sm text-slate-300 mb-2">Your Name</label>
                <input
                  id="user-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  autoComplete="given-name"
                  className="w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>
              <div className="mb-5">
                <label htmlFor="user-location" className="block text-sm text-slate-300 mb-2">Location (Country / Region)</label>
                <input
                  id="user-location"
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. United States"
                  autoComplete="country-name"
                  className="w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>
            </section>
          )}

          {/* Step 1: Transport */}
          {step === 1 && (
            <section aria-labelledby="step-transport-heading">
              <h2 id="step-transport-heading" className="text-2xl font-bold mb-2">
                <span aria-hidden="true">🚗</span> Transportation
              </h2>
              <p className="text-slate-400 mb-6">Transport is typically the largest slice of a personal footprint.</p>
              <Select id="car-type" label="Primary vehicle type" value={transport.carType}
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
                <Slider id="car-miles" label="Miles driven per week" value={transport.carMilesPerWeek}
                  min={0} max={500} step={10} unit="mi/wk"
                  onChange={v => setTransport(t => ({ ...t, carMilesPerWeek: v }))} />
              )}
              <Select id="flight-type" label="How often do you fly?" value={transport.flightType}
                options={[
                  { value: 'none', label: 'Never' },
                  { value: 'short', label: 'Occasionally (short-haul, 1-2 flights/yr)' },
                  { value: 'mixed', label: 'Regularly (mixed, 3-5 flights/yr)' },
                  { value: 'long', label: 'Frequent flyer (long-haul, 6+ flights/yr)' },
                ]}
                onChange={v => setTransport(t => ({ ...t, flightType: v as TransportData['flightType'] }))}
              />
              <Slider id="transit-miles" label="Public transit miles per week" value={transport.publicTransitMilesPerWeek}
                min={0} max={200} step={5} unit="mi/wk"
                onChange={v => setTransport(t => ({ ...t, publicTransitMilesPerWeek: v }))} />
            </section>
          )}

          {/* Step 2: Energy */}
          {step === 2 && (
            <section aria-labelledby="step-energy-heading">
              <h2 id="step-energy-heading" className="text-2xl font-bold mb-2">
                <span aria-hidden="true">⚡</span> Home Energy
              </h2>
              <p className="text-slate-400 mb-6">Your home&apos;s energy use varies greatly by size, climate, and fuel source.</p>
              <Slider id="electricity" label="Monthly electricity usage" value={energy.electricityKwhPerMonth}
                min={0} max={2000} step={50} unit="kWh"
                onChange={v => setEnergy(e => ({ ...e, electricityKwhPerMonth: v }))} />
              <Slider id="gas" label="Monthly natural gas usage" value={energy.naturalGasThermPerMonth}
                min={0} max={200} step={5} unit="therms"
                onChange={v => setEnergy(e => ({ ...e, naturalGasThermPerMonth: v }))} />
              <Slider id="household-size" label="People in your household" value={energy.householdSize}
                min={1} max={8} step={1} unit="people"
                onChange={v => setEnergy(e => ({ ...e, householdSize: v }))} />
              <Toggle id="renewable" label="I use renewable / green energy" checked={energy.renewableEnergy}
                onChange={v => setEnergy(e => ({ ...e, renewableEnergy: v }))} />
              <Select id="home-size" label="Home size" value={energy.homeSize}
                options={[
                  { value: 'small', label: 'Small (apartment / studio)' },
                  { value: 'medium', label: 'Medium (2-3 bedroom house)' },
                  { value: 'large', label: 'Large (4+ bedroom house)' },
                ]}
                onChange={v => setEnergy(e => ({ ...e, homeSize: v as EnergyData['homeSize'] }))} />
            </section>
          )}

          {/* Step 3: Food */}
          {step === 3 && (
            <section aria-labelledby="step-food-heading">
              <h2 id="step-food-heading" className="text-2xl font-bold mb-2">
                <span aria-hidden="true">🥗</span> Food &amp; Diet
              </h2>
              <p className="text-slate-400 mb-6">What you eat is one of the most impactful personal choices for the climate.</p>
              <Select id="diet-type" label="Describe your diet" value={food.diet}
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
                <Slider id="beef-servings" label="Beef servings per week" value={food.beefServingsPerWeek}
                  min={0} max={14} step={1} unit="servings"
                  onChange={v => setFood(f => ({ ...f, beefServingsPerWeek: v }))} />
              )}
              <Select id="food-waste" label="Food waste level" value={food.foodWaste}
                options={[
                  { value: 'minimal', label: 'Minimal — I barely waste any food' },
                  { value: 'average', label: 'Average — some waste occasionally' },
                  { value: 'significant', label: 'Significant — I throw away a lot' },
                ]}
                onChange={v => setFood(f => ({ ...f, foodWaste: v as FoodData['foodWaste'] }))} />
              <Select id="local-food" label="How often do you buy local / seasonal food?" value={food.localFood}
                options={[
                  { value: 'always', label: 'Always — farmers market every week' },
                  { value: 'often', label: 'Often — most produce is local' },
                  { value: 'sometimes', label: 'Sometimes — when convenient' },
                  { value: 'rarely', label: 'Rarely — mostly supermarket' },
                ]}
                onChange={v => setFood(f => ({ ...f, localFood: v as FoodData['localFood'] }))} />
            </section>
          )}

          {/* Step 4: Shopping */}
          {step === 4 && (
            <section aria-labelledby="step-shopping-heading">
              <h2 id="step-shopping-heading" className="text-2xl font-bold mb-2">
                <span aria-hidden="true">🛍️</span> Shopping &amp; Consumption
              </h2>
              <p className="text-slate-400 mb-6">Manufactured goods account for a surprisingly large share of emissions.</p>
              <Select id="shopping-freq" label="Overall shopping frequency" value={shopping.shoppingFrequency}
                options={[
                  { value: 'minimal', label: 'Minimal — buy only what I need' },
                  { value: 'average', label: 'Average — typical consumer' },
                  { value: 'frequent', label: 'Frequent — I love shopping' },
                ]}
                onChange={v => setShopping(s => ({ ...s, shoppingFrequency: v as ShoppingData['shoppingFrequency'] }))} />
              <Slider id="clothing-items" label="New clothing items per month" value={shopping.clothingItemsPerMonth}
                min={0} max={20} step={1} unit="items"
                onChange={v => setShopping(s => ({ ...s, clothingItemsPerMonth: v }))} />
              <Slider id="electronics" label="New electronics per year" value={shopping.newElectronicsPerYear}
                min={0} max={10} step={1} unit="devices"
                onChange={v => setShopping(s => ({ ...s, newElectronicsPerYear: v }))} />
              <Select id="recycling" label="Recycling habits" value={shopping.recyclingHabits}
                options={[
                  { value: 'thorough', label: 'Thorough — I recycle everything possible' },
                  { value: 'moderate', label: 'Moderate — I recycle most things' },
                  { value: 'minimal', label: 'Minimal — I rarely recycle' },
                ]}
                onChange={v => setShopping(s => ({ ...s, recyclingHabits: v as ShoppingData['recyclingHabits'] }))} />
            </section>
          )}

          {/* Step 5: Summary */}
          {step === 5 && breakdown && (
            <section aria-labelledby="step-results-heading">
              <h2 id="step-results-heading" className="text-2xl font-bold mb-2">Your Carbon Summary</h2>
              <p className="text-slate-400 mb-6">Here&apos;s what we calculated. Save it to unlock your AI analysis.</p>
              <div className="text-center mb-6" role="status" aria-label={`Your total carbon footprint is ${breakdown.total} tonnes of CO2 equivalent per year`}>
                <div className="text-6xl font-bold gradient-text" aria-hidden="true">{breakdown.total}t</div>
                <div className="text-slate-400 text-sm mt-1">CO₂e per year</div>
              </div>
              <dl className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { cat: 'Transport', emoji: '🚗', val: breakdown.transport },
                  { cat: 'Energy', emoji: '⚡', val: breakdown.energy },
                  { cat: 'Food', emoji: '🥗', val: breakdown.food },
                  { cat: 'Shopping', emoji: '🛍️', val: breakdown.shopping },
                ].map(({ cat, emoji, val }) => (
                  <div key={cat} className="rounded-xl p-4 text-center"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <dt className="text-xs text-slate-400 mt-1"><span aria-hidden="true">{emoji}</span> {cat}</dt>
                    <dd className="text-xl font-bold text-white">{val}t</dd>
                  </div>
                ))}
              </dl>
              <p className="text-xs text-slate-500 text-center mb-4">
                US avg: 16t &bull; World avg: 4.7t &bull; 2030 target: 2t
              </p>
            </section>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              aria-label="Go to previous step"
              className="px-6 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              ← Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                aria-label={`Continue to ${STEPS[step + 1]}`}
                className="px-8 py-3 rounded-xl font-semibold text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                aria-label="Save results and view dashboard"
                aria-busy={loading}
                className="px-8 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
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

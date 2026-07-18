import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, GraduationCap, Stethoscope, Home as HomeIcon, Droplets, Heart } from 'lucide-react';

// Approximate impact units per ₹1 spent, varies by campaign category
const IMPACT_RATES = {
  Medical: [
    { icon: Stethoscope, label: 'medical consultations', unit: 250 },
    { icon: Heart, label: 'days of medicine supply', unit: 80 },
  ],
  Education: [
    { icon: GraduationCap, label: 'days of school supplies', unit: 60 },
    { icon: Utensils, label: 'school meals', unit: 40 },
  ],
  Emergency: [
    { icon: HomeIcon, label: 'days of emergency shelter', unit: 150 },
    { icon: Droplets, label: 'liters of clean water', unit: 8 },
  ],
  default: [
    { icon: Utensils, label: 'meals provided', unit: 50 },
    { icon: GraduationCap, label: 'days of education support', unit: 70 },
    { icon: Stethoscope, label: 'medical aid units', unit: 200 },
  ],
};

const PRESETS = [100, 500, 1000, 2500, 5000];

export default function ImpactCalculator({ category, onDonateClick }) {
  const [amount, setAmount] = useState(500);
  const rates = IMPACT_RATES[category] || IMPACT_RATES.default;

  const impacts = useMemo(() => rates.map(r => ({
    ...r,
    value: Math.max(0, Math.floor(amount / r.unit)),
  })), [amount, rates]);

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Impact Calculator</h3>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {PRESETS.map(p => (
          <button
            key={p}
            onClick={() => setAmount(p)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
              amount === p ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:border-primary/50'
            }`}
          >
            ₹{p.toLocaleString()}
          </button>
        ))}
      </div>

      <div className="relative mb-5">
        <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
          className="input-field pl-7 sm:pl-8 text-sm"
          placeholder="Enter amount"
        />
      </div>

      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {impacts.map((im) => (
            <motion.div
              key={im.label}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-secondary-500/5 border border-primary/10"
            >
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                <im.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm text-slate-700 min-w-0">
                <motion.span
                  key={im.value}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-bold text-slate-900"
                >
                  ~{im.value}
                </motion.span>{' '}
                {im.label}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {onDonateClick && (
        <button onClick={() => onDonateClick(amount)} className="btn-primary w-full mt-5 py-2.5 text-sm">
          Donate ₹{amount.toLocaleString()} Now
        </button>
      )}
      <p className="text-[10px] text-slate-400 mt-3 text-center">
        *Estimates based on average program costs. Actual impact may vary.
      </p>
    </div>
  );
}

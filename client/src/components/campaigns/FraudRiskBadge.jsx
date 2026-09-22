import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';

/**
 * Computes a deterministic 0-100 risk score from campaign signals already
 * present in the data model (aiTrustScore, fraudFlags, org verification,
 * progress velocity). Higher score = higher risk.
 */
export function computeFraudRisk(campaign) {
  if (!campaign) return { score: 0, level: 'low' };

  let risk = 0;
  const trust = campaign.aiTrustScore?.overall;
  if (typeof trust === 'number') {
    risk += (100 - trust) * 0.5;
  } else {
    risk += 20; // unknown trust score = mild uncertainty
  }

  const unresolvedFlags = campaign.fraudFlags?.filter(f => !f.resolved)?.length || 0;
  risk += Math.min(unresolvedFlags * 18, 45);

  if (!campaign.organization?.isVerified) risk += 15;

  const goal = campaign.goalAmount || 1;
  const raised = campaign.raisedAmount || 0;
  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline) - new Date()) / 86400000));
  // Suspicious if fully funded almost instantly with very few donors relative to amount
  if (raised > 0 && campaign.donorCount > 0) {
    const avgDonation = raised / campaign.donorCount;
    if (avgDonation > goal * 0.4 && campaign.donorCount < 3) risk += 12;
  }
  if (daysLeft === 0 && raised / goal < 0.2) risk += 8;

  risk = Math.max(0, Math.min(100, Math.round(risk)));
  const level = risk >= 60 ? 'high' : risk >= 30 ? 'medium' : 'low';
  return { score: risk, level };
}

const CONFIG = {
  low: { label: 'Low Risk', icon: ShieldCheck, bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
  medium: { label: 'Medium Risk', icon: ShieldQuestion, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  high: { label: 'High Risk', icon: ShieldAlert, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
};

export default function FraudRiskBadge({ campaign, size = 'md', showScore = true }) {
  const { score, level } = computeFraudRisk(campaign);
  const cfg = CONFIG[level];
  const Icon = cfg.icon;
  const sizeCls = size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      title={`AI fraud risk score: ${score}/100`}
      className={`inline-flex items-center rounded-full border font-semibold ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeCls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {cfg.label}
      {showScore && <span className="opacity-70 font-normal">· {score}</span>}
    </span>
  );
}

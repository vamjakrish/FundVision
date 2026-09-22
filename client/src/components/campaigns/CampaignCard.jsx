import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Users, Heart } from 'lucide-react';
import { format } from 'date-fns';
import FraudRiskBadge from './FraudRiskBadge';

export default function CampaignCard({ campaign }) {
  if (!campaign) return null;
  const progress = Math.min(Math.round((campaign.raisedAmount / campaign.goalAmount) * 100), 100);
  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline) - new Date()) / 86400000));
  const primaryImage = campaign.images?.find(i => i.isPrimary)?.url || campaign.images?.[0]?.url;

  return (
    <Link to={`/campaigns/${campaign._id}`} className="block group">
      <div className="card h-full flex flex-col hover:-translate-y-1 transition-all duration-300">
        {/* Image */}
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-100">
          {primaryImage ? (
            <img src={primaryImage} alt={campaign.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
              <Heart className="w-10 h-10 text-primary/20" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {campaign.isUrgent && (
              <span className="badge bg-red-500 text-white text-[10px] px-2 py-0.5 animate-pulse">🚨 Urgent</span>
            )}
            {campaign.isFeatured && (
              <span className="badge bg-amber-400 text-white text-[10px] px-2 py-0.5">⭐ Featured</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4 sm:p-5">
          {/* Category + org */}
          <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
            <span className="badge bg-primary/10 text-primary text-[10px] sm:text-xs shrink-0">{campaign.category}</span>
            <FraudRiskBadge campaign={campaign} size="sm" showScore={false} />
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 truncate mb-1">{campaign.organization?.name}</p>

          {/* Title */}
          <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight mb-2 line-clamp-2 flex-1">
            {campaign.title}
          </h3>

          {/* Description */}
          <p className="text-slate-500 text-xs sm:text-sm line-clamp-2 mb-3 leading-relaxed">
            {campaign.description}
          </p>

          {/* Progress */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span className="font-semibold text-slate-700">₹{campaign.raisedAmount?.toLocaleString() || 0}</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-1">of ₹{campaign.goalAmount?.toLocaleString()} goal</p>
          </div>

          {/* Stats footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1 text-slate-500 text-xs">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>{campaign.donorCount || 0} donors</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 text-xs">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{daysLeft > 0 ? `${daysLeft}d left` : 'Ended'}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

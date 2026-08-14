import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, ArrowRight, Heart } from 'lucide-react';
import { aiAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';
import CampaignCard from './CampaignCard';

/**
 * Shows AI-personalized campaign recommendations based on the logged-in
 * user's donation history, category affinity, and campaign popularity.
 * Renders nothing for logged-out users or when no recommendations exist.
 *
 * @param {'section'|'compact'} variant - 'section' renders full campaign
 *   cards (Home/CampaignDetail); 'compact' renders a slim list (sidebars).
 * @param {number} limit - max number of campaigns to show
 * @param {string} excludeId - a campaign id to exclude (e.g. current detail page)
 */
export default function RecommendedCampaigns({ variant = 'section', limit = 3, excludeId = null, title = 'Recommended for You' }) {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => aiAPI.getRecommendations().then(r => r.data),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  if (!user) return null;

  const campaigns = (data?.data || []).filter(c => c._id !== excludeId).slice(0, limit);
  if (!isLoading && campaigns.length === 0) return null;

  if (variant === 'compact') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-secondary-500" />
          <h3 className="font-bold text-slate-800">{title}</h3>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map(c => (
              <Link key={c._id} to={`/campaigns/${c.slug || c._id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                  {c.images?.[0]?.url ? <img src={c.images[0].url} alt="" className="w-full h-full object-cover" /> : <Heart className="w-5 h-5 text-slate-300 m-auto mt-2.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-primary transition-colors">{c.title}</p>
                  <p className="text-xs text-slate-400">{c.category}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="py-12 sm:py-16 bg-slate-50">
      <div className="section-container">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-secondary-600 text-sm font-semibold mb-2">
              <Sparkles className="w-4 h-4" /> AI-Powered
            </div>
            <h2 className="section-title">{title}</h2>
            <p className="section-subtitle">Picked based on your donation history and interests</p>
          </div>
          <Link to="/campaigns" className="btn-secondary text-sm flex items-center gap-2">
            Explore All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: limit }).map((_, i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {campaigns.map((c, i) => (
              <motion.div key={c._id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <CampaignCard campaign={c} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

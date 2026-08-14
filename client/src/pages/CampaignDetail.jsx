import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Heart, Bookmark, Share2, BadgeCheck, Clock, Users, Target,
  ChevronRight, ExternalLink, Sparkles, Shield,
  Calendar, ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { campaignAPI, aiAPI, donationAPI } from '../services/api';
import useAuthStore from '../context/authStore';
import { joinCampaign, leaveCampaign, getSocket } from '../services/socket';
import BlockchainBadge from '../components/blockchain/BlockchainBadge';
import FraudRiskBadge from '../components/campaigns/FraudRiskBadge';
import MilestoneTracker from '../components/campaigns/MilestoneTracker';
import ImpactCalculator from '../components/campaigns/ImpactCalculator';
import ShareModal from '../components/campaigns/ShareModal';
import RecommendedCampaigns from '../components/campaigns/RecommendedCampaigns';

function TrustScore({ score }) {
  if (!score?.overall) return null;
  const color = score.overall >= 75 ? 'text-green-600' : score.overall >= 50 ? 'text-amber-600' : 'text-red-500';
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-slate-800 text-sm sm:text-base">AI Trust Analysis</h3>
      </div>
      <div className="space-y-3">
        {[['Overall', score.overall], ['Transparency', score.transparency], ['Reliability', score.reliability]].map(([label, val]) => (
          <div key={label}>
            <div className="flex justify-between text-xs sm:text-sm mb-1">
              <span className="text-slate-600">{label}</span>
              <span className={`font-bold ${color}`}>{val}/100</span>
            </div>
            <div className="progress-bar">
              <motion.div className={`h-full rounded-full ${val >= 75 ? 'bg-green-500' : val >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 1 }} />
            </div>
          </div>
        ))}
      </div>
      {score.analysis && <p className="text-xs text-slate-500 mt-3 leading-relaxed">{score.analysis}</p>}
    </div>
  );
}

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('story');
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [liveStats, setLiveStats] = useState(null);
  const [showStickyDonate, setShowStickyDonate] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const qc = useQueryClient();

  const { data: res, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignAPI.getOne(id).then(r => r.data),
  });
  const campaign = res?.data;

  const { data: aiRes } = useQuery({
    queryKey: ['trust-score', id],
    queryFn: () => aiAPI.getTrustScore(id).then(r => r.data),
    enabled: !!campaign, staleTime: 5 * 60 * 1000,
  });

  const { data: donorsRes } = useQuery({
    queryKey: ['campaign-donors', id],
    queryFn: () => donationAPI.getCampaignDonations(id, { limit: 5 }).then(r => r.data),
    enabled: !!campaign,
  });

  useEffect(() => {
    if (!campaign) return;
    setLiked(campaign.likes?.includes(user?._id));
    setBookmarked(campaign.bookmarks?.includes(user?._id));
    joinCampaign(campaign._id);
    const socket = getSocket();
    if (socket) {
      socket.on('new_donation', (data) => { setLiveStats(data); qc.invalidateQueries(['campaign', id]); });
    }
    return () => leaveCampaign(campaign._id);
  }, [campaign]);

  useEffect(() => {
    const handler = () => setShowStickyDonate(window.scrollY > 400);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const likeMutation = useMutation({
    mutationFn: () => campaignAPI.like(campaign._id),
    onMutate: () => setLiked(p => !p), onError: () => setLiked(p => !p),
  });
  const bookmarkMutation = useMutation({
    mutationFn: () => campaignAPI.bookmark(campaign._id),
    onMutate: () => setBookmarked(p => !p),
    onSuccess: () => toast.success(bookmarked ? 'Removed' : '📌 Bookmarked!'),
    onError: () => setBookmarked(p => !p),
  });

  const handleShare = () => {
    campaignAPI.share(campaign._id).catch(() => {});
  };

  if (isLoading) return (
    <div className="pt-20 min-h-screen">
      <div className="section-container py-8">
        <div className="skeleton h-6 w-48 rounded mb-6" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="skeleton aspect-video rounded-2xl" />
            <div className="skeleton h-8 w-3/4 rounded" />
            <div className="skeleton h-4 w-full rounded" />
          </div>
          <div className="space-y-4">
            <div className="skeleton h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!campaign) return (
    <div className="pt-20 min-h-screen flex items-center justify-center p-4">
      <div className="text-center"><div className="text-5xl mb-4">😢</div>
        <h2 className="text-xl font-bold text-slate-800">Campaign not found</h2>
        <Link to="/campaigns" className="btn-primary mt-4 inline-block">Browse Campaigns</Link>
      </div>
    </div>
  );

  const progress = Math.min(Math.round((campaign.raisedAmount / campaign.goalAmount) * 100), 100);
  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline) - new Date()) / 86400000));
  const raised = liveStats?.raisedAmount ?? campaign.raisedAmount;
  const liveProgress = liveStats?.progress ?? progress;
  const primaryImage = campaign.images?.find(i => i.isPrimary)?.url || campaign.images?.[0]?.url;
  const shareUrl = encodeURIComponent(window.location.href);
  const shareText = encodeURIComponent(`Help "${campaign.title}" on FundVision!`);
  const canDonate = campaign.status === 'active' && daysLeft > 0;

  return (
    <div className="pt-20 min-h-screen pb-24 overflow-x-hidden">
      <div className="section-container py-6 sm:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-500 mb-5 sm:mb-6 flex-wrap">
          <Link to="/" className="hover:text-primary shrink-0">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/campaigns" className="hover:text-primary shrink-0">Campaigns</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-800 truncate max-w-[150px] sm:max-w-xs">{campaign.title}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-5 sm:space-y-6 min-w-0">
            {/* Hero image */}
            <div className="rounded-2xl overflow-hidden aspect-video bg-slate-100 relative w-full">
              {primaryImage ? (
                <img src={primaryImage} alt={campaign.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-primary/20" />
                </div>
              )}
              {campaign.isUrgent && <div className="absolute top-3 left-3 badge bg-red-500 text-white text-xs px-3 py-1 animate-pulse">🚨 Urgent</div>}
            </div>

            {/* Title & org */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="badge bg-primary/10 text-primary text-xs">{campaign.category}</span>
                {campaign.isFeatured && <span className="badge bg-amber-100 text-amber-700 text-xs">⭐ Featured</span>}
                <FraudRiskBadge campaign={campaign} size="sm" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 leading-tight mb-4">{campaign.title}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
                    {campaign.organization?.logo ? <img src={campaign.organization.logo} alt="" className="w-full h-full object-cover" /> : campaign.organization?.name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-800 text-sm truncate">{campaign.organization?.name}</span>
                      {campaign.organization?.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-400">Verified Org</p>
                  </div>
                </div>
                <div className="ml-auto flex gap-2 shrink-0">
                  <button onClick={() => { if (!user) return toast.error('Login required'); likeMutation.mutate(); }}
                    className="p-2 rounded-xl border border-slate-200 hover:border-red-200 hover:bg-red-50 transition-all">
                    <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${liked ? 'fill-red-500 text-red-500' : 'text-slate-500'}`} />
                  </button>
                  <button onClick={() => { if (!user) return toast.error('Login required'); bookmarkMutation.mutate(); }}
                    className="p-2 rounded-xl border border-slate-200 hover:border-primary/30 hover:bg-primary/5 transition-all">
                    <Bookmark className={`w-4 h-4 sm:w-5 sm:h-5 ${bookmarked ? 'fill-primary text-primary' : 'text-slate-500'}`} />
                  </button>
                  <button onClick={() => setShareOpen(true)}
                    className="p-2 rounded-xl border border-slate-200 hover:border-primary/30 hover:bg-primary/5 transition-all">
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile: donation card inline */}
            <div className="lg:hidden">
              <DonationCard campaign={campaign} raised={raised} liveProgress={liveProgress} liveStats={liveStats}
                daysLeft={daysLeft} canDonate={canDonate} onDonate={() => navigate(`/donate/${campaign._id}`)} />
            </div>

            {/* Milestones */}
            <MilestoneTracker milestones={campaign.milestones} raisedAmount={raised} goalAmount={campaign.goalAmount} />

            {/* Impact calculator (mobile/tablet, desktop version lives in sidebar) */}
            <div className="lg:hidden">
              <ImpactCalculator category={campaign.category} onDonateClick={() => navigate(`/donate/${campaign._id}`)} />
            </div>

            {/* AI summary */}
            {campaign.aiSummary && (
              <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/15">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">AI Summary</span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">{campaign.aiSummary}</p>
              </div>
            )}

            {/* Tabs */}
            <div className="border-b border-slate-200 overflow-x-auto no-scrollbar">
              <div className="flex gap-4 sm:gap-6 min-w-max">
                {['story', 'updates', 'donors'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-semibold capitalize whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    {tab}{tab === 'updates' ? ` (${campaign.updates?.length || 0})` : tab === 'donors' ? ` (${campaign.donorCount || 0})` : ''}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'story' && (
              <div className="prose prose-sm sm:prose-base prose-slate max-w-none text-slate-700 leading-relaxed">
                {campaign.story?.split('\n').map((p, i) => p.trim() ? <p key={i}>{p}</p> : <br key={i} />)}
              </div>
            )}
            {activeTab === 'updates' && (
              <div className="space-y-4">
                {campaign.updates?.length > 0 ? campaign.updates.map((u, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative"
                  >
                    {/* Timeline connector */}
                    {i < campaign.updates.length - 1 && (
                      <div className="absolute left-5 top-16 bottom-0 w-0.5 bg-slate-100" />
                    )}
                    <div className="card p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-slate-800 text-sm">{u.title}</h4>
                            <span className="text-xs text-slate-400">
                              {format(new Date(u.postedAt), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed">{u.content}</p>
                          {u.images?.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {u.images.map((img, j) => (
                                <div key={j} className="aspect-video rounded-xl overflow-hidden bg-slate-100">
                                  <img
                                    src={typeof img === 'string' ? img : img.url}
                                    alt={`Update image ${j + 1}`}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <div className="text-center py-10 text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No updates yet. Check back soon!</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'donors' && (
              <div className="space-y-3">
                {donorsRes?.data?.length > 0 ? donorsRes.data.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-slate-50">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
                      {d.donor?.avatar ? <img src={d.donor.avatar} alt="" className="w-full h-full object-cover" /> : (d.donor?.name?.[0] || '?')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{d.donor?.name || 'Anonymous'}</p>
                      <p className="text-xs text-slate-400">{format(new Date(d.createdAt), 'MMM dd, yyyy')}</p>
                    </div>
                    <span className="font-bold text-primary text-sm shrink-0">₹{d.amount?.toLocaleString()}</span>
                  </div>
                )) : <div className="text-center py-10 text-slate-400"><Heart className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Be the first to donate!</p></div>}
              </div>
            )}

            {/* Share */}
            <div className="card p-4 sm:p-5">
              <p className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-2">
                <Share2 className="w-4 h-4" /> Help spread the word
              </p>
              <button
                onClick={() => setShareOpen(true)}
                className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
              >
                <Share2 className="w-4 h-4" /> Share Campaign
              </button>
            </div>

            {/* Recommendations below main content */}
            <div className="lg:hidden">
              <RecommendedCampaigns variant="compact" limit={3} excludeId={campaign._id} title="You might also like" />
            </div>
          </div>

          {/* RIGHT - desktop only */}
          <div className="hidden lg:flex flex-col gap-5 min-w-0">
            <DonationCard campaign={campaign} raised={raised} liveProgress={liveProgress} liveStats={liveStats}
              daysLeft={daysLeft} canDonate={canDonate} onDonate={() => navigate(`/donate/${campaign._id}`)} sticky />
            <ImpactCalculator category={campaign.category} onDonateClick={() => navigate(`/donate/${campaign._id}`)} />
            {aiRes?.trustScore && <TrustScore score={aiRes.trustScore} />}
            {campaign.organization && (
              <div className="card p-5">
                <h3 className="font-semibold text-slate-800 mb-3 text-sm">About the Organization</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
                    {campaign.organization?.logo ? <img src={campaign.organization.logo} alt="" className="w-full h-full object-cover" /> : campaign.organization?.name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-800 text-sm truncate">{campaign.organization?.name}</span>
                      {campaign.organization?.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </div>
                    {campaign.organization?.isVerified && <span className="text-xs text-green-600">✓ Verified</span>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{campaign.organization?.description}</p>
                <Link to={`/organizations/${campaign.organization?._id}`} className="mt-3 text-xs text-primary font-medium hover:underline flex items-center gap-1">
                  View Profile <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky mobile donate button */}
      {canDonate && (
        <motion.div animate={{ y: showStickyDonate ? 0 : 80 }} transition={{ duration: 0.3 }}
          className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/90 backdrop-blur border-t border-slate-200 z-40">
          <button onClick={() => navigate(`/donate/${campaign._id}`)} className="btn-primary w-full py-3 text-sm">
            ❤️ Donate Now · ₹{raised?.toLocaleString()} raised
          </button>
        </motion.div>
      )}

      {/* Share modal */}
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        title={campaign.title}
        campaignId={campaign._id}
        onShare={handleShare}
      />

      {/* AI Recommendations (desktop) */}
      <div className="hidden lg:block">
        <RecommendedCampaigns variant="section" limit={3} excludeId={campaign._id} title="You Might Also Like" />
      </div>
    </div>
  );
}

function DonationCard({ campaign, raised, liveProgress, liveStats, daysLeft, canDonate, onDonate, sticky }) {
  return (
    <div className={`card p-4 sm:p-5 ${sticky ? 'sticky top-24' : ''}`}>
      {liveStats && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0" />
          <span className="text-green-700 text-xs font-medium truncate">{liveStats.donorName} donated ₹{liveStats.amount?.toLocaleString()}!</span>
        </motion.div>
      )}
      <div className="mb-2">
        <span className="text-2xl sm:text-3xl font-bold text-slate-900">₹{raised?.toLocaleString()}</span>
        <span className="text-slate-400 text-xs sm:text-sm ml-1.5">of ₹{campaign.goalAmount?.toLocaleString()}</span>
      </div>
      <div className="progress-bar mb-3 sm:mb-4">
        <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${liveProgress}%` }} transition={{ duration: 1 }} />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4 sm:mb-5">
        {[
          { icon: Target, value: `${liveProgress}%`, label: 'Funded' },
          { icon: Users, value: liveStats?.donorCount ?? campaign.donorCount, label: 'Donors' },
          { icon: Clock, value: daysLeft > 0 ? `${daysLeft}d` : 'Ended', label: 'Left' },
        ].map(({ icon: Icon, value, label }) => (
          <div key={label} className="text-center p-2 sm:p-3 rounded-xl bg-slate-50">
            <Icon className="w-3.5 h-3.5 text-primary mx-auto mb-0.5" />
            <p className="font-bold text-slate-800 text-xs sm:text-sm">{value}</p>
            <p className="text-[10px] sm:text-xs text-slate-400">{label}</p>
          </div>
        ))}
      </div>
      {canDonate ? (
        <button onClick={onDonate} className="btn-primary w-full py-3 text-sm sm:text-base">❤️ Donate Now</button>
      ) : (
        <div className="p-3 bg-slate-100 rounded-xl text-center text-slate-500 text-xs sm:text-sm">Campaign has ended</div>
      )}
      <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] sm:text-xs text-slate-400">
        <Shield className="w-3 h-3" />Secured by Razorpay
      </div>
    </div>
  );
}

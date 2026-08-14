import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, Users, Target, Edit, Eye, CheckCircle, Clock, BadgeCheck, BarChart2, Sparkles, ShieldCheck, Megaphone, X, Upload } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import useAuthStore from '../../context/authStore';
import { orgAPI, campaignAPI, aiAPI, blockchainAPI, uploadAPI } from '../../services/api';
import { Card, Badge, Button, SkeletonGrid, SkeletonRow, EmptyState } from '../../components/ui';
import { StatCard, DashboardHeader, DashboardTabs } from '../../components/dashboard';
import FraudRiskBadge from '../../components/campaigns/FraudRiskBadge';

const STATUS_TONE = {
  active: 'success',
  pending: 'warning',
  draft: 'slate',
  completed: 'primary',
  paused: 'warning',
  rejected: 'danger',
};

function PostUpdateModal({ campaignId, campaignTitle, onClose }) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const [imageUrls, setImageUrls] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('images', f));
      const res = await uploadAPI.multiple(fd);
      const urls = (res.data?.files || []).map(f => f.url);
      setImageUrls(prev => [...prev, ...urls]);
      toast.success(`${urls.length} image(s) uploaded`);
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      await campaignAPI.addUpdate(campaignId, { ...data, images: imageUrls });
      toast.success('Update posted! Donors have been notified.');
      qc.invalidateQueries({ queryKey: ['my-campaigns'] });
      reset();
      setImageUrls([]);
      onClose();
    } catch {
      toast.error('Failed to post update');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          className="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-800">Post Campaign Update</h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[260px]">{campaignTitle}</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
              <input {...register('title', { required: 'Title is required' })} placeholder="e.g. 50% Goal Reached! \uD83C\uDF89" className="input-field" />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Content *</label>
              <textarea {...register('content', { required: 'Content is required', minLength: { value: 20, message: 'Min 20 characters' } })} rows={4} placeholder="Share news, milestones, or how donations are being used..." className="input-field resize-none" />
              {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Images (optional)</label>
              <label className={`flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50'}`}>
                <Upload className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">{uploading ? 'Uploading...' : 'Click to upload images'}</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImages} disabled={uploading} />
              </label>
              {imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {imageUrls.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                      <button type="button" onClick={() => setImageUrls(p => p.filter((_, j) => j !== i))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">x</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400">Donors who contributed to this campaign will receive a notification.</p>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Megaphone className="w-4 h-4" /> {isSubmitting ? 'Posting...' : 'Post Update'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function OrgDashboard() {
  const { organization } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [updateModal, setUpdateModal] = useState(null); // { _id, title }

  const { data: orgRes, isLoading: orgLoading } = useQuery({
    queryKey: ['my-org'],
    queryFn: () => orgAPI.getMe().then(r => r.data),
  });

  const { data: analyticsRes } = useQuery({
    queryKey: ['org-analytics'],
    queryFn: () => orgAPI.getAnalytics().then(r => r.data),
    enabled: !!orgRes?.data?.isVerified,
  });

  const { data: campaignsRes, isLoading: campaignsLoading } = useQuery({
    queryKey: ['my-campaigns'],
    queryFn: () => campaignAPI.getMine().then(r => r.data),
  });

  const { data: insightsRes } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => aiAPI.getInsights().then(r => r.data),
  });

  const { data: bcStatsRes } = useQuery({
    queryKey: ['org-blockchain-stats'],
    queryFn: () => blockchainAPI.getOrgStats().then(r => r.data),
    enabled: !!orgRes?.data,
  });

  const org = orgRes?.data;
  const analytics = analyticsRes?.data;
  const campaigns = campaignsRes?.data || [];
  const insights = insightsRes?.insights || [];
  const bcStats = bcStatsRes?.data;

  const TABS = ['overview', 'campaigns', 'analytics', 'transparency', 'insights'];

  if (orgLoading) {
    return (
      <div className="pt-20 min-h-screen bg-slate-50">
        <div className="section-container py-5 sm:py-8">
          <SkeletonGrid count={4} />
        </div>
      </div>
    );
  }

  if (!org) return (
    <div className="pt-20 min-h-screen flex items-center justify-center px-4">
      <Card className="text-center max-w-md" padding="p-8 sm:p-10">
        <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BadgeCheck className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Complete Your Organization Profile</h2>
        <p className="text-slate-500 text-sm mb-6">Set up your organization to start creating campaigns</p>
        <Link to="/organization/setup"><Button variant="primary">Setup Organization</Button></Link>
      </Card>
    </div>
  );

  return (
    <div className="pt-20 min-h-screen bg-slate-50">
      <div className="section-container py-5 sm:py-8">
        <DashboardHeader
          eyebrow={`Organization Dashboard · ${org.type}`}
          title={org.name}
          subtitle={!org.isVerified ? `Awaiting verification (${org.verificationStatus})` : 'Manage your campaigns, donors and transparency reports.'}
          badges={org.isVerified ? [<Badge key="v" tone="success" icon={BadgeCheck}>Verified</Badge>] : []}
          action={
            org.isVerified ? (
              <Link to="/campaigns/create"><Button variant="primary" icon={Plus} iconPosition="left" className="!bg-white !text-primary hover:!shadow-lg">New Campaign</Button></Link>
            ) : (
              <div className="px-4 py-2 bg-white/15 border border-white/20 rounded-xl text-sm text-white backdrop-blur-sm">⏳ Pending review</div>
            )
          }
        />

        {!org.isVerified && (
          <Card className="mb-6 bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">Verification Pending</p>
                <p className="text-amber-700 text-sm mt-1">Our team is reviewing your documents. You'll receive an email once verified (usually within 48 hours).</p>
                {org.verificationStatus === 'rejected' && org.verificationNote && (
                  <p className="text-red-600 text-sm mt-2 font-medium">Rejection reason: {org.verificationNote}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        <DashboardTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              <StatCard icon={TrendingUp} label="Total Raised" value={`₹${(org.totalRaised || 0).toLocaleString()}`} color="text-primary" bg="bg-primary-50" delay={0} />
              <StatCard icon={Target} label="Total Campaigns" value={campaigns.length} color="text-secondary" bg="bg-teal-50" delay={0.06} />
              <StatCard icon={CheckCircle} label="Active Campaigns" value={campaigns.filter(c => c.status === 'active').length} color="text-green-500" bg="bg-green-50" delay={0.12} />
              <StatCard icon={Users} label="Total Donors" value={campaigns.reduce((s, c) => s + (c.donorCount || 0), 0)} color="text-amber-500" bg="bg-amber-50" delay={0.18} />
            </div>

            <Card padding="p-6">
              <h3 className="font-bold text-slate-800 mb-4">Recent Campaigns</h3>
              {campaignsLoading ? (
                <div className="divide-y divide-slate-50">{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</div>
              ) : campaigns.slice(0, 4).length > 0 ? (
                <div className="space-y-3">
                  {campaigns.slice(0, 4).map(c => (
                    <div key={c._id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-50 flex-wrap sm:flex-nowrap">
                      <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
                        {c.images?.[0]?.url ? <img src={c.images[0].url} alt="" className="w-full h-full object-cover" /> : c.title?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{c.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge tone={STATUS_TONE[c.status] || 'slate'}>{c.status}</Badge>
                          <span className="text-xs text-slate-400">₹{c.raisedAmount?.toLocaleString()} raised</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Link to={`/campaigns/${c._id}`} className="p-2 rounded-lg hover:bg-white transition-colors">
                          <Eye className="w-4 h-4 text-slate-400" />
                        </Link>
                        <Link to={`/campaigns/${c._id}/edit`} className="p-2 rounded-lg hover:bg-white transition-colors">
                          <Edit className="w-4 h-4 text-slate-400" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={BarChart2} title="No campaigns yet" actionLabel={org.isVerified ? 'Create First Campaign' : undefined} onAction={org.isVerified ? () => window.location.assign('/campaigns/create') : undefined} />
              )}
            </Card>
          </div>
        )}

        {/* Campaigns tab */}
        {activeTab === 'campaigns' && (
          <Card padding="p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h3 className="font-bold text-slate-800">All Campaigns ({campaigns.length})</h3>
              {org.isVerified && <Link to="/campaigns/create"><Button variant="primary" size="sm" icon={Plus} iconPosition="left">New</Button></Link>}
            </div>
            {campaignsLoading ? (
              <div className="divide-y divide-slate-50">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
            ) : campaigns.length > 0 ? (
              <div className="space-y-3">
                {campaigns.map(c => (
                  <motion.div key={c._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-5 rounded-xl border border-slate-200 hover:border-primary/30 transition-colors flex-wrap sm:flex-nowrap">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      {c.images?.[0]?.url ? <img src={c.images[0].url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">{c.category === 'Medical' ? '🏥' : '❤️'}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{c.title}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <Badge tone={STATUS_TONE[c.status] || 'slate'}>{c.status}</Badge>
                        <span className="text-xs text-slate-400">{c.category}</span>
                        <FraudRiskBadge campaign={c} size="sm" showScore={false} />
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span>₹{c.raisedAmount?.toLocaleString()} / ₹{c.goalAmount?.toLocaleString()}</span>
                        <span>{c.donorCount || 0} donors</span>
                        <span>{Math.max(0, Math.ceil((new Date(c.deadline) - new Date()) / 86400000))} days left</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                      <Link to={`/campaigns/${c._id}`} className="flex-1 sm:flex-none"><Button variant="ghost" size="sm" icon={Eye} iconPosition="left" fullWidth>View</Button></Link>
                      <Link to={`/campaigns/${c._id}/edit`} className="flex-1 sm:flex-none"><Button variant="ghost" size="sm" icon={Edit} iconPosition="left" fullWidth>Edit</Button></Link>
                      {c.status === 'active' && <Button variant="ghost" size="sm" icon={Megaphone} iconPosition="left" fullWidth onClick={() => setUpdateModal(c)}>Update</Button>}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState icon={BarChart2} title="No campaigns yet" description={org.isVerified ? 'Create your first campaign to start fundraising.' : 'Get verified first to start creating campaigns.'} actionLabel={org.isVerified ? 'Create First Campaign' : undefined} onAction={org.isVerified ? () => window.location.assign('/campaigns/create') : undefined} />
            )}
          </Card>
        )}

        {/* Analytics tab */}
        {activeTab === 'analytics' && (
          analytics ? (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="font-bold text-slate-800 mb-4">Monthly Donations</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.monthlyDonations?.map(m => ({ month: `${m._id.month}/${m._id.year}`, amount: m.total }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Amount']} />
                    <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <h3 className="font-bold text-slate-800 mb-4">Top Campaigns</h3>
                <div className="space-y-3">
                  {analytics.topCampaigns?.map((c, i) => (
                    <div key={c._id} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-primary-50 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{c.title}</p>
                        <div className="progress-bar mt-1"><div className="progress-fill" style={{ width: `${(c.raisedAmount / c.goalAmount) * 100}%` }} /></div>
                      </div>
                      <span className="text-sm font-bold text-primary shrink-0">₹{c.raisedAmount?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : <EmptyState icon={BarChart2} title="Analytics unavailable" description="Analytics unlock once your organization is verified." />
        )}

        {/* Transparency tab */}
        {activeTab === 'transparency' && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <StatCard icon={ShieldCheck} label="Blockchain Verified Donations" value={bcStats?.totalVerified ?? 0} color="text-emerald-500" bg="bg-emerald-50" delay={0} />
              <StatCard icon={TrendingUp} label="Verified Amount Received" value={`₹${(bcStats?.totalAmount || 0).toLocaleString()}`} color="text-primary" bg="bg-primary-50" delay={0.08} />
            </div>

            <Card padding="p-6">
              <h3 className="font-bold text-slate-800 mb-2">Why Transparency Matters</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                Donations marked "Blockchain Verified" are permanently recorded on FundVision's tamper-proof
                ledger, giving your donors an immutable, publicly auditable record. This builds trust and
                differentiates your campaigns from unverified fundraisers.
              </p>
              <Link to="/ledger"><Button variant="secondary" size="sm" icon={ShieldCheck} iconPosition="left">View Public Ledger</Button></Link>
            </Card>
          </div>
        )}

        {/* Insights tab */}
        {activeTab === 'insights' && (
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-5 h-5 text-secondary-500" />
              <h3 className="font-bold text-slate-800">AI-Powered Insights</h3>
            </div>
            {insights.length > 0 ? (
              <div className="space-y-4">
                {insights.map((ins, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                    <Card padding="p-5">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{ins.type === 'tip' ? '💡' : ins.type === 'alert' ? '⚠️' : '🏆'}</span>
                        <div>
                          <p className="font-semibold text-slate-800">{ins.title}</p>
                          <p className="text-slate-500 text-sm mt-1 leading-relaxed">{ins.description}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card padding="p-10" className="text-center">
                <EmptyState icon={Sparkles} title="No insights yet" description="Insights will appear once you have active campaigns" />
              </Card>
            )}
          </div>
        )}
      </div>
      {updateModal && (
        <PostUpdateModal
          campaignId={updateModal._id}
          campaignTitle={updateModal.title}
          onClose={() => setUpdateModal(null)}
        />
      )}
    </div>
  );
}

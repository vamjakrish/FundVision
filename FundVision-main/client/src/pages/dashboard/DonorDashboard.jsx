import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Heart, TrendingUp, BookOpen, Award, Download, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import useAuthStore from '../../context/authStore';
import { donationAPI, aiAPI } from '../../services/api';
import BlockchainBadge from '../../components/blockchain/BlockchainBadge';
import { Card, Badge, SkeletonGrid, SkeletonRow, EmptyState } from '../../components/ui';
import { StatCard, DashboardHeader, DonorLeaderboard } from '../../components/dashboard';
import generateDonationCertificate from '../../utils/generateCertificate';

const COLORS = ['#2563EB', '#10B981', '#34D399', '#F59E0B', '#EF4444', '#0EA5E9'];

export default function DonorDashboard() {
  const { user } = useAuthStore();

  const { data: donationsRes, isLoading } = useQuery({
    queryKey: ['my-donations'],
    queryFn: () => donationAPI.getMyDonations({ limit: 50 }).then(r => r.data),
  });

  const { data: recommendRes } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => aiAPI.getRecommendations().then(r => r.data),
  });

  const { data: insightsRes } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => aiAPI.getInsights().then(r => r.data),
  });

  const donations = donationsRes?.data || [];
  const totalDonated = donations.reduce((s, d) => s + d.amount, 0);

  const categoryData = donations.reduce((acc, d) => {
    const cat = d.campaign?.category || 'Other';
    acc[cat] = (acc[cat] || 0) + d.amount;
    return acc;
  }, {});
  const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

  const monthlyData = donations.reduce((acc, d) => {
    const month = format(new Date(d.createdAt), 'MMM yy');
    acc[month] = (acc[month] || 0) + d.amount;
    return acc;
  }, {});
  const lineData = Object.entries(monthlyData).slice(-6).map(([month, amount]) => ({ month, amount }));

  const INSIGHT_ICONS = { tip: '💡', alert: '⚠️', achievement: '🏆' };

  return (
    <div className="pt-20 min-h-screen bg-slate-50">
      <div className="section-container py-5 sm:py-8">
        <DashboardHeader
          eyebrow={`Welcome back, ${user?.name?.split(' ')[0] || 'there'} 👋`}
          title="My Dashboard"
          subtitle="Track your giving history, impact, and personalized recommendations."
          action={
            <div className="flex items-center gap-2 px-4 py-2 bg-white/15 rounded-xl border border-white/20 backdrop-blur-sm">
              <Award className="w-5 h-5 text-amber-300" />
              <span className="text-sm font-semibold text-white">{user?.badge || 'New Supporter'}</span>
            </div>
          }
        />

        {isLoading ? (
          <SkeletonGrid count={4} />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-5 sm:mb-8">
            <StatCard icon={Heart} label="Total Donated" value={`₹${totalDonated.toLocaleString()}`} color="text-red-500" bg="bg-red-50" delay={0} />
            <StatCard icon={BookOpen} label="Campaigns Supported" value={donations.length} color="text-primary" bg="bg-primary-50" delay={0.06} />
            <StatCard icon={TrendingUp} label="Lives Impacted" value={`${donations.length * 3}+`} color="text-secondary" bg="bg-teal-50" delay={0.12} />
            <StatCard icon={Award} label="Donor Rank" value={user?.badge?.split(' ')[0] || 'New'} color="text-amber-500" bg="bg-amber-50" delay={0.18} />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {lineData.length > 0 && (
              <Card>
                <h2 className="font-bold text-slate-800 mb-4">Donation History</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Amount']} />
                    <Line type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            <Card>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-slate-800">Recent Donations</h2>
                <Link to="/dashboard?tab=history" className="text-sm text-primary hover:underline shrink-0">View all</Link>
              </div>
              {isLoading ? (
                <div className="divide-y divide-slate-50">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
              ) : donations.length > 0 ? (
                <div className="space-y-3">
                  {donations.slice(0, 6).map((d, i) => (
                    <motion.div key={d._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors flex-wrap">
                      <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
                        {d.campaign?.primaryImage
                          ? <img src={d.campaign.primaryImage} alt="" className="w-full h-full object-cover" />
                          : d.campaign?.title?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{d.campaign?.title}</p>
                        <p className="text-xs text-slate-400">{format(new Date(d.createdAt), 'MMM dd, yyyy')}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-primary text-sm">₹{d.amount.toLocaleString()}</p>
                        <Badge tone="success" className="mt-0.5">✓ {d.paymentStatus}</Badge>
                      </div>
                      <BlockchainBadge blockchain={d.blockchain} />
                      <button
                        onClick={() => generateDonationCertificate({
                          donorName: user?.name,
                          campaignTitle: d.campaign?.title,
                          amount: d.amount,
                          transactionId: d.blockchain?.transactionId || d.razorpayPaymentId || d._id,
                          date: d.createdAt,
                          receiptNumber: d.receiptNumber,
                        })}
                        className="p-1.5 hover:bg-white rounded-lg transition-colors"
                        title="Download Certificate"
                      >
                        <Download className="w-4 h-4 text-slate-400" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Heart} title="You haven't donated yet" description="Find a cause you care about and make your first contribution." actionLabel="Explore Campaigns" onAction={() => window.location.assign('/campaigns')} />
              )}
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <Card padding="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Blockchain Verification</h3>
                <Link to="/ledger" className="text-xs text-primary hover:underline shrink-0">Full ledger</Link>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-700">
                    {donations.filter(d => d.blockchain?.isVerified).length} / {donations.length}
                  </p>
                  <p className="text-xs text-emerald-600">Donations on the immutable ledger</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Every completed donation is automatically hashed and chained into our tamper-proof
                ledger — no wallet or crypto needed. Tap any "Blockchain Verified" badge below to view
                its block on the public explorer.
              </p>
            </Card>

            <DonorLeaderboard limit={5} />

            {pieData.length > 0 && (
              <Card padding="p-5">
                <h3 className="font-bold text-slate-800 mb-4">Donation by Category</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => [`₹${v.toLocaleString()}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-slate-600 truncate">{d.name}</span>
                      </div>
                      <span className="font-semibold text-slate-700 shrink-0">₹{d.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {insightsRes?.insights?.length > 0 && (
              <Card padding="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-secondary-500" />
                  <h3 className="font-bold text-slate-800">AI Insights</h3>
                </div>
                <div className="space-y-3">
                  {insightsRes.insights.map((ins, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50">
                      <p className="text-sm font-semibold text-slate-800">{INSIGHT_ICONS[ins.type]} {ins.title}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ins.description}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {recommendRes?.data?.length > 0 && (
              <Card padding="p-5">
                <h3 className="font-bold text-slate-800 mb-4">Recommended for You</h3>
                <div className="space-y-3">
                  {recommendRes.data.slice(0, 3).map(c => (
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
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, BadgeCheck, TrendingUp, AlertTriangle, CheckCircle, XCircle, Eye, Flag, BarChart2, Link2, ShieldCheck, ShieldAlert, RefreshCw, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { adminAPI, blockchainAPI } from '../../services/api';
import { Button, Card, Badge, Modal, SkeletonGrid, SkeletonRow, EmptyState } from '../../components/ui';
import { Textarea } from '../../components/ui/Input';
import { StatCard, DashboardHeader, DashboardTabs } from '../../components/dashboard';
import FraudRiskBadge from '../../components/campaigns/FraudRiskBadge';

const PIE_COLORS = ['#2563EB', '#10B981', '#34D399', '#F59E0B', '#EF4444', '#0EA5E9'];

function AnalyticsTab({ data, isLoading }) {
  if (isLoading) return <SkeletonGrid count={4} />;
  if (!data) return <EmptyState icon={Activity} title="Analytics unavailable" description="Could not load analytics data." />;

  const { donationGrowth = [], topDonors = [], campaignPerformance = [], fraudAlerts = [], revenueByCategory = [], suspiciousActivity = [] } = data;

  const growthChartData = donationGrowth.map(d => ({ date: d._id.slice(5), amount: d.amount, count: d.count }));
  const revData = revenueByCategory.map(d => ({ name: d._id || 'Other', value: d.revenue }));

  return (
    <div className="space-y-6">
      {/* Fraud Alerts */}
      {fraudAlerts.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-slate-800">Fraud Alerts ({fraudAlerts.length})</h3>
          </div>
          <div className="space-y-3">
            {fraudAlerts.map((a, i) => (
              <div key={i} className={`p-4 rounded-xl border ${a.severity === 'high' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{a.organization}</p>
                  </div>
                  <span className={`badge text-xs ${a.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {a.severity === 'high' ? '⚠️ High Risk' : '⚡ Medium Risk'}
                  </span>
                </div>
                <ul className="mt-2 space-y-1">
                  {a.reasons.map((r, j) => <li key={j} className="text-xs text-slate-600 flex gap-1.5"><span className="text-red-400">•</span>{r}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Donation Growth Chart */}
      <Card>
        <h3 className="font-bold text-slate-800 mb-4">Donation Growth (Last 90 Days)</h3>
        {growthChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={growthChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v, n) => [n === 'amount' ? `₹${v.toLocaleString()}` : v, n === 'amount' ? 'Revenue' : 'Donations']} />
              <Line type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={2.5} dot={false} name="amount" />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-slate-400 text-center py-10">No donation data yet</p>}
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <Card>
          <h3 className="font-bold text-slate-800 mb-4">Revenue by Category</h3>
          {revData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={revData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {revData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => `₹${Number(v).toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400 text-center py-10">No data yet</p>}
        </Card>

        {/* Top Donors */}
        <Card>
          <h3 className="font-bold text-slate-800 mb-4">Top Donors</h3>
          <div className="space-y-3 overflow-y-auto max-h-52">
            {topDonors.length > 0 ? topDonors.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 w-5 text-right">{i + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                  {d.avatar ? <img src={d.avatar} alt="" className="w-full h-full object-cover" /> : d.name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{d.name}</p>
                  <p className="text-xs text-slate-400">{d.count} donation{d.count !== 1 ? 's' : ''}</p>
                </div>
                <span className="font-bold text-primary text-sm shrink-0">₹{d.total?.toLocaleString()}</span>
              </div>
            )) : <p className="text-sm text-slate-400 text-center py-6">No donor data yet</p>}
          </div>
        </Card>
      </div>

      {/* Campaign Performance */}
      <Card>
        <h3 className="font-bold text-slate-800 mb-4">Campaign Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-500">
                <th className="pb-2 text-left font-semibold">Campaign</th>
                <th className="pb-2 text-right font-semibold">Goal</th>
                <th className="pb-2 text-right font-semibold">Raised</th>
                <th className="pb-2 text-right font-semibold">Donors</th>
                <th className="pb-2 text-right font-semibold">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {campaignPerformance.map((c, i) => {
                const pct = Math.min(Math.round((c.raisedAmount / c.goalAmount) * 100), 100);
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 pr-4 max-w-[200px]">
                      <p className="truncate font-medium text-slate-800">{c.title}</p>
                      <p className="text-xs text-slate-400">{c.category}</p>
                    </td>
                    <td className="py-2.5 text-right text-slate-600 whitespace-nowrap">₹{c.goalAmount?.toLocaleString()}</td>
                    <td className="py-2.5 text-right font-semibold text-primary whitespace-nowrap">₹{c.raisedAmount?.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-slate-600">{c.donorCount}</td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-700 w-8 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {campaignPerformance.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No active campaigns yet</p>}
        </div>
      </Card>

      {/* Suspicious Activity */}
      {suspiciousActivity.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-800">Suspicious Activity (Rapid Donations)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 text-xs text-slate-500">
                <th className="pb-2 text-left font-semibold">Donor</th>
                <th className="pb-2 text-left font-semibold">Campaign</th>
                <th className="pb-2 text-right font-semibold">Count</th>
                <th className="pb-2 text-right font-semibold">Total</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {suspiciousActivity.map((s, i) => (
                  <tr key={i} className="hover:bg-amber-50/50 transition-colors">
                    <td className="py-2 pr-4 font-medium text-slate-800">{s.donorName || 'Unknown'}</td>
                    <td className="py-2 pr-4 text-slate-600 max-w-[140px] truncate">{s.campaignTitle || 'Unknown'}</td>
                    <td className="py-2 text-right font-bold text-amber-600">{s.count}×</td>
                    <td className="py-2 text-right font-bold text-primary">₹{s.total?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [rejectModal, setRejectModal] = useState(null); // { type: 'org'|'campaign', id }
  const [rejectNote, setRejectNote] = useState('');
  const qc = useQueryClient();

  const { data: statsRes, isLoading: statsLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminAPI.getStats().then(r => r.data) });
  const { data: pendingOrgsRes, isLoading: orgsLoading } = useQuery({ queryKey: ['pending-orgs'], queryFn: () => adminAPI.getPendingOrgs().then(r => r.data) });
  const { data: pendingCampsRes, isLoading: campsLoading } = useQuery({ queryKey: ['pending-camps'], queryFn: () => adminAPI.getPendingCampaigns().then(r => r.data) });
  const { data: usersRes, isLoading: usersLoading } = useQuery({ queryKey: ['all-users'], queryFn: () => adminAPI.getUsers().then(r => r.data) });
  const { data: bcStatsRes } = useQuery({
    queryKey: ['admin-blockchain-stats'],
    queryFn: () => blockchainAPI.getAdminStats().then(r => r.data),
    refetchInterval: 30000,
  });

  const stats = statsRes?.stats;
  const pendingOrgs = pendingOrgsRes?.data || [];
  const pendingCamps = pendingCampsRes?.data || [];
  const users = usersRes?.data || [];
  const bcStats = bcStatsRes?.data;

  const { data: analyticsRes, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminAPI.getAnalytics().then(r => r.data),
    enabled: activeTab === 'analytics',
    staleTime: 5 * 60 * 1000,
  });

  const retrySyncMutation = useMutation({
    mutationFn: (donationId) => blockchainAPI.retrySync(donationId),
    onSuccess: (res) => {
      qc.invalidateQueries(['admin-blockchain-stats']);
      if (res.data?.success) toast.success('Blockchain sync retried successfully!');
      else toast.error(res.data?.message || 'Retry failed.');
    },
    onError: () => toast.error('Failed to retry sync'),
  });

  const verifyOrgMutation = useMutation({
    mutationFn: ({ id, status, note }) => adminAPI.verifyOrg(id, { status, note }),
    onSuccess: () => { qc.invalidateQueries(['pending-orgs']); toast.success('Organization status updated!'); },
    onError: () => toast.error('Failed to update status'),
  });

  const approveCampMutation = useMutation({
    mutationFn: ({ id, status, note }) => adminAPI.approveCampaign(id, { status, note }),
    onSuccess: () => { qc.invalidateQueries(['pending-camps']); toast.success('Campaign status updated!'); },
    onError: () => toast.error('Failed to update campaign'),
  });

  const toggleUserMutation = useMutation({
    mutationFn: (id) => adminAPI.toggleUser(id),
    onSuccess: () => { qc.invalidateQueries(['all-users']); toast.success('User status updated!'); },
  });

  const TABS = ['overview', 'organizations', 'campaigns', 'users', 'blockchain', 'analytics'];

  const openReject = (type, id) => { setRejectNote(''); setRejectModal({ type, id }); };
  const confirmReject = () => {
    if (!rejectModal) return;
    if (rejectModal.type === 'org') verifyOrgMutation.mutate({ id: rejectModal.id, status: 'rejected', note: rejectNote });
    else approveCampMutation.mutate({ id: rejectModal.id, status: 'rejected', note: rejectNote });
    setRejectModal(null);
  };

  return (
    <div className="pt-20 min-h-screen bg-slate-50">
      <div className="section-container py-5 sm:py-8">
        <DashboardHeader
          eyebrow="Platform Control Center"
          title="Admin Dashboard"
          subtitle="Manage NGOs, campaigns, users, and blockchain integrity across FundVision."
          badges={[
            pendingOrgs.length > 0 && <Badge key="o" tone="warning" icon={AlertTriangle}>{pendingOrgs.length} orgs pending</Badge>,
            pendingCamps.length > 0 && <Badge key="c" tone="primary" icon={Flag}>{pendingCamps.length} campaigns pending</Badge>,
            bcStats?.totalFailed > 0 && <Badge key="b" tone="danger" icon={ShieldAlert}>{bcStats.totalFailed} sync failures</Badge>,
          ].filter(Boolean)}
        />

        <DashboardTabs
          tabs={TABS}
          active={activeTab}
          onChange={setActiveTab}
          counts={{ organizations: pendingOrgs.length, campaigns: pendingCamps.length, blockchain: bcStats?.totalFailed || 0 }}
        />

        {/* Overview */}
        {activeTab === 'overview' && (
          statsLoading ? <SkeletonGrid count={4} /> : stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="text-primary" bg="bg-primary-50" delay={0} />
                <StatCard icon={BadgeCheck} label="Organizations" value={stats.totalOrgs} color="text-secondary" bg="bg-teal-50" delay={0.06} />
                <StatCard icon={TrendingUp} label="Total Raised" value={`₹${((stats.totalDonationAmount || 0) / 100000).toFixed(1)}L`} color="text-green-500" bg="bg-green-50" delay={0.12} />
                <StatCard icon={BarChart2} label="Active Campaigns" value={stats.activeCampaigns} color="text-amber-500" bg="bg-amber-50" delay={0.18} />
              </div>

              {stats.monthlyDonations?.length > 0 && (
                <Card>
                  <h3 className="font-bold text-slate-800 mb-4">Monthly Donations (Last 30 Days)</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.monthlyDonations.map(d => ({ day: `Day ${d._id}`, amount: d.amount }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Amount']} />
                      <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              <Card padding="p-6">
                <h3 className="font-bold text-slate-800 mb-4">Recent Donations</h3>
                {stats.recentDonations?.length > 0 ? (
                  <div className="table-scroll">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500 border-b border-slate-100">
                          <th className="pb-3 font-medium">Donor</th>
                          <th className="pb-3 font-medium">Campaign</th>
                          <th className="pb-3 font-medium">Amount</th>
                          <th className="pb-3 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {stats.recentDonations.map(d => (
                          <tr key={d._id} className="hover:bg-slate-50">
                            <td className="py-3 whitespace-nowrap">{d.isAnonymous ? 'Anonymous' : d.donor?.name}</td>
                            <td className="py-3 text-slate-500 truncate max-w-[160px]">{d.campaign?.title}</td>
                            <td className="py-3 font-semibold text-primary whitespace-nowrap">₹{d.amount?.toLocaleString()}</td>
                            <td className="py-3 text-slate-400 whitespace-nowrap">{format(new Date(d.createdAt), 'MMM dd')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <EmptyState title="No donations yet" />}
              </Card>
            </div>
          )
        )}

        {/* Organizations */}
        {activeTab === 'organizations' && (
          <Card padding="p-6">
            <h3 className="font-bold text-slate-800 mb-5">Pending Verifications ({pendingOrgs.length})</h3>
            {orgsLoading ? (
              <div className="divide-y divide-slate-50">{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</div>
            ) : pendingOrgs.length > 0 ? (
              <div className="space-y-4">
                {pendingOrgs.map(org => (
                  <motion.div key={org._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="border border-slate-200 rounded-xl p-4 sm:p-5 hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-bold text-slate-800">{org.name}</h4>
                          <Badge tone="slate">{org.type}</Badge>
                          <Badge tone="warning">{org.verificationStatus}</Badge>
                        </div>
                        <p className="text-sm text-slate-500 mb-2">{org.user?.email} · Joined {format(new Date(org.createdAt), 'MMM dd, yyyy')}</p>
                        <p className="text-sm text-slate-600 line-clamp-2">{org.description}</p>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {org.documents?.ngoCertificate?.url && (
                            <a href={org.documents.ngoCertificate.url} target="_blank" rel="noopener noreferrer"
                              className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center gap-1">
                              <Eye className="w-3 h-3" /> NGO Certificate
                            </a>
                          )}
                          {org.documents?.panCard?.url && (
                            <a href={org.documents.panCard.url} target="_blank" rel="noopener noreferrer"
                              className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center gap-1">
                              <Eye className="w-3 h-3" /> PAN Card
                            </a>
                          )}
                          {org.documents?.registrationProof?.url && (
                            <a href={org.documents.registrationProof.url} target="_blank" rel="noopener noreferrer"
                              className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center gap-1">
                              <Eye className="w-3 h-3" /> Registration
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto sm:min-w-[140px]">
                        <Button variant="primary" size="sm" icon={CheckCircle} iconPosition="left" className="!bg-green-500 hover:!shadow-none flex-1 sm:flex-none"
                          onClick={() => verifyOrgMutation.mutate({ id: org._id, status: 'verified', note: '' })}>
                          Approve
                        </Button>
                        <Button variant="outline" size="sm" icon={XCircle} iconPosition="left" className="!border-red-200 !text-red-600 hover:!bg-red-50 flex-1 sm:flex-none"
                          onClick={() => openReject('org', org._id)}>
                          Reject
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : <EmptyState icon={CheckCircle} title="No pending verifications" description="All organizations have been reviewed." />}
          </Card>
        )}

        {/* Campaigns */}
        {activeTab === 'campaigns' && (
          <Card padding="p-6">
            <h3 className="font-bold text-slate-800 mb-5">Pending Campaign Approvals ({pendingCamps.length})</h3>
            {campsLoading ? (
              <div className="divide-y divide-slate-50">{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</div>
            ) : pendingCamps.length > 0 ? (
              <div className="space-y-4">
                {pendingCamps.map(c => (
                  <motion.div key={c._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-slate-200 rounded-xl p-4 sm:p-5">
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        {c.images?.[0]?.url ? <img src={c.images[0].url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">📋</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-bold text-slate-800 truncate">{c.title}</h4>
                          <Badge tone="primary">{c.category}</Badge>
                          <FraudRiskBadge campaign={c} size="sm" />
                        </div>
                        <p className="text-sm text-slate-500 mb-2">By {c.organization?.name} · Goal: ₹{c.goalAmount?.toLocaleString()}</p>
                        <p className="text-sm text-slate-600 line-clamp-2">{c.description}</p>
                        <div className="flex gap-3 mt-3">
                          <a href={`/campaigns/${c._id}`} target="_blank" rel="noopener noreferrer"
                            className="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Preview
                          </a>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto shrink-0">
                        <Button variant="primary" size="sm" icon={CheckCircle} iconPosition="left" className="!bg-green-500 hover:!shadow-none flex-1 sm:flex-none"
                          onClick={() => approveCampMutation.mutate({ id: c._id, status: 'approved' })}>
                          Approve
                        </Button>
                        <Button variant="outline" size="sm" icon={XCircle} iconPosition="left" className="!border-red-200 !text-red-600 hover:!bg-red-50 flex-1 sm:flex-none"
                          onClick={() => openReject('campaign', c._id)}>
                          Reject
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : <EmptyState icon={CheckCircle} title="All campaigns reviewed" />}
          </Card>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <Card padding="p-6">
            <h3 className="font-bold text-slate-800 mb-5">All Users ({users.length})</h3>
            {usersLoading ? (
              <div className="divide-y divide-slate-50">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>
            ) : users.length > 0 ? (
              <div className="table-scroll">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">Joined</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map(u => (
                      <tr key={u._id} className="hover:bg-slate-50">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
                              {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.name?.[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 truncate">{u.name}</p>
                              <p className="text-xs text-slate-400 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 capitalize whitespace-nowrap">
                          <Badge tone={u.role === 'admin' ? 'secondary' : u.role === 'organization' ? 'success' : 'slate'}>{u.role}</Badge>
                        </td>
                        <td className="py-3 text-slate-500 whitespace-nowrap">{format(new Date(u.createdAt), 'MMM dd, yyyy')}</td>
                        <td className="py-3 whitespace-nowrap"><Badge tone={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Suspended'}</Badge></td>
                        <td className="py-3 whitespace-nowrap">
                          {u.role !== 'admin' && (
                            <Button variant="outline" size="sm" className={u.isActive ? '!border-red-200 !text-red-600 hover:!bg-red-50' : '!border-green-200 !text-green-600 hover:!bg-green-50'}
                              onClick={() => toggleUserMutation.mutate(u._id)}>
                              {u.isActive ? 'Suspend' : 'Activate'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState title="No users found" />}
          </Card>
        )}

        {/* Blockchain */}
        {activeTab === 'blockchain' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              <StatCard icon={ShieldCheck} label="Verified Donations" value={bcStats?.totalVerified ?? 0} color="text-emerald-500" bg="bg-emerald-50" delay={0} />
              <StatCard icon={ShieldAlert} label="Failed Syncs" value={bcStats?.totalFailed ?? 0} color="text-red-500" bg="bg-red-50" delay={0.06} />
              <StatCard icon={Link2} label="Pending Sync" value={bcStats?.totalPending ?? 0} color="text-amber-500" bg="bg-amber-50" delay={0.12} />
              <StatCard icon={BadgeCheck} label="Total Blocks" value={bcStats?.chainStats?.totalBlocks ?? '—'} color="text-primary" bg="bg-primary-50" delay={0.18} />
            </div>

            {bcStats?.chainValid === false && (
              <Card className="border border-red-200 bg-red-50/50">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">
                    Chain integrity check failed at block <span className="font-mono font-semibold">#{bcStats.corruptedBlock}</span>.
                    This indicates tampered or corrupted ledger data — investigate immediately.
                  </p>
                </div>
              </Card>
            )}

            <Card padding="p-6">
              <h3 className="font-bold text-slate-800 mb-5">Failed Blockchain Syncs</h3>
              {bcStats?.recentFailed?.length > 0 ? (
                <div className="space-y-3">
                  {bcStats.recentFailed.map(d => (
                    <div key={d._id} className="flex items-center justify-between gap-4 border border-red-100 bg-red-50/40 rounded-xl p-4 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">{d.campaign?.title || 'Campaign'}</p>
                        <p className="text-xs text-slate-500">₹{d.amount?.toLocaleString()} · {format(new Date(d.createdAt), 'MMM dd, yyyy')}</p>
                        {d.blockchain?.syncError && (
                          <p className="text-xs text-red-500 mt-1 line-clamp-1">{d.blockchain.syncError}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" icon={RefreshCw} iconPosition="left"
                        disabled={retrySyncMutation.isPending}
                        onClick={() => retrySyncMutation.mutate(d._id)}>
                        Retry
                      </Button>
                    </div>
                  ))}
                </div>
              ) : <EmptyState icon={CheckCircle} title="No failed syncs" description="All donations are healthy." />}
            </Card>
          </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab data={analyticsRes?.analytics} isLoading={analyticsLoading} />
        )}
      </div>

      <Modal
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title={rejectModal?.type === 'org' ? 'Reject Organization' : 'Reject Campaign'}
        footer={[
          <Button key="cancel" variant="ghost" size="sm" onClick={() => setRejectModal(null)}>Cancel</Button>,
          <Button key="confirm" variant="danger" size="sm" onClick={confirmReject}>Confirm Rejection</Button>,
        ]}
      >
        <Textarea
          label="Rejection reason"
          rows={4}
          placeholder="Explain why this is being rejected — this will be shared with the applicant."
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
        />
      </Modal>
    </div>
  );
}

export default AdminDashboard;

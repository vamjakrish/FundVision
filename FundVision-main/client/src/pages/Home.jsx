import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Heart, Shield, TrendingUp, Users, Star, ChevronRight, BadgeCheck, Zap, Globe, Award, Search, Lock, Link2, FileCheck, Sparkles } from 'lucide-react';
import { campaignAPI, aiAPI } from '../services/api';
import CampaignCard from '../components/campaigns/CampaignCard';
import LiveDonationFeed from '../components/campaigns/LiveDonationFeed';
import RecommendedCampaigns from '../components/campaigns/RecommendedCampaigns';
import DonorLeaderboard from '../components/dashboard/DonorLeaderboard';
import { Button, Card } from '../components/ui';

function Counter({ target, prefix = '', suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  if (inView && count === 0 && target > 0) {
    const step = target / 60;
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 20);
  }
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

const STATS = [
  { value: 15000, suffix: '+', label: 'Lives Impacted', icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
  { value: 850, suffix: '+', label: 'Campaigns Funded', icon: TrendingUp, color: 'text-primary', bg: 'bg-blue-50' },
  { value: 320, suffix: '+', label: 'Verified NGOs', icon: BadgeCheck, color: 'text-secondary', bg: 'bg-teal-50' },
  { prefix: '₹', value: 12, suffix: 'Cr+', label: 'Total Raised', icon: Award, color: 'text-amber-500', bg: 'bg-amber-50' },
];

const STEPS = [
  { step: '01', title: 'NGO Applies', desc: 'Organizations submit verification documents for review.', icon: Shield },
  { step: '02', title: 'Admin Verifies', desc: 'Our team reviews documents and verifies legitimacy within 48 hours.', icon: BadgeCheck },
  { step: '03', title: 'Campaign Created', desc: 'Verified organizations create detailed campaigns with goals and stories.', icon: Globe },
  { step: '04', title: 'Donors Give', desc: 'Donors browse causes and donate securely via Razorpay.', icon: Heart },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Regular Donor', avatar: 'PS', rating: 5, text: "FundVision's transparency completely changed how I give. I can see exactly where my money goes." },
  { name: 'Rajesh Kumar', role: 'NGO Director', avatar: 'RK', rating: 5, text: 'The verification badge gave our campaigns instant credibility. We raised 40% more than our target!' },
  { name: 'Anita Patel', role: 'Medical Donor', avatar: 'AP', rating: 5, text: 'The AI impact report showed me exactly how my contribution helped. Incredibly moving.' },
];

const CATEGORIES = [
  { name: 'Medical', emoji: '🏥', count: '234 campaigns', color: 'bg-red-50 hover:bg-red-100 border-red-100' },
  { name: 'Education', emoji: '📚', count: '189 campaigns', color: 'bg-blue-50 hover:bg-blue-100 border-blue-100' },
  { name: 'Emergency', emoji: '🚨', count: '67 campaigns', color: 'bg-orange-50 hover:bg-orange-100 border-orange-100' },
  { name: 'Environment', emoji: '🌱', count: '112 campaigns', color: 'bg-green-50 hover:bg-green-100 border-green-100' },
  { name: 'Animal Welfare', emoji: '🐾', count: '88 campaigns', color: 'bg-amber-50 hover:bg-amber-100 border-amber-100' },
  { name: 'Social Causes', emoji: '🤝', count: '156 campaigns', color: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-100' },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(p => !p)} className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-50">
        <span className="font-semibold text-slate-800 text-sm sm:text-base pr-4">{q}</span>
        <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-slate-500 text-sm leading-relaxed">{a}</div>}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: featuredRes } = useQuery({
    queryKey: ['featured-campaigns'],
    queryFn: () => campaignAPI.getAll({ featured: true, limit: 6, status: 'active' }).then(r => r.data),
  });
  const { data: trendingRes } = useQuery({
    queryKey: ['trending-campaigns'],
    queryFn: () => campaignAPI.getAll({ trending: true, limit: 3, status: 'active' }).then(r => r.data),
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/campaigns?search=${encodeURIComponent(searchQuery)}`);
    else navigate('/campaigns');
  };

  return (
    <div className="overflow-x-hidden">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center bg-hero-pattern pt-20 pb-12">
        <div className="absolute top-20 right-0 w-64 sm:w-96 lg:w-[500px] h-64 sm:h-96 lg:h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 sm:w-72 h-48 sm:h-72 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="section-container relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-3 sm:px-4 py-2 mb-5 sm:mb-6">
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                  <span className="text-primary text-xs sm:text-sm font-medium">AI-Powered Transparent Fundraising</span>
                </div>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 leading-[1.15] mb-5 sm:mb-6">
                Fund the{' '}<span className="gradient-text">Future</span>,<br />Change Lives
              </motion.h1>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="text-base sm:text-lg text-slate-500 leading-relaxed mb-6 sm:mb-8 max-w-lg">
                Connect with verified NGOs and donate with confidence. Every rupee tracked, every story told, every life changed.
              </motion.p>

              <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6 sm:mb-8 max-w-lg">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search campaigns..."
                    className="input-field pl-10 sm:pl-12 py-3 sm:py-4 text-sm shadow-card" />
                </div>
                <button type="submit" className="btn-primary py-3 sm:py-4 px-5 text-sm sm:text-base">Search</button>
              </motion.form>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-3">
                <Link to="/campaigns" className="btn-primary gap-2 flex items-center text-sm sm:text-base">
                  Browse Campaigns <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/register" className="btn-secondary gap-2 flex items-center text-sm sm:text-base">
                  Start a Campaign
                </Link>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-3 sm:gap-4 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-200">
                {['SSL Secured', '80G Tax Benefits', 'Verified NGOs', 'Razorpay'].map(badge => (
                  <div key={badge} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-500 shrink-0" />{badge}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Hero visual - hidden on small screens */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block relative">
              <div className="relative w-full max-w-md mx-auto">
                <div className="bg-white rounded-3xl shadow-card-hover p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center"><Heart className="w-6 h-6 text-white fill-white" /></div>
                    <div><p className="font-bold text-slate-800">Helping Children Learn</p><p className="text-xs text-slate-400">Education · Mumbai</p></div>
                    <span className="ml-auto badge bg-green-100 text-green-700">Active</span>
                  </div>
                  <div className="w-full h-28 rounded-xl bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center mb-4">
                    <span className="text-4xl">📚</span>
                  </div>
                  <div className="mb-2 flex justify-between text-sm"><span className="text-slate-500">Progress</span><span className="font-bold text-primary">72%</span></div>
                  <div className="progress-bar mb-4"><div className="progress-fill" style={{ width: '72%' }} /></div>
                  <div className="flex justify-between text-sm text-slate-500"><span>₹3.6L raised</span><span>₹5L goal</span></div>
                </div>
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-4 -right-4 glass rounded-2xl p-3 shadow-glass">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span className="text-xs font-medium text-slate-700">Live Donations</span></div>
                  <p className="text-lg font-bold gradient-text mt-1">₹2,450</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trusted-by strip */}
      <section className="py-6 sm:py-8 bg-white border-y border-slate-100">
        <div className="section-container">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-12 opacity-70">
            <p className="text-xs sm:text-sm text-slate-400 font-medium w-full text-center sm:w-auto sm:text-left">Trusted &amp; compliant with</p>
            {[
              { icon: Lock, label: 'PCI-DSS Secured' },
              { icon: FileCheck, label: '80G Tax Certified' },
              { icon: Link2, label: 'Blockchain Verified' },
              { icon: BadgeCheck, label: 'RBI Compliant Payments' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-slate-500">
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-white">
        <div className="section-container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {STATS.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                    <Counter target={s.value} prefix={s.prefix} suffix={s.suffix} />
                  </p>
                  <p className="text-slate-500 text-xs sm:text-sm">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured campaigns */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="section-container">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold mb-2">
                <Star className="w-4 h-4" /> Featured Campaigns
              </div>
              <h2 className="section-title">Making a Real Difference</h2>
            </div>
            <Link to="/campaigns?featured=true" className="btn-secondary text-sm flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {featuredRes?.data?.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featuredRes.data.slice(0, 6).map((c, i) => (
                <motion.div key={c._id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <CampaignCard campaign={c} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Featured campaigns coming soon</p>
            </div>
          )}
        </div>
      </section>

      {/* Live activity: donation feed + leaderboard */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="section-container">
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold mb-2">
              <Zap className="w-4 h-4" /> Happening Right Now
            </div>
            <h2 className="section-title">The Community in Action</h2>
            <p className="section-subtitle mx-auto">Real donations, real impact, updating live</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-5 sm:gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <LiveDonationFeed />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <DonorLeaderboard limit={6} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="section-container">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="section-title">Browse by Category</h2>
            <p className="section-subtitle mx-auto">Find causes that match your values</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {CATEGORIES.map((cat, i) => (
              <motion.div key={cat.name} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Link to={`/campaigns?category=${cat.name}`}
                  className={`block border rounded-2xl p-3 sm:p-4 text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-card ${cat.color}`}>
                  <span className="text-2xl sm:text-3xl block mb-2">{cat.emoji}</span>
                  <p className="font-semibold text-slate-800 text-xs sm:text-sm">{cat.name}</p>
                  <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5">{cat.count}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="section-container">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="section-title">How FundVision Works</h2>
            <p className="section-subtitle mx-auto">Simple, transparent, and secure</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {STEPS.map((s, i) => (
              <motion.div key={s.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative text-center">
                {i < STEPS.length - 1 && <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-px border-t-2 border-dashed border-slate-200" />}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-4 shadow-glow">
                  <s.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="inline-block bg-primary/10 text-primary font-bold text-xs px-2.5 py-1 rounded-full mb-2">{s.step}</div>
                <h3 className="font-bold text-slate-800 mb-2 text-sm sm:text-base">{s.title}</h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending campaigns */}
      {trendingRes?.data?.length > 0 && (
        <section className="py-12 sm:py-16 bg-white">
          <div className="section-container">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold mb-2">
                  <TrendingUp className="w-4 h-4" /> Trending Now
                </div>
                <h2 className="section-title">Urgent Causes</h2>
              </div>
              <Link to="/campaigns?trending=true" className="btn-secondary text-sm flex items-center gap-2">View All <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {trendingRes.data.slice(0, 3).map((c, i) => (
                <motion.div key={c._id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <CampaignCard campaign={c} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AI-powered recommendations (logged-in users only) */}
      <RecommendedCampaigns variant="section" limit={3} />

      {/* Testimonials */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="section-container">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="section-title">What People Say</h2>
            <p className="section-subtitle mx-auto">Real stories from donors and organizations</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="card p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-brand flex items-center justify-center text-white font-bold shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm sm:text-base">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">{[...Array(t.rating)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />)}</div>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{t.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Blockchain Transparency */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-secondary-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="section-container relative z-10">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 sm:px-4 py-2 mb-4">
              <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary-400 shrink-0" />
              <span className="text-secondary-300 text-xs sm:text-sm font-medium">Blockchain-Backed Transparency</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">Every Rupee, Verifiable On-Chain</h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">No wallet, no crypto knowledge needed. Just real, tamper-proof proof that your donation reached its cause.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: Lock, title: 'Cryptographic Hashing', desc: 'Every donation is hashed into an immutable ledger the moment it lands.' },
              { icon: FileCheck, title: 'Public Audit Trail', desc: 'Anyone can verify a donation hash and trace fund movement, end to end.' },
              { icon: Sparkles, title: 'Zero Tampering', desc: 'Records can\u2019t be edited or deleted \u2014 by NGOs, admins, or anyone else.' },
            ].map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-sm hover:bg-white/10 transition-colors duration-300">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-brand flex items-center justify-center mb-4 shadow-glow">
                  <f.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="font-bold text-white mb-2 text-sm sm:text-base">{f.title}</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8 sm:mt-10">
            <Link to="/ledger">
              <Button variant="outline" icon={ArrowRight} className="!border-white/20 !text-white hover:!bg-white/10">
                Explore the Public Ledger
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="section-container max-w-3xl">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {[
              ['Is my donation secure?', 'Yes. All payments are processed through Razorpay, a PCI-DSS compliant payment gateway. Your financial information is never stored on our servers.'],
              ['How are NGOs verified?', 'We manually verify NGO certificates, PAN cards, and registration documents. Only organizations that pass our verification receive the Verified badge.'],
              ['Can I get a tax receipt?', 'Yes! Donations to verified NGOs registered under 80G are eligible for tax deductions. Download your receipt from your dashboard.'],
              ['How does blockchain verification work?', 'Every donation is cryptographically hashed into our tamper-proof ledger. Visit the Ledger page to verify any donation — no crypto wallet needed.'],
            ].map(([q, a]) => <FAQItem key={q} q={q} a={a} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-20 bg-slate-50">
        <div className="section-container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative rounded-2xl sm:rounded-3xl bg-gradient-brand overflow-hidden p-8 sm:p-12 text-center">
            <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full -translate-y-24 translate-x-24 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/10 rounded-full translate-y-16 -translate-x-16 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">Start Your Impact Today</h2>
              <p className="text-white/80 text-sm sm:text-base mb-6 sm:mb-8 max-w-lg mx-auto">Join thousands of donors making a difference. Every contribution creates ripples of change.</p>
              <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
                <Link to="/campaigns">
                  <Button variant="primary" size="lg" icon={ArrowRight} className="!bg-white !text-primary hover:!shadow-lg">
                    Explore Campaigns
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline" size="lg" className="!border-white/30 !text-white hover:!bg-white/10">
                    Register as NGO
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

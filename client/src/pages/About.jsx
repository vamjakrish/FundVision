import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, Shield, Eye, Users, Award, ArrowRight, BadgeCheck } from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

const TEAM = [
  { name: 'Aarav Mehta', role: 'Founder & CEO', avatar: 'AM', bio: '10+ years in social impact & fintech' },
  { name: 'Priya Singh', role: 'CTO', avatar: 'PS', bio: 'Ex-Google engineer, AI specialist' },
  { name: 'Raj Patel', role: 'Head of Partnerships', avatar: 'RP', bio: 'Built 200+ NGO relationships' },
  { name: 'Anita Sharma', role: 'Head of Trust & Safety', avatar: 'AS', bio: 'Former compliance officer at RBI' },
];

const VALUES = [
  { icon: Eye, title: 'Radical Transparency', desc: 'Every rupee tracked. Every update shared. No hidden fees, no hidden agendas.', color: 'text-primary', bg: 'bg-blue-50' },
  { icon: Shield, title: 'Verified Trust', desc: 'Manual verification of every organization before they publish a single campaign.', color: 'text-secondary', bg: 'bg-teal-50' },
  { icon: Heart, title: 'People First', desc: 'We exist for the beneficiaries — the children, patients, and communities who need help.', color: 'text-red-500', bg: 'bg-red-50' },
  { icon: Award, title: 'Proven Impact', desc: 'Real stories, real data, real change. We measure success in lives improved.', color: 'text-amber-500', bg: 'bg-amber-50' },
];

export default function About() {
  return (
    <div className="pt-20 overflow-hidden">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="section-container text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
              <Heart className="w-4 h-4 text-primary fill-primary" />
              <span className="text-primary text-sm font-medium">Our Story</span>
            </div>
            <h1 className="text-5xl font-bold text-slate-900 mb-6">
              We Believe Every Rupee<br />Should <span className="gradient-text">Create Impact</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              FundVision was built on a simple belief: when donors can see exactly where their money goes, they give more — and causes thrive. We're building India's most transparent fundraising platform.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="section-container max-w-4xl">
          <div className="grid sm:grid-cols-2 gap-8">
            {[
              { title: 'Our Mission', text: 'To democratize fundraising in India by creating a transparent, AI-powered platform that connects compassionate donors with verified organizations creating measurable social impact.', icon: '🎯' },
              { title: 'Our Vision', text: 'A world where every social cause has access to the funding it needs, and every donor can see the exact impact of their contribution — from classroom to hospital to forest.', icon: '🌟' },
            ].map((item, i) => (
              <motion.div key={item.title} {...fadeUp} transition={{ delay: i * 0.1 }} className="card p-8">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-slate-50">
        <div className="section-container">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="section-title">What We Stand For</h2>
            <p className="section-subtitle mx-auto">Four principles guide every decision we make</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => (
              <motion.div key={v.title} {...fadeUp} transition={{ delay: i * 0.1 }} className="card p-6 text-center">
                <div className={`w-14 h-14 rounded-2xl ${v.bg} flex items-center justify-center mx-auto mb-4`}>
                  <v.icon className={`w-7 h-7 ${v.color}`} />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{v.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="section-container">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="section-title">The Team Behind FundVision</h2>
            <p className="section-subtitle mx-auto">Passionate individuals dedicated to social impact</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {TEAM.map((member, i) => (
              <motion.div key={member.name} {...fadeUp} transition={{ delay: i * 0.1 }} className="card p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                  {member.avatar}
                </div>
                <h3 className="font-bold text-slate-800">{member.name}</h3>
                <p className="text-primary text-sm font-medium">{member.role}</p>
                <p className="text-slate-500 text-xs mt-2">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-brand">
        <div className="section-container text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-4xl font-bold text-white mb-4">Join the Movement</h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">Whether you're a donor, an NGO, or a changemaker — there's a place for you at FundVision.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/campaigns" className="bg-white text-primary font-semibold px-8 py-4 rounded-xl hover:shadow-lg transition-all flex items-center gap-2">
                Browse Campaigns <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/register" className="bg-white/20 text-white border border-white/30 font-semibold px-8 py-4 rounded-xl hover:bg-white/30 transition-all">
                Register as NGO
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, Shield, Eye, Award, ArrowRight, Linkedin, Github, Mail, Globe } from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

const TEAM = [
  {
    name: 'Krish Vamja',
    role: 'Team Lead & Full Stack Developer',
    avatar: '/team/krish-vamja.jpg',
    bio: 'Leads the team with strong problem-solving skills and full stack development expertise.',
    socials: [
      { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
      { icon: Github, href: 'https://github.com', label: 'GitHub' },
      { icon: Mail, href: 'mailto:krish@fundvision.org', label: 'Email' },
      { icon: Globe, href: '#', label: 'Website' },
    ],
  },
  {
    name: 'Ankit Rudani',
    role: 'Backend Developer',
    avatar: '/team/ankit-rudani.jpg',
    bio: 'Specializes in building secure and scalable backend systems and database management.',
    socials: [
      { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
      { icon: Github, href: 'https://github.com', label: 'GitHub' },
      { icon: Mail, href: 'mailto:ankit@fundvision.org', label: 'Email' },
      { icon: Globe, href: '#', label: 'Website' },
    ],
  },
  {
    name: 'Patel Rudra',
    role: 'Frontend Developer',
    avatar: '/team/patel-rudra.jpg',
    bio: 'Creates responsive and intuitive user interfaces with modern frontend technologies.',
    socials: [
      { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
      { icon: Github, href: 'https://github.com', label: 'GitHub' },
      { icon: Mail, href: 'mailto:rudra@fundvision.org', label: 'Email' },
      { icon: Globe, href: '#', label: 'Website' },
    ],
  },
  {
    name: 'Parv Bhalani',
    role: 'UI/UX Designer',
    avatar: '/team/parv-bhalani.jpg',
    bio: 'Designs beautiful and user-friendly interfaces that enhance user experience.',
    socials: [
      { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
      { icon: Github, href: 'https://github.com', label: 'GitHub' },
      { icon: Mail, href: 'mailto:parv@fundvision.org', label: 'Email' },
      { icon: Globe, href: '#', label: 'Website' },
    ],
  },
];

const VALUES = [
  { icon: Eye, title: 'Radical Transparency', desc: 'Every rupee tracked. Every update shared. No hidden fees, no hidden agendas.', color: 'text-primary', bg: 'bg-blue-50' },
  { icon: Shield, title: 'Verified Trust', desc: 'Manual verification of every organization before they publish a single campaign.', color: 'text-secondary', bg: 'bg-teal-50' },
  { icon: Heart, title: 'People First', desc: 'We exist for the beneficiaries — the children, patients, and communities who need help.', color: 'text-red-500', bg: 'bg-red-50' },
  { icon: Award, title: 'Proven Impact', desc: 'Real stories, real data, real change. We measure success in lives improved.', color: 'text-amber-500', bg: 'bg-amber-50' },
];

function DotPattern() {
  return (
    <svg className="w-16 h-24 text-slate-300 fill-current opacity-50" viewBox="0 0 64 96">
      <pattern id="dot-pattern" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="4" r="2.5" className="text-teal-400/60" fill="currentColor" />
      </pattern>
      <rect width="64" height="96" fill="url(#dot-pattern)" />
    </svg>
  );
}

export default function About() {
  return (
    <div className="pt-20 overflow-hidden bg-slate-50/50">
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
      <section className="py-24 bg-[#f8fafc] relative overflow-hidden">
        {/* Background decorations */}
        <div className="w-80 h-80 rounded-full bg-teal-100/40 blur-3xl absolute -top-20 -left-20 pointer-events-none" />
        <div className="w-80 h-80 rounded-full bg-blue-100/40 blur-3xl absolute -bottom-20 -right-20 pointer-events-none" />

        {/* Side Dot Matrix Decorators */}
        <div className="hidden lg:block absolute left-8 top-28 pointer-events-none">
          <DotPattern />
        </div>
        <div className="hidden lg:block absolute right-8 top-28 pointer-events-none">
          <DotPattern />
        </div>

        <div className="section-container relative z-10">
          {/* Header */}
          <motion.div {...fadeUp} className="text-center mb-14">
            <div className="inline-flex items-center justify-center bg-[#318282] text-white text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider mb-5 shadow-xs">
              MEET THE TEAM
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-3">
              The Team Behind FundVision
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full mx-auto my-3 relative flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-teal-400 absolute -right-3" />
            </div>
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mt-4">
              Passionate individuals dedicated to building a transparent and impactful platform for donors and fund seekers.
            </p>
          </motion.div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 p-6 flex flex-col items-center text-center h-full"
              >
                {/* Image */}
                <div className="relative mb-5">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 border-2 border-teal-500/70 flex items-center justify-center bg-white shadow-xs">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">{member.name}</h3>

                {/* Role */}
                <p className="text-xs sm:text-sm font-medium text-teal-600 mb-3">{member.role}</p>

                {/* Description */}
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6 flex-grow max-w-[240px]">
                  {member.bio}
                </p>

                {/* Social Links */}
                <div className="flex items-center justify-center gap-3 mt-auto pt-2">
                  {member.socials.map((s, idx) => {
                    const IconComponent = s.icon;
                    return (
                      <a
                        key={idx}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        className="w-8 h-8 rounded-full border border-teal-200/70 flex items-center justify-center text-teal-600 bg-teal-50/20 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all duration-200"
                      >
                        <IconComponent className="w-4 h-4" />
                      </a>
                    );
                  })}
                </div>
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

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Twitter, Facebook, Instagram, Linkedin, Mail, Phone, MapPin, Lock, BadgeCheck, ArrowRight } from 'lucide-react';
import { Button } from '../ui';
import Logo from '../common/Logo';

const TRUST = [
  { icon: Lock, label: 'PCI-DSS Secured Payments' },
  { icon: BadgeCheck, label: 'Verified NGO Network' },
  { icon: Heart, label: '80G Tax Benefits' },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 relative overflow-hidden">
      {/* gradient accent line */}
      <div className="h-1 w-full bg-gradient-brand" />

      {/* trust strip */}
      <div className="border-b border-slate-800">
        <div className="section-container py-6 sm:py-7">
          <div className="flex flex-wrap items-center justify-center sm:justify-between gap-4 sm:gap-6">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {TRUST.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-secondary-400 shrink-0" />
                  <span className="text-xs sm:text-sm text-slate-400 font-medium whitespace-nowrap">{label}</span>
                </div>
              ))}
            </div>
            <Link to="/register" className="hidden sm:block">
              <Button variant="primary" size="sm" icon={ArrowRight}>Start Fundraising</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="section-container pt-14 sm:pt-16 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 mb-12"
        >
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Logo variant="full" dark height={38} />
            </Link>
            <p className="text-sm leading-relaxed text-slate-400 mb-5">
              Transparent fundraising platform connecting compassionate donors with verified NGOs and social organizations across India.
            </p>
            <div className="flex gap-3">
              {[Twitter, Facebook, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-gradient-brand transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-3 text-sm">
              {[['Campaigns', '/campaigns'], ['Organizations', '/organizations'], ['About Us', '/about'], ['How It Works', '/about#how']].map(([label, to]) => (
                <li key={label}><Link to={to} className="hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-semibold mb-4">Categories</h4>
            <ul className="space-y-3 text-sm">
              {['Medical', 'Education', 'Emergency', 'Environment', 'Animal Welfare', 'Social Causes'].map(cat => (
                <li key={cat}>
                  <Link to={`/campaigns?category=${cat}`} className="hover:text-white transition-colors">{cat}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary shrink-0" /><span className="break-all">support@fundvision.com</span></li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary shrink-0" /><span>+91 98765 43210</span></li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary shrink-0" /><span>Mumbai, Maharashtra, India</span></li>
            </ul>
            <div className="mt-6">
              <p className="text-xs text-slate-500 mb-2">Subscribe for updates</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Your email" className="flex-1 min-w-0 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary" />
                <button className="px-3 py-2 bg-gradient-brand rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity shrink-0">Go</button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p className="text-center sm:text-left">© 2026 FundVision Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

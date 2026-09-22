import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Heart, Mail, Lock, User, Building, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';
import api from '../../services/api';
import Logo from '../../components/common/Logo';

const ROLES = [
  { value: 'donor', label: 'Donor', desc: 'I want to donate', icon: Heart },
  { value: 'organization', label: 'Organization', desc: 'I represent an NGO/Charity', icon: Building },
];

export default function Register() {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('donor');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ defaultValues: { role: 'donor' } });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authAPI.register({ ...data, role: selectedRole });
      const { user, organization, token, refreshToken } = res.data;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setAuth({ user, organization, token, refreshToken });
      toast.success('Account created! Welcome to FundVision 🎉');
      if (selectedRole === 'organization') navigate('/organization/setup');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  const password = watch('password');

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-secondary to-primary relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 bg-hero-pattern opacity-10" />
        <div className="relative z-10 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 p-3">
            <Logo variant="icon" height={56} className="rounded-xl overflow-hidden" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Join FundVision</h2>
          <p className="text-white/80 text-lg max-w-sm leading-relaxed">
            Be part of a movement that's changing lives. Transparent, verified, and impactful fundraising.
          </p>
          <div className="mt-8 space-y-3 text-left">
            {['Free to join and donate', 'Verified NGO ecosystem', 'AI-powered transparency', '80G tax exemption support', 'Real-time impact tracking'].map(f => (
              <div key={f} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2.5">
                <span className="w-2 h-2 bg-green-400 rounded-full shrink-0" />
                <span className="text-sm text-white/90">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md py-8"
        >
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <Logo variant="full" height={34} />
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">Create account</h1>
            <p className="text-slate-500 mt-2">Already have one? <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link></p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {ROLES.map(r => (
              <button key={r.value} type="button" onClick={() => setSelectedRole(r.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${selectedRole === r.value ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}>
                <r.icon className={`w-5 h-5 mb-1.5 ${selectedRole === r.value ? 'text-primary' : 'text-slate-400'}`} />
                <p className={`font-semibold text-sm ${selectedRole === r.value ? 'text-primary' : 'text-slate-700'}`}>{r.label}</p>
                <p className="text-xs text-slate-400">{r.desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('name', { required: 'Name required', minLength: { value: 2, message: 'Min 2 characters' } })}
                  placeholder="Your full name"
                  className={`input-field pl-11 ${errors.name ? 'border-red-400' : ''}`} />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('email', { required: 'Email required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                  type="email" placeholder="you@example.com"
                  className={`input-field pl-11 ${errors.email ? 'border-red-400' : ''}`} />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('password', { required: 'Password required', minLength: { value: 8, message: 'Min 8 characters' } })}
                  type={showPass ? 'text' : 'password'} placeholder="Min 8 characters"
                  className={`input-field pl-11 pr-11 ${errors.password ? 'border-red-400' : ''}`} />
                <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('confirmPassword', {
                  required: 'Please confirm password',
                  validate: v => v === password || 'Passwords do not match'
                })}
                  type="password" placeholder="Confirm your password"
                  className={`input-field pl-11 ${errors.confirmPassword ? 'border-red-400' : ''}`} />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? (
                <span className="flex items-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">Create Account <ArrowRight className="w-4 h-4" /></span>
              )}
            </button>

            <p className="text-xs text-slate-400 text-center">
              By registering, you agree to our{' '}
              <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{' '}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

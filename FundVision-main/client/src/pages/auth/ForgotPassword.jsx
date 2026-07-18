// ForgotPassword.jsx - export default
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>
        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h2>
              <p className="text-slate-500 text-sm">We've sent a password reset link to your email address. Check your inbox and spam folder.</p>
              <Link to="/login" className="btn-primary mt-6 inline-block">Back to Login</Link>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 bg-gradient-brand rounded-2xl flex items-center justify-center mb-6">
                <Mail className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Forgot password?</h2>
              <p className="text-slate-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input {...register('email', { required: 'Email required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                      type="email" placeholder="your@email.com"
                      className={`input-field pl-11 ${errors.email ? 'border-red-400' : ''}`} />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
export default ForgotPasswordPage;

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Shield, Heart, ArrowLeft, CheckCircle, Sparkles, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { campaignAPI, donationAPI, aiAPI, blockchainAPI } from '../services/api';
import useAuthStore from '../context/authStore';
import BlockchainBadge from '../components/blockchain/BlockchainBadge';
import Confetti from '../components/common/Confetti';
import generateDonationCertificate from '../utils/generateCertificate';

const PRESET_AMOUNTS = [100, 500, 1000, 2500, 5000, 10000];

export default function DonatePage() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState('amount'); // amount | payment | success
  const [donationData, setDonationData] = useState(null);
  const [impactMessage, setImpactMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);

  const { register, handleSubmit, watch } = useForm({
    defaultValues: { isAnonymous: false, message: '' }
  });

  const { data: res } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignAPI.getOne(campaignId).then(r => r.data),
  });
  const campaign = res?.data;

  const finalAmount = selectedPreset || parseInt(customAmount) || 0;

  const loadRazorpay = () => new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handlePayment = async (formData) => {
    if (!finalAmount || finalAmount < 10) return toast.error('Minimum donation is ₹10');
    setLoading(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Razorpay failed to load');

      const { data: orderData } = await donationAPI.createOrder({
        campaignId, amount: finalAmount,
        isAnonymous: formData.isAnonymous,
        message: formData.message
      });

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'FundVision',
        description: campaign?.title,
        order_id: orderData.orderId,
        prefill: { name: user.name, email: user.email, contact: user.phone || '' },
        theme: { color: '#2563EB' },
        handler: async (response) => {
          try {
            const verifyRes = await donationAPI.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              donationId: orderData.donationId
            });
            setDonationData(verifyRes.data);
            setImpactMessage(verifyRes.data.impactMessage || '');
            setStep('success');
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: { ondismiss: () => { setLoading(false); toast('Payment cancelled'); } }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => { toast.error('Payment failed. Please try again.'); setLoading(false); });
      rzp.open();
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  if (step === 'success') {
    return <DonationSuccess donationData={donationData} finalAmount={finalAmount} impactMessage={impactMessage} />;
  }

  if (!campaign) return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full" />
    </div>
  );

  return (
    <div className="pt-20 min-h-screen bg-slate-50">
      <div className="section-container py-10">
        <Link to={`/campaigns/${campaignId}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to campaign
        </Link>

        <div className="grid lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
          {/* Campaign summary */}
          <div className="lg:col-span-2">
            <div className="card p-5 sticky top-24">
              <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 mb-4">
                {campaign.images?.[0]?.url
                  ? <img src={campaign.images[0].url} alt={campaign.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Heart className="w-10 h-10 text-slate-300" /></div>}
              </div>
              <h3 className="font-bold text-slate-800 text-sm leading-snug mb-3">{campaign.title}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Goal</span><span className="font-semibold">₹{campaign.goalAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Raised</span><span className="font-semibold text-green-600">₹{campaign.raisedAmount?.toLocaleString()}</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100)}%` }} /></div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 border-t border-slate-100 pt-4">
                <Shield className="w-3.5 h-3.5 text-green-500" />
                SSL Secured · 80G Tax Benefits · Razorpay Protected
              </div>
            </div>
          </div>

          {/* Donation form */}
          <div className="lg:col-span-3">
            <div className="card p-5 sm:p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Make a Donation</h2>
              <p className="text-slate-500 text-sm mb-6">100% of your donation reaches the campaign</p>

              {/* Amount selection */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-slate-700 mb-3">Choose Amount</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {PRESET_AMOUNTS.map(amt => (
                    <button key={amt} type="button"
                      onClick={() => { setSelectedPreset(amt); setCustomAmount(''); }}
                      className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${selectedPreset === amt ? 'border-primary bg-primary text-white' : 'border-slate-200 text-slate-700 hover:border-primary/50'}`}>
                      ₹{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                  <input
                    type="number" placeholder="Enter custom amount" min="10"
                    value={customAmount}
                    onChange={e => { setCustomAmount(e.target.value); setSelectedPreset(null); }}
                    className="input-field pl-8"
                  />
                </div>
                {finalAmount > 0 && (
                  <p className="text-xs text-slate-500 mt-2">
                    You're donating <span className="font-bold text-primary">₹{finalAmount.toLocaleString()}</span>
                    {finalAmount >= 500 && <span className="ml-1 text-green-600">· Eligible for 80G tax deduction</span>}
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit(handlePayment)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Message (optional)</label>
                  <textarea {...register('message')} rows={3}
                    placeholder="Share your reason for donating or a message of support..."
                    className="input-field resize-none" />
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 cursor-pointer" onClick={() => {}}>
                  <input {...register('isAnonymous')} type="checkbox" id="anon" className="w-4 h-4 accent-primary cursor-pointer" />
                  <label htmlFor="anon" className="text-sm text-slate-700 cursor-pointer">
                    Donate anonymously <span className="text-slate-400">(your name won't appear publicly)</span>
                  </label>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-slate-200">
                  <Shield className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-sm text-slate-600">
                    Every donation is automatically recorded on our tamper-proof blockchain ledger — no
                    wallet or crypto required.
                  </p>
                </div>

                <button type="submit" disabled={loading || !finalAmount}
                  className="btn-primary w-full py-4 text-base disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full inline-block" />
                      Processing...
                    </span>
                  ) : (
                    <><Heart className="w-5 h-5" /> Donate ₹{finalAmount.toLocaleString() || '0'} Now</>
                  )}
                </button>

                <p className="text-xs text-center text-slate-400 flex items-center justify-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Payments secured by Razorpay. Test mode active.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DonationSuccess({ donationData, finalAmount, impactMessage }) {
  const donationId = donationData?.donation?._id || donationData?.donation?.id;
  const [blockchain, setBlockchain] = useState(donationData?.donation?.blockchain || null);
  const { user } = useAuthStore();

  const handleDownloadCertificate = () => {
    generateDonationCertificate({
      donorName: user?.name || 'Valued Donor',
      campaignTitle: donationData?.donation?.campaign?.title || 'a FundVision Campaign',
      amount: finalAmount,
      transactionId: blockchain?.transactionId || donationData?.donation?.razorpayPaymentId || donationId || 'N/A',
      date: donationData?.donation?.createdAt || new Date(),
      receiptNumber: donationData?.donation?.receiptNumber,
      organizationName: donationData?.donation?.organization?.name || donationData?.donation?.campaign?.organization?.name || 'FundVision',
      is80GEligible: donationData?.donation?.taxExemption?.eligible !== false,
    });
  };

  // Poll briefly for blockchain verification since it's recorded async in the background
  useEffect(() => {
    if (!donationId || blockchain?.isVerified) return;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const res = await blockchainAPI.getDonationRecord(donationId);
        const bc = res.data?.data?.blockchainInfo;
        if (bc) setBlockchain(bc);
        if (bc?.isVerified || bc?.syncStatus === 'failed' || attempts >= 10) {
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [donationId, blockchain?.isVerified]);

  return (
    <div className="pt-20 min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <Confetti show />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full"
      >
        <div className="card p-6 sm:p-8 text-center">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-green-500" />
          </motion.div>

          <h2 className="text-3xl font-bold text-slate-900 mb-2">Thank You! 🎉</h2>
          <p className="text-slate-500 mb-2">Your donation of</p>
          <p className="text-4xl font-bold gradient-text mb-2">₹{finalAmount.toLocaleString()}</p>
          <p className="text-slate-500 mb-4">has been received successfully</p>

          <div className="flex justify-center mb-6">
            <BlockchainBadge blockchain={blockchain} size="md" />
          </div>

          {impactMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="p-5 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/15 mb-6 text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Your Impact</span>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed">{impactMessage}</p>
            </motion.div>
          )}

          {donationData?.donation?.receiptNumber && (
            <p className="text-xs text-slate-400 mb-6">Receipt: <span className="font-mono font-semibold">{donationData.donation.receiptNumber}</span></p>
          )}

          <button
            onClick={handleDownloadCertificate}
            className="btn-primary w-full py-3.5 mb-3 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download Donation Certificate
          </button>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/dashboard" className="btn-secondary flex-1 text-center py-3">View My Donations</Link>
            <Link to="/campaigns" className="btn-secondary flex-1 text-center py-3">Explore More</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

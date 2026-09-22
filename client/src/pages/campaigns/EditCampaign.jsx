import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, ShieldCheck, PieChart, Edit, Eye, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { campaignAPI } from '../../services/api';
import { Card, Badge, Button } from '../../components/ui';
import CampaignProofManager from '../../components/campaigns/CampaignProofManager';
import FundUtilizationEditor from '../../components/campaigns/FundUtilizationEditor';

const PRESET_CATEGORIES = ['Medical', 'Education', 'Emergency', 'Environment', 'Animal Welfare', 'Startup Funding', 'Social Causes'];

const STATUS_TONES = {
  verified: 'success',
  pending: 'warning',
  under_review: 'primary',
  more_info_required: 'warning',
  rejected: 'danger',
  suspended: 'danger',
  not_submitted: 'slate',
};

export default function EditCampaign() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();

  const initialTab = searchParams.get('tab') || 'details';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [useCustomCategory, setUseCustomCategory] = useState(false);

  const { data: res, refetch } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignAPI.getOne(id).then(r => r.data),
  });
  const campaign = res?.data;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTab(searchParams.get('tab'));
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  useEffect(() => {
    if (campaign) {
      const isCustom = !PRESET_CATEGORIES.includes(campaign.category);
      setUseCustomCategory(isCustom);
      reset({
        title: campaign.title,
        description: campaign.description,
        story: campaign.story,
        goalAmount: campaign.goalAmount,
        deadline: campaign.deadline?.split('T')[0],
        category: isCustom ? '' : campaign.category,
        customCategory: isCustom ? campaign.category : '',
        isUrgent: campaign.isUrgent,
      });
    }
  }, [campaign]);

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    if (val === '__custom__') { setUseCustomCategory(true); setValue('category', ''); }
    else { setUseCustomCategory(false); setValue('category', val); }
  };

  const onSubmit = async (data) => {
    const finalCategory = useCustomCategory ? (data.customCategory || '').trim() : data.category;
    if (!finalCategory) return toast.error('Please select or enter a category');
    setLoading(true);
    try {
      const payload = { ...data, category: finalCategory, goalAmount: parseInt(data.goalAmount) };
      delete payload.customCategory;
      await campaignAPI.update(id, payload);
      toast.success('Campaign details updated! 🎉');
      refetch();
      qc.invalidateQueries({ queryKey: ['my-campaigns'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
    setLoading(false);
  };

  if (!campaign) return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full" />
    </div>
  );

  const verificationStatus = campaign.verificationStatus || 'not_submitted';

  return (
    <div className="pt-20 min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <div className="section-container py-8 max-w-4xl">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 text-slate-500 hover:text-primary text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <div className="flex items-center gap-2">
            <Link to={`/campaigns/${campaign._id}`}>
              <Button variant="ghost" size="sm" icon={Eye} iconPosition="left">
                View Public Page
              </Button>
            </Link>
          </div>
        </div>

        {/* Campaign Title & Quick Status Header */}
        <div className="mb-6 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Managing Campaign
              </span>
              <Badge tone={STATUS_TONES[verificationStatus] || 'slate'}>
                {verificationStatus.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {campaign.title}
            </h1>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium">Goal Amount</span>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              ₹{campaign.goalAmount?.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Main Tab Navigation */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap">
          <button
            type="button"
            onClick={() => handleTabChange('details')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'details'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Edit className="w-4 h-4" />
            Campaign Details
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('proofs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'proofs'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Proof of Trust & Verification
            {verificationStatus === 'more_info_required' && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('utilization')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'utilization'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PieChart className="w-4 h-4" />
            Fund Utilization ({campaign.fundUtilization?.length || 0})
          </button>
        </div>

        {/* TAB 1: Basic Campaign Details */}
        {activeTab === 'details' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <form onSubmit={handleSubmit(onSubmit)} className="card p-6 sm:p-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Campaign Title</label>
                <input {...register('title', { required: true })} className="input-field" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                <select
                  value={useCustomCategory ? '__custom__' : watch('category') || ''}
                  onChange={handleCategoryChange}
                  className="input-field"
                >
                  <option value="">Select category...</option>
                  {PRESET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__custom__">Other / Custom Category</option>
                </select>
                {useCustomCategory && (
                  <input
                    {...register('customCategory', { required: useCustomCategory, minLength: { value: 3, message: 'Min 3 chars' }, maxLength: { value: 40, message: 'Max 40 chars' } })}
                    placeholder="Enter custom category"
                    className="input-field mt-2"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Short Description</label>
                <textarea {...register('description')} rows={3} className="input-field resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Story</label>
                <textarea {...register('story')} rows={8} className="input-field resize-none" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Goal Amount (₹)</label>
                  <input {...register('goalAmount')} type="number" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Deadline</label>
                  <input {...register('deadline')} type="date" className="input-field" />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex-1 py-3">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />{loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* TAB 2: Proof of Trust & Verification */}
        {activeTab === 'proofs' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <CampaignProofManager
              campaignId={id}
              initialCampaign={campaign}
              onCampaignUpdated={(updated) => {
                refetch();
              }}
            />
          </motion.div>
        )}

        {/* TAB 3: Fund Utilization Plan */}
        {activeTab === 'utilization' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card padding="p-6 sm:p-8">
              <FundUtilizationEditor
                items={campaign.fundUtilization || []}
                goalAmount={campaign.goalAmount}
                campaignId={id}
                onSaved={(data) => {
                  refetch();
                  qc.invalidateQueries({ queryKey: ['my-campaigns'] });
                }}
              />
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}


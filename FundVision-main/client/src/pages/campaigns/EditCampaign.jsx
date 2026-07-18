import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { campaignAPI } from '../../services/api';

const PRESET_CATEGORIES = ['Medical', 'Education', 'Emergency', 'Environment', 'Animal Welfare', 'Startup Funding', 'Social Causes'];

export default function EditCampaign() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [useCustomCategory, setUseCustomCategory] = useState(false);

  const { data: res } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignAPI.getOne(id).then(r => r.data),
  });
  const campaign = res?.data;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();

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
      toast.success('Campaign updated!');
      navigate('/dashboard');
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

  return (
    <div className="pt-20 min-h-screen bg-slate-50 pb-20">
      <div className="section-container py-8 max-w-2xl">
        <button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit Campaign</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
            <input {...register('title', { required: true })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Short Description</label>
            <textarea {...register('description')} rows={3} className="input-field resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Story</label>
            <textarea {...register('story')} rows={8} className="input-field resize-none" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Goal Amount (₹)</label>
              <input {...register('goalAmount')} type="number" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Deadline</label>
              <input {...register('deadline')} type="date" className="input-field" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex-1 py-3">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />{loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

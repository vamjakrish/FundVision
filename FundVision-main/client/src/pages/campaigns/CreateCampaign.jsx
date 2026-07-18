import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Upload, X, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { campaignAPI, uploadAPI, orgAPI } from '../../services/api';

const PRESET_CATEGORIES = ['Medical', 'Education', 'Emergency', 'Environment', 'Animal Welfare', 'Startup Funding', 'Social Causes'];

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(1);
  const [useCustomCategory, setUseCustomCategory] = useState(false);

  const { data: orgRes } = useQuery({ queryKey: ['my-org'], queryFn: () => orgAPI.getMe().then(r => r.data) });
  const org = orgRes?.data;

  const { register, handleSubmit, watch, setValue, formState: { errors }, trigger } = useForm({
    defaultValues: { minDonation: 10, isUrgent: false }
  });

  const selectedCategory = watch('category');
  const customCategory = watch('customCategory');

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setUseCustomCategory(true);
      setValue('category', '');
    } else {
      setUseCustomCategory(false);
      setValue('category', val);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files.slice(0, 5 - uploadedImages.length)) {
        const fd = new FormData();
        fd.append('image', file);
        const { data } = await uploadAPI.campaignImage(fd);
        setUploadedImages(prev => [...prev, { url: data.url, publicId: data.publicId, isPrimary: prev.length === 0 }]);
      }
      toast.success('Images uploaded!');
    } catch {
      toast.error('Image upload failed');
    }
    setUploading(false);
  };

  const removeImage = (idx) => setUploadedImages(prev => prev.filter((_, i) => i !== idx));
  const setPrimary = (idx) => setUploadedImages(prev => prev.map((img, i) => ({ ...img, isPrimary: i === idx })));

  const onSubmit = async (data) => {
    if (uploadedImages.length === 0) return toast.error('Please upload at least one image');
    const finalCategory = useCustomCategory ? (data.customCategory || '').trim() : data.category;
    if (!finalCategory) return toast.error('Please select or enter a category');
    setLoading(true);
    try {
      const payload = {
        ...data,
        category: finalCategory,
        images: uploadedImages,
        goalAmount: parseInt(data.goalAmount),
        minDonation: parseInt(data.minDonation)
      };
      delete payload.customCategory;
      await campaignAPI.create(payload);
      toast.success('Campaign submitted for review! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create campaign');
    }
    setLoading(false);
  };

  const nextStep = async () => {
    let fields = [];
    if (step === 1) {
      fields = ['title', 'description', 'goalAmount', 'deadline'];
      if (!useCustomCategory) fields.push('category');
      else fields.push('customCategory');
    } else if (step === 2) {
      fields = ['story'];
    }
    const valid = await trigger(fields);
    if (step === 1 && useCustomCategory) {
      const cc = (customCategory || '').trim();
      if (cc.length < 3) { toast.error('Custom category must be at least 3 characters'); return; }
    }
    if (step === 1 && !useCustomCategory && !selectedCategory) {
      toast.error('Please select a category'); return;
    }
    if (valid) setStep(s => s + 1);
  };

  if (!org?.isVerified) return (
    <div className="pt-20 min-h-screen flex items-center justify-center p-6">
      <div className="card p-8 sm:p-10 max-w-md w-full text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Verification Required</h2>
        <p className="text-slate-500 text-sm mb-6">Your organization must be verified before creating campaigns.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">Back to Dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="pt-20 min-h-screen bg-slate-50 pb-20">
      <div className="section-container py-8 max-w-3xl">
        <button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Create Campaign</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Fill in the details to submit your campaign for review</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-8">
          {['Basic Info', 'Story', 'Images'].map((label, i) => (
            <div key={label} className="flex items-center gap-1 sm:gap-2 flex-1">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 transition-all ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === i + 1 ? 'text-primary' : 'text-slate-400'}`}>{label}</span>
              {i < 2 && <div className={`flex-1 h-0.5 ${step > i + 1 ? 'bg-green-500' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1 */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card p-6 sm:p-8 space-y-5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">Basic Information</h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Campaign Title *</label>
                <input {...register('title', { required: 'Title required', minLength: { value: 10, message: 'Min 10 characters' } })}
                  placeholder="Give your campaign a compelling title..."
                  className={`input-field ${errors.title ? 'border-red-400' : ''}`} />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>

              {/* Category - preset + custom */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category *</label>
                <select
                  value={useCustomCategory ? '__custom__' : selectedCategory || ''}
                  onChange={handleCategoryChange}
                  className="input-field"
                >
                  <option value="">Select category...</option>
                  {PRESET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__custom__">Other / Custom Category</option>
                </select>
                {!useCustomCategory && errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}

                {useCustomCategory && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                    <input
                      {...register('customCategory', {
                        required: useCustomCategory ? 'Custom category required' : false,
                        minLength: { value: 3, message: 'Min 3 characters' },
                        maxLength: { value: 40, message: 'Max 40 characters' }
                      })}
                      placeholder="Enter custom category"
                      className={`input-field ${errors.customCategory ? 'border-red-400' : ''}`}
                    />
                    {errors.customCategory && <p className="text-red-500 text-xs mt-1">{errors.customCategory.message}</p>}
                  </motion.div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Short Description * <span className="text-slate-400 font-normal">(max 500 chars)</span></label>
                <textarea {...register('description', { required: 'Description required', maxLength: { value: 500, message: 'Max 500 characters' } })}
                  rows={3} placeholder="Summarize your campaign in a few sentences..."
                  className={`input-field resize-none ${errors.description ? 'border-red-400' : ''}`} />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Goal Amount (₹) *</label>
                  <input {...register('goalAmount', { required: 'Goal required', min: { value: 1000, message: 'Min ₹1000' } })}
                    type="number" placeholder="500000"
                    className={`input-field ${errors.goalAmount ? 'border-red-400' : ''}`} />
                  {errors.goalAmount && <p className="text-red-500 text-xs mt-1">{errors.goalAmount.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Campaign Deadline *</label>
                  <input {...register('deadline', { required: 'Deadline required' })}
                    type="date" min={new Date().toISOString().split('T')[0]}
                    className={`input-field ${errors.deadline ? 'border-red-400' : ''}`} />
                  {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline.message}</p>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input {...register('isUrgent')} type="checkbox" id="urgent" className="w-4 h-4 accent-red-500" />
                <label htmlFor="urgent" className="text-sm text-slate-700">Mark as Urgent Campaign</label>
              </div>

              <button type="button" onClick={nextStep} className="btn-primary w-full py-3">Continue →</button>
            </motion.div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card p-6 sm:p-8 space-y-5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">Campaign Story</h2>
              <div className="p-4 bg-blue-50 rounded-xl flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700">Write a detailed, emotional story that helps donors connect with your cause.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Story *</label>
                <textarea {...register('story', { required: 'Story required', minLength: { value: 100, message: 'Min 100 characters' } })}
                  rows={10} placeholder="Tell your story in detail. Why is this campaign needed? Who will benefit?..."
                  className={`input-field resize-none font-mono text-sm ${errors.story ? 'border-red-400' : ''}`} />
                {errors.story && <p className="text-red-500 text-xs mt-1">{errors.story.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tags <span className="text-slate-400 font-normal">(comma separated)</span></label>
                <input {...register('tags')} placeholder="children, education, rural" className="input-field" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                  <input {...register('location.city')} placeholder="Mumbai" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                  <input {...register('location.state')} placeholder="Maharashtra" className="input-field" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">← Back</button>
                <button type="button" onClick={nextStep} className="btn-primary flex-1 py-3">Continue →</button>
              </div>
            </motion.div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="card p-6 sm:p-8">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-5">Campaign Images</h2>
                <label className={`block border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-colors ${uploading ? 'border-primary/50 bg-primary/5' : 'border-slate-300 hover:border-primary/50'}`}>
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading || uploadedImages.length >= 5} />
                  <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">{uploading ? 'Uploading...' : 'Click to upload images'}</p>
                  <p className="text-slate-400 text-sm mt-1">Up to 5 images · JPG, PNG, WebP · Max 10MB</p>
                </label>
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                    {uploadedImages.map((img, i) => (
                      <div key={i} className="relative group aspect-square">
                        <img src={img.url} alt="" className="w-full h-full object-cover rounded-xl" />
                        <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => setPrimary(i)}
                            className={`text-xs px-2 py-1 rounded-lg ${img.isPrimary ? 'bg-primary text-white' : 'bg-white/80 text-slate-800'}`}>
                            {img.isPrimary ? '★' : 'Main'}
                          </button>
                        </div>
                        <button type="button" onClick={() => removeImage(i)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                        {img.isPrimary && <div className="absolute bottom-1 left-1 text-[10px] bg-primary text-white px-1.5 rounded">Main</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card p-5 sm:p-6">
                <h3 className="font-bold text-slate-800 mb-4">Review Before Submitting</h3>
                <div className="space-y-2 text-sm">
                  {[
                    ['Title', watch('title')],
                    ['Category', useCustomCategory ? watch('customCategory') : watch('category')],
                    ['Goal Amount', watch('goalAmount') ? `₹${parseInt(watch('goalAmount')).toLocaleString()}` : ''],
                    ['Deadline', watch('deadline')],
                  ].map(([k, v]) => v && (
                    <div key={k} className="flex gap-2 flex-wrap">
                      <span className="text-slate-400 w-24 shrink-0 text-xs sm:text-sm">{k}:</span>
                      <span className="text-slate-700 font-medium text-xs sm:text-sm break-all">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-700">
                  ⏳ Our admin team will review your campaign within 24-48 hours.
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1 py-3">← Back</button>
                <button type="submit" disabled={loading || uploadedImages.length === 0}
                  className="btn-primary flex-1 py-3 disabled:opacity-50">
                  {loading ? 'Submitting...' : '🚀 Submit Campaign'}
                </button>
              </div>
            </motion.div>
          )}
        </form>
      </div>
    </div>
  );
}

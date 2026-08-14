import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Building, Upload, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { orgAPI, uploadAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';

const ORG_TYPES = ['NGO', 'Charity', 'Hospital', 'Educational Institution', 'Social Enterprise', 'Other'];

export default function OrganizationSetup() {
  const navigate = useNavigate();
  const { updateOrg } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [documents, setDocuments] = useState({ ngoCertificate: null, panCard: null, registrationProof: null });
  const [docUploading, setDocUploading] = useState({});

  const { register, handleSubmit, trigger, formState: { errors } } = useForm();

  const handleDocUpload = async (e, docType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocUploading(p => ({ ...p, [docType]: true }));
    try {
      const fd = new FormData();
      fd.append('document', file);
      const { data } = await uploadAPI.document(fd);
      setDocuments(p => ({ ...p, [docType]: { url: data.url, publicId: data.publicId } }));
      toast.success(`${docType === 'ngoCertificate' ? 'NGO Certificate' : docType === 'panCard' ? 'PAN Card' : 'Registration Proof'} uploaded!`);
    } catch {
      toast.error('Upload failed. Try again.');
    }
    setDocUploading(p => ({ ...p, [docType]: false }));
  };

  const onSubmit = async (data) => {
    if (!documents.ngoCertificate) return toast.error('NGO Certificate is required');
    setLoading(true);
    try {
      // Create organization profile
      const res = await orgAPI.create({
        name: data.name,
        description: data.description,
        type: data.type,
        registrationNumber: data.registrationNumber,
        panNumber: data.panNumber,
        website: data.website,
        phone: data.phone,
        address: { street: data.street, city: data.city, state: data.state, pincode: data.pincode },
      });

      // Upload documents
      await orgAPI.uploadDocs({
        ngoCertificate: documents.ngoCertificate,
        panCard: documents.panCard,
        registrationProof: documents.registrationProof,
      });

      updateOrg(res.data.data);
      toast.success('Organization profile submitted! Awaiting verification. 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Setup failed');
    }
    setLoading(false);
  };

  const nextStep = async () => {
    const fields = step === 1 ? ['name', 'type', 'description'] : ['city', 'state'];
    const valid = await trigger(fields);
    if (valid) setStep(s => s + 1);
  };

  const DocUploadField = ({ docKey, label, required }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <label className={`flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${documents[docKey] ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-primary/50'}`}>
        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => handleDocUpload(e, docKey)} />
        {docUploading[docKey] ? (
          <div className="flex items-center gap-2 text-primary text-sm"><div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Uploading...</div>
        ) : documents[docKey] ? (
          <div className="flex items-center gap-2 text-green-600 text-sm"><CheckCircle className="w-5 h-5" /> Uploaded successfully</div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 text-sm"><Upload className="w-5 h-5" /> Click to upload PDF or image</div>
        )}
      </label>
    </div>
  );

  return (
    <div className="pt-20 min-h-screen bg-slate-50 pb-20">
      <div className="section-container py-8 max-w-2xl">
        <button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Organization Setup</h1>
          </div>
          <p className="text-slate-500 text-sm">Complete your profile to get verified and start creating campaigns</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {['Basic Info', 'Address', 'Documents'].map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${step === i + 1 ? 'text-primary font-medium' : 'text-slate-400'}`}>{label}</span>
              {i < 2 && <div className={`flex-1 h-0.5 ${step > i + 1 ? 'bg-green-500' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card p-8 space-y-5">
              <h2 className="text-lg font-bold text-slate-800">Basic Information</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Organization Name *</label>
                <input {...register('name', { required: 'Name required' })} placeholder="e.g. Helping Hands Foundation"
                  className={`input-field ${errors.name ? 'border-red-400' : ''}`} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Organization Type *</label>
                <select {...register('type', { required: 'Type required' })} className={`input-field ${errors.type ? 'border-red-400' : ''}`}>
                  <option value="">Select type...</option>
                  {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description *</label>
                <textarea {...register('description', { required: 'Description required', minLength: { value: 50, message: 'Min 50 characters' } })}
                  rows={4} placeholder="Describe your organization's mission and work..."
                  className={`input-field resize-none ${errors.description ? 'border-red-400' : ''}`} />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Registration Number</label>
                  <input {...register('registrationNumber')} placeholder="NGO Registration #" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">PAN Number</label>
                  <input {...register('panNumber')} placeholder="ABCDE1234F" className="input-field" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Website</label>
                  <input {...register('website')} type="url" placeholder="https://yourorg.org" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                  <input {...register('phone')} placeholder="+91 98765 43210" className="input-field" />
                </div>
              </div>
              <button type="button" onClick={nextStep} className="btn-primary w-full py-3">Continue →</button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card p-8 space-y-5">
              <h2 className="text-lg font-bold text-slate-800">Address Details</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Street Address</label>
                <input {...register('street')} placeholder="123 Main Street" className="input-field" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">City *</label>
                  <input {...register('city', { required: 'City required' })} placeholder="Mumbai" className={`input-field ${errors.city ? 'border-red-400' : ''}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">State *</label>
                  <input {...register('state', { required: 'State required' })} placeholder="Maharashtra" className={`input-field ${errors.state ? 'border-red-400' : ''}`} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Pincode</label>
                <input {...register('pincode')} placeholder="400001" className="input-field" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">← Back</button>
                <button type="button" onClick={nextStep} className="btn-primary flex-1 py-3">Continue →</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card p-8 space-y-5">
              <h2 className="text-lg font-bold text-slate-800">Verification Documents</h2>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-700">
                  <p className="font-semibold mb-1">Documents required for verification</p>
                  <p>Our admin team will review your documents within 48 hours. Accepted formats: PDF, JPG, PNG, WebP.</p>
                </div>
              </div>
              <DocUploadField docKey="ngoCertificate" label="NGO / Charity Certificate" required />
              <DocUploadField docKey="panCard" label="PAN Card" />
              <DocUploadField docKey="registrationProof" label="Registration Proof" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1 py-3">← Back</button>
                <button type="submit" disabled={loading || !documents.ngoCertificate} className="btn-primary flex-1 py-3 disabled:opacity-50">
                  {loading ? 'Submitting...' : '🚀 Submit for Verification'}
                </button>
              </div>
            </motion.div>
          )}
        </form>
      </div>
    </div>
  );
}

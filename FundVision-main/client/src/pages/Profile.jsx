import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, MapPin, Camera, Save, Award, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../context/authStore';
import { uploadAPI } from '../services/api';
import api from '../services/api';

const INTERESTS = ['Medical', 'Education', 'Emergency', 'Environment', 'Animal Welfare', 'Startup Funding', 'Social Causes'];

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState(user?.interests || []);
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { isDirty } } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      'location.city': user?.location?.city || '',
      'location.state': user?.location?.state || '',
    }
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await uploadAPI.profileImage(fd);
      await api.put('/users/profile', { avatar: data.url });
      updateUser({ avatar: data.url });
      toast.success('Profile photo updated!');
    } catch {
      toast.error('Upload failed');
    }
    setUploading(false);
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        name: data.name,
        phone: data.phone,
        bio: data.bio,
        location: { city: data['location.city'], state: data['location.state'] },
        interests: selectedInterests,
      };
      await api.put('/users/profile', payload);
      updateUser(payload);
      toast.success('Profile updated!');
    } catch {
      toast.error('Update failed');
    }
  };

  const toggleInterest = (interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  return (
    <div className="pt-20 min-h-screen bg-slate-50 pb-20">
      <div className="section-container py-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">My Profile</h1>

        <div className="grid sm:grid-cols-3 gap-6">
          {/* Avatar card */}
          <div className="sm:col-span-1">
            <div className="card p-6 text-center sticky top-24">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="w-24 h-24 rounded-2xl bg-gradient-brand flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                  {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user?.name?.[0]}
                </div>
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  {uploading ? <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <Camera className="w-3.5 h-3.5 text-slate-600" />}
                </label>
              </div>
              <h3 className="font-bold text-slate-800">{user?.name}</h3>
              <p className="text-slate-500 text-sm">{user?.email}</p>
              <span className="badge bg-primary/10 text-primary mt-2 capitalize">{user?.role}</span>

              {/* Donor stats */}
              {user?.role === 'donor' && (
                <div className="mt-5 pt-5 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Total Donated</span>
                    <span className="font-bold text-primary">₹{(user.totalDonated || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Donations</span>
                    <span className="font-bold text-slate-800">{user.donationCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-700">{user.badge || 'New Supporter'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="sm:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="card p-6 space-y-4">
                <h3 className="font-bold text-slate-800">Personal Information</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input {...register('name')} className="input-field pl-11" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email <span className="text-slate-400">(cannot change)</span></label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={user?.email} disabled className="input-field pl-11 bg-slate-50 cursor-not-allowed opacity-60" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input {...register('phone')} placeholder="+91 98765 43210" className="input-field pl-11" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
                  <textarea {...register('bio')} rows={3} placeholder="Tell us about yourself..." className="input-field resize-none" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input {...register('location.city')} placeholder="Mumbai" className="input-field pl-11" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                    <input {...register('location.state')} placeholder="Maharashtra" className="input-field" />
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div className="card p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" /> Donation Interests
                </h3>
                <p className="text-sm text-slate-500 mb-3">We'll use these to recommend campaigns you care about</p>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => (
                    <button key={interest} type="button" onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${selectedInterests.includes(interest) ? 'border-primary bg-primary text-white' : 'border-slate-200 text-slate-600 hover:border-primary/50'}`}>
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Save Profile
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BadgeCheck, Globe, Phone, MapPin, Users, TrendingUp, Heart, ExternalLink, Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';
import { orgAPI, campaignAPI } from '../../services/api';
import CampaignCard from '../../components/campaigns/CampaignCard';

export default function OrganizationProfile() {
  const { id } = useParams();

  const { data: orgRes, isLoading } = useQuery({
    queryKey: ['organization', id],
    queryFn: () => orgAPI.getOne(id).then(r => r.data),
  });

  const { data: campaignsRes } = useQuery({
    queryKey: ['org-campaigns', id],
    queryFn: () => campaignAPI.getAll({ organization: id, status: 'active', limit: 6 }).then(r => r.data),
    enabled: !!orgRes?.data,
  });

  if (isLoading) return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full" />
    </div>
  );

  const org = orgRes?.data;
  if (!org) return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <div className="text-center"><div className="text-6xl mb-4">😢</div><h2 className="text-xl font-bold text-slate-800">Organization not found</h2></div>
    </div>
  );

  const campaigns = campaignsRes?.data || [];
  const SOCIAL = [
    { icon: Twitter, url: org.socialLinks?.twitter, label: 'Twitter' },
    { icon: Facebook, url: org.socialLinks?.facebook, label: 'Facebook' },
    { icon: Instagram, url: org.socialLinks?.instagram, label: 'Instagram' },
    { icon: Linkedin, url: org.socialLinks?.linkedin, label: 'LinkedIn' },
  ].filter(s => s.url);

  return (
    <div className="pt-20 min-h-screen pb-20">
      {/* Cover */}
      <div className="h-48 sm:h-64 bg-gradient-brand relative overflow-hidden">
        {org.coverImage && <img src={org.coverImage} alt="" className="w-full h-full object-cover opacity-40" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="section-container">
        {/* Profile header */}
        <div className="relative -mt-16 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="w-28 h-28 rounded-2xl border-4 border-white shadow-card bg-white overflow-hidden shrink-0">
              {org.logo ? (
                <img src={org.logo} alt={org.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-brand flex items-center justify-center text-white text-3xl font-bold">
                  {org.name?.[0]}
                </div>
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
                {org.isVerified && (
                  <span className="badge bg-primary/10 text-primary gap-1 text-xs">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
                <span className="badge bg-slate-100 text-slate-600 text-xs">{org.type}</span>
              </div>
              <p className="text-slate-500 text-sm">{org.address?.city && `${org.address.city}, `}{org.address?.state}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="font-bold text-slate-800 mb-3">About</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{org.description}</p>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: TrendingUp, label: 'Total Raised', value: `₹${(org.totalRaised || 0).toLocaleString()}`, color: 'text-primary' },
                { icon: Heart, label: 'Campaigns', value: org.totalCampaigns || campaigns.length, color: 'text-red-500' },
                { icon: Users, label: 'Trust Score', value: `${org.trustScore || 85}/100`, color: 'text-green-500' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="card p-4 text-center">
                  <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-2`} />
                  <p className="text-xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Campaigns */}
            {campaigns.length > 0 && (
              <div>
                <h2 className="font-bold text-slate-800 mb-4">Active Campaigns</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  {campaigns.map((c, i) => <CampaignCard key={c._id} campaign={c} index={i} />)}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="card p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Contact & Links</h3>
              <div className="space-y-3 text-sm">
                {org.website && (
                  <a href={org.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 text-primary hover:underline">
                    <Globe className="w-4 h-4 shrink-0" /><span className="truncate">{org.website}</span>
                    <ExternalLink className="w-3 h-3 ml-auto shrink-0" />
                  </a>
                )}
                {org.phone && <div className="flex items-center gap-3 text-slate-600"><Phone className="w-4 h-4 shrink-0" />{org.phone}</div>}
                {(org.address?.city || org.address?.state) && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {[org.address.city, org.address.state, org.address.country].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
              {SOCIAL.length > 0 && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                  {SOCIAL.map(({ icon: Icon, url, label }) => (
                    <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-primary hover:text-white flex items-center justify-center transition-colors text-slate-500">
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {org.isVerified && (
              <div className="card p-5 border-2 border-green-200 bg-green-50">
                <div className="flex items-center gap-2 mb-2">
                  <BadgeCheck className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Verified Organization</span>
                </div>
                <p className="text-green-700 text-xs leading-relaxed">
                  This organization has been manually verified by the FundVision team. Documents and registration are confirmed.
                </p>
              </div>
            )}

            <div className="card p-5">
              <p className="text-xs text-slate-400 text-center">Member since {new Date(org.createdAt).getFullYear()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

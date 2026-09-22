import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  PieChart as PieIcon,
  Eye,
  Building2,
  Lock,
  AlertCircle,
  HelpCircle,
  FileCheck,
  Shield,
  Layers
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { proofAPI } from '../../services/api';
import { Card, Badge, Button, SkeletonRow } from '../ui';
import PublicProofDocumentViewer from './PublicProofDocumentViewer';

const DOC_TYPE_LABELS = {
  hospital_estimate: 'Hospital Estimate / Quotation',
  medical_report: 'Medical Report / Diagnostic Scan',
  government_certificate: 'Government Certificate / 80G / 12A',
  project_proposal: 'Project Proposal / Plan',
  project_quotation: 'Vendor / Project Quotation',
  vendor_invoice: 'Vendor Invoice / Equipment Bill',
  beneficiary_proof: 'Beneficiary Proof / ID',
  authorization_letter: 'Authorization / NOC Letter',
  bank_statement: 'Bank Statement / Cancelled Cheque',
  site_photo: 'Site / Beneficiary Photo',
  other: 'Supporting Document',
};

const CHART_COLORS = ['#2563EB', '#10B981', '#06B6D4', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B'];

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function ProofOfTrustSection({ campaignId, campaign }) {
  const [selectedDoc, setSelectedDoc] = useState(null);

  const {
    data: proofRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['campaign-public-proofs', campaignId],
    queryFn: () => proofAPI.getPublicProofs(campaignId).then((r) => r.data),
    enabled: !!campaignId,
    staleTime: 5 * 60 * 1000,
  });

  const proofData = proofRes?.data;
  const publicDocs = proofData?.documents || [];
  const fundUtilization = proofData?.fundUtilization || campaign?.fundUtilization || [];
  const totalUtilization = proofData?.totalUtilization ?? fundUtilization.reduce(
    (sum, i) => sum + (Number(i.estimatedAmount) || 0),
    0
  );
  const goalAmount = Number(proofData?.goalAmount || campaign?.goalAmount) || 0;
  const vStatus = proofData?.campaignVerificationStatus || campaign?.verificationStatus || 'not_submitted';
  const isCampaignVerified = vStatus === 'verified';
  const isOrgVerified = !!campaign?.organization?.isVerified;

  if (isLoading) {
    return (
      <Card padding="p-6">
        <div className="space-y-4">
          <div className="skeleton h-6 w-48 rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
        <p>Proof of Trust information is temporarily unavailable.</p>
      </div>
    );
  }

  // Prepare chart data for fund utilization
  const chartData = fundUtilization.map((item) => ({
    name: item.purpose,
    value: Number(item.estimatedAmount) || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Proof of Trust & Transparency
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Publicly verified evidence and fund utilization plans submitted by the campaign organization and reviewed by FundVision.
        </p>
      </div>

      {/* 1. Transparency Highlights Checklist Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-primary/5 dark:from-slate-900 dark:to-primary-950/20 border border-slate-200 dark:border-slate-800 space-y-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Verification Summary
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {/* Campaign Verification */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60">
            {isCampaignVerified ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            ) : (
              <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {isCampaignVerified ? 'Campaign Verified by Platform' : 'Verification Under Review / Pending'}
            </span>
          </div>

          {/* Organization Verification */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60">
            {isOrgVerified ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            ) : (
              <Shield className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {isOrgVerified ? 'Verified Non-Profit / Organization' : 'Standard Organization'}
            </span>
          </div>

          {/* Public Proof Documents */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60">
            {publicDocs.length > 0 ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {publicDocs.length > 0
                ? `${publicDocs.length} Public Verified Document${publicDocs.length !== 1 ? 's' : ''}`
                : 'No Public Documents Attached'}
            </span>
          </div>

          {/* Fund Breakdown */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60">
            {fundUtilization.length > 0 ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            ) : (
              <PieIcon className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {fundUtilization.length > 0
                ? `${fundUtilization.length} Itemized Fund Allocation${fundUtilization.length !== 1 ? 's' : ''}`
                : 'Fund Breakdown Not Provided'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Fund Utilization Transparency */}
      <Card padding="p-5 sm:p-6" className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-primary" />
              Fund Utilization Plan
            </h3>
            <p className="text-xs text-slate-500">
              Itemized breakdown of planned expenses as submitted by the organization.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Planned Allocation</span>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              ₹{totalUtilization.toLocaleString()}
            </div>
          </div>
        </div>

        {fundUtilization.length > 0 ? (
          <div className="space-y-4 pt-2">
            {/* Visual allocation chart & legend */}
            {chartData.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-slate-50/60 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="h-36 sm:h-40 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={56}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="sm:col-span-2 space-y-1.5 overflow-y-auto max-h-36 pr-1">
                  {fundUtilization.map((item, idx) => {
                    const itemAmt = Number(item.estimatedAmount) || 0;
                    const itemPct = totalUtilization > 0 ? Math.round((itemAmt / totalUtilization) * 100) : 0;
                    const color = CHART_COLORS[idx % CHART_COLORS.length];

                    return (
                      <div key={idx} className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                            {item.purpose}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white shrink-0">
                          ₹{itemAmt.toLocaleString()} <span className="text-slate-400 font-normal">({itemPct}%)</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Itemized Table / List */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500">
                  <tr>
                    <th className="p-3 text-left font-semibold">Purpose</th>
                    <th className="p-3 text-right font-semibold">Planned Amount</th>
                    <th className="p-3 text-right font-semibold">Share</th>
                    <th className="p-3 text-left font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {fundUtilization.map((item, idx) => {
                    const itemAmt = Number(item.estimatedAmount) || 0;
                    const itemPct = totalUtilization > 0 ? Math.round((itemAmt / totalUtilization) * 100) : 0;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{item.purpose}</td>
                        <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                          ₹{itemAmt.toLocaleString()}
                        </td>
                        <td className="p-3 text-right text-slate-500 font-medium">{itemPct}%</td>
                        <td className="p-3 text-slate-500 max-w-xs">{item.description || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/30">
            <PieIcon className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs text-slate-500">
              No itemized fund utilization breakdown has been published for this campaign yet.
            </p>
          </div>
        )}
      </Card>

      {/* 3. Verified Public Documents */}
      <Card padding="p-5 sm:p-6" className="space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-green-600" />
            Publicly Verified Evidence ({publicDocs.length})
          </h3>
          <p className="text-xs text-slate-500">
            Official proof documents reviewed and verified by FundVision administrators.
          </p>
        </div>

        {publicDocs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {publicDocs.map((doc) => (
              <div
                key={doc._id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/40 transition-all flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-300 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge tone="success" icon={CheckCircle2}>
                          Verified Proof
                        </Badge>
                        <span className="text-[10px] text-slate-400">
                          {formatBytes(doc.fileSizeBytes)}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-1 truncate" title={doc.title}>
                        {doc.title}
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-slate-500">
                    {DOC_TYPE_LABELS[doc.documentType] || doc.documentType}
                  </p>

                  {doc.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {doc.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Verified {doc.verifiedAt ? format(new Date(doc.verifiedAt), 'dd MMM yyyy') : 'Recently'}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDoc(doc)}
                    icon={Eye}
                    iconPosition="left"
                    className="!py-1 !px-2 text-xs"
                  >
                    View Document
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/30">
            <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
              No public verified documents available
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              The organization has not published public evidence documents or uploaded proofs are kept confidential for patient/beneficiary privacy.
            </p>
          </div>
        )}
      </Card>

      {/* Public Document Viewer Modal */}
      {selectedDoc && (
        <PublicProofDocumentViewer
          document={selectedDoc}
          open={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}

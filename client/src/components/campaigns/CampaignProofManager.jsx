import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, FileText, PieChart, RefreshCw, AlertCircle } from 'lucide-react';
import { proofAPI, campaignAPI } from '../../services/api';
import { Button, Card, SkeletonRow } from '../ui';
import CampaignVerificationStatusCard from './CampaignVerificationStatusCard';
import CampaignProofUpload from './CampaignProofUpload';
import CampaignProofList from './CampaignProofList';
import FundUtilizationEditor from './FundUtilizationEditor';

export default function CampaignProofManager({ campaignId, initialCampaign, onCampaignUpdated }) {
  const qc = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [initialDocType, setInitialDocType] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('proofs'); // 'proofs' | 'utilization'

  // Fetch latest campaign details if not provided or to stay fresh
  const { data: campaignRes, refetch: refetchCampaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignAPI.getOne(campaignId).then((r) => r.data),
    initialData: initialCampaign ? { success: true, data: initialCampaign } : undefined,
    enabled: !!campaignId,
  });

  const campaign = campaignRes?.data || initialCampaign;

  // Fetch campaign proof documents
  const {
    data: docsRes,
    isLoading: docsLoading,
    refetch: refetchDocs,
  } = useQuery({
    queryKey: ['campaign-proofs', campaignId],
    queryFn: () => proofAPI.getProofs(campaignId).then((r) => r.data),
    enabled: !!campaignId,
  });

  const documents = docsRes?.data || [];

  const handleUploadSuccess = () => {
    setShowUpload(false);
    setInitialDocType('');
    refetchDocs();
    refetchCampaign();
    qc.invalidateQueries({ queryKey: ['my-campaigns'] });
  };

  const handleDocumentDeleted = () => {
    refetchDocs();
    refetchCampaign();
    qc.invalidateQueries({ queryKey: ['my-campaigns'] });
  };

  const handleResubmitSuccess = (updatedCampaign) => {
    refetchCampaign();
    onCampaignUpdated?.(updatedCampaign);
    qc.invalidateQueries({ queryKey: ['my-campaigns'] });
  };

  const handleUploadRequestedDoc = (type) => {
    setInitialDocType(type);
    setShowUpload(true);
    setActiveSubTab('proofs');
  };

  if (!campaign) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Verification Status Banner & History */}
      <CampaignVerificationStatusCard
        campaign={campaign}
        onUploadRequestedDoc={handleUploadRequestedDoc}
        onResubmitSuccess={handleResubmitSuccess}
        hasProofDocuments={documents.length > 0}
        hasFundUtilization={campaign.fundUtilization && campaign.fundUtilization.length > 0}
      />

      {/* Sub Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('proofs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeSubTab === 'proofs'
              ? 'bg-primary text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          Proof Documents ({documents.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('utilization')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeSubTab === 'utilization'
              ? 'bg-primary text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PieChart className="w-4 h-4" />
          Fund Utilization ({campaign.fundUtilization?.length || 0})
        </button>
      </div>

      {/* Tab 1: Proof Documents */}
      {activeSubTab === 'proofs' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                Uploaded Proof Documents
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Official documents verifying hospital estimates, quotes, NGO registration, and project plans.
              </p>
            </div>

            {!showUpload && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowUpload(true)}
                icon={Plus}
                iconPosition="left"
              >
                Upload Document
              </Button>
            )}
          </div>

          {/* Upload Form Modal / Drawer / Section */}
          {showUpload && (
            <CampaignProofUpload
              campaignId={campaignId}
              initialDocType={initialDocType}
              onUploadSuccess={handleUploadSuccess}
              onCancel={() => {
                setShowUpload(false);
                setInitialDocType('');
              }}
            />
          )}

          {/* List of Documents */}
          {docsLoading ? (
            <Card padding="p-6">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            </Card>
          ) : (
            <CampaignProofList
              documents={documents}
              campaignId={campaignId}
              onDocumentDeleted={handleDocumentDeleted}
              onRefresh={refetchDocs}
            />
          )}
        </div>
      )}

      {/* Tab 2: Fund Utilization Breakdown */}
      {activeSubTab === 'utilization' && (
        <Card padding="p-6 sm:p-7">
          <FundUtilizationEditor
            items={campaign.fundUtilization || []}
            goalAmount={campaign.goalAmount}
            campaignId={campaignId}
            onSaved={(updatedData) => {
              refetchCampaign();
              qc.invalidateQueries({ queryKey: ['my-campaigns'] });
            }}
          />
        </Card>
      )}
    </div>
  );
}

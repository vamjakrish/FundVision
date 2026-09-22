import { FileText, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Modal, Badge, Button } from '../ui';

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

export default function PublicProofDocumentViewer({ document: doc, open, onClose }) {
  if (!open || !doc) return null;

  const isPdf = doc.fileType === 'application/pdf' || doc.fileUrl?.includes('.pdf');
  const title = doc.title || 'Verified Document';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 max-w-[85%]">
          <FileText className="w-5 h-5 text-primary shrink-0" />
          <span className="truncate">{title}</span>
        </div>
      }
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full flex-wrap gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-green-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Publicly Verified by FundVision
          </span>
          <div className="flex items-center gap-2">
            {doc.fileUrl && (
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary !py-1.5 !px-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-primary"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Full Screen
              </a>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Metadata Bar */}
        <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex-wrap text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {DOC_TYPE_LABELS[doc.documentType] || doc.documentType}
            </span>
            <Badge tone="success" icon={ShieldCheck}>
              Verified Public Proof
            </Badge>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">{doc.fileType}</span>
        </div>

        {/* Description if present */}
        {doc.description && (
          <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
            {doc.description}
          </p>
        )}

        {/* Viewer Content */}
        {doc.fileUrl ? (
          <div className="bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center">
            {isPdf ? (
              <iframe
                src={`${doc.fileUrl}#toolbar=1&navpanes=0`}
                title={title}
                className="w-full h-[65vh] rounded-xl bg-white"
              />
            ) : (
              <div className="max-h-[65vh] overflow-auto p-4 flex items-center justify-center">
                <img
                  src={doc.fileUrl}
                  alt={title}
                  className="max-h-[60vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-sm">
            Document preview is currently unavailable.
          </div>
        )}
      </div>
    </Modal>
  );
}

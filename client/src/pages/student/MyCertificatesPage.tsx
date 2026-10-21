import React, { useState, useEffect } from 'react';
import { Award, ShieldCheck, Printer, Copy, Check, ExternalLink, Calendar } from 'lucide-react';
import { Certificate } from '../../types';
import { certificateService } from '../../services/api';
import { CertificateModal } from '../../components/certificates/CertificateModal';
import { Button } from '../../components/common/Button';
import { CategoryBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export const MyCertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      setIsLoading(true);
      try {
        const res = await certificateService.getMyCertificates();
        if (res.data.success) {
          setCertificates(res.data.certificates || []);
        }
      } catch (err) {
        console.error('Failed to load certificates', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  const handleCopyLink = (code: string) => {
    const verificationUrl = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(verificationUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Verified Academic & Activity Certificates
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Official digital credentials issued upon QR attendance verification by campus event coordinators.
        </p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : certificates.length === 0 ? (
        <EmptyState
          title="No participation certificates issued yet"
          description="Attend upcoming technical workshops, hackathons, or seminars and have your QR pass scanned at the venue to unlock verified certificates."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {certificates.map((cert) => (
            <div
              key={cert._id}
              className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Top Accent Ribbon */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600" />

              <div>
                <div className="flex items-center justify-between">
                  <CategoryBadge category={cert.category || 'Technical'} />
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="line-clamp-2 text-base font-bold text-slate-900 dark:text-white">
                      {cert.eventTitle}
                    </h3>
                    <p className="text-[11px] text-slate-400">{cert.issuerOrganization}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                    Issued on {new Date(cert.issueDate).toLocaleDateString()}
                  </p>
                  <p className="font-mono text-[11px] text-slate-400">
                    ID: <strong className="text-slate-700 dark:text-slate-300">{cert.certificateCode}</strong>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedCert(cert)}
                  leftIcon={<Printer className="h-4 w-4" />}
                >
                  View & Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(cert.certificateCode)}
                  title="Copy public verification link"
                >
                  {copiedCode === cert.certificateCode ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Official Certificate Modal */}
      <CertificateModal
        isOpen={!!selectedCert}
        certificate={selectedCert}
        onClose={() => setSelectedCert(null)}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { AlertCircle, ExternalLink, X, Database } from 'lucide-react';

export const FIRESTORE_UPGRADE_URL =
  'https://console.firebase.google.com/project/c-io-de95b/firestore/databases/ai-studio-ciouniversityofi-82610386-8674-4fef-8b52-46883a438337/data?openUpgradeDialog=true';

interface FirestoreQuotaBannerProps {
  isQuotaExceeded?: boolean;
  onDismiss?: () => void;
}

export const FirestoreQuotaBanner: React.FC<FirestoreQuotaBannerProps> = ({
  isQuotaExceeded: propIsQuotaExceeded,
  onDismiss,
}) => {
  const [internalQuotaExceeded, setInternalQuotaExceeded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleQuotaEvent = () => {
      setInternalQuotaExceeded(true);
      setDismissed(false);
    };

    window.addEventListener('cio_firestore_quota_exceeded', handleQuotaEvent);
    return () => {
      window.removeEventListener('cio_firestore_quota_exceeded', handleQuotaEvent);
    };
  }, []);

  const isExceeded = propIsQuotaExceeded !== undefined ? propIsQuotaExceeded : internalQuotaExceeded;

  useEffect(() => {
    if (isExceeded) {
      setDismissed(false);
    }
  }, [isExceeded]);

  if (!isExceeded || dismissed) return null;

  return (
    <aside
      id="firestore-quota-warning-banner"
      role="alert"
      aria-label="Firebase daily quota limit reached notice"
      className="bg-amber-50 border-b border-amber-200/90 text-amber-950 px-4 py-2 text-xs relative z-40"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-1 rounded-md bg-amber-200/70 text-amber-900 shrink-0 mt-0.5 sm:mt-0">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold mr-1">Firebase Daily Read Quota Reached:</span>
            <span className="text-amber-900/90">
              The free daily read quota for this database has reached its Spark daily limit (resets daily at midnight PST). C'IO is running smoothly in resilient offline/cached mode with full browsing, search, and WhatsApp seller contact active.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <a
            id="firestore-quota-upgrade-btn"
            href={FIRESTORE_UPGRADE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#5A5A40] hover:bg-[#484833] text-white font-medium transition text-[11px] shadow-xs"
          >
            <Database className="w-3 h-3" />
            <span>Manage / Upgrade Quota</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
          </a>

          <button
            id="firestore-quota-dismiss-btn"
            onClick={() => {
              setDismissed(true);
              if (onDismiss) onDismiss();
            }}
            aria-label="Dismiss notice"
            className="p-1 text-amber-800 hover:text-amber-950 hover:bg-amber-200/60 rounded transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <aside
      id="cio-offline-indicator"
      aria-label="Offline status notification"
      className="fixed bottom-16 md:bottom-4 left-4 right-4 md:right-auto md:max-w-md z-50 flex items-center gap-2.5 rounded-xl bg-[#141413] border border-[#8E8E6F]/50 px-4 py-2.5 text-xs font-medium text-white shadow-2xl animate-in slide-in-from-bottom"
    >
      <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
        <WifiOff className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-white">Offline Mode</p>
        <p className="text-[11px] text-[#D9D9C8]">You are browsing cached listings on C'IO.</p>
      </div>
    </aside>
  );
};

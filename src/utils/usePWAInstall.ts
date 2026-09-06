import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISSED_KEY = 'cio_pwa_dismissed_at';
const INSTALLED_KEY = 'cio_pwa_installed';
// Re-prompt after 7 days if the user tapped "Not Now"
const PROMPT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  useEffect(() => {
    // 1. Detect Standalone / Installed mode
    const checkStandalone = () => {
      const standaloneQuery = window.matchMedia('(display-mode: standalone)').matches;
      const navigatorStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      const androidApp = document.referrer.includes('android-app://');
      const storedInstalled = localStorage.getItem(INSTALLED_KEY) === 'true';

      const runningStandalone = standaloneQuery || navigatorStandalone || androidApp;
      setIsStandalone(runningStandalone);
      if (runningStandalone || storedInstalled) {
        setIsInstalled(true);
      }
      return runningStandalone || storedInstalled;
    };

    const alreadyInstalled = checkStandalone();

    // 2. Device detection
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    const androidDevice = /android/.test(ua);
    const mobileDevice = iosDevice || androidDevice || /mobile|silk|kindle|tablet/.test(ua) || window.innerWidth < 768;

    setIsIOS(iosDevice);
    setIsAndroid(androidDevice);
    setIsMobile(mobileDevice);

    // 3. Listen for native beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowPopup(false);
      setShowGuideModal(false);
      try {
        localStorage.setItem(INSTALLED_KEY, 'true');
      } catch (err) {
        console.warn(err);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 4. Determine if mobile popup should be displayed automatically
    if (!alreadyInstalled && mobileDevice) {
      const lastDismissed = localStorage.getItem(DISMISSED_KEY);
      let canShow = true;

      if (lastDismissed) {
        const lastTime = parseInt(lastDismissed, 10);
        if (!isNaN(lastTime) && Date.now() - lastTime < PROMPT_COOLDOWN_MS) {
          canShow = false;
        }
      }

      if (canShow) {
        // Show after a gentle 1.8-second delay so the user sees the marketplace first
        const timer = setTimeout(() => {
          setShowPopup(true);
        }, 1800);
        return () => {
          clearTimeout(timer);
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
          window.removeEventListener('appinstalled', handleAppInstalled);
        };
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // When user taps "Install"
  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          setShowPopup(false);
          localStorage.setItem(INSTALLED_KEY, 'true');
        } else {
          // User cancelled the native prompt
          setShowPopup(false);
          localStorage.setItem(DISMISSED_KEY, Date.now().toString());
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
        setShowGuideModal(true);
      }
    } else {
      // Native prompt not supported (e.g. iOS Safari, Firefox mobile, or non-Chromium)
      // Display simple visual instructions!
      setShowPopup(false);
      setShowGuideModal(true);
    }
  }, [deferredPrompt]);

  // When user taps "Not Now"
  const handleDismiss = useCallback(() => {
    setShowPopup(false);
    try {
      localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // Trigger manual installation from navbar or bottom menu
  const triggerManualInstall = useCallback(() => {
    if (deferredPrompt) {
      handleInstallClick();
    } else {
      setShowGuideModal(true);
    }
  }, [deferredPrompt, handleInstallClick]);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isStandalone,
    isMobile,
    isIOS,
    isAndroid,
    showPopup,
    showGuideModal,
    setShowPopup,
    setShowGuideModal,
    handleInstallClick,
    handleDismiss,
    triggerManualInstall,
  };
}

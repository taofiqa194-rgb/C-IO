import { useState, useEffect, useCallback, useRef } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISSED_KEY = 'cio_pwa_dismissed_at';
const INSTALLED_KEY = 'cio_pwa_installed';
// Re-prompt after 7 days if the user tapped "Not Now"
const PROMPT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function isDismissCooldownActive(): boolean {
  try {
    const lastDismissed = localStorage.getItem(DISMISSED_KEY);
    if (!lastDismissed) return false;
    const lastTime = parseInt(lastDismissed, 10);
    return !isNaN(lastTime) && Date.now() - lastTime < PROMPT_COOLDOWN_MS;
  } catch {
    return false;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Keep a ref to deferredPrompt for synchronous checks
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // 1. Detect Standalone / Installed mode
    const checkStandalone = (): boolean => {
      if (typeof window === 'undefined') return false;
      const standaloneQuery = window.matchMedia('(display-mode: standalone)').matches;
      const navigatorStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      const androidApp = document.referrer.includes('android-app://');
      const storedInstalled = localStorage.getItem(INSTALLED_KEY) === 'true';

      const runningStandalone = standaloneQuery || navigatorStandalone || androidApp;
      setIsStandalone(runningStandalone);
      if (runningStandalone || storedInstalled) {
        setIsInstalled(true);
        return true;
      }
      return false;
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

    // 3. Listen for native beforeinstallprompt (Android / Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      deferredPromptRef.current = promptEvent;

      // When the website is installable on Android:
      // Show the "Install C'IO" popup if user has not dismissed it recently & not installed
      if (!alreadyInstalled && !isDismissCooldownActive()) {
        setShowPopup(true);
      }
    };

    // 4. Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      deferredPromptRef.current = null;
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

    // 5. Fallback timer for mobile browsers that don't support beforeinstallprompt (e.g. iOS Safari)
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    if (!alreadyInstalled && mobileDevice && !isDismissCooldownActive()) {
      fallbackTimer = setTimeout(() => {
        // If beforeinstallprompt didn't fire yet and it's iOS or non-Chromium mobile, show popup
        setShowPopup(true);
      }, 2000);
    }

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // When user taps "Install"
  const handleInstallClick = useCallback(async () => {
    const promptEvent = deferredPromptRef.current || deferredPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          deferredPromptRef.current = null;
          setShowPopup(false);
          try {
            localStorage.setItem(INSTALLED_KEY, 'true');
          } catch (e) {
            console.warn(e);
          }
        } else {
          // User dismissed the native dialog
          setShowPopup(false);
          try {
            localStorage.setItem(DISMISSED_KEY, Date.now().toString());
          } catch (e) {
            console.warn(e);
          }
        }
      } catch (err) {
        console.warn('Install prompt execution error:', err);
        setShowPopup(false);
        setShowGuideModal(true);
      }
    } else {
      // Native prompt not supported (e.g. iOS Safari, Firefox, or in-app webview)
      // Display clear instructions for the specific platform!
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
    const promptEvent = deferredPromptRef.current || deferredPrompt;
    if (promptEvent) {
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

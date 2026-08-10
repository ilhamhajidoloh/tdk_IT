"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SCHOOL_LOGO, getCurrentSchoolKey, getSchoolLogoUrl, useSchoolBrand } from "./SchoolBrand";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [schoolKey, setSchoolKey] = useState<string | null>(null);
  const [logoSrc, setLogoSrc] = useState(DEFAULT_SCHOOL_LOGO);

  useEffect(() => {
    setSchoolKey(getCurrentSchoolKey());
  }, []);

  const { school } = useSchoolBrand(schoolKey);

  useEffect(() => {
    const url = getSchoolLogoUrl(school?.logo_drive_file_id, school?.logo_url);
    setLogoSrc(url || DEFAULT_SCHOOL_LOGO);
  }, [school]);

  const appTitle = school?.name?.trim() || "TDK IT";

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY));
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_DURATION_MS) return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    const isIOSDevice = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const iosTimer = isIOSDevice
      ? setTimeout(() => {
          setIsIOS(true);
          setVisible(true);
        }, 0)
      : undefined;

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "dismissed") {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:max-w-sm z-50 animate-fade-in-up">
      <div className="flex items-start gap-3 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-2xl p-4 text-foreground">
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl opacity-20 blur-sm" />
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-background shadow-sm relative border border-border/80 flex items-center justify-center p-1">
            <img
              src={logoSrc}
              alt={appTitle}
              className="w-full h-full object-contain"
              onError={() => setLogoSrc(DEFAULT_SCHOOL_LOGO)}
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-foreground leading-tight">
            ติดตั้งแอป {appTitle}
          </p>
          {isIOS ? (
            <p className="text-xs text-muted-foreground mt-1 leading-normal">
              แตะปุ่มแชร์ <span className="font-semibold">⬆️</span> แล้วเลือก &quot;เพิ่มไปยังหน้าจอโฮม&quot; เพื่อใช้งานเหมือนแอป
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1 leading-normal">
              เพิ่มไปยังหน้าจอหลักเพื่อเข้าใช้งาน {appTitle} ได้รวดเร็วขึ้น
            </p>
          )}
          <div className="flex items-center gap-2 mt-3">
            {!isIOS && (
              <button
                onClick={handleInstall}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all cursor-pointer shadow-md"
              >
                ติดตั้ง
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              ไม่ใช่ตอนนี้
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="ปิด"
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer p-0.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export default function PwaRegister() {
  const [installEvent, setInstallEvent] = useState(null);

  useEffect(() => {
    // Service worker : uniquement en production (évite les fichiers périmés en dev)
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Impossible d'enregistrer le service worker :", error);
      });
    }

    const onPrompt = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    const onInstalled = () => setInstallEvent(null);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!installEvent) return null;

  const handleInstall = async () => {
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
    >
      <Download className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Installer l&apos;application</span>
    </button>
  );
}
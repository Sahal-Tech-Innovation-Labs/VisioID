"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

function VerifyContent() {
  const params = useSearchParams();
  const token = params.get("token");

  const [status, setStatus] = useState(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : "Lien de vérification invalide.");

  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    const verify = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/entreprises/verify-email?token=${encodeURIComponent(token)}`
        );
        const result = await response.json().catch(() => ({}));

        if (response.ok && result.success) {
          setStatus("success");
          setMessage(result.message || "Compte vérifié avec succès.");
        } else {
          setStatus("error");
          setMessage(
            typeof result.detail === "string" ? result.detail : "Impossible de vérifier ce lien."
          );
        }
      } catch {
        setStatus("error");
        setMessage("Impossible de contacter le serveur.");
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#0f1e3d] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-16 h-16 mb-3 rounded-2xl overflow-hidden shadow-md">
            <Image src="/icons/icon-192.png" alt="CNIScan" fill sizes="64px" priority className="object-cover" />
          </div>
          <h1 className="text-xl font-bold text-[#0f1e3d]">CNIScan</h1>
        </div>

        {status === "loading" && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#1d4ed8] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600">Vérification en cours...</p>
          </div>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg width="24" height="18" viewBox="0 0 24 19" fill="none" aria-label="Vérifié">
                <path d="M1.5 9.5L8.5 16.5L22.5 2.5" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[#0f1e3d] mb-2">Compte activé</h2>
            <p className="text-sm text-gray-600">{message}</p>
            <Link
              href="/login"
              className="inline-block mt-6 px-6 py-3 bg-[#1d4ed8] hover:bg-[#1d40c0] text-white font-semibold rounded-lg transition-colors"
            >
              Se connecter
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-label="Erreur">
                <path d="M4 4L16 16M16 4L4 16" stroke="#C62828" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[#0f1e3d] mb-2">Vérification impossible</h2>
            <p className="text-sm text-gray-600">{message}</p>
            <Link
              href="/login"
              className="inline-block mt-6 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              Retour à la connexion
            </Link>
                        <Link href="/resend-verification" className="block mt-3 text-sm text-[#1d4ed8] font-semibold hover:underline">
              Recevoir un nouveau lien
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f1e3d] flex items-center justify-center">
          <p className="text-white/70">Chargement...</p>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
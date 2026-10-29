"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");

  const handleSubmit = async () => {
    const value = email.trim();
    if (!EMAIL_REGEX.test(value)) {
      setError("Adresse email invalide.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/entreprises/resend-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: value }),
        }
      );
      if (!response.ok) {
        setError("Impossible d'envoyer la demande. Réessayez.");
        return;
      }
      setSentTo(value);
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1e3d] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-16 h-16 mb-3 rounded-2xl overflow-hidden shadow-md">
            <Image src="/icons/icon-192.png" alt="CNIScan" fill sizes="64px" priority className="object-cover" />
          </div>
          <h1 className="text-xl font-bold text-[#0f1e3d]">CNIScan</h1>
        </div>

        {sentTo ? (
          <div className="text-center">
            <h2 className="text-lg font-semibold text-[#0f1e3d] mb-2">Demande envoyée</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Si un compte non vérifié existe pour{" "}
              <span className="font-semibold text-gray-900">{sentTo}</span>, un nouvel email vient d&apos;être
              envoyé. Le lien est valable 24 heures.
            </p>
            <p className="text-xs text-gray-400 mt-3">
              Pensez à regarder dans vos spams. Vous pourrez refaire une demande dans une minute.
            </p>
            <Link
              href="/login"
              className="inline-block mt-6 px-6 py-3 bg-[#1d4ed8] hover:bg-[#1d40c0] text-white font-semibold rounded-lg transition-colors"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 text-center">
              Saisissez l&apos;adresse email utilisée à l&apos;inscription pour recevoir un nouveau lien d&apos;activation.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="vous@entreprise.com"
                className="w-full px-4 py-3 border border-gray-900 rounded-lg text-base text-gray-900 focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent outline-none"
              />
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 bg-[#1d4ed8] hover:bg-[#1d40c0] text-white font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? "Envoi..." : "Renvoyer le lien"}
            </button>

            <p className="text-center text-sm text-gray-500">
              <Link href="/login" className="text-[#1d4ed8] font-semibold hover:underline">
                Retour à la connexion
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
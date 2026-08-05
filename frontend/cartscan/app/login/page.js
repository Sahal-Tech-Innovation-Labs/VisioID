"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ login: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.login || !form.password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    setError("");
    try {
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: form.login, password: form.password }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.detail || "Erreur de connexion.");
        return;
      }

      // Stocker le token dans localStorage ET cookie (pour le middleware)
      localStorage.setItem("token", result.token);
localStorage.setItem("user", JSON.stringify(result.user));

document.cookie = `token=${result.token}; path=/; max-age=${12 * 3600}`;

window.dispatchEvent(new Event("userUpdated"));

router.push("/dashboard");
    } catch (err) {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1e3d] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-32 h-16 mb-4">
            <Image src="/images/sahal.jpeg" alt="Sahal Tech" fill className="object-contain" />
          </div>
          <h1 className="text-xl font-bold text-[#0f1e3d]">CniScan</h1>
          <p className="text-xs text-gray-400 mt-0.5">Système de gestion des visiteurs</p>
        </div>

        {/* Formulaire */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Login
            </label>
            <input
              type="text"
              value={form.login}
              onChange={(e) => setForm({ ...form, login: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Votre identifiant"
              className="w-full px-4 py-3 border border-gray-900 rounded-lg text-base text-gray-900 focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Mot de passe
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-900 rounded-lg text-base text-gray-900 focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-[#1d4ed8] hover:bg-[#1d40c0] text-white font-semibold rounded-lg transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Sahal Tech Innovation Labs © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
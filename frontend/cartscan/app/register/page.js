"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const SECTEURS = [
  { value: "hotel", label: "Hôtellerie" },
  { value: "securite", label: "Sécurité / gardiennage" },
  { value: "administration", label: "Administration" },
  { value: "general", label: "Autre" },
];

const LOGIN_REGEX = /^[a-zA-Z0-9_.-]{3,50}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputCls =
  "w-full px-4 py-3 border border-gray-900 rounded-lg text-base text-gray-900 focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent outline-none";
const labelCls =
  "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";

export default function RegisterPage() {
  const [form, setForm] = useState({
    nom_entreprise: "",
    secteur: "hotel",
    prenom: "",
    nom: "",
    email: "",
    login: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const validate = () => {
    if (
      !form.nom_entreprise.trim() || !form.prenom.trim() || !form.nom.trim() ||
      !form.email.trim() || !form.login.trim() || !form.password
    ) {
      return "Veuillez remplir tous les champs.";
    }
    if (!EMAIL_REGEX.test(form.email.trim())) return "Adresse email invalide.";
    if (!LOGIN_REGEX.test(form.login)) {
      return "Identifiant invalide : 3 à 50 caractères, lettres, chiffres, point, tiret ou underscore (sans espace ni accent).";
    }
    if (form.password.length < 8) return "Le mot de passe doit faire au moins 8 caractères.";
    if (form.password.length > 72) return "Le mot de passe est trop long (72 caractères maximum).";
    if (form.password !== form.confirm) return "Les mots de passe ne correspondent pas.";
    return "";
  };

  const handleSubmit = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/entreprises/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom_entreprise: form.nom_entreprise.trim(),
          secteur: form.secteur,
          nom: form.nom.trim(),
          prenom: form.prenom.trim(),
          email: form.email.trim(),
          login: form.login,
          password: form.password,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(
          typeof result.detail === "string"
            ? result.detail
            : "Informations invalides. Vérifiez les champs saisis."
        );
        return;
      }
      setSentTo(form.email.trim());
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const logo = (
    <div className="flex flex-col items-center mb-6">
      <div className="relative w-16 h-16 mb-3 rounded-2xl overflow-hidden shadow-md">
        <Image src="/icons/icon-192.png" alt="CNIScan" fill sizes="64px" priority className="object-cover" />
      </div>
      <h1 className="text-xl font-bold text-[#0f1e3d]">CNIScan</h1>
    </div>
  );

  if (sentTo) {
    return (
      <div className="min-h-screen bg-[#0f1e3d] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          {logo}
          <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg width="24" height="18" viewBox="0 0 24 19" fill="none" aria-label="Envoyé">
              <path d="M1.5 9.5L8.5 16.5L22.5 2.5" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[#0f1e3d] mb-2">Vérifiez votre email</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Un lien d&apos;activation a été envoyé à <span className="font-semibold text-gray-900">{sentTo}</span>.
            Cliquez dessus pour activer votre compte. Il est valable 24 heures.
          </p>
          <p className="text-xs text-gray-400 mt-3">Si vous ne voyez rien, regardez dans vos spams.</p>
          <Link
            href="/login"
            className="inline-block mt-6 px-6 py-3 bg-[#1d4ed8] hover:bg-[#1d40c0] text-white font-semibold rounded-lg transition-colors"
          >
            Aller à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1e3d] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {logo}
        <p className="text-center text-sm text-gray-500 mb-6">Créer le compte de votre entreprise</p>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>Nom de l&apos;entreprise</label>
            <input type="text" maxLength={150} value={form.nom_entreprise} onChange={set("nom_entreprise")} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Secteur d&apos;activité</label>
            <select value={form.secteur} onChange={set("secteur")} className={inputCls}>
              {SECTEURS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Prénom</label>
              <input type="text" maxLength={100} value={form.prenom} onChange={set("prenom")} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Nom</label>
              <input type="text" maxLength={100} value={form.nom} onChange={set("nom")} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="vous@entreprise.com" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Identifiant de connexion</label>
            <input type="text" maxLength={50} value={form.login} onChange={set("login")} className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">Lettres, chiffres, point, tiret ou underscore.</p>
          </div>

          <div>
            <label className={labelCls}>Mot de passe</label>
            <input type="password" maxLength={72} value={form.password} onChange={set("password")} className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">8 caractères minimum.</p>
          </div>

          <div>
            <label className={labelCls}>Confirmer le mot de passe</label>
            <input
              type="password"
              maxLength={72}
              value={form.confirm}
              onChange={set("confirm")}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className={inputCls}
            />
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-[#1d4ed8] hover:bg-[#1d40c0] text-white font-semibold rounded-lg transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? "Création du compte..." : "Créer mon compte"}
          </button>

          <p className="text-center text-sm text-gray-500 pt-1">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-[#1d4ed8] font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Propulsé par Sahal Tech Innovation Labs · © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
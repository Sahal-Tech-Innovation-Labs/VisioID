"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

const STATUTS = {
  actif: { label: "Active", cls: "bg-green-100 text-green-700" },
  en_attente: { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  suspendu: { label: "Suspendue", cls: "bg-red-100 text-red-700" },
};

const SECTEURS = {
  hotel: "Hôtellerie",
  securite: "Sécurité",
  administration: "Administration",
  general: "Autre",
  plateforme: "Plateforme",
};

const FILTRES = [
  { key: "tous", label: "Toutes" },
  { key: "actif", label: "Actives" },
  { key: "en_attente", label: "En attente" },
  { key: "suspendu", label: "Suspendues" },
];

export default function AdminEntreprisesPage() {
  const router = useRouter();
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("tous");
  const [busyId, setBusyId] = useState(null);
  const [myEntrepriseId] = useState(() => {
    if (typeof window === "undefined") return null;
    return JSON.parse(localStorage.getItem("user") || "{}").entreprise_id ?? null;
  });

  useEffect(() => {
    // Page réservée à la plateforme : tout autre rôle est renvoyé à l'accueil
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role !== "super_admin") {
      router.push("/");
      return;
    }
    const loadEntreprises = async () => {
      try {
        const response = await apiFetch("/entreprises/");
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(typeof result.detail === "string" ? result.detail : "Impossible de charger les entreprises.");
          return;
        }
        setEntreprises(result.data || []);
      } catch {
        setError("Impossible de contacter le serveur.");
      } finally {
        setLoading(false);
      }
    };
    void loadEntreprises();
  }, [router]);

  const changeStatut = async (e, statut) => {
    const message =
      statut === "suspendu"
        ? `Suspendre « ${e.nom} » ? Ses utilisateurs ne pourront plus se connecter (les sessions déjà ouvertes expirent d'ici 12 h au maximum).`
        : `Réactiver « ${e.nom} » ?`;
    if (!confirm(message)) return;

    setBusyId(e.id);
    try {
      const response = await apiFetch(`/entreprises/${e.id}/statut`, {
        method: "PUT",
        body: JSON.stringify({ statut }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(typeof result.detail === "string" ? result.detail : "Erreur lors de la mise à jour.");
        return;
      }
      setEntreprises((prev) => prev.map((x) => (x.id === e.id ? { ...x, statut } : x)));
    } catch {
      alert("Impossible de contacter le serveur.");
    } finally {
      setBusyId(null);
    }
  };

    const supprimer = async (e) => {
    if (!confirm(`Supprimer définitivement « ${e.nom} » et ses comptes en attente ? Cette action est irréversible.`)) return;
    setBusyId(e.id);
    try {
      const response = await apiFetch(`/entreprises/${e.id}`, { method: "DELETE" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(typeof result.detail === "string" ? result.detail : "Erreur lors de la suppression.");
        return;
      }
      setEntreprises((prev) => prev.filter((x) => x.id !== e.id));
    } catch {
      alert("Impossible de contacter le serveur.");
    } finally {
      setBusyId(null);
    }
  };


  const counts = useMemo(() => ({
    tous: entreprises.length,
    actif: entreprises.filter((e) => e.statut === "actif").length,
    en_attente: entreprises.filter((e) => e.statut === "en_attente").length,
    suspendu: entreprises.filter((e) => e.statut === "suspendu").length,
  }), [entreprises]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entreprises.filter((e) => {
      const matchQ = !q || e.nom?.toLowerCase().includes(q) || e.email_contact?.toLowerCase().includes(q);
      const matchS = filter === "tous" || e.statut === filter;
      return matchQ && matchS;
    });
  }, [entreprises, query, filter]);

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return "—";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
        <span className="hover:text-blue-600 cursor-pointer" onClick={() => router.push("/dashboard")}>
          Tableau de bord
        </span>
        <span>›</span>
        <span className="text-gray-700 font-medium">Entreprises</span>
      </div>

      {/* Compteurs (cliquables = filtres) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {FILTRES.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`bg-white rounded-xl border p-4 text-left transition-colors ${
              filter === f.key ? "border-[#1d4ed8] ring-1 ring-[#1d4ed8]" : "border-gray-100 hover:border-gray-300"
            }`}
          >
            <p className="text-xs text-gray-500">{f.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{counts[f.key]}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <h1 className="text-base font-semibold text-gray-800 mr-2">Entreprises clientes</h1>
          <div className="relative w-full sm:w-72 sm:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un nom ou un email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>
        </div>

        {error && <p className="m-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Entreprise", "Secteur", "Statut", "Utilisateurs", "Inscrite le", "Action"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${
                      i === 3 ? "text-center" : i === 5 ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((e) => {
                const statut = STATUTS[e.statut] || { label: e.statut, cls: "bg-gray-100 text-gray-600" };
                const isMine = e.id === myEntrepriseId;
                return (
                  <tr key={e.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-800">
                        {e.nom}
                        {isMine && (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-100 text-blue-700 align-middle">
                            Votre entreprise
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{e.email_contact || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{SECTEURS[e.secteur] || e.secteur}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statut.cls}`}>
                        {statut.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-center">{e.nombre_users}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(e.created_at)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {isMine ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : e.statut === "actif" ? (
                        <button
                          onClick={() => changeStatut(e, "suspendu")}
                          disabled={busyId === e.id}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {busyId === e.id ? "..." : "Suspendre"}
                        </button>
                      ) : e.statut === "suspendu" ? (
                        <button
                          onClick={() => changeStatut(e, "actif")}
                          disabled={busyId === e.id}
                          className="px-3 py-1.5 text-xs font-semibold text-green-700 border border-green-200 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {busyId === e.id ? "..." : "Réactiver"}
                        </button>
                      ) : (
                       <div className="flex items-center justify-end gap-3">
                          <span className="text-xs text-gray-400">Email non vérifié</span>
                          <button
                            onClick={() => supprimer(e)}
                            disabled={busyId === e.id}
                            className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {busyId === e.id ? "..." : "Supprimer"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">Aucune entreprise trouvée.</p>
          </div>
        )}
      </div>
    </div>
  );
}
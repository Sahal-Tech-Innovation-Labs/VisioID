"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ShieldCheck, User, X } from "lucide-react";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nom: "", prenom: "", login: "", password: "", role: "vigile",
  });

  const getToken = () => localStorage.getItem("token");

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:8000/auth/users", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const result = await response.json();
      if (result.success) setUsers(result.data);
    } catch (err) {
      console.error("Erreur chargement comptes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    if (!form.nom || !form.prenom || !form.login || !form.password) {
      setError("Tous les champs sont obligatoires.");
      return;
    }
    if (form.password.length < 4) {
      setError("Le mot de passe doit faire au moins 4 caractères.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("http://localhost:8000/auth/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.detail || "Erreur lors de la création.");
        return;
      }
      setForm({ nom: "", prenom: "", login: "", password: "", role: "vigile" });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setError("Impossible de contacter le serveur.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, login) => {
    if (!confirm(`Supprimer le compte "${login}" ?`)) return;
    try {
      const response = await fetch(`http://localhost:8000/auth/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const result = await response.json();
      if (!response.ok) {
        alert(result.detail || "Erreur lors de la suppression.");
        return;
      }
      setUsers(users.filter((u) => u.id !== id));
    } catch (err) {
      alert("Impossible de contacter le serveur.");
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
        <span className="text-gray-700 font-medium">Gestion des comptes</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-800">Comptes utilisateurs</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-2 bg-[#1d4ed8] hover:bg-[#1d40c0] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau compte
          </button>
        </div>

        <div className="divide-y divide-gray-50">
          {users.map((u) => (
            <div key={u.id} className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0f1e3d]/10 flex items-center justify-center text-xs font-bold text-[#0f1e3d]">
                  {u.prenom?.[0]}{u.nom?.[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{u.prenom} {u.nom}</p>
                  <p className="text-xs text-gray-400">@{u.login}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                  u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {u.role === "admin" ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {u.role === "admin" ? "Admin" : "Vigile"}
                </span>
                <button
                  onClick={() => handleDelete(u.id, u.login)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">Aucun compte trouvé.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal création */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">Nouveau compte</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Prénom</label>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nom</label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Login</label>
                <input
                  type="text"
                  value={form.login}
                  onChange={(e) => setForm({ ...form, login: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Rôle</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="vigile">Vigile</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <button
                onClick={handleCreate}
                disabled={submitting}
                className="w-full py-2.5 bg-[#1d4ed8] hover:bg-[#1d40c0] text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-60"
              >
                {submitting ? "Création..." : "Créer le compte"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
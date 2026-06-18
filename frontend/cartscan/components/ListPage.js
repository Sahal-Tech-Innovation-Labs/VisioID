"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, Pencil, Trash2, Plus, Download, ChevronLeft, ChevronRight,
  FileText, X, LogOut, Clock
} from "lucide-react";

export default function ListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("Tous types");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [marquantSortie, setMarquantSortie] = useState(false);

  useEffect(() => {
    const urlFilter = searchParams.get("filter");

    const fetchDocuments = async () => {
      try {
        let url = "http://localhost:8000/documents/";
        if (urlFilter === "expires") url = "http://localhost:8000/documents/expires";
        if (urlFilter === "cni") url = "http://localhost:8000/documents/type/cni";
        if (urlFilter === "passeport") url = "http://localhost:8000/documents/type/passeport";

        const response = await fetch(url);
        const result = await response.json();
        if (result.success) setDocuments(result.data);
      } catch (err) {
        console.error("Erreur chargement documents:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const filtered = documents.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchQ = !q ||
      d.nom?.toLowerCase().includes(q) ||
      d.prenom?.toLowerCase().includes(q) ||
      d.numero_doc?.toLowerCase().includes(q) ||
      d.nationalite?.toLowerCase().includes(q);
    const matchType = typeFilter === "Tous types" || d.type_doc === typeFilter;
    return matchQ && matchType;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleExport = () => {
    import("xlsx").then((XLSX) => {
      const data = filtered.map((doc) => ({
        "NOM": doc.nom,
        "PRENOM": doc.prenom,
        "NUM.DOC": doc.numero_doc,
        "NATIONALITE": doc.nationalite,
        "TYPE": doc.type_doc,
        "DATE NAISSANCE": doc.date_naissance,
        "LIEU NAISSANCE": doc.lieu_naissance,
        "SEXE": doc.sexe,
        "PROFESSION": doc.profession,
        "DATE EXPIRATION": doc.date_expiration,
        "DATE ENREGISTREMENT": doc.date_enreg,
        "HEURE SORTIE": doc.heure_sortie || "",
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      ws["!cols"] = [
        { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
        { wch: 15 }, { wch: 20 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, "Documents");
      XLSX.writeFile(wb, `CniScan_export_${new Date().toISOString().split("T")[0]}.xlsx`);
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer ce document ?")) return;
    try {
      const response = await fetch(`http://localhost:8000/documents/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        setDocuments(documents.filter((doc) => doc.id !== id));
      }
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

  const handleEdit = (doc) => {
    sessionStorage.setItem("editDocument", JSON.stringify(doc));
    setTimeout(() => router.push("/form"), 100);
  };

  const handleOpenModal = (doc) => {
    setSelectedDoc(doc);
  };

  const handleCloseModal = () => {
    setSelectedDoc(null);
  };

  const handleMarquerSortie = async (doc) => {
    setMarquantSortie(true);
    try {
      const response = await fetch(`http://localhost:8000/documents/${doc.id}/sortie`, {
        method: "PUT",
      });
      const result = await response.json();

      if (!response.ok) {
        alert(result.detail || "Erreur lors de l'enregistrement de la sortie.");
        return;
      }

      const updated = { ...doc, heure_sortie: result.heure_sortie };
      setDocuments((prev) => prev.map((d) => (d.id === doc.id ? updated : d)));
      setSelectedDoc(updated);
    } catch (err) {
      alert("Impossible de contacter le serveur.");
    } finally {
      setMarquantSortie(false);
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
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
        <span className="hover:text-blue-600 cursor-pointer" onClick={() => router.push("/dashboard")}>
          Tableau de bord
        </span>
        <span>›</span>
        <span className="text-gray-700 font-medium">Visiteurs</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, document..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-gray-700"
          >
            <option>Tous types</option>
            <option value="PASSEPORT">Passeport</option>
            <option value="CNI">CNI</option>
          </select>

          <div className="flex-1" />

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>

          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 bg-[#1d4ed8] hover:bg-[#1d40c0] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Entrée
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nom</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type Doc.</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Numéro</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nationalité</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date enreg.</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((doc) => (
                <tr key={doc.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <div
                      className="flex items-center gap-2.5 cursor-pointer group"
                      onClick={() => handleOpenModal(doc)}
                      title="Voir la fiche"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#0f1e3d]/10 flex items-center justify-center text-xs font-bold text-[#0f1e3d] shrink-0 overflow-hidden">
                        {doc.photo_profil ? (
                          <img
                            src={doc.photo_profil}
                            alt={`${doc.prenom || ""} ${doc.nom || ""}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <>{doc.prenom?.[0]}{doc.nom?.[0]}</>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 group-hover:underline">
                          {doc.prenom} {doc.nom}
                        </p>
                        <p className="text-xs text-gray-400">{doc.profession}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      doc.type_doc === "PASSEPORT" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {doc.type_doc || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-mono">{doc.numero_doc}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.nationalite}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.date_enreg}</td>
                  <td className="px-4 py-3">
                    {doc.heure_sortie ? (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                        Sorti
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                        Présent
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => handleEdit(doc)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Éditer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {paginated.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aucun document trouvé</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-gray-400">
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  page === n ? "bg-[#0f1e3d] text-white" : "border border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de consultation */}
      {selectedDoc && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">Fiche visiteur</h2>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-full bg-[#0f1e3d]/10 flex items-center justify-center text-lg font-bold text-[#0f1e3d] shrink-0 overflow-hidden">
                  {selectedDoc.photo_profil ? (
                    <img
                      src={selectedDoc.photo_profil}
                      alt={`${selectedDoc.prenom || ""} ${selectedDoc.nom || ""}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>{selectedDoc.prenom?.[0]}{selectedDoc.nom?.[0]}</>
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-800">
                    {selectedDoc.prenom} {selectedDoc.nom}
                  </p>
                  <p className="text-sm text-gray-500">{selectedDoc.profession || "—"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedDoc.heure_sortie ? (
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                        Sorti
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                        Présent
                      </span>
                    )}
<span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700">
  {selectedDoc.nombre_visites || 1} visite{(selectedDoc.nombre_visites || 1) > 1 ? "s" : ""}
</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Type document</p>
                  <p className="text-gray-800 font-medium">{selectedDoc.type_doc || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Numéro</p>
                  <p className="text-gray-800 font-medium font-mono">{selectedDoc.numero_doc}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Nationalité</p>
                  <p className="text-gray-800 font-medium">{selectedDoc.nationalite}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Sexe</p>
                  <p className="text-gray-800 font-medium">{selectedDoc.sexe}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Date naissance</p>
                  <p className="text-gray-800 font-medium">{selectedDoc.date_naissance}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Lieu naissance</p>
                  <p className="text-gray-800 font-medium">{selectedDoc.lieu_naissance}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Date expiration</p>
                  <p className="text-gray-800 font-medium">{selectedDoc.date_expiration}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Date enreg.</p>
                  <p className="text-gray-800 font-medium">{selectedDoc.date_enreg}</p>
                </div>
              </div>

              <div className="mb-5">
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Motif de visite
                </p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 min-h-12">
                  {selectedDoc.motif_visite || "Aucun motif renseigné."}
                </p>
              </div>

              {selectedDoc.heure_sortie && (
                <p className="text-xs text-gray-500 mb-4">
                  Sortie enregistrée le {selectedDoc.heure_sortie}
                </p>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => handleEdit(selectedDoc)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Éditer
                </button>
                {!selectedDoc.heure_sortie && (
                  <button
                    onClick={() => handleMarquerSortie(selectedDoc)}
                    disabled={marquantSortie}
                    className="px-4 py-2 bg-[#0f1e3d] hover:bg-[#16275a] text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60"
                  >
                    <LogOut className="w-4 h-4" />
                    {marquantSortie ? "..." : "Marquer sorti"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
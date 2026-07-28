"use client";
import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, Pencil, Trash2, Plus, Download, ChevronLeft, ChevronRight,
  FileText, X, LogOut, Clock
} from "lucide-react";

function ListPageContent() {
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
  const [historique, setHistorique] = useState(null);
const [loadingHistorique, setLoadingHistorique] = useState(false);

  useEffect(() => {
    const urlFilter = searchParams.get("filter");
    const fetchDocuments = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL;
let url = `${API}/documents/`;
if (urlFilter === "expires") url = `${API}/documents/expires`;
if (urlFilter === "cni") url = `${API}/documents/type/cni`;
if (urlFilter === "passeport") url = `${API}/documents/type/passeport`;
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

  const handleExport = async () => {
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Visiteurs");

      // Colonnes avec largeurs
      ws.columns = [
        { header: "NOM",                 key: "nom",           width: 18 },
        { header: "PRENOM",              key: "prenom",        width: 22 },
        { header: "NUM.DOC",             key: "numero_doc",    width: 20 },
        { header: "NATIONALITE",         key: "nationalite",   width: 15 },
        { header: "TYPE",                key: "type_doc",      width: 12 },
        { header: "DATE NAISSANCE",      key: "date_naissance",width: 16 },
        { header: "LIEU NAISSANCE",      key: "lieu_naissance",width: 18 },
        { header: "SEXE",                key: "sexe",          width: 8  },
        { header: "PROFESSION",          key: "profession",    width: 18 },
        { header: "DATE EXPIRATION",     key: "date_expiration",width: 17},
        { header: "DATE ENREGISTREMENT", key: "date_enreg",    width: 22 },
        { header: "HEURE SORTIE",        key: "heure_sortie",  width: 20 },
      ];

      // Style en-têtes
      const headerRow = ws.getRow(1);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern", pattern: "solid",
          fgColor: { argb: "FF0F1E3D" }, // bleu foncé de la sidebar
        };
        cell.font  = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FF1D4ED8" } },
        };
      });
      headerRow.height = 28;

      // Données
      filtered.forEach((doc, idx) => {
        const row = ws.addRow({
          nom:            doc.nom || "",
          prenom:         doc.prenom || "",
          numero_doc:     doc.numero_doc || "",
          nationalite:    doc.nationalite || "",
          type_doc:       doc.type_doc || "",
          date_naissance: doc.date_naissance || "",
          lieu_naissance: doc.lieu_naissance || "",
          sexe:           doc.sexe || "",
          profession:     doc.profession || "",
          date_expiration:doc.date_expiration || "",
          date_enreg:     doc.date_enreg || "",
          heure_sortie:   doc.heure_sortie || "",
        });

        // Alternance de couleur sur les lignes
        const bgColor = idx % 2 === 0 ? "FFFFFFFF" : "FFF0F3F8";
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
          cell.alignment = { vertical: "middle" };
          cell.font = { size: 10 };
        });
        row.height = 22;

        // Badge type doc en couleur
        const typeCell = row.getCell("type_doc");
        if (doc.type_doc === "PASSEPORT") {
          typeCell.font = { bold: true, color: { argb: "FF7C3AED" }, size: 10 };
        } else if (doc.type_doc === "CNI") {
          typeCell.font = { bold: true, color: { argb: "FF1D4ED8" }, size: 10 };
        }

        // Statut sortie en couleur
        const sortieCell = row.getCell("heure_sortie");
        if (doc.heure_sortie) {
          sortieCell.font = { color: { argb: "FF6B7280" }, size: 10 };
        } else {
          sortieCell.value = "Présent";
          sortieCell.font = { bold: true, color: { argb: "FF16A34A" }, size: 10 };
        }
      });

      // Bordure extérieure du tableau
      const lastRow = ws.rowCount;
      for (let r = 1; r <= lastRow; r++) {
        ws.getRow(r).getCell(1).border = {
          ...ws.getRow(r).getCell(1).border,
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
        };
        ws.getRow(r).getCell(12).border = {
          ...ws.getRow(r).getCell(12).border,
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        };
      }

      // Téléchargement
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `VisioID_export_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erreur lors de l'export : " + err.message);
    }
  };
  const handleVoirHistorique = async (numero_doc) => {
  setLoadingHistorique(true);
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/historique/${numero_doc}`, {
      method: "GET",
    });
    const result = await response.json();
    if (result.success) setHistorique(result.data);
  } catch (err) {
    alert("Impossible de charger l'historique.");
  } finally {
    setLoadingHistorique(false);
  }
};

  const handleDelete = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer ce document ?")) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (result.success) setDocuments(documents.filter((doc) => doc.id !== id));
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

  const handleEdit = (doc) => {
    sessionStorage.setItem("editDocument", JSON.stringify(doc));
    setTimeout(() => router.push("/form"), 100);
  };

  const handleOpenModal  = (doc) => setSelectedDoc(doc);
  const handleCloseModal = () => setSelectedDoc(null);

  const handleMarquerSortie = async (doc) => {
    setMarquantSortie(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${doc.id}/sortie`, { method: "PUT" });
      const result = await response.json();
      if (!response.ok) { alert(result.detail || "Erreur."); return; }
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
    <div className="p-3 sm:p-6">
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
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:flex-1 sm:min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-gray-700"
          >
            <option>Tous types</option>
            <option value="PASSEPORT">Passeport</option>
            <option value="CNI">CNI</option>
          </select>
          <div className="hidden sm:flex flex-1" />
          <button onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exporter</span>
          </button>
          <button onClick={() => router.push("/")}
            className="flex items-center gap-2 px-3 py-2 bg-[#1d4ed8] hover:bg-[#1d40c0] text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouvelle Entrée</span>
          </button>
        </div>

        {/* Table desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Nom","Type Doc.","Numéro","Nationalité","Date enreg.","Statut","Actions"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((doc) => (
                <tr key={doc.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => handleOpenModal(doc)}>
                      <div className="w-8 h-8 rounded-full bg-[#0f1e3d]/10 flex items-center justify-center text-xs font-bold text-[#0f1e3d] shrink-0 overflow-hidden">
                        {doc.photo_profil ? <img src={doc.photo_profil} alt="" className="w-full h-full object-cover" /> : <>{doc.prenom?.[0]}{doc.nom?.[0]}</>}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 group-hover:underline">{doc.prenom} {doc.nom}</p>
                        <p className="text-xs text-gray-400">{doc.profession}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${doc.type_doc === "PASSEPORT" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                      {doc.type_doc || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-mono">{doc.numero_doc}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.nationalite}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.date_enreg}</td>
                  <td className="px-4 py-3">
                    {doc.heure_sortie
                      ? <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Sorti</span>
                      : <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">Présent</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => handleEdit(doc)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Éditer"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards mobile */}
        <div className="sm:hidden divide-y divide-gray-100">
          {paginated.map((doc) => (
            <div key={doc.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => handleOpenModal(doc)}>
                  <div className="w-10 h-10 rounded-full bg-[#0f1e3d]/10 flex items-center justify-center text-sm font-bold text-[#0f1e3d] shrink-0 overflow-hidden">
                    {doc.photo_profil ? <img src={doc.photo_profil} alt="" className="w-full h-full object-cover" /> : <>{doc.prenom?.[0]}{doc.nom?.[0]}</>}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{doc.prenom} {doc.nom}</p>
                    <p className="text-xs text-gray-400 font-mono">{doc.numero_doc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {doc.heure_sortie
                    ? <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Sorti</span>
                    : <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">Présent</span>}
                  <button onClick={() => handleEdit(doc)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg ml-1"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="mt-2 flex gap-2 flex-wrap">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${doc.type_doc === "PASSEPORT" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{doc.type_doc || "—"}</span>
                <span className="text-xs text-gray-400">{doc.date_enreg}</span>
              </div>
            </div>
          ))}
        </div>

        {paginated.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aucun document trouvé</p>
          </div>
        )}

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-gray-400">{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</p>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 rounded-lg text-sm font-medium ${page === n ? "bg-[#0f1e3d] text-white" : "border border-gray-200 hover:bg-gray-50 text-gray-700"}`}>{n}</button>
            ))}
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50" onClick={handleCloseModal}>
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">Fiche visiteur</h2>
              <button onClick={handleCloseModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-full bg-[#0f1e3d]/10 flex items-center justify-center text-lg font-bold text-[#0f1e3d] shrink-0 overflow-hidden">
                  {selectedDoc.photo_profil ? <img src={selectedDoc.photo_profil} alt="" className="w-full h-full object-cover" /> : <>{selectedDoc.prenom?.[0]}{selectedDoc.nom?.[0]}</>}
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-800">{selectedDoc.prenom} {selectedDoc.nom}</p>
                  <p className="text-sm text-gray-500">{selectedDoc.profession || "—"}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {selectedDoc.heure_sortie
                      ? <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Sorti</span>
                      : <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">Présent</span>}
                    <button
  onClick={() => handleVoirHistorique(selectedDoc.numero_doc)}
  className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
>
  {loadingHistorique ? "..." : `${selectedDoc.nombre_visites || 1} visite${(selectedDoc.nombre_visites || 1) > 1 ? "s" : ""}`}
</button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                {[
                  ["Type document", selectedDoc.type_doc || "—"],
                  ["Numéro", selectedDoc.numero_doc],
                  ["Nationalité", selectedDoc.nationalite],
                  ["Sexe", selectedDoc.sexe],
                  ["Date naissance", selectedDoc.date_naissance],
                  ["Lieu naissance", selectedDoc.lieu_naissance],
                  ["Date expiration", selectedDoc.date_expiration],
                  ["Date enreg.", selectedDoc.date_enreg],
                  ["Enregistré par", selectedDoc.agent_login || "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">{label}</p>
                    <p className="text-gray-800 font-medium">{value || "—"}</p>
                  </div>
                ))}
              </div>
              <div className="mb-5">
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Motif de visite
                </p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 min-h-12">
                  {selectedDoc.motif_visite || "Aucun motif renseigné."}
                </p>
              </div>
              {selectedDoc.heure_sortie && (
                <p className="text-xs text-gray-500 mb-4">Sortie enregistrée le {selectedDoc.heure_sortie}</p>
              )}
              <div className="flex gap-3 justify-end">
                <button onClick={() => handleEdit(selectedDoc)} className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg flex items-center gap-2">
                  <Pencil className="w-4 h-4" /> Éditer
                </button>
                {!selectedDoc.heure_sortie && (
                  <button onClick={() => handleMarquerSortie(selectedDoc)} disabled={marquantSortie} className="px-4 py-2 bg-[#0f1e3d] hover:bg-[#16275a] text-white text-sm font-semibold rounded-lg flex items-center gap-2 disabled:opacity-60">
                    <LogOut className="w-4 h-4" /> {marquantSortie ? "..." : "Marquer sorti"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {historique && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-[60]" onClick={() => setHistorique(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">
                Historique — {historique.length} visite{historique.length > 1 ? "s" : ""}
              </h2>
              <button onClick={() => setHistorique(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {historique.map((visite, idx) => (
                <div key={visite.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Visite {historique.length - idx}
                    </span>
                    {visite.heure_sortie
                      ? <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Sorti</span>
                      : <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">Présent</span>}
                  </div>
                  <p className="text-sm text-gray-700 font-medium">{visite.date_enreg}</p>
                  {visite.heure_sortie && (
                    <p className="text-xs text-gray-400 mt-0.5">Sortie : {visite.heure_sortie}</p>
                  )}
                  {visite.motif_visite && (
                    <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded-lg px-3 py-2">
                      {visite.motif_visite}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default function ListPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Chargement...</p></div>}>
      <ListPageContent />
    </Suspense>
  );
}
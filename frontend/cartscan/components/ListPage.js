"use client";
import { useState, useEffect } from "react";
import { Search, Eye, Trash2, Plus, Download, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function ListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch("http://localhost:8000/documents/");
        const result = await response.json();
        if (result.success) {
          setDocuments(result.data);
        }
      } catch (err) {
        console.error("Erreur chargement documents:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

   if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Chargement...</p>
      </div>
    );
  }

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.prenom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.numero_doc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.profession?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    const headers = ["NOM", "PRENOM", "NUM.DOC", "NATIONALITE", "Date naissance", "Lieu Naissance", "Sex", "Profession", "Date.Expire", "Date.Enreg"];
    const csvContent = [
      headers.join(","),
      ...filteredDocuments.map((doc) =>
        [doc.nom, doc.prenom, doc.numero_doc, doc.nationalite, doc.date_naissance, doc.lieu_naissance, doc.sexe, doc.profession, doc.date_expiration, doc.date_enreg].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `documents_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold text-blue-900">Liste des documents</h1>
        <div className="flex gap-3">
          <Link href="/dashboard">
            <button className="flex items-center gap-2 px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-lg shadow-md transition-all font-medium">
              <BarChart3 className="w-5 h-5" />
              Statistiques
            </button>
          </Link>
          <Link href="/">
            <button className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-all font-medium">
              <Plus className="w-5 h-5" />
              Nouveau document
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou numéro..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none"
          />
        </div>

        <div className="overflow-x-auto mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                {["NOM", "PRENOM", "NUM.DOC", "NATIONALITE", "Date naissance", "Lieu Naissance", "Sex", "Profession", "Date.Expire", "Date.Enreg", "Actions"].map((h) => (
                  <th key={h} className="text-left py-4 px-3 font-semibold text-gray-700 text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-3 text-sm">{doc.nom}</td>
                  <td className="py-4 px-3 text-sm">{doc.prenom}</td>
                  <td className="py-4 px-3 text-sm">{doc.numero_doc}</td>
                  <td className="py-4 px-3 text-sm">{doc.nationalite}</td>
                  <td className="py-4 px-3 text-sm">{doc.date_naissance}</td>
                  <td className="py-4 px-3 text-sm">{doc.lieu_naissance}</td>
                  <td className="py-4 px-3 text-sm">{doc.sexe}</td>
                  <td className="py-4 px-3 text-sm">{doc.profession}</td>
                  <td className="py-4 px-3 text-sm">{doc.date_expiration}</td>
                  <td className="py-4 px-3 text-sm">{doc.date_enreg}</td>
                  <td className="py-4 px-3">
                    <div className="flex gap-2 justify-end">
                      <Link href="/form">
                        <button className="p-2 text-blue-900 hover:bg-blue-100 rounded-lg transition-colors">
                          <Eye className="w-5 h-5" />
                        </button>
                      </Link>
                      <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Aucun document trouvé
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-lg shadow-md transition-all font-medium"
          >
            <Download className="w-5 h-5" />
            Exporter
          </button>
        </div>
      </div>
    </div>
  );
}
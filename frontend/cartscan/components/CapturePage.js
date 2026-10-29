"use client";
import { apiFetch } from "@/lib/api";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload, RotateCcw, Mic, ScanLine, X } from "lucide-react";

export default function CapturePage() {
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [motifVisite, setMotifVisite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

  const handleFileUpload = async (file) => {
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Format non supporté. Utilisez JPEG ou PNG.");
      return;
    }
    setError(null);
    setLoading(true);
    setScanned(true);

    // Crée un aperçu de la photo capturée
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);

    try {
      const formData = new FormData();
      formData.append("file", file);

     const response = await apiFetch("/extract/scan", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.detail || "Erreur lors de l'extraction.");
        setLoading(false);
        setScanned(false);
        setPhotoPreview(null);
        return;
      }

      sessionStorage.setItem("extractedData", JSON.stringify(result.data));
      sessionStorage.setItem("motifVisite", motifVisite);
      sessionStorage.setItem("photoPreview", previewUrl);
      router.push("/form");

    } catch (err) {
      setError("Impossible de contacter le serveur.");
      setLoading(false);
      setScanned(false);
      setPhotoPreview(null);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleSpeech = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const r = new SR();
      r.lang = "fr-FR";
      r.onstart = () => setIsListening(true);
      r.onresult = (ev) => setMotifVisite((p) => p + " " + ev.results[0][0].transcript);
      r.onend = () => setIsListening(false);
      r.start();
    }
  };

  const handleReset = () => {
    setScanned(false);
    setError(null);
    setPhotoPreview(null);
  };

  return (
    <div className="p-3 sm:p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
        <span className="hover:text-blue-600 cursor-pointer" onClick={() => router.push("/dashboard")}>
          Tableau de bord
        </span>
        <span>›</span>
        <span className="text-gray-700 font-medium">Nouvelle Entrée</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* LEFT — Scanner */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-blue-600" />
              Scanner le Document
            </h2>
          </div>

          <div className="p-5">
            {/* Zone scan */}
            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-xl overflow-hidden border-2 cursor-pointer flex items-center justify-center
                ${isDragging ? "border-blue-400 bg-blue-50" :
                  scanned ? "border-green-400" : "border-dashed border-blue-300"}
                bg-[#f8faff]`}
              style={{ height: 280 }}
            >
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Extraction en cours...</p>
                </div>
              ) : scanned && photoPreview ? (
                <div className="w-full h-full relative">
                  <img
                    src={photoPreview}
                    alt="Document scanné"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500 rounded-tl m-2" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500 rounded-tr m-2" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500 rounded-bl m-2" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500 rounded-br m-2" />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-green-500/90 text-white text-xs px-3 py-1 rounded-full">
                    Document détecté ✓
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center p-6">
                  <div className="w-20 h-20 rounded-full bg-blue-50 border-4 border-blue-200 flex items-center justify-center">
                    <Camera className="w-9 h-9 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Glissez une image ou cliquez
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      JPEG ou PNG recommandé
                    </p>
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleInputChange}
                className="hidden"
              />
            </label>

            {/* Erreur */}
            {error && (
              <div className="mt-3 px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reprendre
              </button>
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                Importer une image
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Motif de visite */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              <label className={labelCls}>Motif de visite</label>
              <div className="flex gap-2">
                <textarea
                  value={motifVisite}
                  onChange={(e) => setMotifVisite(e.target.value)}
                  placeholder="Saisir le motif de visite..."
                  rows={2}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                />
                <button
                  onClick={handleSpeech}
                  className={`px-3 rounded-lg transition-colors flex items-center justify-center ${
                    isListening
                      ? "bg-red-500 text-white"
                      : "border border-gray-200 hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Informations Extraites</h2>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <ScanLine className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">
                Scannez un document pour voir les informations extraites
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
"use client";
import { useState } from "react";
import { Camera, Loader , List } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CapturePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const handleFileUpload = async (file) => {
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Format non supporté. Utilisez une image JPEG ou PNG.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/extract/scan", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.detail || "Erreur lors de l'extraction.");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("extractedData", JSON.stringify(result.data));
      router.push("/form");

    } catch (err) {
      setError("Impossible de contacter le serveur. Vérifiez que le backend tourne.");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative">
      <div className="flex flex-col items-center gap-8">

        <h1 className="text-3xl font-semibold text-blue-900">CniScan</h1>

       
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-64 h-64 rounded-full bg-gray-50 shadow-2xl transition-all flex items-center justify-center border-8 cursor-pointer
            ${isDragging
              ? "border-green-500 bg-green-50 scale-105"
              : "border-blue-900 hover:border-green-600"
            } group`}
        >
          {loading ? (
            <Loader className="w-32 h-32 text-blue-900 animate-spin" />
          ) : (
            <Camera className={`w-32 h-32 transition-colors ${
              isDragging ? "text-green-500" : "text-blue-900 group-hover:text-green-600"
            }`} />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleInputChange}
            className="hidden"
          />
        </label>

       
        <p className="text-gray-400 text-sm">
          Glissez une image ici ou cliquez pour sélectionner
        </p>

     
        {error && (
          <div className="px-6 py-3 bg-red-100 text-red-700 rounded-lg text-center max-w-sm">
            {error}
          </div>
        )}

       
        <div className="flex gap-4">
         
          <label className="px-16 py-5 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all text-2xl font-semibold cursor-pointer">
            {loading ? "Extraction en cours..." : "Ajouter"}
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleInputChange}
              className="hidden"
            />
          </label>

         
        </div>
        <Link href="/list">
  <button className="px-10 py-3 border-2 border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white rounded-xl transition-all font-semibold">
    Voir la liste
  </button>
</Link>
      </div>
    </div>
  );
}
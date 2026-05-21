"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, Mic } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FormPage() {

  const router = useRouter();

  const [formData, setFormData] = useState({
    nom:           "",
    prenom:        "",
    numDoc:        "",
    nationalite:   "",
    dateNaissance: "",
    lieuNaissance: "",
    sexe:          "",
    profession:    "",
    dateExpire:    "",
    dateEnreg:     new Date().toISOString().slice(0, 16).replace("T", " "),
  });

  const [motifVisite, setMotifVisite] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [editId, setEditId] = useState(null);

useEffect(() => {
    
    const editData = sessionStorage.getItem("editDocument");
    if (editData) {
      const doc = JSON.parse(editData);
      setEditId(doc.id);
      setFormData((prev) => ({
        ...prev,
        nom:           doc.nom || "",
        prenom:        doc.prenom || "",
        numDoc:        doc.numero_doc || "",
        nationalite:   doc.nationalite || "",
        dateNaissance: doc.date_naissance || "",
        lieuNaissance: doc.lieu_naissance || "",
        sexe:          doc.sexe || "",
        profession:    doc.profession || "",
        dateExpire:    doc.date_expiration || "",
        dateEnreg:     doc.date_enreg || "",
      }));
      sessionStorage.removeItem("editDocument");
      return;
    }

    const extractData = sessionStorage.getItem("extractedData");
    if (extractData) {
      const parsed = JSON.parse(extractData);
      setFormData((prev) => ({
        ...prev,
        nom:           parsed.nom || "",
        prenom:        parsed.prenom || "",
        numDoc:        parsed.numero_doc || "",
        nationalite:   parsed.nationalite || "",
        dateNaissance: parsed.date_naissance || "",
        lieuNaissance: parsed.lieu_naissance || "",
        sexe:          parsed.sexe || "",
        profession:    parsed.profession || "",
        dateExpire:    parsed.date_expiration || "",
      }));
    }
}, []);

  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSpeechToText = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "fr-FR";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMotifVisite(motifVisite + " " + transcript);
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      alert("La reconnaissance vocale n'est pas supportée par ce navigateur");
    }
  };

  const handleSave = async () => {
    const requiredFields = ["nom", "prenom", "numDoc", "nationalite",
      "dateNaissance", "lieuNaissance", "sexe", "profession",
      "dateExpire", "dateEnreg"];

    for (const field of requiredFields) {
      if (!formData[field]) {
        setSaveStatus("error");
        alert(`Le champ "${field}" est obligatoire.`);
        return;
      }
    }

    setSaving(true);
    setSaveStatus(null);

    try {
      const url = editId
        ? `http://localhost:8000/documents/${editId}`
        : "http://localhost:8000/documents/";
      
      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom:             formData.nom,
          prenom:          formData.prenom,
          numero_doc:      formData.numDoc,
          nationalite:     formData.nationalite,
          date_naissance:  formData.dateNaissance,
          lieu_naissance:  formData.lieuNaissance,
          sexe:            formData.sexe,
          profession:      formData.profession,
          date_delivrance: formData.dateDelivrance || "",
          date_expiration: formData.dateExpire,
          motif_visite:    motifVisite,
          date_enreg:      formData.dateEnreg,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSaveStatus("error");
        alert(result.detail || "Erreur lors de la sauvegarde.");
        setSaving(false);
        return;
      }

      setSaveStatus("success");
      setSaving(false);
      setTimeout(() => {
        router.push("/list");
      }, 1000);

    } catch (err) {
      setSaveStatus("error");
      alert("Impossible de contacter le serveur.");
      setSaving(false);
    }
};

  const fields = [
    { label: "NOM", name: "nom" },
    { label: "PRENOM", name: "prenom" },
    { label: "NUM.DOC", name: "numDoc" },
    { label: "NATIONALITE", name: "nationalite" },
    { label: "Date naissance", name: "dateNaissance" },
    { label: "Lieu Naissance", name: "lieuNaissance" },
    { label: "Sex", name: "sexe" },
    { label: "Profession", name: "profession" },
    { label: "Date.Expire", name: "dateExpire" },
  ];

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold text-blue-900">Extraction des données</h1>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 text-blue-900 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </Link>
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="grid grid-cols-2 gap-6 mb-6">

          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
              </label>
              <input
                type="text"
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none
                  ${formData[field.name]
                    ? "border-blue-900 bg-white"
                    : "border-orange-400 bg-gray-100"
                  }`}
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date.Enreg
            </label>
            <input
              type="text"
              value={formData.dateEnreg}
              readOnly
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 outline-none cursor-not-allowed"
            />
          </div>

        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motif de visite
          </label>
          <div className="flex gap-3">
            <textarea
              value={motifVisite}
              onChange={(e) => setMotifVisite(e.target.value)}
              placeholder="Saisir le motif de visite..."
              rows={4}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none resize-none"
            />
            <button
              onClick={handleSpeechToText}
              className={`px-6 py-3 rounded-lg shadow-md transition-all font-medium flex items-center gap-2 ${
                isListening
                  ? "bg-red-600 text-white"
                  : "bg-blue-900 hover:bg-blue-800 text-white"
              }`}
            >
              <Mic className="w-5 h-5" />
              {isListening ? "Écoute..." : "Vocal"}
            </button>
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <Link href="/">
            <button className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-all font-medium">
              Annuler
            </button>
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-8 py-3 rounded-lg shadow-md transition-all font-medium ${
              saveStatus === "success"
                ? "bg-green-500 text-white"
                : saveStatus === "error"
                ? "bg-red-600 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {saving ? "Sauvegarde..." : saveStatus === "success" ? "Sauvegardé ✓" : "Enregistrer"}
          </button>
        </div>

      </div>
    </div>
  );
}
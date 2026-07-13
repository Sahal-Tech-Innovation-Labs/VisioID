"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Mic, MicOff } from "lucide-react";
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
    typeDoc:       "",
    photoProfil:   "",
  });

  const [motifVisite, setMotifVisite] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [editId, setEditId] = useState(null);
  const [photo, setPhoto] = useState(null);

  // Refs pour piloter l'enregistrement audio (MediaRecorder)
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  useEffect(() => {
    // Aperçu de la pièce scannée (récupéré côté client uniquement)
    const storedPhoto = sessionStorage.getItem("photoPreview");
    if (storedPhoto) setPhoto(storedPhoto);

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
        typeDoc: doc.type_doc || "",
        photoProfil: doc.photo_profil || "",
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
        typeDoc: parsed.type_doc || "",
        photoProfil: parsed.photo_profil || "",
      }));
    }
  }, []);

  // Coupe le micro si l'utilisateur quitte la page en cours d'enregistrement
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      // webm/opus est bien supporté par Edge/Chrome et accepté par Groq
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        if (audioBlob.size === 0) {
          setIsTranscribing(false);
          return;
        }

        setIsTranscribing(true);
        try {
          const fd = new FormData();
          fd.append("file", audioBlob, "motif.webm");

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/extract/transcribe`, {
            method: "POST",
            body: fd,
          });
          const result = await response.json();

          if (response.ok && result.success && result.texte) {
            setMotifVisite((prev) => {
              const cleanPrev = prev.trim();
              return cleanPrev ? `${cleanPrev} ${result.texte}` : result.texte;
            });
          } else {
            alert(result.detail || "La transcription n'a rien retourné.");
          }
        } catch (err) {
          alert("Impossible de contacter le serveur de transcription.");
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        alert("Accès au microphone refusé. Vérifie les autorisations du navigateur.");
      } else {
        alert("Impossible d'accéder au microphone : " + err.message);
      }
      setIsListening(false);
    }
  };

  const handleSpeechToText = () => {
    if (isListening) {
      // Arrêt demandé : on coupe l'enregistrement, la transcription se lance dans onstop
      mediaRecorderRef.current?.stop();
      setIsListening(false);
    } else {
      startRecording();
    }
  };

  const handleSave = async () => {
    const requiredFields = ["nom", "prenom", "numDoc", "nationalite",
      "dateNaissance", "lieuNaissance", "sexe",
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
        ? `${process.env.NEXT_PUBLIC_API_URL}/documents/${editId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/documents/`;

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
          type_doc:        formData.typeDoc || "",
          photo_profil:    formData.photoProfil || null,
          date_enreg:      formData.dateEnreg,
          agent_login: JSON.parse(localStorage.getItem("user") || "{}").login || null,
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
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-semibold text-blue-900">
            Extraction des données
          </h1>
          {formData.typeDoc && (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              formData.typeDoc === "CNI"
                ? "bg-blue-100 text-blue-900"
                : "bg-green-100 text-green-700"
            }`}>
              {formData.typeDoc}
            </span>
          )}
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 text-blue-900 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </Link>
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8">

        {(photo || formData.photoProfil) && (
          <div className="mb-8 flex flex-wrap gap-6">
            {photo && (
              <div className="flex flex-col items-center">
                <span className="block text-sm font-medium text-gray-700 mb-2 self-start">
                  Pièce scannée
                </span>
                <img
                  src={photo}
                  alt="Aperçu de la pièce scannée"
                  className="max-h-64 w-auto rounded-lg border border-gray-200 shadow-sm object-contain bg-gray-50"
                />
              </div>
            )}
            {formData.photoProfil && (
              <div className="flex flex-col items-center">
                <span className="block text-sm font-medium text-gray-700 mb-2 self-start">
                  Photo profil
                </span>
                <img
                  src={formData.photoProfil}
                  alt="Photo de la personne"
                  className="max-h-64 w-auto rounded-lg border border-gray-200 shadow-sm object-contain bg-gray-50"
                />
              </div>
            )}
          </div>
        )}

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
            <div className="flex-1">
              <textarea
                value={motifVisite}
                onChange={(e) => setMotifVisite(e.target.value)}
                placeholder="Saisir le motif de visite..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none resize-none"
              />
              {isListening && (
                <p className="text-sm text-red-500 italic mt-1 min-h-[1.25rem]">
                  🎙️ Enregistrement en cours...
                </p>
              )}
              {isTranscribing && (
                <p className="text-sm text-gray-400 italic mt-1 min-h-[1.25rem]">
                  ⏳ Transcription en cours...
                </p>
              )}
            </div>
            <button
              onClick={handleSpeechToText}
              disabled={isTranscribing}
              className={`px-6 py-3 rounded-lg shadow-md transition-all font-medium flex items-center gap-2 self-start ${
                isListening
                  ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                  : "bg-blue-900 hover:bg-blue-800 text-white"
              } ${isTranscribing ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {isListening ? "Arrêter" : isTranscribing ? "Patiente..." : "Vocal"}
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
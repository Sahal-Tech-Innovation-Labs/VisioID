"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const PAYMENT_OPTIONS = [
  { id: "cash",       label: "Cash",         icon: "₣" },
  { id: "visa",       label: "Visa",         icon: "V" },
  { id: "mastercard", label: "Mastercard",   icon: "M" },
  { id: "amex",       label: "Amex",         icon: "A" },
  { id: "orange",     label: "Orange Money", icon: "O" },
];

function Field({ label, name, type = "text", value, onChange, placeholder, readOnly, span }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "7px", gridColumn: span ? "1 / -1" : undefined }}>
      <label htmlFor={name} style={{
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "11px", fontWeight: 600,
        letterSpacing: "0.12em", textTransform: "uppercase",
        color: focused ? "#B8925A" : "#5A5248", transition: "color 0.15s",
      }}>
        {label}
      </label>
      <div style={{
        position: "relative",
        borderBottom: `1px solid ${focused ? "#B8925A" : readOnly ? "#D4C9BC" : "#D0C8BC"}`,
        transition: "border-color 0.2s",
        backgroundColor: readOnly ? "rgba(184,146,90,0.06)" : "transparent",
      }}>
        <input
          id={name} name={name} type={type}
          value={value}
          readOnly={readOnly}
          placeholder={placeholder || ""}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", padding: "12px 0",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "16px", fontWeight: 500,
            color: readOnly ? "#5A5248" : "#000000",
            background: "transparent", border: "none", outline: "none",
            fontStyle: "normal",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}

const EMPTY = {
  nom: "", prenom: "", nationalite: "", profession: "",
  email: "", dateNaissance: "", lieuNaissance: "",
  venantDe: "", allantA: "",
  dateEntree: "", dateDepart: "",
  numeroPieceIdentite: "", motifVoyage: "",
  modePaiement: "", numeroChambre: "",
};


/*traduction*/

const TRANSLATIONS = {
  fr: {
    headerTitle: "Fiche d'arrivée",
    sectionTitle: "Enregistrement client",
    formTitle: "Fiche d'hôtel",
    formSubtitle: "Vos informations sont confidentielles et utilisées uniquement pour votre séjour.",
    scanTitle: "Scanner votre pièce d'identité",
    scanSubtitle: "CNI ou Passeport · Les champs sont remplis automatiquement",
    scanButton: "Scanner",
    scanning: "Analyse en cours…",
    scanError: "Scan échoué. Vérifiez la qualité de l'image.",
    scanServerError: "Impossible de contacter le serveur de scan.",
    sectionIdentite: "Identité",
    sectionVoyage: "Voyage",
    sectionSejour: "Séjour",
    nom: "Nom ",
    prenom: "Prénom",
    nationalite: "Nationalité",
    profession: "Profession",
    email: "Email / WhatsApp",
    dateNaissance: "Date de naissance",
    lieuNaissance: "Lieu de naissance",
    venantDe: "Venant de",
    allantA: "Allant à",
    dateEntree: "Date d'entrée",
    dateDepart: "Date de départ",
    numeroPiece: "N° Pièce d'identité / Passeport",
    motifVoyage: "Motif du voyage",
    modePaiement: "Mode de paiement",
    numeroChambre: "Chambre N°",
    numeroChambrePlaceholder: "Ex: 204",
    submit: "Terminer et envoyer",
  },
  en: {
    headerTitle: "Arrival Form",
    sectionTitle: "Guest Registration",
    formTitle: "Hotel Form",
    formSubtitle: "Your information is confidential and used only for your stay.",
    scanTitle: "Scan your ID document",
    scanSubtitle: "ID card or Passport · Fields are filled in automatically",
    scanButton: "Scan",
    scanning: "Scanning…",
    scanError: "Scan failed. Please check the image quality.",
    scanServerError: "Unable to reach the scan server.",
    sectionIdentite: "Identity",
    sectionVoyage: "Travel",
    sectionSejour: "Stay",
    nom: "Last Name",
    prenom: "First Name",
    nationalite: "Nationality",
    profession: "Occupation",
    email: "Email / WhatsApp",
    dateNaissance: "Date of Birth",
    lieuNaissance: "Place of Birth",
    venantDe: "Coming From",
    allantA: "Going To",
    dateEntree: "Check-in Date",
    dateDepart: "Check-out Date",
    numeroPiece: "ID / Passport Number",
    motifVoyage: "Purpose of Travel",
    modePaiement: "Payment Method",
    numeroChambre: "Room N°",
    numeroChambrePlaceholder: "e.g. 204",
    submit: "Submit",
  },
};


export default function HotelFormPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(EMPTY);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [lang, setLang] = useState("fr");
  const fileRef = useRef(null);
  const t = TRANSLATIONS[lang];

  const set = (key) => (val) => setFormData(prev => ({ ...prev, [key]: val }));


  const handleScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setScanError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/extract/scan`, {
        method: "POST", body: fd,
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setScanError("Scan échoué. Vérifiez la qualité de l'image.");
        return;
      }
      const d = result.data;
      setFormData(prev => ({
        ...prev,
        nom:           d.nom || prev.nom,
        prenom:        d.prenom || prev.prenom,
        nationalite:   d.nationalite || prev.nationalite,
        profession:    d.profession || prev.profession,
        dateNaissance: d.date_naissance || prev.dateNaissance,
        lieuNaissance: d.lieu_naissance || prev.lieuNaissance,
        numeroPieceIdentite: d.numero_doc || prev.numeroPieceIdentite,
      }));
    } catch {
      setScanError("Impossible de contacter le serveur de scan.");
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sessionStorage.setItem("hotelFormData", JSON.stringify(formData));
    router.push("/hotel/ConfirmPage");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F7F4EF", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Header */}
      <header style={{
        backgroundColor: "#100D0A",
        padding: "20px 48px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <a href="/hotel" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "18px", fontWeight: 400, color: "#FBF8F3" }}>
              Zind Naaba
            </span>
            <span style={{ fontSize: "9px", letterSpacing: "0.2em", color: "#B8925A", textTransform: "uppercase", marginTop: "2px" }}>
              Appart Hôtel
            </span>
          </div>
        </a>
        <span style={{ fontSize: "10px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.30)", textTransform: "uppercase" }}>
          Fiche d&apos;arrivée
        </span>

        <span style={{ fontSize: "10px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.30)", textTransform: "uppercase" }}>
  {t.headerTitle}
</span>
<button
  onClick={() => setLang(lang === "fr" ? "en" : "fr")}
  style={{
    fontSize: "11px", fontWeight: 600,
    color: "#B8925A", background: "transparent",
    border: "1px solid #B8925A", padding: "6px 14px",
    cursor: "pointer", letterSpacing: "0.1em",
  }}
>
  {lang === "fr" ? "EN" : "FR"}
</button>
      </header>

      {/* Body */}
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "clamp(32px, 5vw, 64px) 24px" }}>

        {/* Titre */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ width: "24px", height: "1px", backgroundColor: "#B8925A" }} />
            <span style={{ fontSize: "10px", letterSpacing: "0.2em", color: "#B8925A", textTransform: "uppercase" }}>
              {t.sectionTitle}
            </span>
          </div>
          <h1 style={{
            fontFamily: "Playfair Display, Georgia, serif",
            fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 400,
            color: "#100D0A", margin: "0 0 10px", lineHeight: 1.15,
          }}>
            {t.formTitle}
          </h1>
          <p style={{ fontSize: "13px", color: "#8C8378", fontWeight: 300, margin: 0, lineHeight: 1.6 }}>
            Vos informations sont confidentielles et utilisées uniquement pour votre séjour.
          </p>
        </div>

        {/* Scan */}
        <div style={{
          backgroundColor: "#1A1511",
          border: "1px solid rgba(184,146,90,0.25)",
          padding: "24px 28px",
          marginBottom: "36px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "16px",
        }}>
          <div>
            <p style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "15px", color: "#FBF8F3", margin: "0 0 4px" }}>
              Scanner votre pièce d&apos;identité
            </p>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.40)", margin: 0, fontWeight: 300 }}>
              CNI ou Passeport · Les champs sont remplis automatiquement
            </p>
            {scanError && (
              <p style={{ fontSize: "12px", color: "#E57373", margin: "8px 0 0" }}>{scanError}</p>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {scanning && (
              <span style={{ fontSize: "12px", color: "#B8925A" }}>Analyse en cours…</span>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={scanning}
              style={{
                fontSize: "11px", fontWeight: 500,
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: "#100D0A", backgroundColor: scanning ? "#8C7A62" : "#B8925A",
                border: "none", padding: "13px 28px",
                cursor: scanning ? "not-allowed" : "pointer",
              }}
            >
              {scanning ? "Scan…" : "Scanner"}
            </button>
            <input
              ref={fileRef} type="file"
              accept="image/jpeg,image/png"
              style={{ display: "none" }}
              onChange={handleScan}
            />
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <div style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E0D4",
            padding: "clamp(24px, 4vw, 44px)",
          }}>

            {/* Section Identité */}
           <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.15em", color: "#100D0A", textTransform: "uppercase", marginBottom: "20px" }}>
  Identité/Identity
</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px 32px", marginBottom: "36px" }}
              className="form-grid">
              <Field label={t.nom}       name="nom"          value={formData.nom}          onChange={set("nom")} />
              <Field label={t.prenom}           name="prenom"       value={formData.prenom}       onChange={set("prenom")} />
              <Field label={t.nationalite}      name="nationalite"  value={formData.nationalite}  onChange={set("nationalite")} />
              <Field label={t.profession}       name="profession"   value={formData.profession}   onChange={set("profession")} />
              <Field label={t.email} name="email"        value={formData.email}        onChange={set("email")} type="email" span />
              <Field label={t.dateNaissance} name="dateNaissance" value={formData.dateNaissance} onChange={set("dateNaissance")} type="date" />
              <Field label={t.lieuNaissance} name="lieuNaissance" value={formData.lieuNaissance} onChange={set("lieuNaissance")} />
            </div>

            {/* Séparateur */}
            <div style={{ borderTop: "1px solid #E8E0D4", marginBottom: "28px" }} />

            {/* Section Voyage */}
            <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.15em", color: "#100D0A", textTransform: "uppercase", marginBottom: "20px" }}>
          Voyage/Travel
        </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px 32px", marginBottom: "36px" }}>
              <Field label={t.venantDe}  name="venantDe" value={formData.venantDe} onChange={set("venantDe")} />
              <Field label={t.allantA}   name="allantA"  value={formData.allantA}  onChange={set("allantA")} />
              <Field label={t.dateEntree} name="dateEntree" value={formData.dateEntree} onChange={set("dateEntree")} type="date" />
              <Field label={t.dateDepart} name="dateDepart" value={formData.dateDepart} onChange={set("dateDepart")} type="date" />
              <Field label={t.numeroPieceIdentite} name="numeroPieceIdentite" value={formData.numeroPieceIdentite} onChange={set("numeroPieceIdentite")} span />
              <Field label={t.motifVoyage} name="motifVoyage" value={formData.motifVoyage} onChange={set("motifVoyage")} span />
            </div>

            {/* Séparateur */}
            <div style={{ borderTop: "1px solid #E8E0D4", marginBottom: "28px" }} />

            {/* Section Séjour */}
            <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.15em", color: "#100D0A", textTransform: "uppercase", marginBottom: "20px" }}>
  Séjour/Stay
</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px 32px", marginBottom: "36px" }}>
              {/* Mode de paiement */}
              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8C8378", marginBottom: "12px" }}>
                  Mode de paiement/Payment Method
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {PAYMENT_OPTIONS.map(opt => (
  <button
    key={opt.id} type="button"
    onClick={() => set("modePaiement")(opt.id)}
    style={{
      padding: "10px 18px",
      border: `1px solid ${formData.modePaiement === opt.id ? "#2E7D32" : "#D0C8BC"}`,
      backgroundColor: formData.modePaiement === opt.id ? "rgba(46,125,50,0.10)" : "transparent",
      color: formData.modePaiement === opt.id ? "#2E7D32" : "#6B6560",
      fontSize: "12px", fontWeight: 500, cursor: "pointer",
      transition: "all 0.15s",
    }}
  >
    {opt.label}
  </button>
))}
                </div>
              </div>

              {/* Chambre — réservé réception */}
              <Field
                  label={t.numeroChambre}
                  name="numeroChambre"
                  value={formData.numeroChambre}
                  onChange={set("numeroChambre")}
                  placeholder="Ex: 204"
              />
            </div>

            {/* Submit */}
            <div style={{ paddingTop: "28px", borderTop: "1px solid #E0D8CE", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                style={{
                  fontSize: "11px", fontWeight: 500,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  color: "#FBF8F3", backgroundColor: "#100D0A",
                  border: "1px solid #100D0A",
                  padding: "15px 52px", cursor: "pointer",
                  transition: "background-color 0.2s, border-color 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#B8925A";
                  e.currentTarget.style.borderColor = "#B8925A";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#100D0A";
                  e.currentTarget.style.borderColor = "#100D0A";
                }}
              >
                 {t.submit}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
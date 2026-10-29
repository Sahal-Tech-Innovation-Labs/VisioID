"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function fmt(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }); }
  catch { return d; }
}

export default function HotelConfirmationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("hotelFormData");
    if (!stored) { router.push("/hotel/FormPage"); return; }
    Promise.resolve().then(() => setFormData(JSON.parse(stored)));
  }, [router]);

  if (!formData) return null;

  const name = [formData.prenom, formData.nom].filter(Boolean).join(" ") || "—";

  const PAIEMENT_LABEL = {
    cash: "Cash", visa: "Visa", mastercard: "Mastercard", amex: "Amex", orange: "Orange Money",
  };

  const lignes = [
    { label: "Nom complet",       value: name },
    { label: "Nationalité",       value: formData.nationalite || "—" },
    { label: "Venant de",         value: formData.venantDe || "—" },
    { label: "Allant à",          value: formData.allantA || "—" },
    { label: "Date d'entrée",     value: fmt(formData.dateEntree) },
    { label: "Date de départ",    value: fmt(formData.dateDepart) },
    { label: "N° Pièce",          value: formData.numeroPieceIdentite || "—" },
    ...(formData.numeroChambre ? [{ label: "Chambre N°", value: formData.numeroChambre }] : []),
    ...(formData.motifVoyage ? [{ label: "Motif du voyage", value: formData.motifVoyage }] : []),
    ...(formData.modePaiement ? [{ label: "Paiement", value: PAIEMENT_LABEL[formData.modePaiement] || formData.modePaiement }] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F7F4EF", display: "flex", flexDirection: "column" }}>

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
        <span style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.40)",
        }}>
          Confirmation d&apos;enregistrement
        </span>
      </header>

      {/* Main */}
      <main style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "clamp(48px, 8vw, 96px) 32px",
      }}>
        <div style={{ width: "100%", maxWidth: "520px", textAlign: "center" }}>

          {/* Sceau */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "36px" }}>
            <div style={{
              width: "88px", height: "88px",
              border: "1px solid rgba(46,125,50,0.30)",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: "68px", height: "68px",
                backgroundColor: "rgba(46,125,50,0.08)",
                border: "1px solid #2E7D32",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="22" height="17" viewBox="0 0 24 19" fill="none" aria-label="Confirmé">
                  <path d="M1.5 9.5L8.5 16.5L22.5 2.5" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Titre */}
          <p style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase",
            color: "#B8925A", margin: "0 0 14px", fontWeight: 600,
          }}>
            Enregistrement confirmé
          </p>
          <h1 style={{
            fontFamily: "Playfair Display, Georgia, serif",
            fontWeight: 400, fontStyle: "italic",
            fontSize: "clamp(22px, 3vw, 32px)",
            color: "#100D0A", margin: "0 0 10px", lineHeight: 1.25,
          }}>
            Votre fiche a bien été enregistrée.
          </h1>
          <p style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "14px", color: "#6B6560",
            fontWeight: 400, margin: "0 0 40px", lineHeight: 1.6,
          }}>
            Merci, {name}. Nous vous attendons avec plaisir.
          </p>

          {/* Récap */}
          <div style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E0D4",
            padding: "28px 32px",
            marginBottom: "32px",
            textAlign: "left",
          }}>
            {lignes.map(({ label, value }, i) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "baseline", gap: "24px",
                padding: "11px 0",
                borderBottom: i < lignes.length - 1 ? "1px solid #EFE9DF" : "none",
              }}>
                <span style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: "11px", letterSpacing: "0.07em",
                  color: "#8C8378",
                }}>{label}</span>
                <span style={{
                  fontFamily: "Playfair Display, Georgia, serif",
                  fontSize: "14px", fontWeight: 500,
                  color: "#100D0A", textAlign: "right",
                }}>{value}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a
            href="/hotel"
            style={{
              display: "inline-block",
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "11px", fontWeight: 500,
              letterSpacing: "0.14em", textTransform: "uppercase",
              color: "#FBF8F3", backgroundColor: "#100D0A",
              border: "1px solid #100D0A", padding: "15px 44px",
              cursor: "pointer", textDecoration: "none",
              marginBottom: "24px",
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
            Retour à l&apos;accueil
          </a>

          <p style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "11px", color: "#A39A8C",
            lineHeight: 1.7, margin: 0,
          }}>
            Erreur sur votre fiche ? Contactez la réception :<br />
            <span style={{ color: "#6B6560" }}>+226 25 00 00 00</span>
          </p>
        </div>
      </main>
    </div>
  );
}
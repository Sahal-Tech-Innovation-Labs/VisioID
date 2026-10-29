"use client";

const HERO = "https://images.unsplash.com/photo-1698927100805-2a32718a7e05?w=1800&h=1200&fit=crop&auto=format&q=85";

export default function HotelHomePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#100D0A" }}>

      {/* Header */}
      <header style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "28px 48px",
      }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{
            fontFamily: "Playfair Display, Georgia, serif",
            fontSize: "20px", fontWeight: 400, color: "#FBF8F3", letterSpacing: "0.02em",
          }}>
            Zind Naaba
          </span>
          <span style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "9px", letterSpacing: "0.2em", color: "#B8925A", textTransform: "uppercase", marginTop: "2px",
          }}>
            Appart Hôtel
          </span>
        </div>
        <span style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "11px", letterSpacing: "0.14em",
          color: "rgba(255,255,255,0.40)", textTransform: "uppercase",
        }}>
          Ouagadougou · Burkina Faso
        </span>
      </header>

      {/* Hero */}
      <div style={{ position: "relative", flex: 1, minHeight: "100vh", overflow: "hidden" }}>
        <img
          src={HERO}
          alt="Suite Zind Naaba Appart Hôtel"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
        />
        {/* Overlays */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(16,13,10,0.82) 0%, rgba(16,13,10,0.30) 55%, rgba(16,13,10,0.08) 100%)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(16,13,10,0.65) 0%, transparent 50%)",
        }} />

        {/* Content */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "0 clamp(32px, 7vw, 112px)", paddingTop: "100px",
        }}>
          {/* Ornement */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
            <div style={{ width: "32px", height: "1px", backgroundColor: "#B8925A" }} />
            <span style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "10px", letterSpacing: "0.2em",
              color: "#B8925A", textTransform: "uppercase",
            }}>
              5 étoiles · Ouagadougou
            </span>
          </div>

          <h1 style={{
            fontFamily: "Playfair Display, Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(36px, 5.5vw, 72px)",
            lineHeight: 1.1, color: "#FBF8F3",
            margin: "0 0 20px", letterSpacing: "-0.01em", maxWidth: "620px",
          }}>
            Zind Naaba<br />
            <em style={{ fontStyle: "italic", fontWeight: 400, color: "#D4AB76" }}>Appart Hôtel</em>
          </h1>

          <p style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "clamp(14px, 1.4vw, 16px)",
            lineHeight: 1.75, color: "rgba(251,248,243,0.60)",
            margin: "0 0 48px", maxWidth: "380px", fontWeight: 300,
          }}>
            UNE EXPERIENCE OÙ CHAQUE DÉTAIL COMPTE !
          </p>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "14px" }}>
            <a
              href="/hotel/FormPage"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "12px", fontWeight: 500,
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: "#100D0A", backgroundColor: "#B8925A",
                border: "none", padding: "16px 44px",
                cursor: "pointer", textDecoration: "none",
                display: "inline-block",
                transition: "background-color 0.25s",
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#D4AB76")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#B8925A")}
            >
              Veillez remplir la fiche d&apos;arrivée
            </a>

          </div>
        </div>

        {/* Bottom strip */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          borderTop: "1px solid rgba(255,255,255,0.10)",
          padding: "20px 48px",
          display: "flex", flexWrap: "wrap", gap: "8px 40px", justifyContent: "flex-end",
        }}>
          {["Ouagadougou, Burkina Faso", "+226 25 00 00 00", "contact@zindnauba.com"].map(t => (
            <span key={t} style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "11px", color: "rgba(255,255,255,0.30)", letterSpacing: "0.03em",
            }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
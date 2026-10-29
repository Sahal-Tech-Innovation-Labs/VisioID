export default function manifest() {
  return {
    name: "CNIScan",
    short_name: "CNIScan",
    description: "Numérisation et gestion sécurisée des pièces d'identité",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0F1E3D",
    theme_color: "#0F1E3D",
    lang: "fr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
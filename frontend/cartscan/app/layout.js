import "./globals.css";
import Layout from "../components/layout";

export const metadata = {
  title: "CNIScan",
  description: "Système d'extraction de pièces d'identité",
  applicationName: "CNIScan",
  icons: {
    icon: "/icons/favicon-64.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "CNIScan",
    statusBarStyle: "default",
  },
};

export const viewport = {
  themeColor: "#0F1E3D",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <Layout>
          {children}
        </Layout>
      </body>
    </html>
  );
}
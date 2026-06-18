import "./globals.css";
import Layout from "../components/layout";

export const metadata = {
  title: "CniScan",
  description: "Système d'extraction de pièces d'identité",
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
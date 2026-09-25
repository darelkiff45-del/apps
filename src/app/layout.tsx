import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Créateur Digital AI — Crée et vends tes produits digitaux",
  description:
    "Ebooks, templates, sites vitrines, mockups, pages de vente et vidéos pub UGC générés par l'IA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;800&family=Playfair+Display:wght@700;900&family=Montserrat:wght@700;900&family=Bebas+Neue&family=Lora:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

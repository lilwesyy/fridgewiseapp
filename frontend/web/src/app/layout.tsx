import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MaintenanceWrapper from "@/components/MaintenanceWrapper";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FridgeWise - Trasforma i tuoi ingredienti in ricette deliziose",
  description: "Scansiona gli ingredienti nel tuo frigo e lascia che l'AI di FridgeWise crei ricette personalizzate per te. Zero sprechi, massimo sapore.",
  keywords: "ricette, AI, ingredienti, cucina, frigo, sostenibilità, app iOS",
  authors: [{ name: "FridgeWise Team" }],
  creator: "FridgeWise",
  publisher: "FridgeWise",
  openGraph: {
    title: "FridgeWise - La tua cucina intelligente",
    description: "Trasforma i tuoi ingredienti in ricette deliziose con l'intelligenza artificiale",
    url: "https://fridgewise.app",
    siteName: "FridgeWise",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "FridgeWise App",
      },
    ],
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FridgeWise - La tua cucina intelligente",
    description: "Trasforma i tuoi ingredienti in ricette deliziose con l'AI",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  other: {
    'google-analytics': 'G-XXXXXXXXXX', // Sostituisci con il tuo GA ID
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        <MaintenanceWrapper>
          {children}
        </MaintenanceWrapper>
      </body>
    </html>
  );
}

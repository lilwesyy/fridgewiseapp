import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import MaintenanceWrapper from "@/components/MaintenanceWrapper";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { getServerTranslations, Language } from "@/lib/i18n";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

async function detectLanguageFromHeaders(): Promise<Language> {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';

  // Check if Italian is preferred
  if (acceptLanguage.toLowerCase().includes('it')) {
    return 'it';
  }

  // Default to English
  return 'en';
}

export async function generateMetadata(): Promise<Metadata> {
  const language = await detectLanguageFromHeaders();
  const t = getServerTranslations(language);
  const isItalian = language === 'it';

  return {
    metadataBase: new URL('https://fridgewiseai.com'),
    title: t.meta.title,
    description: t.meta.description,
    keywords: t.meta.keywords,
    authors: [{ name: "FridgeWiseAI Team" }],
    creator: "FridgeWiseAI",
    publisher: "FridgeWiseAI Inc.",
    applicationName: "FridgeWiseAI",
    generator: "Next.js",
    referrer: "origin-when-cross-origin",
    icons: {
      icon: [
        { url: "/assets/icon.png", sizes: "any", type: "image/png" },
        { url: "/assets/icon.png", sizes: "32x32", type: "image/png" },
        { url: "/assets/logo.svg", type: "image/svg+xml" },
      ],
      apple: [
        { url: "/assets/icon.png", sizes: "180x180", type: "image/png" },
      ],
      shortcut: "/assets/icon.png",
    },
    manifest: "/manifest.json",
    openGraph: {
      title: t.meta.ogTitle,
      description: t.meta.ogDescription,
      url: "https://fridgewiseai.com",
      siteName: "FridgeWiseAI",
      images: [
        {
          url: "/assets/screenshots_ita/home.png",
          width: 1200,
          height: 630,
          alt: t.meta.ogImageAlt,
        },
      ],
      locale: isItalian ? "it_IT" : "en_US",
      type: "website",
      countryName: isItalian ? "Italy" : "United States",
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.twitterTitle,
      description: t.meta.twitterDescription,
      images: ["/assets/screenshots_ita/home.png"],
      creator: "@fridgewise",
      site: "@fridgewise",
    },
    robots: {
      index: true,
      follow: true,
      noarchive: false,
      nosnippet: false,
      noimageindex: false,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: "https://fridgewiseai.com",
      languages: {
        "it-IT": "https://fridgewiseai.com",
        "en-US": "https://fridgewiseai.com/en",
      },
    },
    category: "food & drink",
    classification: "Mobile App Landing Page",
    other: {
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "apple-mobile-web-app-title": t.meta.appleMobileWebAppTitle,
      "mobile-web-app-capable": "yes",
      "msapplication-TileColor": "#16A34A",
      "msapplication-config": "/browserconfig.xml",
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  colorScheme: "light",
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = await detectLanguageFromHeaders();

  return (
    <html lang={language === 'it' ? 'it' : 'en'} className="scroll-smooth">
      <head>
        <link rel="icon" href="/assets/icon.png" type="image/png" />
        <link rel="icon" href="/assets/icon.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/assets/logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/assets/icon.png" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <LanguageProvider>
          <MaintenanceWrapper>
            {children}
          </MaintenanceWrapper>
        </LanguageProvider>
      </body>
    </html>
  );
}

import { Providers } from "@/components/landing/providers";
import { getDictionary } from "@/lib/dictionary";
import { roboto } from "@/lib/fonts";
import { getDictionary as getSharedDictionary } from "@workspace/ui/lib/dictionary";
import { type Locale, i18n } from "@workspace/ui/lib/i18n.config";
import "@workspace/ui/styles/globals.css";
import { type Metadata } from "next";
import { headers } from "next/headers";

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export const metadata: Metadata = {
  applicationName: "Cloudbot",
  title: {
    default: "Cloudbot",
    template: "%s - Cloudbot",
  },
  description:
    "Cloudbot is a chatbot framework that can easily be hosted on Cloudflare.",
  keywords: ["cloudbot", "chatbot"],
  robots: {
    index: true,
    follow: true,
    googleBot: "index, follow",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: "/",
    languages: {
      de: "/de",
      en: "/en",
    },
  },
  // openGraph: {
  //   siteName: "NextGpt",
  //   type: "website",
  //   images: [{ url: "/en/opengraph-image.png" }],
  // },
  // twitter: {
  //   images: [{ url: "/en/twitter-image.png" }],
  // },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const lang = (await params).lang as Locale;
  const dictionary = await getDictionary(lang);
  const sharedDictionary = await getSharedDictionary(lang);
  const nonce = (await headers()).get("x-nonce") || "";

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={`${roboto.variable} antialiased`}>
        <Providers
          sharedTranslations={sharedDictionary}
          dashboardTranslations={dictionary}
          locale={lang}
          attribute="class"
          defaultTheme="system"
          enableSystem
          nonce={nonce}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Astro E-commerce - Mobile First Shopping",
  description: "Modern e-commerce platform optimized for mobile shopping with Cash on Delivery",
  keywords: ["e-commerce", "mobile shopping", "Nepal", "COD", "online store"],
  authors: [{ name: "Astro E-commerce Team" }],
  creator: "Astro E-commerce",
  publisher: "Astro E-commerce",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "Astro E-commerce - Mobile First Shopping",
    description: "Modern e-commerce platform optimized for mobile shopping with Cash on Delivery",
    url: "/",
    siteName: "Astro E-commerce",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Astro E-commerce - Mobile First Shopping",
    description: "Modern e-commerce platform optimized for mobile shopping with Cash on Delivery",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Astro E-commerce" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${inter.variable} antialiased touch-manipulation font-light`}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
   
            <div className="flex-1">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}

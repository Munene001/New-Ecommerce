// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Poppins, Plus_Jakarta_Sans, Lora, Inter } from "next/font/google";
import './globals.css';
import { AuthProvider } from "@/context/authcontext";

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  display: 'swap',
  weight: ["400", "500", "600", "700"],
  variable: "--font-lora",
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    template: '%s', // Changed from '%s | PaziaTech' so children retain complete control
    default: 'PaziaTech',
  },
  description: "Launch an online shop, receive payments",
  // Removed global applicationName & authors to prevent brand leakage across white-labeled subdomains
  generator: "Next.js",
  keywords: ["ecommerce", "online shop", "payments", "selling online"],
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "PaziaTech",
    description: "Launch an online shop, receive payments",
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: "PaziaTech",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PaziaTech - Launch an online shop',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PaziaTech',
    description: 'Launch an online shop, receive payments',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      className={`${poppins.variable} ${jakarta.variable} ${inter.variable} ${lora.variable}`} 
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light" />
        <meta name="darkreader-lock" content="yes" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        
        {/* Note: If manifest.json contains "name": "PaziaTech", remove it or make it dynamic per domain */}
        
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'} />
      </head>
      <body className="min-h-screen bg-white antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
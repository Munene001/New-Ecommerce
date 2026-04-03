// app/layout.tsx
import type { Metadata } from "next";
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
  title: "PaziaTech",
  description: "Launch an online, shop receive payments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    
    <html lang="en" className={`${poppins.variable} ${jakarta.variable} ${inter.variable} ${lora.variable}`} suppressHydrationWarning>
      <body className="min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
} 

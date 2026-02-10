// app/layout.tsx
import type { Metadata } from "next";
import { Poppins, Plus_Jakarta_Sans } from "next/font/google";
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
})

export const metadata: Metadata = {
  title: "Thamani Tech",
  description: "Launch an online, shop receive payments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${jakarta.variable}`}>
      <body className="min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
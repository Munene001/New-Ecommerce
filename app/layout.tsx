

// app/layout.tsx
import type { Metadata } from "next";
import { Poppins, Plus_Jakarta_Sans } from "next/font/google";
import Header from "./components/layout/header";
import './globals.css';
import { AuthProvider } from "@/context/authcontext"; // Import AuthProvider

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
  title: "Valuer Report Generator",
  description: "Professional property survey reports for Kenyan valuers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable}`}>
        <AuthProvider> {/* Wrap with AuthProvider */}
          <Header/>
          <main className="font-poppins 
            antialiased
            md:bg-[url('/assets/hex3.svg')] bg-[url('/assets/mazehex4.svg')] bg-black
            bg-repeat
            min-h-screen">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
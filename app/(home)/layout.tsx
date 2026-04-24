
import HomeHeader from "../components/layout/homeHeader";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
    <HomeHeader/>
      <main className="font-poppins 
        md:antialiased subpixel-antialiased
        md:bg-[url('/assets/hex3.svg')] bg-[url('/assets/mazehex4.svg')] bg-black
        bg-repeat
        min-h-screen">
        {children}
      </main>
    </>
  );
}
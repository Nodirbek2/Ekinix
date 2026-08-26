import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Ekinix — O'zbekiston Dehqonlari Uchun Aqlli Agro Platforma",
  description: "Sun'iy yo'ldosh orqali hosil holatini kuzatish, oqilona sug'orish tavsiyalari va hosilni vositachisiz to'g'ridan-to'g'ri sotish platformasi.",
  keywords: ["Ekinix", "O'zbekiston dehqonchilik", "agro platforma", "sun'iy yo'ldosh NDVI", "sug'orish rejalari", "hosil bozori"],
  openGraph: {
    title: "Ekinix — Aqlli Agro Platforma",
    description: "O'zbekiston dehqonlari uchun sun'iy yo'ldosh va sug'orish yordamchisi.",
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" className="scroll-smooth">
      <head />
      <body className="bg-[#F8FAFC] text-slate-900 antialiased min-h-screen flex flex-col selection:bg-[#164E35] selection:text-white">
        {children}
      </body>
    </html>
  );
}

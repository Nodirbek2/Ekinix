import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={metadataBase:new URL('https://ekinix.vercel.app'),title:'Ekinix — Dalangiz uchun aqlli monitoring',description:'Sun’iy yo‘ldosh kuzatuvlari, ob-havo, tuproq namligi va sug‘orish qaydlari — bitta platformada.',openGraph:{title:'Ekinix — Know your field',description:'Field observations, soil measurements, and irrigation planning.',type:'website'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="uz"><body>{children}</body></html>}

'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="boot"><h1>Ekinix</h1><p>Sahifani yuklab bo‘lmadi. / Could not load the page.</p><button className="button primary" onClick={reset}>Qayta urinish / Retry</button></main>}

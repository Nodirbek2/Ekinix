"use client";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  ArrowUpRight,
  CloudSun,
  Layers,
  Satellite,
  Sprout,
} from "lucide-react";
import { pick, type Lang } from "@/lib/domain";
import { demoFields } from "@/lib/workspace";
const PortfolioMap = dynamic(() => import("./PortfolioMap"), {
  ssr: false,
  loading: () => <div className="map-skeleton" />,
});
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-icon">
        <Sprout size={23} />
      </span>
      ekinix<span className="brand-dot">.</span>
    </span>
  );
}
export function LanguagePicker({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
  return (
    <select
      className="language-picker"
      aria-label="Language / Til / Язык"
      value={lang}
      onChange={(e) => onChange(e.target.value as Lang)}
    >
      <option value="uz">UZ</option>
      <option value="ru">RU</option>
      <option value="en">EN</option>
    </select>
  );
}
export function Landing({
  lang,
  onLanguage,
  onAuth,
  onDemo,
  onPrivacy,
}: {
  lang: Lang;
  onLanguage: (l: Lang) => void;
  onAuth: (mode: "login" | "register") => void;
  onDemo: () => void;
  onPrivacy: () => void;
}) {
  return (
    <div className="landing compact-landing">
      <header className="public-header">
        <Brand />
        <nav>
          <LanguagePicker lang={lang} onChange={onLanguage} />
          <button className="button secondary" onClick={() => onAuth("login")}>
            {pick(lang, "Kirish", "Войти", "Sign in")}
            <ArrowUpRight size={15} />
          </button>
        </nav>
      </header>
      <main className="welcome-main">
        <section className="welcome-hero">
          <div className="welcome-copy">
            <span className="welcome-badge">
              <Sprout size={14} />
              {pick(
                lang,
                "O‘zbekiston fermerlari uchun",
                "Для фермеров Узбекистана",
                "For Uzbekistan’s farmers",
              )}
            </span>
            <h1>
              {pick(
                lang,
                "Dalani kuzating.",
                "Следите за полем.",
                "Know your field.",
              )}
              <br />
              <span>
                {pick(
                  lang,
                  "Sug‘orishni rejalang.",
                  "Планируйте полив.",
                  "Plan your irrigation.",
                )}
              </span>
            </h1>
            <p>
              {pick(
                lang,
                "Ob-havo, sun’iy yo‘ldosh kuzatuvlari va ekin tahlili — dalangiz uchun bitta qulay platformada.",
                "Погода, спутниковые наблюдения и анализ растений — в одной удобной платформе.",
                "Weather, satellite observations and crop analysis, together in one field workspace.",
              )}
            </p>
            <div className="welcome-features">
              <span>
                <Satellite size={17} />
                {pick(
                  lang,
                  "NDVI kuzatuvi",
                  "Мониторинг NDVI",
                  "NDVI monitoring",
                )}
              </span>
              <span>
                <CloudSun size={17} />
                {pick(
                  lang,
                  "Sug‘orish rejasi",
                  "План полива",
                  "Irrigation planning",
                )}
              </span>
              <span>
                <Sprout size={17} />
                {pick(
                  lang,
                  "Rasm orqali AI tahlili",
                  "ИИ-анализ фото",
                  "AI photo analysis",
                )}
              </span>
            </div>
            <div className="welcome-actions">
              <button
                className="button primary"
                onClick={() => onAuth("register")}
              >
                {pick(
                  lang,
                  "Hisob yaratish",
                  "Создать аккаунт",
                  "Create account",
                )}
                <ArrowRight size={17} />
              </button>
              <button className="button secondary" onClick={onDemo}>
                {pick(
                  lang,
                  "Platformani ko‘rish",
                  "Посмотреть платформу",
                  "Explore the platform",
                )}
              </button>
            </div>
            <small className="welcome-note">
              {pick(
                lang,
                "Avval namuna fermasida sinab ko‘rishingiz mumkin.",
                "Сначала можно посмотреть пример хозяйства.",
                "Explore a sample farm before signing up.",
              )}
            </small>
          </div>
          <div className="welcome-preview">
            <div className="welcome-preview-head">
              <span>
                <Layers size={16} />
                {pick(
                  lang,
                  "Dalalaringiz — bir xaritada",
                  "Ваши поля на одной карте",
                  "Your fields on one map",
                )}
              </span>
              <small>DEMO</small>
            </div>
            <PortfolioMap fields={demoFields} lang={lang} />
            <div className="welcome-preview-foot">
              <span>
                <i />
                {pick(
                  lang,
                  "Namuna fermasi",
                  "Пример хозяйства",
                  "Sample farm",
                )}
              </span>
              <span>Sentinel-2 · Open-Meteo</span>
            </div>
          </div>
        </section>
        <div className="welcome-steps">
          {[
            pick(lang, "Dalani belgilang", "Отметьте поле", "Draw your field"),
            pick(
              lang,
              "Ekin va fazani kiriting",
              "Укажите культуру и фазу",
              "Set crop and phase",
            ),
            pick(
              lang,
              "Kuzatuv va rejani ko‘ring",
              "Изучайте данные и план",
              "See observations and plan",
            ),
          ].map((step, i) => (
            <div key={i}>
              <b>0{i + 1}</b>
              <span>{step}</span>
              {i < 2 && <ArrowRight size={15} />}
            </div>
          ))}
        </div>
      </main>
      <footer className="public-footer">
        <span>© 2026 Ekinix</span>
        <button className="text-button" onClick={onPrivacy}>
          {pick(lang, "Maxfiylik", "Конфиденциальность", "Privacy")}
        </button>
      </footer>
    </div>
  );
}

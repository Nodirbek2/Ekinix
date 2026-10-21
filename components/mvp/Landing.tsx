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
    <div className="landing">
      <header className="public-header">
        <Brand />
        <nav>
          <LanguagePicker lang={lang} onChange={onLanguage} />
          <button className="text-button" onClick={() => onAuth("login")}>
            {pick(lang, "Kirish", "Войти", "Sign in")}
          </button>
          <button className="button primary" onClick={() => onAuth("register")}>
            {pick(lang, "Boshlash", "Начать", "Get started")}
            <ArrowUpRight size={15} />
          </button>
        </nav>
      </header>
      <main className="landing-main">
        <section className="landing-hero">
          <div>
            <div className="eyebrow">
              EKINIX /{" "}
              {pick(
                lang,
                "RAQAMLI DALA BOSHQARUVI",
                "ЦИФРОВОЕ УПРАВЛЕНИЕ ПОЛЯМИ",
                "DIGITAL FIELD OPERATIONS",
              )}
            </div>
            <h1>
              {pick(lang, "Dalalaringizni", "Ваши поля.", "Your fields.")}
              <br />
              <span>
                {pick(
                  lang,
                  "to‘liq ko‘ring.",
                  "Полная картина.",
                  "The complete picture.",
                )}
              </span>
            </h1>
            <p>
              {pick(
                lang,
                "Sun’iy yo‘ldosh kuzatuvlari, ob-havo va dala ishlari uchun yagona ish maydoni. Har bir dalaning tarixini ko‘ring va mavsumni ma’lumot asosida boshqaring.",
                "Единая рабочая область для спутниковых наблюдений, погоды и полевых работ. История каждого поля и управление сезоном на основе данных.",
                "A single workspace for satellite observations, weather, and field activity. See the history of every field and manage the season with evidence.",
              )}
            </p>
            <div className="hero-actions">
              <button
                className="button primary"
                onClick={() => onAuth("register")}
              >
                {pick(
                  lang,
                  "Fermamni qo‘shish",
                  "Добавить хозяйство",
                  "Add my farm",
                )}
                <ArrowRight size={16} />
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
            <div className="hero-facts">
              <span>Sentinel-2</span>
              <i />
              <span>Open-Meteo</span>
              <i />
              <span>
                {pick(
                  lang,
                  "O‘zbekiston uchun",
                  "Для Узбекистана",
                  "Built for Uzbekistan",
                )}
              </span>
            </div>
          </div>
          <div className="landing-product">
            <div className="product-window-bar">
              <span>
                <i />
                <i />
                <i />
              </span>
              <strong>
                ekinix /{" "}
                {pick(
                  lang,
                  "Ferma markazi",
                  "Центр хозяйства",
                  "Farm overview",
                )}
              </strong>
              <small>DEMO</small>
            </div>
            <PortfolioMap fields={demoFields} lang={lang} />
            <div className="product-window-stats">
              <div>
                <small>{pick(lang, "DALALAR", "ПОЛЯ", "FIELDS")}</small>
                <strong>03</strong>
              </div>
              <div>
                <small>{pick(lang, "MAYDON", "ПЛОЩАДЬ", "AREA")}</small>
                <strong>
                  24.2 <em>ha</em>
                </strong>
              </div>
              <div>
                <small>{pick(lang, "MA’LUMOTLAR", "ДАННЫЕ", "DATA")}</small>
                <strong>{pick(lang, "Namuna", "Пример", "Example")}</strong>
              </div>
            </div>
          </div>
        </section>
        <section className="landing-capabilities">
          {[
            {
              icon: Layers,
              n: "01",
              title: pick(
                lang,
                "Dalalar reyestri",
                "Реестр полей",
                "Field register",
              ),
              text: pick(
                lang,
                "Chegarani chizing, ekin va mavsumni belgilang. Xarita va ro‘yxat orasida ishlang.",
                "Нарисуйте границы, укажите культуру и сезон. Работайте с картой и списком.",
                "Draw boundaries, set the crop and season. Work between the map and field list.",
              ),
            },
            {
              icon: Satellite,
              n: "02",
              title: pick(
                lang,
                "Vegetatsiya monitoringi",
                "Мониторинг растительности",
                "Vegetation monitoring",
              ),
              text: pick(
                lang,
                "NDVI tarixini surat sanasi va yaroqlilik darajasi bilan ko‘ring.",
                "Смотрите историю NDVI с датой и качеством наблюдения.",
                "Read NDVI history with acquisition dates and observation quality.",
              ),
            },
            {
              icon: CloudSun,
              n: "03",
              title: pick(
                lang,
                "Dala ishlarini rejalash",
                "Планирование работ",
                "Field planning",
              ),
              text: pick(
                lang,
                "7 kunlik prognoz, sug‘orish jurnali va yuklab olinadigan hisobotlar.",
                "Прогноз на 7 дней, журнал полива и выгрузка отчётов.",
                "Seven-day forecasts, irrigation records, and downloadable reports.",
              ),
            },
          ].map((r) => (
            <article key={r.n}>
              <span>{r.n}</span>
              <r.icon size={24} />
              <h2>{r.title}</h2>
              <p>{r.text}</p>
            </article>
          ))}
        </section>
        <section className="landing-close">
          <span className="eyebrow">
            {pick(
              lang,
              "O‘LCHOVDAN QARORGA",
              "ОТ НАБЛЮДЕНИЯ К РЕШЕНИЮ",
              "FROM OBSERVATION TO ACTION",
            )}
          </span>
          <h2>
            {pick(
              lang,
              "Har bir dala — o‘z tarixi bilan.",
              "У каждого поля своя история.",
              "Every field has a story.",
            )}
          </h2>
          <p>
            {pick(
              lang,
              "Yo‘q ma’lumotni to‘ldirmaymiz. Manba, sana va taxminlar ochiq ko‘rsatiladi.",
              "Не подменяем отсутствующие данные. Источники, даты и оценки обозначены явно.",
              "We do not fill gaps with invented values. Sources, dates, and estimates are shown clearly.",
            )}
          </p>
          <button className="button secondary" onClick={onDemo}>
            {pick(
              lang,
              "Ish maydonini ochish",
              "Открыть рабочую область",
              "Open the workspace",
            )}
            <ArrowRight size={15} />
          </button>
        </section>
      </main>
      <footer className="public-footer">
        <Brand />
        <span>© 2026 Ekinix</span>
        <button className="text-button" onClick={onPrivacy}>
          {pick(lang, "Maxfiylik", "Конфиденциальность", "Privacy")}
        </button>
      </footer>
    </div>
  );
}

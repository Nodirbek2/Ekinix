"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  BookOpen,
  ChevronRight,
  CloudSun,
  Droplets,
  FileBarChart2,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  Satellite,
  Settings2,
  X,
} from "lucide-react";
import { supabase, requireClient } from "@/lib/supabase";
import { pick, type Field, type Lang, type Profile } from "@/lib/domain";
import { demoFields, sectionName, type Section } from "@/lib/workspace";
import { t } from "@/lib/copy";
import { AuthPanel } from "./AuthPanel";
import { FieldForm } from "./FieldForm";
import { RecordForm } from "./RecordForm";
import { Busy, ErrorNotice, Modal } from "./ui";
import { Landing, Brand, LanguagePicker } from "./Landing";
import {
  FarmOverview,
  FieldsView,
  SatelliteView,
  WeatherView,
  JournalView,
  ReportsView,
  type ViewProps,
} from "./WorkspaceViews";
import { GuideView, IrrigationPlanView } from "./AgronomyViews";
import { SettingsView } from "./SettingsView";
import { FieldDetail } from "./FieldDetail";
import { useFarmData } from "./useFarmData";
const nav = [
  { id: "overview", icon: LayoutDashboard },
  { id: "fields", icon: Layers },
  { id: "satellite", icon: Satellite },
  { id: "weather", icon: CloudSun },
  { id: "planning", icon: Droplets },
  { id: "irrigation", icon: BookOpen },
  { id: "reports", icon: FileBarChart2 },
  { id: "guide", icon: BookOpen },
] as const;
const demoProfile: Profile = {
  id: "demo",
  user_id: "demo",
  full_name: "Aziz Karimov",
  phone: null,
  region: "Toshkent viloyati",
};
export default function EkinixApp() {
  const currentUser = useRef<string | null>(null);
  const [lang, setLang] = useState<Lang>("uz"),
    [user, setUser] = useState<User | null>(null),
    [sessionReady, setSessionReady] = useState(false),
    [profile, setProfile] = useState<Profile | null>(null),
    [fields, setFields] = useState<Field[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [auth, setAuth] = useState<"login" | "register" | "recovery" | null>(null),
    [tab, setTab] = useState<Section>("overview"),
    [selected, setSelected] = useState<string | null>(null),
    [planField, setPlanField] = useState<string | null>(null),
    [fieldForm, setFieldForm] = useState<Field | "new" | null>(null),
    [demo, setDemo] = useState(false),
    [privacy, setPrivacy] = useState(false);
  useEffect(() => {
    const savedLang = localStorage.getItem("ekinix-language");
    if (savedLang === "uz" || savedLang === "ru" || savedLang === "en")
      queueMicrotask(() => setLang(savedLang));
    // Remove retired, account-unscoped caches. Supabase owns all private data now.
    Object.keys(localStorage)
      .filter((k) => k.startsWith("ekinix_"))
      .forEach((k) => localStorage.removeItem(k));
    const client = supabase;
    if (!client) {
      queueMicrotask(() => {
        setSessionReady(true);
        setLoading(false);
      });
      return;
    }
    let alive = true;
    client.auth.getSession().then(({ data, error }) => {
      if (alive) {
        currentUser.current = data.session?.user.id ?? null;
        setUser(data.session?.user ?? null);
        setSessionReady(true);
        if (error) setError("session_expired");
      }
    });
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (alive) {
        if (currentUser.current !== (session?.user.id ?? null)) {
          setProfile(null);
          setFields([]);
          setSelected(null);
          setFieldForm(null);
          setLoading(true);
        }
        currentUser.current = session?.user.id ?? null;
        setUser(session?.user ?? null);
        setSessionReady(true);
        if (event === "PASSWORD_RECOVERY") setAuth("recovery");
        if (event === "SIGNED_OUT") {
          setProfile(null);
          setFields([]);
          setSelected(null);
        }
      }
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem("ekinix-language", lang);
  }, [lang]);
  const load = useCallback(async () => {
    if (!user) return;
    const client = requireClient();
    let { data: p, error: e } = await client
      .from("farmers")
      .select("id,user_id,full_name,phone,region")
      .eq("user_id", user.id)
      .maybeSingle();
    if (e) throw e;
    if (!p) {
      const { data: created, error: insertError } = await client
        .from("farmers")
        .insert({
          user_id: user.id,
          full_name: String(
            user.user_metadata.full_name ??
              user.email?.split("@")[0] ??
              "Farmer",
          ).slice(0, 100),
          phone: null,
          region: String(user.user_metadata.region ?? "Toshkent viloyati"),
        })
        .select("id,user_id,full_name,phone,region")
        .single();
      if (insertError) {
        const again = await client
          .from("farmers")
          .select("id,user_id,full_name,phone,region")
          .eq("user_id", user.id)
          .single();
        if (again.error) throw again.error;
        p = again.data;
      } else p = created;
    }
    const { data, error } = await client
      .from("fields")
      .select("*")
      .eq("farmer_id", p!.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (currentUser.current !== user.id) return;
    setProfile(p as Profile);
    setFields((data ?? []) as Field[]);
    setError("");
    setLoading(false);
  }, [user]);
  useEffect(() => {
    if (user) {
      let alive = true;
      Promise.resolve()
        .then(() => {
          if (alive) return load();
        })
        .catch(() => {
          if (alive) {
            setError("database_error");
            setLoading(false);
          }
        });
      return () => {
        alive = false;
      };
    }
  }, [user, load]);
  const [mobile, setMobile] = useState(false),
    [record, setRecord] = useState<Field | null>(null);
  const active = useMemo(
    () => (demo ? demoFields : fields.filter((f) => !f.archived_at)),
    [fields, demo],
  );
  const farm = useFarmData(active, demo, user?.id ?? "");
  const shownProfile = demo ? demoProfile : profile;
  function navigate(section: Section) {
    setTab(section);
    setSelected(null);
    setMobile(false);
    window.scrollTo({ top: 0 });
  }
  function openField(id: string) {
    setSelected(id);
    setMobile(false);
    void farm.loadField(id);
    window.scrollTo({ top: 0 });
  }
  const chosen = active.find((f) => f.id === selected);
  const openAuth = (mode: "login" | "register") => {
    setDemo(false);
    setAuth(mode);
  };
  async function logout() {
    if (demo) {
      setDemo(false);
      setSelected(null);
      setTab("overview");
      return;
    }
    try {
      const { error } = await requireClient().auth.signOut();
      if (error) throw error;
      setProfile(null);
      setFields([]);
      setSelected(null);
      setTab("overview");
    } catch {
      setError("request_failed");
    }
  }
  async function archive(field: Field) {
    if (demo) return;
    setError("");
    try {
      const { error } = await requireClient()
        .from("fields")
        .update({
          archived_at: field.archived_at ? null : new Date().toISOString(),
        })
        .eq("id", field.id)
        .select("id")
        .single();
      if (error) throw error;
      await load();
    } catch {
      setError("request_failed");
    }
  }
  const view: ViewProps = {
    fields: active,
    data: farm.data,
    water: farm.water,
    lang,
    demo,
    busy: farm.busy,
    onOpen: openField,
    onAdd: () => setFieldForm("new"),
    onEdit: setFieldForm,
    onArchive: archive,
    onRecord: setRecord,
    onNavigate: navigate,
    onLoad: (id) => {
      void farm.loadField(id);
    },
  };
  return (
    <>
      {!sessionReady ? (
        <div className="boot">
          <Brand />
          <Busy label={t(lang, "loading")} />
        </div>
      ) : !user && !demo ? (
        <Landing
          lang={lang}
          onLanguage={setLang}
          onAuth={openAuth}
          onDemo={() => {
            window.scrollTo({ top: 0 });
            setDemo(true);
            setTab("overview");
            setSelected(null);
          }}
          onPrivacy={() => setPrivacy(true)}
        />
      ) : (
        <div className="app-shell">
          {mobile && (
            <button
              className="drawer-scrim"
              aria-label={t(lang, "close")}
              onClick={() => setMobile(false)}
            />
          )}
          <aside className={`sidebar ${mobile ? "is-open" : ""}`}>
            <div className="sidebar-brand">
              <Brand />
              <button
                className="icon-button mobile-close"
                onClick={() => setMobile(false)}
                aria-label={t(lang, "close")}
              >
                <X size={19} />
              </button>
            </div>
            <div className="farm-selector">
              <span className="farm-monogram">
                {shownProfile?.full_name.slice(0, 1) ?? "E"}
              </span>
              <span>
                <strong>
                  {demo
                    ? pick(
                        lang,
                        "Namuna fermasi",
                        "Демо-хозяйство",
                        "Demo farm",
                      )
                    : (shownProfile?.full_name ?? "Ekinix")}
                </strong>
                <small>
                  {pick(
                    lang,
                    "Fermer ish maydoni",
                    "Рабочая область фермера",
                    "Grower workspace",
                  )}
                </small>
              </span>
            </div>
            <div className="sidebar-label">
              {pick(lang, "ISH MAYDONI", "РАБОЧАЯ ОБЛАСТЬ", "WORKSPACE")}
            </div>
            <nav
              aria-label={pick(
                lang,
                "Asosiy bo‘limlar",
                "Основные разделы",
                "Main navigation",
              )}
            >
              {nav.map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  aria-current={tab === id && !selected ? "page" : undefined}
                  className={tab === id && !selected ? "active" : ""}
                  onClick={() => navigate(id)}
                >
                  <Icon size={18} />
                  <span>{sectionName(lang, id)}</span>
                  {id === "fields" && <small>{active.length}</small>}
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <button
                className={tab === "settings" && !selected ? "active" : ""}
                onClick={() => navigate("settings")}
              >
                <Settings2 size={18} />
                {sectionName(lang, "settings")}
              </button>
              <button onClick={logout}>
                <LogOut size={18} />
                {demo
                  ? pick(lang, "Demodan chiqish", "Выйти из демо", "Exit demo")
                  : t(lang, "signout")}
              </button>
              <span className="sidebar-caption">
                EKINIX · FIELD INTELLIGENCE
              </span>
            </div>
          </aside>
          <div className="app-body">
            <header className="app-header">
              <div className="row">
                <button
                  className="icon-button mobile-menu"
                  aria-label={pick(
                    lang,
                    "Menyuni ochish",
                    "Открыть меню",
                    "Open menu",
                  )}
                  onClick={() => setMobile(true)}
                >
                  <Menu size={21} />
                </button>
                <span className="breadcrumb">
                  {pick(lang, "Ish maydoni", "Рабочая область", "Workspace")}
                  <ChevronRight size={14} />
                  <strong>{chosen?.name ?? sectionName(lang, tab)}</strong>
                </span>
              </div>
              <div className="row">
                <button
                  className="icon-button"
                  aria-label={pick(
                    lang,
                    "Kuzatuvlarni yangilash",
                    "Обновить наблюдения",
                    "Refresh observations",
                  )}
                  disabled={demo || farm.busy}
                  onClick={() => {
                    void farm.refresh();
                  }}
                >
                  <RefreshCw size={16} />
                </button>
                <LanguagePicker lang={lang} onChange={setLang} />
                {demo ? (
                  <button
                    className="button secondary small"
                    onClick={() => openAuth("register")}
                  >
                    {t(lang, "signup")}
                  </button>
                ) : (
                  <button
                    className="account-button"
                    onClick={() => navigate("settings")}
                    aria-label={sectionName(lang, "settings")}
                  >
                    <span>{shownProfile?.full_name.slice(0, 1) ?? "E"}</span>
                  </button>
                )}
              </div>
            </header>
            {demo && (
              <div className="demo-ribbon">
                <span>DEMO</span>
                {pick(
                  lang,
                  "Namunaviy ferma — ko‘rsatkichlar haqiqiy hisobingizga tegishli emas.",
                  "Пример хозяйства — показатели не относятся к вашему аккаунту.",
                  "Example farm — these values are not from your account.",
                )}
              </div>
            )}
            <main className="app-content">
              <ErrorNotice error={error} lang={lang} />
              <ErrorNotice error={farm.error} lang={lang} />
              {!demo && loading ? (
                <div className="boot">
                  <Busy label={t(lang, "loading")} />
                </div>
              ) : !shownProfile ? (
                <div className="empty-state">
                  <p>
                    {pick(
                      lang,
                      "Hisob ma’lumotlarini yuklab bo‘lmadi.",
                      "Не удалось загрузить аккаунт.",
                      "Could not load account details.",
                    )}
                  </p>
                  <button
                    className="button primary"
                    onClick={() =>
                      load().catch(() => setError("database_error"))
                    }
                  >
                    {t(lang, "retry")}
                  </button>
                </div>
              ) : chosen ? (
                <FieldDetail
                  key={chosen.id}
                  field={chosen}
                  monitoring={farm.data[chosen.id]}
                  water={farm.water.filter((w) => w.field_id === chosen.id)}
                  lang={lang}
                  demo={demo}
                  onBack={() => navigate("fields")}
                  onEdit={() => setFieldForm(chosen)}
                  onRecord={() => setRecord(chosen)}
                  onRefresh={() => {
                    void farm.loadField(chosen.id);
                  }}
                  onPlan={() => {
                    setPlanField(chosen.id);
                    navigate("planning");
                  }}
                />
              ) : tab === "overview" ? (
                <FarmOverview {...view} />
              ) : tab === "fields" ? (
                <FieldsView
                  {...view}
                  archived={fields.filter((f) => f.archived_at)}
                />
              ) : tab === "satellite" ? (
                <SatelliteView {...view} />
              ) : tab === "weather" ? (
                <WeatherView {...view} />
              ) : tab === "planning" ? (
                <IrrigationPlanView
                  key={planField ?? "default"}
                  {...view}
                  initialFieldId={planField}
                />
              ) : tab === "irrigation" ? (
                <JournalView {...view} />
              ) : tab === "reports" ? (
                <ReportsView {...view} />
              ) : tab === "guide" ? (
                <GuideView {...view} />
              ) : (
                <SettingsView
                  key={shownProfile.id}
                  profile={shownProfile}
                  email={demo ? "demo@ekinix.uz" : (user?.email ?? "")}
                  fields={active}
                  lang={lang}
                  demo={demo}
                  onLanguage={setLang}
                  onReload={load}
                  onLogout={logout}
                />
              )}
            </main>
            <footer className="app-footer">
              <span>© 2026 Ekinix</span>
              <span>
                {pick(
                  lang,
                  "Ma’lumotdan dala qaroriga",
                  "От данных к решениям на поле",
                  "From data to field decisions",
                )}
              </span>
              <button className="text-button" onClick={() => setPrivacy(true)}>
                {t(lang, "privacy")}
              </button>
            </footer>
          </div>
        </div>
      )}
      {auth && (
        <AuthPanel
          key={auth}
          lang={lang}
          mode={auth}
          onClose={() => setAuth(null)}
        />
      )}
      {fieldForm && shownProfile && (
        <FieldForm
          key={fieldForm === "new" ? "new" : fieldForm.id}
          lang={lang}
          farmerId={shownProfile.id}
          field={fieldForm === "new" ? undefined : fieldForm}
          preview={demo}
          onClose={() => setFieldForm(null)}
          onSaved={load}
        />
      )}
      {record && !demo && (
        <RecordForm
          kind="water"
          field={record}
          lang={lang}
          onClose={() => setRecord(null)}
          onSaved={farm.loadWater}
        />
      )}
      {privacy && (
        <Modal
          lang={lang}
          title={t(lang, "privacy")}
          onClose={() => setPrivacy(false)}
        >
          <div className="form-stack">
            <p>
              {pick(
                lang,
                "Profil, dala chegaralari va jurnallar hisobingizga bog‘lab Supabase’da saqlanadi. Boshqa hisoblar kirish huquqiga ega emas.",
                "Профиль, границы полей и журналы хранятся в Supabase с разграничением доступа по аккаунтам.",
                "Profile details, field boundaries, and journals are stored in Supabase with account-level access controls.",
              )}
            </p>
            <p>
              {pick(
                lang,
                "Prognoz uchun dala markazi Open-Meteo’ga, kuzatuvlar uchun chegara Copernicus yoki Earth Search’ga yuboriladi. Bazaviy xarita Esri/OpenStreetMap’dan, joy qidiruvi GeoNames/Open-Meteo’dan olinadi. AI tugmasidan foydalanganda kuzatuvlar Google Gemini’ga yuboriladi.",
                "Центр поля передаётся Open-Meteo, границы — Copernicus или Earth Search. Базовая карта — Esri/OpenStreetMap; поиск мест — GeoNames/Open-Meteo. При использовании ИИ наблюдения отправляются Google Gemini.",
                "The field center goes to Open-Meteo; boundaries go to Copernicus or Earth Search. Basemaps are from Esri/OpenStreetMap; location search uses GeoNames/Open-Meteo. Using AI sends observations to Google Gemini.",
              )}
            </p>
            <p>
              {pick(
                lang,
                "Arxivlash qaydlarni saqlaydi. Brauzerda sessiya va til tanlovi saqlanadi.",
                "Архивация сохраняет записи. Браузер хранит сессию и язык.",
                "Archiving preserves records. The browser stores your session and language preference.",
              )}
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}

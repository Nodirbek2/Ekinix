"use client";
import { useState } from "react";
import {
  Check,
  ChevronRight,
  Download,
  Globe,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { pick, type Field, type Lang, type Profile } from "@/lib/domain";
import { fieldExport } from "@/lib/workspace";
import { requireClient } from "@/lib/supabase";
import { ALL_UZBEKISTAN_REGIONS } from "@/lib/geoConstants";
import { t } from "@/lib/copy";
import { Busy, ErrorNotice } from "./ui";
import { PageHeading, Pill } from "./WorkspaceViews";
export function SettingsView({
  profile,
  email,
  fields,
  lang,
  demo,
  onLanguage,
  onReload,
  onLogout,
}: {
  profile: Profile;
  email: string;
  fields: Field[];
  lang: Lang;
  demo: boolean;
  onLanguage: (l: Lang) => void;
  onReload: () => Promise<void>;
  onLogout: () => void;
}) {
  const [section, setSection] = useState<
      "profile" | "preferences" | "security" | "data"
    >("profile"),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false),
    [error, setError] = useState(""),
    [reset, setReset] = useState(false);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (demo) return;
    const f = new FormData(e.currentTarget),
      name = String(f.get("name") ?? "").trim();
    if (!name) {
      setError("invalid_request");
      return;
    }
    setBusy(true);
    setSaved(false);
    setError("");
    try {
      const { error } = await requireClient()
        .from("farmers")
        .update({
          full_name: name,
          phone: String(f.get("phone") ?? "").trim() || null,
          region: String(f.get("region")),
        })
        .eq("id", profile.id)
        .select("id")
        .single();
      if (error) throw error;
      await onReload();
      setSaved(true);
    } catch {
      setError("request_failed");
    } finally {
      setBusy(false);
    }
  }
  async function passwordReset() {
    if (demo) return;
    setBusy(true);
    setError("");
    try {
      const { error } = await requireClient().auth.resetPasswordForEmail(
        email,
        { redirectTo: window.location.origin },
      );
      if (error) throw error;
      setReset(true);
    } catch {
      setError("request_failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow={pick(
          lang,
          "HISOB VA ISH MAYDONI",
          "АККАУНТ И РАБОЧАЯ ОБЛАСТЬ",
          "ACCOUNT & WORKSPACE",
        )}
        title={pick(lang, "Sozlamalar", "Настройки", "Settings")}
        description={pick(
          lang,
          "Profil, til va hisob xavfsizligini bir joyda boshqaring.",
          "Управляйте профилем, языком и безопасностью аккаунта.",
          "Manage your profile, language, and account security in one place.",
        )}
      />
      <div className="settings-layout">
        <nav
          className="settings-nav"
          aria-label={pick(
            lang,
            "Sozlamalar bo‘limlari",
            "Разделы настроек",
            "Settings sections",
          )}
        >
          {(
            [
              {
                id: "profile",
                icon: UserRound,
                label: pick(
                  lang,
                  "Shaxsiy profil",
                  "Личный профиль",
                  "Personal profile",
                ),
              },
              {
                id: "preferences",
                icon: Globe,
                label: pick(
                  lang,
                  "Til va hudud",
                  "Язык и регион",
                  "Language & region",
                ),
              },
              {
                id: "security",
                icon: LockKeyhole,
                label: pick(lang, "Xavfsizlik", "Безопасность", "Security"),
              },
              {
                id: "data",
                icon: Download,
                label: pick(lang, "Ma’lumotlar", "Данные", "Your data"),
              },
            ] as const
          ).map(({ id, icon: Icon, label }) => (
            <button
              className={section === id ? "active" : ""}
              key={id}
              onClick={() => {
                setSection(id);
                setSaved(false);
                setError("");
              }}
            >
              <Icon size={18} />
              {label}
              <ChevronRight size={14} />
            </button>
          ))}
        </nav>
        <div className="settings-content">
          <ErrorNotice error={error} lang={lang} />
          {section === "profile" ? (
            <form className="panel" onSubmit={save}>
              <div className="settings-section-heading">
                <h2>
                  {pick(
                    lang,
                    "Shaxsiy profil",
                    "Личный профиль",
                    "Personal profile",
                  )}
                </h2>
                <p>
                  {pick(
                    lang,
                    "Siz va fermangiz bilan bog‘lanish ma’lumotlari.",
                    "Ваши контактные данные и регион хозяйства.",
                    "Your contact details and farm location.",
                  )}
                </p>
              </div>
              <div className="profile-identity">
                <span className="profile-avatar">
                  {profile.full_name.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <strong>{profile.full_name}</strong>
                  <small>
                    {email ||
                      pick(
                        lang,
                        "Namunaviy hisob",
                        "Демо-аккаунт",
                        "Demo account",
                      )}
                  </small>
                </div>
                <Pill tone="green">
                  {demo ? "Demo" : pick(lang, "Fermer", "Фермер", "Grower")}
                </Pill>
              </div>
              <div className="settings-form">
                <label>
                  {pick(lang, "To‘liq ism", "Полное имя", "Full name")}
                  <input
                    name="name"
                    required
                    maxLength={100}
                    defaultValue={profile.full_name}
                    disabled={demo}
                  />
                </label>
                <label>
                  {pick(
                    lang,
                    "Telefon raqami",
                    "Номер телефона",
                    "Phone number",
                  )}
                  <input
                    name="phone"
                    type="tel"
                    maxLength={30}
                    defaultValue={profile.phone ?? ""}
                    placeholder="+998"
                    disabled={demo}
                  />
                </label>
                <label className="span-all">
                  {pick(
                    lang,
                    "Ferma joylashgan hudud",
                    "Регион хозяйства",
                    "Farm region",
                  )}
                  <select
                    name="region"
                    defaultValue={profile.region}
                    disabled={demo}
                  >
                    {!ALL_UZBEKISTAN_REGIONS.includes(profile.region) && (
                      <option>{profile.region}</option>
                    )}
                    {ALL_UZBEKISTAN_REGIONS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <label className="span-all">
                  Email
                  <input value={email} readOnly disabled />
                  <small>
                    {pick(
                      lang,
                      "Hisobga kirish uchun ishlatiladi.",
                      "Используется для входа в аккаунт.",
                      "Used to sign into your account.",
                    )}
                  </small>
                </label>
              </div>
              <div className="settings-save">
                <span role="status">
                  {saved && (
                    <>
                      <Check size={15} />
                      {t(lang, "saved")}
                    </>
                  )}
                </span>
                <button className="button primary" disabled={busy || demo}>
                  {busy ? (
                    <Busy label={t(lang, "loading")} />
                  ) : (
                    pick(
                      lang,
                      "O‘zgarishlarni saqlash",
                      "Сохранить изменения",
                      "Save changes",
                    )
                  )}
                </button>
              </div>
            </form>
          ) : section === "preferences" ? (
            <section className="panel">
              <div className="settings-section-heading">
                <h2>
                  {pick(
                    lang,
                    "Til va hudud",
                    "Язык и регион",
                    "Language & region",
                  )}
                </h2>
                <p>
                  {pick(
                    lang,
                    "Tanlov shu brauzerda saqlanadi va darhol qo‘llanadi.",
                    "Выбор сохраняется в браузере и применяется сразу.",
                    "Your choice is saved in this browser and applies immediately.",
                  )}
                </p>
              </div>
              <div className="preference-row">
                <span>
                  <strong>
                    {pick(
                      lang,
                      "Interfeys tili",
                      "Язык интерфейса",
                      "Interface language",
                    )}
                  </strong>
                  <small>
                    {pick(
                      lang,
                      "Menyu, forma va hisobotlar tili",
                      "Язык меню, форм и отчётов",
                      "Language for navigation, forms, and reports",
                    )}
                  </small>
                </span>
                <select
                  aria-label={pick(
                    lang,
                    "Interfeys tili",
                    "Язык интерфейса",
                    "Interface language",
                  )}
                  value={lang}
                  onChange={(e) => onLanguage(e.target.value as Lang)}
                >
                  <option value="uz">O‘zbekcha</option>
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="preference-row">
                <span>
                  <strong>
                    {pick(lang, "Vaqt mintaqasi", "Часовой пояс", "Time zone")}
                  </strong>
                  <small>
                    {pick(
                      lang,
                      "Jurnal va kuzatuv vaqti",
                      "Время записей и наблюдений",
                      "Time for records and observations",
                    )}
                  </small>
                </span>
                <span>Asia/Tashkent · UTC+5</span>
              </div>
              <div className="preference-row">
                <span>
                  <strong>
                    {pick(
                      lang,
                      "O‘lchov birliklari",
                      "Единицы измерения",
                      "Measurement units",
                    )}
                  </strong>
                  <small>
                    {pick(
                      lang,
                      "Dala va sug‘orish hisobotlari",
                      "Отчёты о полях и поливе",
                      "Field and irrigation reports",
                    )}
                  </small>
                </span>
                <span>ha · m³ · mm · °C</span>
              </div>
            </section>
          ) : section === "security" ? (
            <section className="panel">
              <div className="settings-section-heading">
                <h2>
                  {pick(
                    lang,
                    "Hisob xavfsizligi",
                    "Безопасность аккаунта",
                    "Account security",
                  )}
                </h2>
                <p>
                  {pick(
                    lang,
                    "Parolni tiklash va sessiyani boshqarish.",
                    "Восстановление пароля и управление сессией.",
                    "Password recovery and session controls.",
                  )}
                </p>
              </div>
              <div className="preference-row">
                <span>
                  <strong>
                    {pick(
                      lang,
                      "Parolni yangilash",
                      "Обновить пароль",
                      "Update your password",
                    )}
                  </strong>
                  <small>
                    {pick(
                      lang,
                      "Tasdiqlangan emailga xavfsiz havola yuboriladi.",
                      "На ваш email будет отправлена защищённая ссылка.",
                      "A secure recovery link will be sent to your email.",
                    )}
                  </small>
                </span>
                <button
                  type="button"
                  className="button secondary"
                  onClick={passwordReset}
                  disabled={
                    demo || busy || !email || email.endsWith("@ekinix.uz")
                  }
                >
                  <Mail size={15} />
                  {pick(
                    lang,
                    "Havola yuborish",
                    "Отправить ссылку",
                    "Send reset link",
                  )}
                </button>
              </div>
              {reset && (
                <p className="notice" role="status">
                  {pick(
                    lang,
                    "Emailingizdagi tiklash havolasini oching.",
                    "Откройте ссылку восстановления в письме.",
                    "Open the recovery link in your email.",
                  )}
                </p>
              )}
              <div className="preference-row">
                <span>
                  <strong>
                    {pick(
                      lang,
                      "Joriy sessiya",
                      "Текущая сессия",
                      "Current session",
                    )}
                  </strong>
                  <small>
                    {pick(
                      lang,
                      "Ushbu brauzerdagi hisobdan chiqing.",
                      "Выйдите из аккаунта в этом браузере.",
                      "Sign out of the account in this browser.",
                    )}
                  </small>
                </span>
                <button className="button secondary" onClick={onLogout}>
                  <LogOut size={15} />
                  {t(lang, "signout")}
                </button>
              </div>
              <div className="settings-security-note">
                <ShieldCheck size={22} />
                <p>
                  {pick(
                    lang,
                    "Dalalar va qaydlar hisobingizga bog‘langan. Ma’lumotlar boshqa foydalanuvchilardan baza ruxsatlari bilan ajratilgan.",
                    "Поля и записи привязаны к аккаунту и защищены разграничением доступа.",
                    "Fields and records belong to your account and are protected with database access controls.",
                  )}
                </p>
              </div>
            </section>
          ) : (
            <section className="panel">
              <div className="settings-section-heading">
                <h2>
                  {pick(
                    lang,
                    "Sizning ma’lumotlaringiz",
                    "Ваши данные",
                    "Your data",
                  )}
                </h2>
                <p>
                  {pick(
                    lang,
                    "Ma’lumotlarni yuklash va saqlash haqida.",
                    "Выгрузка и хранение данных.",
                    "Exporting and retaining your records.",
                  )}
                </p>
              </div>
              <div className="preference-row">
                <span>
                  <strong>
                    {pick(
                      lang,
                      "Dalalar reyestrini yuklash",
                      "Скачать реестр полей",
                      "Export the field register",
                    )}
                  </strong>
                  <small>
                    {fields.length} {pick(lang, "dala", "полей", "fields")} ·
                    CSV
                  </small>
                </span>
                <button
                  className="button secondary"
                  onClick={() => fieldExport(fields, lang)}
                >
                  <Download size={15} />
                  {t(lang, "export")}
                </button>
              </div>
              <div className="settings-security-note">
                <MapPin size={22} />
                <p>
                  {pick(
                    lang,
                    "Arxivlash dala ma’lumotlarini o‘chirmaydi. Dalalar bo‘limidagi Arxiv sahifasidan qayta tiklash mumkin.",
                    "Архивация не удаляет данные. Поле можно восстановить из архива в разделе полей.",
                    "Archiving preserves field records. Restore an archived field from the Fields page.",
                  )}
                </p>
              </div>
            </section>
          )}
          {demo && (
            <p className="data-footnote">
              {pick(
                lang,
                "Bu sozlamalar namoyishi. Hisob ma’lumotlarini o‘zgartirish uchun tizimga kiring.",
                "Это демонстрация настроек. Войдите, чтобы изменить данные аккаунта.",
                "This is a settings preview. Sign in to edit account details.",
              )}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

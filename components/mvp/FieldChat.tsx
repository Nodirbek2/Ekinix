"use client";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { pick, type Lang } from "@/lib/domain";
import { api } from "@/lib/supabase";
import { ErrorNotice } from "./ui";
type Message = { role: "user" | "assistant"; content: string };
export function FieldChat({
  fieldId,
  lang,
  demo,
}: {
  fieldId: string;
  lang: Lang;
  demo: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const revision = useRef(0);
  useEffect(
    () => () => {
      revision.current++;
    },
    [],
  );
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy || demo) return;
    const current = revision.current;
    const next: Message[] = [
      ...messages.slice(-6),
      { role: "user", content: text.trim() },
    ];
    setMessages(next);
    setText("");
    setBusy(true);
    setError("");
    try {
      const result = await api<{ answer: string }>("/api/field-chat", {
        fieldId,
        lang,
        messages: next,
      });
      if (current === revision.current)
        setMessages([...next, { role: "assistant", content: result.answer }]);
    } catch (e) {
      if (current === revision.current) {
        setMessages(messages);
        setText(next.at(-1)!.content);
        setError(e instanceof Error ? e.message : "request_failed");
      }
    } finally {
      if (current === revision.current) setBusy(false);
    }
  }
  return (
    <section className="panel field-chat">
      <div className="panel-heading">
        <h2>
          <MessageCircle size={19} />
          {pick(
            lang,
            "Shu dala haqida so‘rang",
            "Спросите об этом поле",
            "Ask about this field",
          )}
        </h2>
        <small>Groq AI</small>
      </div>
      <div className="chat-body">
        <p>
          {pick(
            lang,
            "Masalan: “Oxirgi sug‘orishdan keyin nima o‘zgardi?” yoki “Bu haftada nimani tekshirishim kerak?”",
            "Например: «Что изменилось после полива?»",
            "For example: “What changed since irrigation?” or “What should I check this week?”",
          )}
        </p>
        <div className="chat-messages" aria-live="polite">
          {messages.map((m, i) => (
            <div className={`chat-bubble ${m.role}`} key={i}>
              <small>
                {m.role === "user" ? pick(lang, "Siz", "Вы", "You") : "AI"}
              </small>
              <p>{m.content}</p>
            </div>
          ))}
        </div>
        <ErrorNotice error={error} lang={lang} />
        <form onSubmit={send}>
          <label className="sr-only" htmlFor={`chat-${fieldId}`}>
            {pick(lang, "Dala haqida savol", "Вопрос о поле", "Field question")}
          </label>
          <textarea
            id={`chat-${fieldId}`}
            value={text}
            maxLength={1200}
            rows={2}
            disabled={busy || demo}
            onChange={(e) => setText(e.target.value)}
            placeholder={pick(
              lang,
              "Savolingizni yozing…",
              "Напишите вопрос…",
              "Write your question…",
            )}
          />
          <button
            className="button primary"
            disabled={busy || demo || !text.trim()}
          >
            <Send size={16} />
            {busy
              ? pick(
                  lang,
                  "Javob tayyorlanmoqda…",
                  "Готовим ответ…",
                  "Preparing answer…",
                )
              : pick(lang, "Yuborish", "Отправить", "Send")}
          </button>
        </form>
        <small className="muted">
          {demo
            ? pick(
                lang,
                "Chat uchun hisobingizga kiring.",
                "Войдите для чата.",
                "Sign in to chat.",
              )
            : pick(
                lang,
                "Suhbat shu oynada qoladi; sahifani yopganda tozalanadi. AI sug‘orishni avtomatik tasdiqlamaydi.",
                "Чат хранится только в этом окне. ИИ не подтверждает полив.",
                "Chat stays in this view only. AI cannot confirm watering.",
              )}{" "}
          {pick(
            lang,
            "Savol va dala ko‘rsatkichlari Groq’ga yuboriladi; koordinatalar yuborilmaydi.",
            "Вопрос и показатели поля передаются Groq без координат.",
            "Questions and field observations are sent to Groq without coordinates.",
          )}
        </small>
      </div>
    </section>
  );
}

"use client";

import * as React from "react";
import {
  MessageCircle,
  Send,
  X,
  Sparkles,
  Mic,
  MicOff,
  Minus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  chatService,
  type ChatMessage,
  type ChatResponse,
} from "@/services/chatService";
import { chatSettingsService } from "@/services/chatSettingsService";
import { getAuthToken } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────

interface LocalMessage {
  message?: string;
  id: string;
  sender: "user" | "bot";
  text: string;
  intent?: string | null;
  source?: ChatResponse["source"];
  suggestions?: string[];
  language: "ar" | "en";
  timestamp: Date;
  isError?: boolean;
}

// ── Voice Input ─────────────────────────────────────────────────────────

// Add these declarations ABOVE the hook
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }

  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;

    start(): void;
    stop(): void;

    onresult:
      | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
      | null;

    onerror: ((this: SpeechRecognition, ev: Event) => void) | null;

    onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  }

  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────

function formatTime(d: Date, lang: string) {
  return d.toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function detectDirection(lang: "ar" | "en") {
  return lang === "ar" ? "rtl" : "ltr";
}

// ── Typing Indicator ────────────────────────────────────────────────────

function TypingIndicator({
  visible,
  startTime,
  t,
}: {
  visible: boolean;
  startTime: number | null;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    if (!visible || !startTime) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 500);
    return () => clearInterval(interval);
  }, [visible, startTime]);

  if (!visible) return null;

  const text =
    elapsed < 1000
      ? t("assistant.typing")
      : elapsed < 3000
        ? t("assistant.analyzing")
        : t("assistant.almostDone");

  return (
    <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
      <span>{text}</span>
    </div>
  );
}

// ── Chat Bubble ─────────────────────────────────────────────────────────

function ChatBubble({
  msg,
  lang,
  t,
}: {
  msg: LocalMessage;
  lang: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const isUser = msg.sender === "user";
  const dir = detectDirection(msg.language);

  // Render markdown text with \\n normalization + bold/bullet/heading support
  function renderText(text: string) {
    if (!text) return null;

    // Normalize literal \n escape sequences sent by the API
    const normalized = text.replace(/\\n/g, "\n").replace(/\\t/g, " ");

    function parseInline(str: string): React.ReactNode[] {
      const parts: React.ReactNode[] = [];
      const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
      let last = 0;
      let match;
      let k = 0;
      while ((match = regex.exec(str)) !== null) {
        if (match.index > last) parts.push(str.slice(last, match.index));
        if (match[2] !== undefined)
          parts.push(
            <strong
              key={k++}
              className="font-semibold"
            >
              {match[2]}
            </strong>
          );
        else if (match[3] !== undefined)
          parts.push(<em key={k++}>{match[3]}</em>);
        else if (match[4] !== undefined)
          parts.push(
            <code
              key={k++}
              className="rounded bg-muted-foreground/15 px-1 py-0.5 font-mono text-[11px]"
            >
              {match[4]}
            </code>
          );
        last = match.index + match[0].length;
      }
      if (last < str.length) parts.push(str.slice(last));
      return parts;
    }

    const lines = normalized.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;
    let elKey = 0;

    while (i < lines.length) {
      const trimmed = lines[i].trim();
      if (!trimmed) {
        i++;
        continue;
      }

      // Headings: ### ## #
      const hMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (hMatch) {
        const lvl = hMatch[1].length;
        elements.push(
          <p
            key={elKey++}
            className={
              lvl === 1
                ? "text-sm font-bold mt-1"
                : lvl === 2
                  ? "text-sm font-semibold mt-1"
                  : "text-xs font-semibold uppercase tracking-wide opacity-70 mt-1"
            }
          >
            {parseInline(hMatch[2])}
          </p>
        );
        i++;
        continue;
      }

      // Bullet list: - • *
      if (/^[-•*]\s/.test(trimmed)) {
        const items: React.ReactNode[] = [];
        while (i < lines.length && /^[-•*]\s/.test(lines[i].trim())) {
          const item = lines[i].trim().replace(/^[-•*]\s*/, "");
          const online = /online|نشط|متصل/i.test(item);
          const offline = /offline|غير متصل|منقطع/i.test(item);
          items.push(
            <li
              key={i}
              className="flex items-start gap-1.5"
            >
              <span
                className={cn(
                  "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                  online
                    ? "bg-emerald-500"
                    : offline
                      ? "bg-rose-500"
                      : "bg-primary"
                )}
              />
              <span>{parseInline(item)}</span>
            </li>
          );
          i++;
        }
        elements.push(
          <ul
            key={elKey++}
            className="space-y-0.5 text-sm leading-relaxed"
          >
            {items}
          </ul>
        );
        continue;
      }

      // Numbered list: 1. 2.
      if (/^\d+\.\s/.test(trimmed)) {
        const items: React.ReactNode[] = [];
        let n = 1;
        while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
          const item = lines[i].trim().replace(/^\d+\.\s*/, "");
          items.push(
            <li
              key={i}
              className="flex items-start gap-1.5"
            >
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                {n}
              </span>
              <span>{parseInline(item)}</span>
            </li>
          );
          i++;
          n++;
        }
        elements.push(
          <ol
            key={elKey++}
            className="space-y-0.5 text-sm leading-relaxed"
          >
            {items}
          </ol>
        );
        continue;
      }

      // Divider
      if (/^---+$/.test(trimmed)) {
        elements.push(
          <hr
            key={elKey++}
            className="my-1 border-t border-border"
          />
        );
        i++;
        continue;
      }

      // Paragraph
      elements.push(
        <p
          key={elKey++}
          className="text-sm leading-relaxed"
        >
          {parseInline(trimmed)}
        </p>
      );
      i++;
    }

    return <div className="space-y-1">{elements}</div>;
  }

  return (
    <div
      dir={dir}
      className={cn(
        "flex flex-col gap-1",
        isUser ? "items-end" : "items-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : msg.isError
              ? "rounded-tl-sm border border-destructive/30 bg-destructive/10 text-destructive"
              : "rounded-tl-sm bg-muted text-foreground"
        )}
      >
        {msg.isError && (
          <span className="me-1 inline-block align-middle">
            <AlertCircle className="inline h-3.5 w-3.5" />
          </span>
        )}
        {renderText(msg.text)}
      </div>
      <div className="flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
        <span>{formatTime(msg.timestamp, lang)}</span>
        {msg.source && msg.source !== "keyword" && (
          <span className="rounded-full bg-primary/10 px-1.5 py-px text-[9px] font-medium text-primary">
            {msg.source === "gemini"
              ? t("assistant.sourceAi", "AI")
              : t("assistant.sourceKb", "KB")}
          </span>
        )}
        {msg.intent && msg.intent !== "unknown" && (
          <span className="rounded-full bg-muted-foreground/10 px-1.5 py-px text-[9px]">
            {msg.intent.replace(/_/g, " ")}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Suggestions ──────────────────────────────────────────────────────────

function SuggestionChips({
  suggestions,
  onSelect,
}: {
  suggestions: string[];
  onSelect: (s: string) => void;
}) {
  if (!suggestions.length) return null;
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="shrink-0 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ── Voice Input ─────────────────────────────────────────────────────────

function useVoiceInput(lang: "ar" | "en", onResult: (text: string) => void) {
  const [listening, setListening] = React.useState(false);
  const recRef = React.useRef<SpeechRecognition | null>(null);

  const supported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const toggle = React.useCallback(() => {
    if (!supported) return;
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const SR =
      (
        window as unknown as {
          SpeechRecognition?: typeof SpeechRecognition;
          webkitSpeechRecognition?: typeof SpeechRecognition;
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          SpeechRecognition?: typeof SpeechRecognition;
          webkitSpeechRecognition?: typeof SpeechRecognition;
        }
      ).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = lang === "ar" ? "ar-SA" : "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      onResult(e.results[0][0].transcript);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [lang, listening, onResult, supported]);

  return { listening, toggle, supported };
}

// ── Main Widget ──────────────────────────────────────────────────────────

export function AIAssistant() {
  const { t, i18n } = useTranslation();
  const uiLang = (i18n.resolvedLanguage ?? "en") as "ar" | "en";

  // Apply the language chosen in "AI Assistant Settings" (chat settings →
  // notificationLanguage). The assistant converses in the configured language
  // when set, otherwise it follows the current UI locale. Settings are fetched
  // once and cached; failures fall back to demo defaults (enabled: false), in
  // which case we keep the UI language.
  const settingsQ = useQuery({
    queryKey: ["chat-settings", "assistant"],
    queryFn: () => chatSettingsService.get(),
    staleTime: 5 * 60_000,
    enabled: !!getAuthToken(),
  });
  const configuredLang = settingsQ.data?.whatsapp.language;
  const lang: "ar" | "en" = configuredLang ?? uiLang;
  const dir = detectDirection(lang);
  const isRtl = lang === "ar";

  const [open, setOpen] = React.useState(false);
  const [minimized, setMinimized] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<LocalMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingStart, setLoadingStart] = React.useState<number | null>(null);
  const [conversationId, setConversationId] = React.useState<string | null>(
    null
  );
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [historyLoaded, setHistoryLoaded] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isAuth = !!getAuthToken();

  // Greet on first open
  React.useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: "greeting",
          sender: "bot",
          text: t("assistant.greeting"),
          language: lang,
          timestamp: new Date(),
        },
      ]);
      setSuggestions([
        t("assistant.suggest.visitors"),
        t("assistant.suggest.cameras"),
        t("assistant.suggest.report"),
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Load history when opening for authenticated users
  React.useEffect(() => {
    if (open && isAuth && !historyLoaded && messages.length <= 1) {
      setHistoryLoaded(true);
      chatService.getHistory(30, 1).then((res) => {
        if (!res?.data?.length) return;
        const historical: LocalMessage[] = res.data.map((m: ChatMessage) => ({
          id: m.id ? String(m.id) : crypto.randomUUID(),
          sender: m.sender,
          text: m.sender === "bot" ? (m.reply ?? m.message) : m.message,
          intent: m.intent,
          language: m.language,
          timestamp: new Date(m.created_at),
        }));
        setMessages((prev) => {
          // keep greeting + append history
          const greeting = prev.find((m) => m.id === "greeting");
          return [...(greeting ? [greeting] : []), ...historical];
        });
        const last = res.data[res.data.length - 1] as
          | (ChatMessage & { session_id?: string })
          | undefined;
        const sid = last?.conversation_id ?? last?.session_id;
        if (sid) setConversationId(sid);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isAuth]);

  // Auto-scroll
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading]);

  // Focus input when opening
  React.useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized]);

  const {
    listening,
    toggle: toggleVoice,
    supported: voiceSupported,
  } = useVoiceInput(lang, (text) =>
    setInput((prev) => (prev ? prev + " " + text : text))
  );

  const sendMessage = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: LocalMessage = {
        id: crypto.randomUUID(),
        sender: "user",
        text: trimmed,
        language: lang,
        timestamp: new Date(),
      };

      setMessages((m) => [...m, userMsg]);
      setInput("");
      setSuggestions([]);
      setIsLoading(true);
      setLoadingStart(Date.now());

      try {
        const res = await chatService.sendMessage(trimmed, conversationId);
        setConversationId(res.conversation_id);
        setSuggestions(res.suggestions ?? []);

        const botMsg: LocalMessage = {
          id: crypto.randomUUID(),
          sender: "bot",
          text: res.message ?? res.reply ?? "",
          intent: res.intent,
          source: res.source,
          suggestions: res.suggestions,
          language: res.language,
          timestamp: new Date(),
        };
        setMessages((m) => [...m, botMsg]);
      } catch {
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            sender: "bot",
            text: t("assistant.error"),
            language: lang,
            timestamp: new Date(),
            isError: true,
          },
        ]);
      } finally {
        setIsLoading(false);
        setLoadingStart(null);
      }
    },
    [conversationId, isLoading, lang, t]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
    setSuggestions([]);
    setHistoryLoaded(false);
    setOpen(false);
    setTimeout(() => setOpen(true), 10);
  };

  // WhatsApp number from env; if not configured, hide the button
  const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER ?? "15556581711";
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(t("assistant.waGreeting"))}`
    : null;

  return (
    <>
      {/* FAB */}
      <Button
        onClick={() => {
          if (open) {
            setOpen(false);
            setMinimized(false);
          } else {
            setOpen(true);
            setMinimized(false);
          }
        }}
        size="icon"
        data-tour="assistant"
        className="fixed bottom-6 end-6 z-[60] h-14 w-14 !rounded-full shadow-xl shadow-primary/40 ring-2 ring-primary/20 hover:shadow-primary/60 hover:scale-105 transition-all duration-200"
        aria-label={t("assistant.title")}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            <span className="absolute -end-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
          </div>
        )}
      </Button>

      {/* Widget */}
      <div
        dir={dir}
        className={cn(
          "fixed bottom-24 end-6 z-[59] flex flex-col overflow-hidden rounded-2xl shadow-2xl transition-all duration-300",
          "w-[min(390px,calc(100vw-1.5rem))]",
          "border border-primary/20 bg-background",
          "ring-1 ring-primary/10",
          open && !minimized
            ? "h-[min(540px,calc(100dvh-8rem))] opacity-100 translate-y-0"
            : open && minimized
              ? "h-14 opacity-100 translate-y-0"
              : "pointer-events-none h-0 opacity-0 translate-y-4"
        )}
      >
        {/* ── Header ── */}
        <div className="flex shrink-0 items-center gap-2 bg-gradient-to-r from-primary to-[oklch(0.72_0.18_50)] px-3 py-2.5 text-primary-foreground">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-none">
              {t("assistant.title")}
            </p>
            <p className="truncate text-[10px] opacity-80">
              {t("assistant.subtitle")}
            </p>
          </div>

          {/* WhatsApp link — only shown when NEXT_PUBLIC_WA_NUMBER is configured */}
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium transition-colors hover:bg-white/25"
              title={t("assistant.alsoOnWhatsapp")}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3 w-3 fill-current"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span className="hidden sm:inline">
                {t("assistant.alsoOnWhatsapp")}
              </span>
            </a>
          )}

          <button
            onClick={() => setMinimized((v) => !v)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full opacity-70 transition-opacity hover:opacity-100"
            aria-label={t("assistant.minimize", "Minimize")}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setOpen(false);
              setMinimized(false);
            }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full opacity-70 transition-opacity hover:opacity-100"
            aria-label="close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ── Messages ── */}
        {!minimized && (
          <>
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto px-3 py-3 text-sm bg-muted/20"
            >
              {messages.map((m) => (
                <ChatBubble
                  key={m.id}
                  msg={m}
                  lang={lang}
                  t={t}
                />
              ))}
              <TypingIndicator
                visible={isLoading}
                startTime={loadingStart}
                t={t}
              />
            </div>

            {/* ── Suggestions ── */}
            {suggestions.length > 0 && !isLoading && (
              <div className="shrink-0 border-t px-3 pb-2 pt-2">
                <SuggestionChips
                  suggestions={suggestions}
                  onSelect={(s) => sendMessage(s)}
                />
              </div>
            )}

            {/* ── Input ── */}
            <form
              onSubmit={handleSubmit}
              className="flex shrink-0 items-center gap-2 border-t bg-background px-3 py-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  listening
                    ? t("assistant.listening")
                    : t("assistant.placeholder")
                }
                disabled={isLoading}
                dir={isRtl ? "rtl" : "ltr"}
                className={cn(
                  "flex-1 rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none",
                  "placeholder:text-muted-foreground focus:border-primary focus:bg-background",
                  "transition-colors disabled:opacity-50"
                )}
              />

              {/* Voice */}
              {voiceSupported && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={toggleVoice}
                  className={cn(
                    "h-9 w-9 shrink-0 rounded-lg",
                    listening && "animate-pulse text-destructive"
                  )}
                  aria-label={
                    listening
                      ? t("assistant.stopListening")
                      : t("assistant.startListening")
                  }
                >
                  {listening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              )}

              {/* Send */}
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="h-9 w-9 shrink-0 rounded-lg"
                aria-label={t("assistant.send")}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className={cn("h-4 w-4", isRtl && "rotate-180")} />
                )}
              </Button>
            </form>

            {/* ── Footer ── */}
            <div className="flex shrink-0 items-center justify-between border-t bg-muted/30 px-3 py-1.5 text-[10px] text-muted-foreground">
              <span>{t("assistant.poweredBy")}</span>
              <button
                onClick={clearChat}
                className="underline-offset-2 transition-colors hover:text-destructive hover:underline"
              >
                {t("assistant.clearChat")}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default AIAssistant;

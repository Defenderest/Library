"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Check, Loader2, SendHorizontal, Sparkles, ThumbsDown, ThumbsUp, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAuthSession } from "@/components/providers/auth-session-provider";
import { cn } from "@/lib/cn";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  eventId?: number | null;
  sources?: AiSourceBook[];
  feedback?: "up" | "down" | null;
};

type AiSourceBook = {
  bookId: number;
  title: string;
  authors: string;
  genre: string;
  price: number;
  stockQuantity: number;
  href: string;
  score?: number;
  matchReasons?: string[];
};

type ServiceState = "ready" | "not_configured" | "error";

type QuickAction = {
  label: string;
  prompt: string;
};

const MAX_HISTORY = 10;
const MAX_INPUT_LENGTH = 700;
const SEND_DEBOUNCE_MS = 700;
const SESSION_STORAGE_KEY = "library-ai-chat-session-id";
const INITIAL_MESSAGE =
  "Вітаю. Я підберу книги за настроєм, жанром, бюджетом і наявністю в каталозі Library.";

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Щось українське", prompt: "Порадь щось українське з реальних книг у наявності" },
  { label: "Темне фентезі", prompt: "Порадь темне фентезі з наявних книг" },
  { label: "До 500 грн", prompt: "Підбери книгу до 500 грн" },
  { label: "Щось як Гаррі Поттер", prompt: "Порадь щось як Гаррі Поттер, але доросліше" },
  { label: "Для подарунка", prompt: "Підбери книгу для подарунка" },
  { label: "Коротка книга", prompt: "Порадь коротку й атмосферну книгу" },
  { label: "Нон-фікшн", prompt: "Порадь щось серйозне, не художнє" },
];

function createMessage(role: ChatRole, content: string): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  };
}

function createSessionId(): string {
  return `ai-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function safeSessionStorageGet(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function safeSessionStorageSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function trimMessages(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_HISTORY) {
    return messages;
  }

  return messages.slice(messages.length - MAX_HISTORY);
}

function normalizeAssistantMessage(content: string): string {
  return content
    .replace(/\*/g, "")
    .replace(/([^\n])\s+(\d+\.)/g, "$1\n$2")
    .replace(/(В наявності:)/g, "\n$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function AiChatWidget() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useAuthSession();
  const [open, setOpen] = useState(false);
  const [serviceState, setServiceState] = useState<ServiceState>("ready");
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([createMessage("assistant", INITIAL_MESSAGE)]);
  const [sessionId, setSessionId] = useState("");
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const lastSendAtRef = useRef(0);

  useEffect(() => {
    document.body.classList.toggle("mobile-ai-chat-open", open);

    return () => {
      document.body.classList.remove("mobile-ai-chat-open");
    };
  }, [open]);

  useEffect(() => {
    const stored = safeSessionStorageGet(SESSION_STORAGE_KEY);
    if (stored.length > 0) {
      setSessionId(stored);
      return;
    }

    const created = createSessionId();
    safeSessionStorageSet(SESSION_STORAGE_KEY, created);
    setSessionId(created);
  }, []);

  const stateLabel =
    serviceState === "not_configured" ? "Не налаштовано" : serviceState === "error" ? "Помилка" : "Онлайн";

  const stateClass =
    serviceState === "not_configured"
      ? "border-app-warning/45 bg-app-warning/10 text-app-warning"
      : serviceState === "error"
        ? "border-app-error/45 bg-app-error/10 text-app-error"
        : "border-app-success/45 bg-app-success/10 text-app-success";

  const shouldShowQuickActions = messages.length <= 2;
  const canUseCartActions = Boolean(session) && !sessionLoading;
  const canSend = useMemo(
    () => !pending && draft.trim().length > 0 && serviceState !== "not_configured" && sessionId.length > 0,
    [draft, pending, serviceState, sessionId],
  );

  const scrollToBottom = () => {
    const container = bodyRef.current;
    if (!container) {
      return;
    }

    window.requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  };

  const sendFeedback = async (eventId: number | null | undefined, payload: { useful?: boolean; action?: "add_to_cart" }) => {
    if (!eventId) {
      return;
    }

    try {
      await fetch("/api/ai/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId, ...payload }),
      });
    } catch {}
  };

  const markMessageFeedback = (messageId: string, direction: "up" | "down") => {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? {
              ...message,
              feedback: direction,
            }
          : message,
      ),
    );
  };

  const addBookToCart = async (book: AiSourceBook, eventId: number | null | undefined) => {
    if (!canUseCartActions) {
      const message = encodeURIComponent("Щоб додавати книги в кошик, увійдіть у профіль");
      router.push(`/profile?message=${message}`);
      return;
    }

    try {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookId: book.bookId, quantity: 1 }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessages((current) =>
          trimMessages([
            ...current,
            createMessage("assistant", payload?.error || "Не вдалося додати книгу в кошик."),
          ]),
        );
        scrollToBottom();
        return;
      }

      await sendFeedback(eventId, { action: "add_to_cart" });
      setMessages((current) =>
        trimMessages([
          ...current,
          createMessage("assistant", `Додав "${book.title}" у кошик.`),
        ]),
      );
      scrollToBottom();
    } catch {
      setMessages((current) =>
        trimMessages([
          ...current,
          createMessage("assistant", "Помилка під час додавання книги в кошик. Спробуйте пізніше."),
        ]),
      );
      scrollToBottom();
    }
  };

  const sendMessage = async (rawText?: string) => {
    const text = (rawText ?? draft).trim();

    if (text.length === 0 || pending || serviceState === "not_configured" || sessionId.length === 0) {
      return;
    }

    const now = Date.now();
    if (now - lastSendAtRef.current < SEND_DEBOUNCE_MS) {
      return;
    }
    lastSendAtRef.current = now;

    const userMessage = createMessage("user", text.slice(0, MAX_INPUT_LENGTH));
    const nextMessages = trimMessages([...messages, userMessage]);
    const assistantDraftId = `${Date.now()}-assistant-draft`;

    setMessages([...nextMessages, { id: assistantDraftId, role: "assistant", content: "" }]);
    setDraft("");
    setPending(true);
    scrollToBottom();

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stream: true,
          sessionId,
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | {
              message?: string;
              error?: string;
              code?: string;
            }
          | null;

        if (response.status === 503 && data?.code === "AI_NOT_CONFIGURED") {
          setServiceState("not_configured");
        } else {
          setServiceState("error");
        }

        setMessages((current) =>
          trimMessages([
            ...current.filter((message) => message.id !== assistantDraftId),
            createMessage("assistant", data?.error || "Не вдалося отримати відповідь асистента."),
          ]),
        );
        scrollToBottom();
        return;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/x-ndjson") || !response.body) {
        const data = (await response.json().catch(() => null)) as
          | {
              message?: string;
              sources?: AiSourceBook[];
              eventId?: number | null;
            }
          | null;

        setServiceState("ready");
        setMessages((current) =>
          trimMessages([
            ...current.filter((message) => message.id !== assistantDraftId),
            {
              ...createMessage("assistant", normalizeAssistantMessage(data?.message || "")),
              sources: Array.isArray(data?.sources) ? data?.sources.slice(0, 5) : [],
              eventId: typeof data?.eventId === "number" ? data.eventId : null,
            },
          ]),
        );
        scrollToBottom();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      let sources: AiSourceBook[] = [];
      let eventId: number | null = null;

      const applyDraft = () => {
        setMessages((current) =>
          trimMessages(
            current.map((message) =>
              message.id === assistantDraftId
                ? {
                    ...message,
                    content: normalizeAssistantMessage(assistantText),
                    sources,
                    eventId,
                  }
                : message,
            ),
          ),
        );
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            continue;
          }

          const packet = JSON.parse(trimmed) as
            | { type: "meta"; eventId?: number | null; sources?: AiSourceBook[] }
            | { type: "chunk"; text?: string }
            | { type: "done"; message?: string }
            | { type: "error"; error?: string };

          if (packet.type === "meta") {
            eventId = typeof packet.eventId === "number" ? packet.eventId : null;
            sources = Array.isArray(packet.sources) ? packet.sources.slice(0, 5) : [];
            applyDraft();
            continue;
          }

          if (packet.type === "chunk") {
            assistantText += packet.text ?? "";
            applyDraft();
            scrollToBottom();
            continue;
          }

          if (packet.type === "done") {
            assistantText = packet.message ?? assistantText;
            applyDraft();
            continue;
          }

          if (packet.type === "error") {
            throw new Error(packet.error || "Помилка потоку відповіді");
          }
        }
      }

      setServiceState("ready");
      scrollToBottom();
    } catch {
      setServiceState("error");
      setMessages((current) =>
        trimMessages([
          ...current.filter((message) => message.id !== assistantDraftId),
          createMessage("assistant", "Не вдалося зв'язатися з AI консультантом. Спробуйте трохи пізніше."),
        ]),
      );
      scrollToBottom();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="pointer-events-none z-[45] desktop:fixed desktop:bottom-6 desktop:right-8 desktop:z-50">
      <AnimatePresence>
        {open ? (
          <div className="pointer-events-none fixed inset-0 z-[46] flex items-center justify-center px-3 pt-10 pb-3 desktop:static desktop:z-auto desktop:flex desktop:items-end desktop:justify-end desktop:px-0 desktop:py-0">
            <motion.section
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className="app-chat-panel pointer-events-auto flex w-[min(calc(100vw-24px),368px)] max-h-[min(620px,calc(100dvh-24px))] flex-col overflow-hidden rounded-[14px] border shadow-[0_26px_60px_rgba(0,0,0,0.22)] backdrop-blur-[30px] desktop:mb-3 desktop:w-[368px] desktop:max-h-[min(620px,76dvh)]"
            >
                <header className="app-subtle-surface-soft flex shrink-0 items-center gap-3 border-b border-app-border-light px-4 py-4">
                  <div className="app-subtle-surface-strong inline-flex h-10 w-10 items-center justify-center rounded-full border border-app-border-light text-app-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <Bot size={16} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[18px] leading-none text-app-primary">AI Консультант</p>
                    <p className="mt-1 font-body text-[10px] uppercase tracking-[0.14em] text-app-muted">
                      Книжковий добір Library
                    </p>
                  </div>

                  <span
                    className={cn(
                      "rounded-pill border px-3 py-[6px] font-body text-[9px] uppercase tracking-[0.12em]",
                      stateClass,
                    )}
                  >
                    {stateLabel}
                  </span>

                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="app-subtle-surface-strong inline-flex h-9 w-9 items-center justify-center rounded-full border border-app-border-light text-app-secondary transition duration-fast hover:border-app-border-hover hover:bg-app-hover hover:text-app-primary"
                      aria-label="Закрити AI чат"
                    >
                    <X size={14} />
                  </button>
                </header>

                <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                  <div className="space-y-4">
                    {shouldShowQuickActions ? (
                      <motion.section
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="app-subtle-surface rounded-[12px] border border-app-border-light p-4"
                      >
                        <div className="flex items-center gap-2 text-app-primary">
                          <Sparkles size={14} className="text-app-primary/80" />
                          <p className="font-body text-[10px] uppercase tracking-[0.14em] text-app-muted">
                            Швидкі добірки
                          </p>
                        </div>
                        <p className="mt-3 font-body text-sm leading-relaxed text-app-secondary">
                          Опишіть настрій, жанр, бюджет або кому шукаєте книгу - я запропоную лише реальні варіанти з каталогу.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {QUICK_ACTIONS.map((action) => (
                            <button
                              key={action.label}
                              type="button"
                              onClick={() => void sendMessage(action.prompt)}
                              disabled={pending || serviceState === "not_configured"}
                              className="app-subtle-surface-soft rounded-pill border border-app-border-light px-3 py-[9px] font-body text-[11px] uppercase tracking-[0.08em] text-app-secondary transition duration-fast hover:border-app-border-hover hover:bg-app-hover hover:text-app-primary disabled:opacity-45"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </motion.section>
                    ) : null}

                    <AnimatePresence initial={false}>
                      {messages.map((message) => (
                        <motion.article
                          key={message.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className={cn(
                            "rounded-[12px] border px-4 py-3 font-body text-[15px] leading-[1.6]",
                            message.role === "user"
                              ? "app-chat-bubble-user ml-auto max-w-[92%] border-app-border-hover text-app-primary"
                              : "app-chat-bubble-assistant mr-auto w-full max-w-full border-app-border-light text-app-primary",
                          )}
                        >
                          <div className="space-y-2 whitespace-pre-line break-words">
                            {message.content || (message.role === "assistant" && pending ? "…" : "")}
                          </div>

                          {message.role === "assistant" && Array.isArray(message.sources) && message.sources.length > 0 ? (
                            <div className="mt-3 grid min-w-0 gap-2">
                              {message.sources.slice(0, 5).map((book) => (
                                <div
                                  key={`${message.id}-${book.bookId}`}
                                  className="min-w-0 rounded-[10px] border border-app-border-light/70 bg-app-card/50 px-3 py-2"
                                >
                                  <div className="grid min-w-0 grid-cols-[1fr_auto] items-start gap-2">
                                    <div className="min-w-0">
                                      <Link
                                        href={book.href || `/books/${book.bookId}`}
                                        className="break-words text-sm font-medium leading-tight text-app-primary underline-offset-2 transition-colors duration-fast hover:text-app-info hover:underline"
                                      >
                                        {book.title}
                                      </Link>
                                      <p className="truncate text-[11px] tracking-[0.04em] text-app-muted">
                                        {book.authors}
                                      </p>
                                    </div>
                                    <p className="shrink-0 text-[11px] text-app-secondary">{book.price.toFixed(2)} UAH</p>
                                  </div>

                                  <div className="mt-2 grid gap-2">
                                    <p className="text-[11px] text-app-secondary/90">
                                      {book.stockQuantity > 0 ? "В наявності" : "Немає в наявності"}
                                    </p>

                                    {canUseCartActions ? (
                                      <button
                                        type="button"
                                        onClick={() => void addBookToCart(book, message.eventId)}
                                        className="inline-flex h-8 w-full min-w-0 items-center justify-center rounded-pill border border-app-border-light px-3 text-[10px] tracking-[0.06em] text-app-primary transition duration-fast hover:border-app-border-hover hover:bg-app-hover"
                                      >
                                        Додати в кошик
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const loginMessage = encodeURIComponent(
                                            "Щоб додавати книги в кошик, увійдіть у профіль",
                                          );
                                          router.push(`/profile?message=${loginMessage}`);
                                        }}
                                        className="inline-flex h-8 w-full min-w-0 items-center justify-center rounded-pill border border-app-border-light px-3 text-[10px] tracking-[0.06em] text-app-secondary transition duration-fast hover:border-app-border-hover hover:bg-app-hover hover:text-app-primary"
                                      >
                                        Увійти для кошика
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}

                          {message.role === "assistant" && message.eventId ? (
                            <div className="mt-3 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  markMessageFeedback(message.id, "up");
                                  void sendFeedback(message.eventId, { useful: true });
                                }}
                                className={cn(
                                  "inline-flex h-8 w-8 items-center justify-center rounded-full border transition duration-fast",
                                  message.feedback === "up"
                                    ? "border-app-success/60 bg-app-success/20 text-app-success"
                                    : "border-app-border-light text-app-secondary hover:border-app-border-hover hover:text-app-primary",
                                )}
                                aria-label="Корисна відповідь"
                              >
                                {message.feedback === "up" ? <Check size={13} /> : <ThumbsUp size={13} />}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  markMessageFeedback(message.id, "down");
                                  void sendFeedback(message.eventId, { useful: false });
                                }}
                                className={cn(
                                  "inline-flex h-8 w-8 items-center justify-center rounded-full border transition duration-fast",
                                  message.feedback === "down"
                                    ? "border-app-error/60 bg-app-error/15 text-app-error"
                                    : "border-app-border-light text-app-secondary hover:border-app-border-hover hover:text-app-primary",
                                )}
                                aria-label="Некорисна відповідь"
                              >
                                <ThumbsDown size={13} />
                              </button>
                            </div>
                          ) : null}
                        </motion.article>
                      ))}
                    </AnimatePresence>

                    {pending ? (
                      <motion.article
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="app-chat-bubble-assistant mr-auto w-full max-w-full rounded-[12px] border border-app-border-light px-4 py-3"
                      >
                        <div className="flex items-center gap-2 font-body text-xs uppercase tracking-[0.12em] text-app-muted">
                          <Loader2 size={12} className="animate-spin" />
                          Підбираю книги
                        </div>
                        <p className="mt-2 font-body text-sm leading-relaxed text-app-secondary">
                          Перевіряю жанр, бюджет, мову й наявність у каталозі.
                        </p>
                      </motion.article>
                    ) : null}

                    {serviceState === "not_configured" ? (
                      <article className="rounded-[12px] border border-app-warning/45 bg-app-warning/10 px-4 py-3 font-body text-xs text-app-warning">
                        Gemini ще не налаштовано на сервері. Додайте `GEMINI_API_KEY` і `GEMINI_MODEL=gemini-3-flash-preview` у Vercel Environment Variables.
                      </article>
                    ) : null}
                  </div>
                </div>

                <footer className="app-chat-footer shrink-0 border-t border-app-border-light px-4 py-4">
                  <div className="grid grid-cols-[1fr_52px] items-stretch gap-3">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value.slice(0, MAX_INPUT_LENGTH))}
                      rows={1}
                      placeholder="Жанр, настрій, бюджет..."
                      disabled={pending || serviceState === "not_configured"}
                      className="app-subtle-surface h-[52px] min-h-[52px] w-full resize-none overflow-hidden rounded-[10px] border border-app-border-light px-4 py-[13px] font-body text-[14px] leading-[1.45] text-app-primary outline-none transition duration-fast placeholder:text-[13px] placeholder:text-app-muted focus:border-app-border-hover disabled:opacity-55"
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void sendMessage();
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => void sendMessage()}
                      disabled={!canSend}
                      className="app-subtle-surface-strong inline-flex h-[52px] w-[52px] flex-none items-center justify-center rounded-[10px] border border-app-border-light text-app-primary transition duration-fast hover:border-app-border-hover hover:bg-app-hover hover:text-app-primary disabled:opacity-45"
                      aria-label="Надіслати повідомлення"
                    >
                      <SendHorizontal size={14} />
                    </button>
                  </div>
                </footer>
            </motion.section>
          </div>
        ) : null}
      </AnimatePresence>

      <div className="mobile-ai-trigger-shell pointer-events-auto desktop:static">
        <AnimatePresence>
          {!open ? (
            <motion.button
              key="ai-chat-trigger"
              type="button"
              onClick={() => setOpen(true)}
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              whileTap={{ scale: 0.96 }}
              className="app-mobile-nav-panel group relative inline-flex h-[var(--mobile-ai-trigger-size)] w-[var(--mobile-ai-trigger-size)] items-center justify-center overflow-hidden rounded-[999px] border border-app-border-light text-app-primary shadow-[var(--shadow-mobile-nav)] backdrop-blur-[28px] transition duration-fast hover:border-app-border-hover hover:bg-app-hover desktop:h-[58px] desktop:w-[58px]"
              aria-label="Відкрити AI чат"
            >
              <span className="pointer-events-none absolute inset-x-[18%] top-0 h-[1px] bg-[linear-gradient(90deg,transparent_0%,var(--color-card-top-glow)_50%,transparent_100%)]" />
              <span className="pointer-events-none absolute inset-0 rounded-[999px] bg-[linear-gradient(180deg,var(--color-shell-control-highlight)_0%,transparent_48%,rgba(0,0,0,0.08)_100%)]" />
              <motion.span
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 inline-flex items-center justify-center text-app-primary"
              >
                <Bot size={24} className="desktop:h-[20px] desktop:w-[20px]" />
              </motion.span>
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

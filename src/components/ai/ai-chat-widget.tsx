"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, SendHorizontal, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/cn";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type ServiceState = "ready" | "not_configured" | "error";

type QuickAction = {
  label: string;
  prompt: string;
};

const MAX_HISTORY = 10;
const MAX_INPUT_LENGTH = 700;
const INITIAL_MESSAGE =
  "Вітаю. Я підберу книги за настроєм, жанром, бюджетом і наявністю в каталозі Library.";

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Щось українське", prompt: "Порадь щось українське з реальних книг у наявності" },
  { label: "Темне фентезі", prompt: "Порадь темне фентезі з наявних книг" },
  { label: "До 500 грн", prompt: "Підбери книгу до 500 грн" },
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
  const [open, setOpen] = useState(false);
  const [serviceState, setServiceState] = useState<ServiceState>("ready");
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([createMessage("assistant", INITIAL_MESSAGE)]);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.body.classList.toggle("mobile-ai-chat-open", open);

    return () => {
      document.body.classList.remove("mobile-ai-chat-open");
    };
  }, [open]);

  const stateLabel = useMemo(() => {
    if (serviceState === "not_configured") {
      return "Не налаштовано";
    }

    if (serviceState === "error") {
      return "Помилка";
    }

    return "Онлайн";
  }, [serviceState]);

  const stateClass = useMemo(() => {
    if (serviceState === "not_configured") {
      return "border-app-warning/45 bg-app-warning/10 text-app-warning";
    }

    if (serviceState === "error") {
      return "border-app-error/45 bg-app-error/10 text-app-error";
    }

    return "border-app-success/45 bg-app-success/10 text-app-success";
  }, [serviceState]);

  const shouldShowQuickActions = messages.length <= 2;

  const scrollToBottom = () => {
    const container = bodyRef.current;
    if (!container) {
      return;
    }

    window.requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  };

  const sendMessage = async (rawText?: string) => {
    const text = (rawText ?? draft).trim();

    if (text.length === 0 || pending || serviceState === "not_configured") {
      return;
    }

    const userMessage = createMessage("user", text.slice(0, MAX_INPUT_LENGTH));
    const nextMessages = trimMessages([...messages, userMessage]);

    setMessages(nextMessages);
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
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | {
            message?: string;
            error?: string;
            code?: string;
          }
        | null;

      if (response.status === 503 && data?.code === "AI_NOT_CONFIGURED") {
        setServiceState("not_configured");
        setMessages((current) =>
          trimMessages([
            ...current,
            createMessage("assistant", data.error || "AI сервіс тимчасово не налаштований."),
          ]),
        );
        scrollToBottom();
        return;
      }

      if (!response.ok || !data?.message) {
        setServiceState("error");
        setMessages((current) =>
          trimMessages([
            ...current,
            createMessage("assistant", data?.error || "Не вдалося отримати відповідь асистента."),
          ]),
        );
        scrollToBottom();
        return;
      }

      setServiceState("ready");
      setMessages((current) =>
        trimMessages([
          ...current,
          createMessage("assistant", normalizeAssistantMessage(data.message || "")),
        ]),
      );
      scrollToBottom();
    } catch {
      setServiceState("error");
      setMessages((current) =>
        trimMessages([
          ...current,
          createMessage("assistant", "Не вдалося зв'язатися з AI консультантом. Спробуйте трохи пізніше."),
        ]),
      );
      scrollToBottom();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="pointer-events-none mobile-ai-trigger-shell z-[45] desktop:fixed desktop:bottom-6 desktop:right-8 desktop:z-50">
      <div className="pointer-events-auto flex flex-col items-end">
        <AnimatePresence>
          {open ? (
            <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--mobile-bottom-cluster-bottom)+2px)] z-[46] flex justify-center px-3 desktop:static desktop:z-auto desktop:flex desktop:justify-end desktop:px-0">
              <motion.section
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 14, scale: 0.98 }}
                transition={{ duration: 0.22 }}
                className="pointer-events-auto flex w-[min(calc(100vw-24px),368px)] max-h-[min(620px,calc(100dvh-24px))] flex-col overflow-hidden rounded-[14px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,10,11,0.975)_0%,rgba(5,5,6,0.988)_100%)] shadow-[0_26px_60px_rgba(0,0,0,0.52)] backdrop-blur-[30px] desktop:mb-3 desktop:w-[368px] desktop:max-h-[min(620px,76dvh)]"
              >
                <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.08] bg-white/[0.01] px-4 py-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-app-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
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
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-app-secondary transition duration-fast hover:bg-white/[0.06] hover:text-app-primary"
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
                        className="rounded-[12px] border border-white/[0.08] bg-white/[0.025] p-4"
                      >
                        <div className="flex items-center gap-2 text-app-primary">
                          <Sparkles size={14} className="text-white/80" />
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
                              className="rounded-pill border border-white/[0.08] bg-white/[0.02] px-3 py-[9px] font-body text-[11px] uppercase tracking-[0.08em] text-app-secondary transition duration-fast hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-app-primary disabled:opacity-45"
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
                            "max-w-[92%] rounded-[12px] border px-4 py-3 font-body text-[15px] leading-[1.6]",
                            message.role === "user"
                              ? "ml-auto border-white/[0.1] bg-white/[0.07] text-app-primary"
                              : "mr-auto border-white/[0.08] bg-white/[0.035] text-app-primary",
                          )}
                        >
                          <div className="space-y-2 whitespace-pre-line break-words">
                            {message.content}
                          </div>
                        </motion.article>
                      ))}
                    </AnimatePresence>

                    {pending ? (
                      <motion.article
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mr-auto rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-4 py-3"
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

                <footer className="shrink-0 border-t border-white/[0.08] bg-black/[0.16] px-4 py-4">
                  <div className="grid grid-cols-[1fr_52px] items-stretch gap-3">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value.slice(0, MAX_INPUT_LENGTH))}
                      rows={2}
                      placeholder="Напишіть настрій, жанр, бюджет або схожість з улюбленою книгою..."
                      disabled={pending || serviceState === "not_configured"}
                      className="h-[52px] min-h-[52px] w-full resize-none rounded-[10px] border border-white/[0.08] bg-white/[0.02] px-4 py-[13px] font-body text-[15px] leading-[1.45] text-app-primary outline-none transition duration-fast placeholder:text-app-muted focus:border-app-white disabled:opacity-55"
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
                      disabled={pending || draft.trim().length === 0 || serviceState === "not_configured"}
                      className="inline-flex h-[52px] w-[52px] flex-none items-center justify-center rounded-[10px] border border-white/[0.14] bg-white/[0.03] text-app-primary transition duration-fast hover:bg-white/[0.08] hover:text-app-primary disabled:opacity-45"
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
              className="group relative inline-flex h-[var(--mobile-ai-trigger-size)] w-[var(--mobile-ai-trigger-size)] items-center justify-center overflow-hidden rounded-[999px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(11,11,13,0.82)_0%,rgba(6,6,8,0.96)_100%)] text-app-primary shadow-[0_18px_36px_rgba(0,0,0,0.34)] backdrop-blur-[28px] transition duration-fast hover:border-white/[0.12] hover:bg-[linear-gradient(180deg,rgba(14,14,16,0.88)_0%,rgba(7,7,9,0.98)_100%)] desktop:h-[54px] desktop:w-[54px] desktop:border-white/[0.12] desktop:shadow-[0_16px_34px_rgba(0,0,0,0.38)]"
              aria-label="Відкрити AI чат"
            >
              <span className="pointer-events-none absolute inset-x-[18%] top-0 h-[1px] bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0)_100%)]" />
              <span className="pointer-events-none absolute inset-0 rounded-[999px] bg-[linear-gradient(180deg,rgba(255,255,255,0.012)_0%,rgba(255,255,255,0)_48%,rgba(0,0,0,0.14)_100%)]" />
              <motion.span
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 inline-flex items-center justify-center text-white/92"
              >
                <Bot size={18} className="desktop:h-[18px] desktop:w-[18px]" />
              </motion.span>
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

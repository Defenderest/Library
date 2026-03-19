"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuthSession } from "@/components/providers/auth-session-provider";
import { cn } from "@/lib/cn";

type BookReviewFormProps = {
  bookId: number;
};

type MessageTone = "success" | "error" | "info";

function toneClass(tone: MessageTone): string {
  if (tone === "success") {
    return "text-app-success";
  }

  if (tone === "error") {
    return "text-app-error";
  }

  return "text-app-secondary";
}

export function BookReviewForm({ bookId }: BookReviewFormProps) {
  const router = useRouter();
  const { session, loading } = useAuthSession();

  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ tone: MessageTone; text: string } | null>(null);
  const reviewLength = reviewText.trim().length;
  const canSubmit = reviewLength >= 5 && !submitting;

  const submitReview = async () => {
    if (!session || submitting || reviewLength < 5) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/books/${bookId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewText,
          rating,
        }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;

      if (response.status === 401) {
        const authMessage = encodeURIComponent("Щоб залишити відгук, увійдіть у профіль");
        router.push(`/profile?message=${authMessage}`);
        return;
      }

      if (!response.ok) {
        setMessage({
          tone: "error",
          text: data?.error || "Не вдалося зберегти відгук",
        });
        return;
      }

      setReviewText("");
      setRating(5);
      setMessage({
        tone: "success",
        text: data?.message || "Відгук успішно додано",
      });
      router.refresh();
    } catch {
      setMessage({
        tone: "error",
        text: "Не вдалося зберегти відгук",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-soft border border-app-border-light bg-white/[0.02] p-m">
        <p className="font-body text-sm text-app-secondary">Перевіряємо можливість залишити відгук...</p>
      </div>
    );
  }

  if (!session) {
    const authMessage = encodeURIComponent("Щоб залишити відгук, увійдіть у профіль");

    return (
      <div className="rounded-soft border border-app-border-light bg-white/[0.02] p-m">
        <p className="font-display text-[22px] text-app-primary">Залишити відгук</p>
        <p className="mt-2 font-body text-sm leading-relaxed text-app-secondary">
          Відгуки доступні для авторизованих читачів. Увійдіть у профіль, щоб оцінити книгу та
          поділитися враженнями.
        </p>
        <Link
          href={`/profile?message=${authMessage}`}
          className="mt-4 inline-flex h-[44px] items-center justify-center rounded-sharp border border-app-white px-6 font-body text-xs uppercase tracking-[0.12em] text-app-primary transition duration-fast hover:bg-app-white hover:text-app-body"
        >
          Увійти для відгуку
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-soft border border-app-border-light bg-white/[0.02] p-m">
      <p className="font-display text-[22px] text-app-primary">Ваш відгук</p>

      <p className="mt-2 font-body text-sm leading-relaxed text-app-secondary">
        Оцініть книгу та залиште короткий відгук у стилі читацької нотатки.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <p className="font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">Оцінка</p>
          <div className="mt-2 flex items-center gap-[2px]">
            {Array.from({ length: 5 }).map((_, index) => {
              const starValue = index + 1;
              const active = starValue <= rating;

              return (
                <button
                  key={`review-star-${starValue}`}
                  type="button"
                  onClick={() => setRating(starValue)}
                  className={cn(
                    "inline-flex h-10 w-7 items-center justify-center bg-transparent transition duration-fast",
                    active
                      ? "text-app-primary"
                      : "text-app-secondary hover:text-app-primary",
                  )}
                  aria-label={`Оцінка ${starValue} з 5`}
                >
                  <span className="text-[24px] leading-none">{active ? "★" : "☆"}</span>
                </button>
              );
            })}
            <span className="ml-s font-body text-sm text-app-secondary">{rating} / 5</span>
          </div>
        </div>

        <div>
          <p className="font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">Текст відгуку</p>
          <textarea
            value={reviewText}
            onChange={(event) => setReviewText(event.target.value)}
            rows={5}
            maxLength={1000}
            placeholder="Напишіть, що вас зачепило в цій книзі..."
            className="mt-2 w-full rounded-sharp border border-app-border-light bg-transparent px-m py-s font-body text-sm leading-relaxed text-app-primary outline-none transition duration-fast placeholder:text-app-muted focus:border-app-white"
          />
          <p className="mt-2 text-right font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">
            {reviewLength} / 1000
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-s">
          <button
            type="button"
            onClick={() => void submitReview()}
            disabled={!canSubmit}
            className="inline-flex h-[46px] items-center justify-center rounded-sharp border border-app-white px-8 font-body text-xs uppercase tracking-[0.12em] text-app-primary transition duration-fast hover:bg-app-white hover:text-app-body disabled:opacity-50"
          >
            {submitting ? "Зберігаємо..." : "Надіслати відгук"}
          </button>

          {message ? (
            <p className={cn("font-body text-xs", toneClass(message.tone))}>{message.text}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

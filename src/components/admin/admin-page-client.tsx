"use client";

import { AlertTriangle, ChevronDown, MessageSquare, Package, Shield, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BookCover } from "@/components/books/book-cover";
import { GlassPanel } from "@/components/ui/glass-panel";
import { SteppedNumberField } from "@/components/ui/stepped-number-field";
import { cn } from "@/lib/cn";
import type { AdminDashboardData } from "@/lib/admin/types";

type AdminPageClientProps = {
  initialData: AdminDashboardData;
  currentAdminId: number;
};

type AdminTabKey = "books" | "comments" | "orders" | "users";

type Notice = {
  tone: "success" | "error";
  text: string;
} | null;

type CreateBookFormState = {
  title: string;
  price: string;
  stockQuantity: string;
  genre: string;
  language: string;
  description: string;
  coverImagePath: string;
  isbn: string;
  pageCount: string;
  publicationDate: string;
  publisherId: string;
};

type UpdateBookFormState = {
  title: string;
  genre: string;
  language: string;
  description: string;
  coverImagePath: string;
  isbn: string;
  pageCount: string;
  publicationDate: string;
  publisherId: string;
};

const TAB_META: Array<{ key: AdminTabKey; label: string; icon: typeof Package }> = [
  { key: "books", label: "Книги", icon: Package },
  { key: "comments", label: "Коментарі", icon: MessageSquare },
  { key: "orders", label: "Замовлення", icon: Shield },
  { key: "users", label: "Користувачі", icon: UserCog },
];

const PANEL_LABEL_CLASS = "font-body text-[9px] uppercase tracking-[0.14em] text-app-muted";
const PANEL_VALUE_CLASS = "mt-1 font-display text-[24px] leading-none text-app-primary";
const BOOK_INFO_CARD_CLASS =
  "app-subtle-surface flex h-full min-h-[90px] flex-col justify-between rounded-soft border border-app-border-light px-m py-m backdrop-blur-[14px]";
const BOOK_CONTROL_CARD_CLASS =
  "app-subtle-surface flex h-full min-h-[132px] flex-col rounded-soft border border-app-border-light p-m backdrop-blur-[14px]";
const BOOK_INFO_VALUE_CLASS = "mt-4 break-words font-body text-[15px] leading-[1.45] text-app-primary/92";
const BOOK_INFO_METRIC_CLASS = "mt-4 font-display text-[32px] leading-none text-app-primary";
const BOOK_INLINE_VALUE_CLASS =
  "font-body text-[10px] uppercase tracking-[0.1em] text-app-secondary whitespace-nowrap";
const BOOK_ACTION_BUTTON_CLASS =
  "inline-flex h-[46px] min-w-0 items-center justify-center rounded-soft border px-m font-body text-[10px] uppercase tracking-[0.12em] transition-[color,background-color,border-color,transform] duration-fast hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-45";
const ADMIN_SELECT_CLASS =
  "app-subtle-surface h-[42px] w-full appearance-none rounded-sharp border border-app-border-light px-m pr-10 font-body text-sm text-app-primary outline-none transition duration-fast focus:border-app-border-hover";
const ADMIN_OPTION_STYLE = {
  backgroundColor: "var(--color-bg-body)",
  color: "var(--color-text-primary)",
};

const DEFAULT_CREATE_BOOK_FORM: CreateBookFormState = {
  title: "",
  price: "0",
  stockQuantity: "0",
  genre: "",
  language: "",
  description: "",
  coverImagePath: "",
  isbn: "",
  pageCount: "",
  publicationDate: "",
  publisherId: "",
};

const DEFAULT_UPDATE_BOOK_FORM: UpdateBookFormState = {
  title: "",
  genre: "",
  language: "",
  description: "",
  coverImagePath: "",
  isbn: "",
  pageCount: "",
  publicationDate: "",
  publisherId: "",
};

function formatMoney(value: number): string {
  return `${value.toFixed(2)} UAH`;
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function toDateInputValue(value: string): string {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function toPayloadNumber(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
}

function toPayloadOptionalInt(value: string): number | null {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.floor(parsed);
}

async function requestJson<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
  });

  const data = (await response.json().catch(() => null)) as { error?: string } | null;

  if (!response.ok) {
    const message = data?.error || "Не вдалося виконати дію";
    throw new Error(message);
  }

  return (data as T) ?? ({} as T);
}

function resolveErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Сталася помилка";
}

export function AdminPageClient({ initialData, currentAdminId }: AdminPageClientProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AdminTabKey>("books");
  const [notice, setNotice] = useState<Notice>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [booksQuery, setBooksQuery] = useState("");
  const [commentsQuery, setCommentsQuery] = useState("");
  const [ordersQuery, setOrdersQuery] = useState("");
  const [usersQuery, setUsersQuery] = useState("");
  const [adminOnlyFilter, setAdminOnlyFilter] = useState(false);

  const [createBookForm, setCreateBookForm] = useState<CreateBookFormState>(
    DEFAULT_CREATE_BOOK_FORM,
  );
  const [editingBookId, setEditingBookId] = useState<number | null>(null);
  const [updateBookForm, setUpdateBookForm] = useState<UpdateBookFormState>(
    DEFAULT_UPDATE_BOOK_FORM,
  );
  const [priceDrafts, setPriceDrafts] = useState<Record<number, string>>({});
  const [stockDrafts, setStockDrafts] = useState<Record<number, string>>({});
  const [orderStatusDrafts, setOrderStatusDrafts] = useState<
    Record<number, { status: string; trackingNumber: string }>
  >({});

  useEffect(() => {
    const nextPriceDrafts: Record<number, string> = {};
    for (const book of initialData.books) {
      nextPriceDrafts[book.bookId] = book.price.toFixed(2);
    }
    setPriceDrafts(nextPriceDrafts);
  }, [initialData.books]);

  const filteredBooks = (() => {
    const query = booksQuery.trim().toLowerCase();
    if (query.length === 0) {
      return initialData.books;
    }

    return initialData.books.filter((book) => {
      const payload = `${book.title} ${book.authors} ${book.genre} ${book.language} ${book.isbn}`.toLowerCase();
      return payload.includes(query);
    });
  })();

  const filteredComments = (() => {
    const query = commentsQuery.trim().toLowerCase();
    if (query.length === 0) {
      return initialData.comments;
    }

    return initialData.comments.filter((comment) => {
      const payload = `${comment.bookTitle} ${comment.customerName} ${comment.customerEmail} ${comment.commentText}`.toLowerCase();
      return payload.includes(query);
    });
  })();

  const filteredOrders = (() => {
    const query = ordersQuery.trim().toLowerCase();
    if (query.length === 0) {
      return initialData.orders;
    }

    return initialData.orders.filter((order) => {
      const payload = `${order.orderId} ${order.customerName} ${order.customerEmail} ${order.currentStatus}`.toLowerCase();
      return payload.includes(query);
    });
  })();

  const filteredUsers = (() => {
    const query = usersQuery.trim().toLowerCase();

    return initialData.users.filter((user) => {
      if (adminOnlyFilter && !user.isAdmin) {
        return false;
      }

      if (query.length === 0) {
        return true;
      }

      const payload = `${user.fullName} ${user.email} ${user.phone} ${user.address}`.toLowerCase();
      return payload.includes(query);
    });
  })();

  const lowStockCount = initialData.books.filter((book) => book.lowStock).length;

  async function runAction(actionKey: string, runner: () => Promise<void>) {
    setBusyAction(actionKey);
    setNotice(null);

    try {
      await runner();
      router.refresh();
    } catch (error) {
      setNotice({
        tone: "error",
        text: resolveErrorMessage(error),
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function submitCreateBook() {
    await runAction("create-book", async () => {
      const response = await requestJson<{ message?: string }>("/api/admin/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: createBookForm.title,
          price: toPayloadNumber(createBookForm.price),
          stockQuantity: Math.floor(toPayloadNumber(createBookForm.stockQuantity)),
          genre: createBookForm.genre,
          language: createBookForm.language,
          description: createBookForm.description,
          coverImagePath: createBookForm.coverImagePath,
          isbn: createBookForm.isbn,
          pageCount: toPayloadOptionalInt(createBookForm.pageCount),
          publicationDate: createBookForm.publicationDate,
          publisherId: toPayloadOptionalInt(createBookForm.publisherId),
        }),
      });

      setCreateBookForm(DEFAULT_CREATE_BOOK_FORM);
      setNotice({ tone: "success", text: response.message || "Книгу створено" });
    });
  }

  function openEditBook(bookId: number) {
    const targetBook = initialData.books.find((book) => book.bookId === bookId);
    if (!targetBook) {
      return;
    }

    setEditingBookId(bookId);
    setUpdateBookForm({
      title: targetBook.title,
      genre: targetBook.genre,
      language: targetBook.language,
      description: targetBook.description,
      coverImagePath: targetBook.coverImagePath,
      isbn: targetBook.isbn,
      pageCount: targetBook.pageCount > 0 ? String(targetBook.pageCount) : "",
      publicationDate: toDateInputValue(targetBook.publicationDate),
      publisherId: targetBook.publisherId ? String(targetBook.publisherId) : "",
    });
  }

  async function submitUpdateBook(bookId: number) {
    await runAction(`update-book-${bookId}`, async () => {
      const response = await requestJson<{ message?: string }>(`/api/admin/books/${bookId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: updateBookForm.title,
          genre: updateBookForm.genre,
          language: updateBookForm.language,
          description: updateBookForm.description,
          coverImagePath: updateBookForm.coverImagePath,
          isbn: updateBookForm.isbn,
          pageCount: toPayloadOptionalInt(updateBookForm.pageCount),
          publicationDate: updateBookForm.publicationDate,
          publisherId: toPayloadOptionalInt(updateBookForm.publisherId),
        }),
      });

      setEditingBookId(null);
      setNotice({ tone: "success", text: response.message || "Книгу оновлено" });
    });
  }

  async function submitBookPrice(bookId: number) {
    await runAction(`price-${bookId}`, async () => {
      const response = await requestJson<{ message?: string }>(`/api/admin/books/${bookId}/price`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price: toPayloadNumber(priceDrafts[bookId] ?? "0"),
        }),
      });

      setNotice({ tone: "success", text: response.message || "Ціну оновлено" });
    });
  }

  async function submitBookStockIncrement(bookId: number) {
    await runAction(`stock-${bookId}`, async () => {
      const incrementBy = Math.max(1, Math.floor(toPayloadNumber(stockDrafts[bookId] ?? "1")));
      const response = await requestJson<{ message?: string }>(`/api/admin/books/${bookId}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ incrementBy }),
      });

      setStockDrafts((current) => ({ ...current, [bookId]: "" }));
      setNotice({ tone: "success", text: response.message || "Залишок оновлено" });
    });
  }

  async function submitDeleteBook(bookId: number) {
    if (!window.confirm("Видалити цю книгу? Дію неможливо скасувати.")) {
      return;
    }

    await runAction(`delete-book-${bookId}`, async () => {
      const response = await requestJson<{ message?: string }>(`/api/admin/books/${bookId}`, {
        method: "DELETE",
      });

      setNotice({ tone: "success", text: response.message || "Книгу видалено" });
    });
  }

  async function submitDeleteComment(commentId: number) {
    if (!window.confirm("Видалити цей коментар?")) {
      return;
    }

    await runAction(`delete-comment-${commentId}`, async () => {
      const response = await requestJson<{ message?: string }>(`/api/admin/comments/${commentId}`, {
        method: "DELETE",
      });

      setNotice({ tone: "success", text: response.message || "Коментар видалено" });
    });
  }

  async function submitAddOrderStatus(orderId: number) {
    const draft = orderStatusDrafts[orderId] ?? { status: "", trackingNumber: "" };

    await runAction(`order-status-${orderId}`, async () => {
      const response = await requestJson<{ message?: string }>(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: draft.status,
          trackingNumber: draft.trackingNumber,
        }),
      });

      setOrderStatusDrafts((current) => ({
        ...current,
        [orderId]: {
          status: "",
          trackingNumber: "",
        },
      }));

      setNotice({ tone: "success", text: response.message || "Статус додано" });
    });
  }

  async function submitToggleAdminRole(customerId: number, targetRole: boolean) {
    await runAction(`toggle-user-${customerId}`, async () => {
      const response = await requestJson<{ message?: string }>(
        `/api/admin/users/${customerId}/admin-role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isAdmin: targetRole,
          }),
        },
      );

      setNotice({ tone: "success", text: response.message || "Роль оновлено" });
    });
  }

  return (
    <section className="space-y-8">
      <GlassPanel className="p-5 mobile:p-8">
        <p className="font-body text-[10px] uppercase tracking-[0.18em] text-app-muted">Панель керування</p>
        <h2 className="mt-s font-display text-[34px] leading-tight text-app-primary mobile:text-[44px]">
          Адміністрування
        </h2>
        <p className="mt-s max-w-3xl font-body text-sm text-app-secondary">
          Керування книгами, коментарями, замовленнями та ролями користувачів у єдиному робочому
          просторі.
        </p>

        <div className="mt-m grid gap-s mobile:grid-cols-4">
          <div className="rounded-soft border border-app-border-light bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,rgba(255,255,255,0.012)_100%)] p-m">
            <p className={PANEL_LABEL_CLASS}>Книги</p>
            <p className={PANEL_VALUE_CLASS}>{initialData.books.length}</p>
          </div>
          <div className="rounded-soft border border-app-border-light bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,rgba(255,255,255,0.012)_100%)] p-m">
            <p className={PANEL_LABEL_CLASS}>Низький залишок</p>
            <p className={PANEL_VALUE_CLASS}>{lowStockCount}</p>
          </div>
          <div className="rounded-soft border border-app-border-light bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,rgba(255,255,255,0.012)_100%)] p-m">
            <p className={PANEL_LABEL_CLASS}>Коментарі</p>
            <p className={PANEL_VALUE_CLASS}>{initialData.comments.length}</p>
          </div>
          <div className="rounded-soft border border-app-border-light bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,rgba(255,255,255,0.012)_100%)] p-m">
            <p className={PANEL_LABEL_CLASS}>Користувачі</p>
            <p className={PANEL_VALUE_CLASS}>{initialData.users.length}</p>
          </div>
        </div>
      </GlassPanel>

      <div className="flex flex-wrap gap-s">
        {TAB_META.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "inline-flex h-[44px] items-center gap-s rounded-pill border px-m font-body text-xs uppercase tracking-[0.12em] transition duration-fast",
                active
                  ? "border-app-border-hover bg-app-hover text-app-primary"
                  : "border-app-border-light bg-transparent text-app-secondary hover:border-app-border-hover hover:bg-app-hover hover:text-app-primary",
              )}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {notice ? (
        <div
          className={cn(
            "rounded-soft border px-m py-s font-body text-sm",
            notice.tone === "success"
              ? "border-app-success/45 bg-app-success/10 text-app-success"
              : "border-app-error/45 bg-app-error/10 text-app-error",
          )}
        >
          {notice.text}
        </div>
      ) : null}

      {activeTab === "books" ? (
        <div className="space-y-5">
          <GlassPanel className="p-m">
            <div className="flex flex-wrap items-center gap-s">
              <p className="font-display text-[28px] text-app-primary">Керування книгами</p>
              <div className="ml-auto w-full mobile:w-[320px]">
                <input
                  value={booksQuery}
                  onChange={(event) => setBooksQuery(event.target.value)}
                  placeholder="Пошук: назва, автор, жанр, мова"
                  className="app-subtle-surface h-[42px] w-full rounded-sharp border border-app-border-light px-m font-body text-sm text-app-primary outline-none placeholder:text-app-muted focus:border-app-border-hover"
                />
              </div>
            </div>
          </GlassPanel>

          <div className="grid gap-m compact:grid-cols-[340px_1fr]">
            <GlassPanel className="p-m">
              <h3 className="font-display text-[26px] text-app-primary">Нова книга</h3>
              <div className="mt-m space-y-s">
                <input
                  value={createBookForm.title}
                  onChange={(event) =>
                    setCreateBookForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Назва *"
                  className="app-subtle-surface h-[42px] w-full rounded-sharp border border-app-border-light px-m font-body text-sm text-app-primary outline-none placeholder:text-app-muted focus:border-app-border-hover"
                />

                <div className="grid grid-cols-2 gap-s">
                  <SteppedNumberField
                    value={createBookForm.price}
                    onChange={(value) =>
                      setCreateBookForm((current) => ({ ...current, price: value }))
                    }
                    min={0}
                    step={0.01}
                    placeholder="Ціна"
                  />

                  <SteppedNumberField
                    value={createBookForm.stockQuantity}
                    onChange={(value) =>
                      setCreateBookForm((current) => ({ ...current, stockQuantity: value }))
                    }
                    min={0}
                    step={1}
                    placeholder="Склад"
                  />
                </div>

                <div className="grid grid-cols-2 gap-s">
                  <input
                    value={createBookForm.genre}
                    onChange={(event) =>
                      setCreateBookForm((current) => ({ ...current, genre: event.target.value }))
                    }
                    placeholder="Жанр"
                    className="app-subtle-surface h-[42px] w-full rounded-sharp border border-app-border-light px-m font-body text-sm text-app-primary outline-none placeholder:text-app-muted focus:border-app-border-hover"
                  />
                  <input
                    value={createBookForm.language}
                    onChange={(event) =>
                      setCreateBookForm((current) => ({ ...current, language: event.target.value }))
                    }
                    placeholder="Мова"
                    className="app-subtle-surface h-[42px] w-full rounded-sharp border border-app-border-light px-m font-body text-sm text-app-primary outline-none placeholder:text-app-muted focus:border-app-border-hover"
                  />
                </div>

                <input
                  value={createBookForm.coverImagePath}
                  onChange={(event) =>
                    setCreateBookForm((current) => ({ ...current, coverImagePath: event.target.value }))
                  }
                  placeholder="URL обкладинки (Cloudinary або інший)"
                  className="app-subtle-surface h-[42px] w-full rounded-sharp border border-app-border-light px-m font-body text-sm text-app-primary outline-none placeholder:text-app-muted focus:border-app-border-hover"
                />

                <div className="grid grid-cols-2 gap-s">
                  <input
                    value={createBookForm.isbn}
                    onChange={(event) =>
                      setCreateBookForm((current) => ({ ...current, isbn: event.target.value }))
                    }
                    placeholder="ISBN"
                    className="app-subtle-surface h-[42px] w-full rounded-sharp border border-app-border-light px-m font-body text-sm text-app-primary outline-none placeholder:text-app-muted focus:border-app-border-hover"
                  />
                  <SteppedNumberField
                    value={createBookForm.pageCount}
                    onChange={(value) =>
                      setCreateBookForm((current) => ({ ...current, pageCount: value }))
                    }
                    min={0}
                    step={1}
                    placeholder="Сторінки"
                  />
                </div>

                <div className="grid grid-cols-2 gap-s">
                  <input
                    type="date"
                    value={createBookForm.publicationDate}
                    onChange={(event) =>
                      setCreateBookForm((current) => ({ ...current, publicationDate: event.target.value }))
                    }
                    className="app-subtle-surface h-[42px] w-full rounded-sharp border border-app-border-light px-m font-body text-sm text-app-primary outline-none focus:border-app-border-hover"
                  />

                  <div className="relative">
                    <select
                      value={createBookForm.publisherId}
                      onChange={(event) =>
                        setCreateBookForm((current) => ({ ...current, publisherId: event.target.value }))
                      }
                      className={ADMIN_SELECT_CLASS}
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="" style={ADMIN_OPTION_STYLE}>
                        Видавець (не вказано)
                      </option>
                      {initialData.publishers.map((publisher) => (
                        <option
                          key={publisher.publisherId}
                          value={publisher.publisherId}
                          style={ADMIN_OPTION_STYLE}
                        >
                          {publisher.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-s top-1/2 -translate-y-1/2 text-app-muted"
                    />
                  </div>
                </div>

                <textarea
                  value={createBookForm.description}
                  onChange={(event) =>
                    setCreateBookForm((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Короткий опис"
                  rows={4}
                  className="app-subtle-surface w-full rounded-sharp border border-app-border-light px-m py-s font-body text-sm text-app-primary outline-none placeholder:text-app-muted focus:border-app-border-hover"
                />

                <button
                  type="button"
                  onClick={() => void submitCreateBook()}
                  disabled={busyAction === "create-book"}
                  className="mt-s inline-flex h-[46px] w-full items-center justify-center rounded-sharp border border-app-border-hover bg-transparent font-body text-xs uppercase tracking-[0.13em] text-app-primary transition duration-fast hover:bg-app-hover disabled:opacity-50"
                >
                  {busyAction === "create-book" ? "Створення..." : "Додати книгу"}
                </button>
              </div>
            </GlassPanel>

            <div className="space-y-s">
              {filteredBooks.map((book) => {
                const priceValue = priceDrafts[book.bookId] ?? book.price.toFixed(2);
                const stockValue = stockDrafts[book.bookId] ?? "";
                const inEditMode = editingBookId === book.bookId;

                return (
                  <GlassPanel key={book.bookId} className="p-m mobile:p-l">
                    <div className="grid gap-m mobile:grid-cols-[78px_1fr]">
                      <BookCover
                        title={book.title}
                        imagePath={book.coverImagePath}
                        className="h-[108px] w-[78px] rounded-soft"
                        imageClassName="brightness-[0.92] contrast-[1.06] saturate-[0.9]"
                      />

                      <div className="min-w-0 space-y-s">
                        <div className="flex flex-wrap items-start gap-m">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display text-[24px] leading-tight text-app-primary">
                              {book.title}
                            </p>
                            <p className="truncate font-body text-xs text-app-muted">{book.authors}</p>
                          </div>

                          {book.lowStock ? (
                            <span className="inline-flex items-center gap-1 rounded-pill border border-app-warning/45 bg-app-warning/10 px-3 py-1 font-body text-[10px] uppercase tracking-[0.1em] text-app-warning">
                              <AlertTriangle size={12} />
                              Низький запас
                            </span>
                          ) : null}
                        </div>

                        <div className="grid gap-s mobile:grid-cols-2 compact:grid-cols-4">
                          <div className={BOOK_INFO_CARD_CLASS}>
                            <p className={PANEL_LABEL_CLASS}>Жанр</p>
                            <p className={BOOK_INFO_VALUE_CLASS}>{book.genre || "-"}</p>
                          </div>

                          <div className={BOOK_INFO_CARD_CLASS}>
                            <p className={PANEL_LABEL_CLASS}>Мова</p>
                            <p className={BOOK_INFO_VALUE_CLASS}>{book.language || "-"}</p>
                          </div>

                          <div className={BOOK_INFO_CARD_CLASS}>
                            <p className={PANEL_LABEL_CLASS}>Коментарі</p>
                            <p className={BOOK_INFO_METRIC_CLASS}>{book.commentCount}</p>
                          </div>

                          <div className={BOOK_INFO_CARD_CLASS}>
                            <p className={PANEL_LABEL_CLASS}>Видавець</p>
                            <p className={BOOK_INFO_VALUE_CLASS}>{book.publisherName || "-"}</p>
                          </div>
                        </div>

                        <div className="grid gap-s mobile:grid-cols-2 compact:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_272px] compact:items-stretch">
                          <div className={BOOK_CONTROL_CARD_CLASS}>
                            <div className="flex items-center justify-between gap-s">
                              <p className={PANEL_LABEL_CLASS}>Оновити ціну</p>
                              <span className={BOOK_INLINE_VALUE_CLASS}>{formatMoney(book.price)}</span>
                            </div>
                            <div className="mt-auto grid grid-cols-[1fr_auto] items-center gap-s pt-4">
                              <SteppedNumberField
                                value={priceValue}
                                onChange={(value) =>
                                  setPriceDrafts((current) => ({
                                    ...current,
                                    [book.bookId]: value,
                                  }))
                                }
                                min={0}
                                step={0.01}
                                inputClassName="app-subtle-surface h-[44px] rounded-soft border-app-border-light"
                              />
                              <button
                                type="button"
                                onClick={() => void submitBookPrice(book.bookId)}
                                disabled={busyAction === `price-${book.bookId}`}
                                className={cn(
                                  BOOK_ACTION_BUTTON_CLASS,
                                  "app-subtle-surface-strong min-w-[72px] border-app-border-light text-app-primary hover:border-app-border-hover hover:bg-app-hover",
                                )}
                              >
                                Ок
                              </button>
                            </div>
                          </div>

                          <div className={BOOK_CONTROL_CARD_CLASS}>
                            <div className="flex items-center justify-between gap-s">
                              <p className={PANEL_LABEL_CLASS}>Поповнити склад</p>
                              <span className={BOOK_INLINE_VALUE_CLASS}>{book.stockQuantity} шт.</span>
                            </div>
                            <div className="mt-auto grid grid-cols-[1fr_auto] items-center gap-s pt-4">
                              <SteppedNumberField
                                value={stockValue}
                                onChange={(value) =>
                                  setStockDrafts((current) => ({
                                    ...current,
                                    [book.bookId]: value,
                                  }))
                                }
                                min={1}
                                step={1}
                                placeholder="+1"
                                inputClassName="app-subtle-surface h-[44px] rounded-soft border-app-border-light"
                              />
                              <button
                                type="button"
                                onClick={() => void submitBookStockIncrement(book.bookId)}
                                disabled={busyAction === `stock-${book.bookId}`}
                                className={cn(
                                  BOOK_ACTION_BUTTON_CLASS,
                                  "app-subtle-surface-strong min-w-[104px] border-app-border-light text-app-primary hover:border-app-border-hover hover:bg-app-hover",
                                )}
                              >
                                Додати
                              </button>
                            </div>
                          </div>

                          <div
                            className={cn(
                              BOOK_CONTROL_CARD_CLASS,
                              "mobile:col-span-2 compact:col-span-1",
                            )}
                          >
                            <p className={PANEL_LABEL_CLASS}>Дії</p>
                            <div className="mt-auto grid grid-cols-2 gap-s pt-4">
                              <button
                                type="button"
                                onClick={() => openEditBook(book.bookId)}
                                className={cn(
                                  BOOK_ACTION_BUTTON_CLASS,
                                  "app-subtle-surface-soft w-full border-app-border-light text-app-secondary hover:border-app-border-hover hover:bg-app-hover hover:text-app-primary",
                                )}
                              >
                                Редагувати
                              </button>
                              <button
                                type="button"
                                onClick={() => void submitDeleteBook(book.bookId)}
                                disabled={busyAction === `delete-book-${book.bookId}`}
                                className={cn(
                                  BOOK_ACTION_BUTTON_CLASS,
                                  "w-full border-app-error/32 bg-white/[0.012] text-app-secondary hover:border-app-error/60 hover:bg-app-error/8 hover:text-app-error",
                                )}
                              >
                                Видалити
                              </button>
                            </div>
                          </div>
                        </div>

                        {inEditMode ? (
                          <div className="app-subtle-surface-strong rounded-soft border border-app-border-light p-m">
                            <p className="font-body text-[10px] uppercase tracking-[0.14em] text-app-muted">
                              Редагування книги #{book.bookId}
                            </p>

                            <div className="mt-s space-y-s">
                              <input
                                value={updateBookForm.title}
                                onChange={(event) =>
                                  setUpdateBookForm((current) => ({
                                    ...current,
                                    title: event.target.value,
                                  }))
                                }
                                placeholder="Назва"
                                className="app-subtle-surface h-[42px] w-full rounded-sharp border border-app-border-light px-m font-body text-sm text-app-primary outline-none focus:border-app-border-hover"
                              />

                              <div className="grid grid-cols-2 gap-s">
                                <input
                                  value={updateBookForm.genre}
                                  onChange={(event) =>
                                    setUpdateBookForm((current) => ({
                                      ...current,
                                      genre: event.target.value,
                                    }))
                                  }
                                  placeholder="Жанр"
                                  className="app-subtle-surface h-[42px] w-full rounded-sharp border border-app-border-light px-m font-body text-sm text-app-primary outline-none focus:border-app-border-hover"
                                />
                                <input
                                  value={updateBookForm.language}
                                  onChange={(event) =>
                                    setUpdateBookForm((current) => ({
                                      ...current,
                                      language: event.target.value,
                                    }))
                                  }
                                  placeholder="Мова"
                                  className="app-subtle-surface h-[42px] w-full rounded-sharp border border-app-border-light px-m font-body text-sm text-app-primary outline-none focus:border-app-border-hover"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-s">
                                <input
                                  value={updateBookForm.isbn}
                                  onChange={(event) =>
                                    setUpdateBookForm((current) => ({
                                      ...current,
                                      isbn: event.target.value,
                                    }))
                                  }
                                  placeholder="ISBN"
                                  className="app-subtle-surface h-[42px] w-full rounded-sharp border border-app-border-light px-m font-body text-sm text-app-primary outline-none focus:border-app-border-hover"
                                />
                                <SteppedNumberField
                                  value={updateBookForm.pageCount}
                                  onChange={(value) =>
                                    setUpdateBookForm((current) => ({
                                      ...current,
                                      pageCount: value,
                                    }))
                                  }
                                  min={0}
                                  step={1}
                                  placeholder="Сторінки"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-s">
                                <input
                                  type="date"
                                  value={updateBookForm.publicationDate}
                                  onChange={(event) =>
                                    setUpdateBookForm((current) => ({
                                      ...current,
                                      publicationDate: event.target.value,
                                    }))
                                  }
                                  className="app-subtle-surface h-[42px] w-full rounded-sharp border border-app-border-light px-m font-body text-sm text-app-primary outline-none focus:border-app-border-hover"
                                />
                                <div className="relative">
                                  <select
                                    value={updateBookForm.publisherId}
                                    onChange={(event) =>
                                      setUpdateBookForm((current) => ({
                                        ...current,
                                        publisherId: event.target.value,
                                      }))
                                    }
                                    className={ADMIN_SELECT_CLASS}
                                    style={{ colorScheme: "dark" }}
                                  >
                                    <option value="" style={ADMIN_OPTION_STYLE}>
                                      Видавець (не вказано)
                                    </option>
                                    {initialData.publishers.map((publisher) => (
                                      <option
                                        key={publisher.publisherId}
                                        value={publisher.publisherId}
                                        style={ADMIN_OPTION_STYLE}
                                      >
                                        {publisher.name}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown
                                    size={14}
                                    className="pointer-events-none absolute right-s top-1/2 -translate-y-1/2 text-app-muted"
                                  />
                                </div>
                              </div>

                              <input
                                value={updateBookForm.coverImagePath}
                                onChange={(event) =>
                                  setUpdateBookForm((current) => ({
                                    ...current,
                                    coverImagePath: event.target.value,
                                  }))
                                }
                                placeholder="URL обкладинки"
                                className="app-subtle-surface h-[42px] w-full rounded-sharp border border-app-border-light px-m font-body text-sm text-app-primary outline-none focus:border-app-border-hover"
                              />

                              <textarea
                                value={updateBookForm.description}
                                onChange={(event) =>
                                  setUpdateBookForm((current) => ({
                                    ...current,
                                    description: event.target.value,
                                  }))
                                }
                                placeholder="Опис"
                                rows={4}
                                className="app-subtle-surface w-full rounded-sharp border border-app-border-light px-m py-s font-body text-sm text-app-primary outline-none focus:border-app-border-hover"
                              />

                              <div className="flex flex-wrap gap-s">
                                <button
                                  type="button"
                                  onClick={() => void submitUpdateBook(book.bookId)}
                                  disabled={busyAction === `update-book-${book.bookId}`}
                                  className="inline-flex h-[44px] items-center justify-center rounded-sharp border border-app-border-hover px-l font-body text-xs uppercase tracking-[0.12em] text-app-primary transition duration-fast hover:bg-app-hover disabled:opacity-45"
                                >
                                  {busyAction === `update-book-${book.bookId}`
                                    ? "Збереження..."
                                    : "Зберегти"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setEditingBookId(null)}
                                  className="inline-flex h-[44px] items-center justify-center rounded-sharp border border-app-border-light px-l font-body text-xs uppercase tracking-[0.12em] text-app-secondary transition duration-fast hover:border-app-border-hover hover:text-app-primary"
                                >
                                  Скасувати
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </GlassPanel>
                );
              })}

              {filteredBooks.length === 0 ? (
                <div className="app-subtle-surface rounded-soft border border-app-border-light p-l">
                  <p className="font-body text-sm text-app-secondary">Книг за поточним пошуком не знайдено.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "comments" ? (
        <div className="space-y-5">
          <GlassPanel className="p-m">
            <div className="flex flex-wrap items-center gap-s">
              <p className="font-display text-[28px] text-app-primary">Модерація коментарів</p>
              <div className="ml-auto w-full mobile:w-[340px]">
                <input
                  value={commentsQuery}
                  onChange={(event) => setCommentsQuery(event.target.value)}
                  placeholder="Пошук: книга, користувач, текст"
                  className="app-subtle-surface h-[42px] w-full rounded-sharp border border-app-border-light px-m font-body text-sm text-app-primary outline-none placeholder:text-app-muted focus:border-app-border-hover"
                />
              </div>
            </div>
          </GlassPanel>

          <div className="space-y-s">
            {filteredComments.map((comment) => (
              <GlassPanel key={comment.commentId} className="p-m">
                <div className="flex flex-wrap items-center gap-s">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[24px] text-app-primary">{comment.bookTitle}</p>
                    <p className="font-body text-xs text-app-muted">
                      {comment.customerName} • {comment.customerEmail}
                    </p>
                    <p className="mt-1 font-body text-xs text-app-secondary">
                      Рейтинг: {comment.rating > 0 ? `${comment.rating}/5` : "-"} • {formatDateTime(comment.commentDate)}
                    </p>
                    <p className="mt-s whitespace-pre-wrap font-body text-sm leading-relaxed text-app-secondary">
                      {comment.commentText}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void submitDeleteComment(comment.commentId)}
                    disabled={busyAction === `delete-comment-${comment.commentId}`}
                    className="self-center inline-flex h-[42px] items-center justify-center rounded-sharp border border-app-error px-m font-body text-[10px] uppercase tracking-[0.12em] text-app-secondary transition duration-fast hover:bg-app-error/20 hover:text-app-error disabled:opacity-45"
                  >
                    Видалити
                  </button>
                </div>
              </GlassPanel>
            ))}

            {filteredComments.length === 0 ? (
                <div className="app-subtle-surface rounded-soft border border-app-border-light p-l">
                <p className="font-body text-sm text-app-secondary">Коментарів не знайдено.</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeTab === "orders" ? (
        <div className="space-y-5">
          <GlassPanel className="p-m">
            <div className="flex flex-wrap items-center gap-s">
              <p className="font-display text-[28px] text-app-primary">Керування статусами замовлень</p>
              <div className="ml-auto w-full mobile:w-[340px]">
                <input
                  value={ordersQuery}
                  onChange={(event) => setOrdersQuery(event.target.value)}
                  placeholder="Пошук: ID, статус, клієнт"
                  className="app-subtle-surface h-[42px] w-full rounded-sharp border border-app-border-light px-m font-body text-sm text-app-primary outline-none placeholder:text-app-muted focus:border-app-border-hover"
                />
              </div>
            </div>
          </GlassPanel>

          <div className="space-y-s">
            {filteredOrders.map((order) => {
              const orderDraft = orderStatusDrafts[order.orderId] ?? {
                status: "",
                trackingNumber: order.trackingNumber,
              };

              return (
                <GlassPanel key={order.orderId} className="p-m">
                  <div className="grid gap-m compact:grid-cols-[1fr_auto]">
                    <div className="space-y-s">
                      <div className="flex flex-wrap items-center gap-s">
                        <p className="font-display text-[28px] text-app-primary">Замовлення #{order.orderId}</p>
                        <span className="app-subtle-surface-strong rounded-pill border border-app-border-light px-3 py-1 font-body text-[10px] uppercase tracking-[0.1em] text-app-primary">
                          {order.currentStatus}
                        </span>
                      </div>

                      <p className="font-body text-sm text-app-secondary">
                        {order.customerName} {order.customerEmail ? `• ${order.customerEmail}` : ""}
                      </p>

                      <p className="font-body text-sm text-app-secondary">
                        Сума: {formatMoney(order.totalAmount)} • Позицій: {order.itemCount} • Статусів: {order.statusCount}
                      </p>

                      <p className="font-body text-xs text-app-muted">
                        Остання зміна: {formatDateTime(order.currentStatusDate)}
                      </p>

                      <p className="break-words font-body text-xs text-app-secondary">
                        Адреса: {order.shippingAddress || "-"}
                      </p>
                    </div>

                    <div className="app-subtle-surface-strong w-full max-w-[360px] space-y-s rounded-soft border border-app-border-light p-s">
                      <p className={PANEL_LABEL_CLASS}>
                        Додати новий статус
                      </p>

                      <input
                        value={orderDraft.status}
                        onChange={(event) =>
                          setOrderStatusDrafts((current) => ({
                            ...current,
                            [order.orderId]: {
                              ...orderDraft,
                              status: event.target.value,
                            },
                          }))
                        }
                        placeholder="Напр.: Підтверджено"
                        className="app-subtle-surface h-[40px] w-full rounded-sharp border border-app-border-light px-s font-body text-sm text-app-primary outline-none placeholder:text-app-muted focus:border-app-border-hover"
                      />

                      <input
                        value={orderDraft.trackingNumber}
                        onChange={(event) =>
                          setOrderStatusDrafts((current) => ({
                            ...current,
                            [order.orderId]: {
                              ...orderDraft,
                              trackingNumber: event.target.value,
                            },
                          }))
                        }
                        placeholder="Трек-номер (необов'язково)"
                        className="app-subtle-surface h-[40px] w-full rounded-sharp border border-app-border-light px-s font-body text-sm text-app-primary outline-none placeholder:text-app-muted focus:border-app-border-hover"
                      />

                      <button
                        type="button"
                        onClick={() => void submitAddOrderStatus(order.orderId)}
                        disabled={busyAction === `order-status-${order.orderId}`}
                        className="inline-flex h-[42px] w-full items-center justify-center rounded-sharp border border-app-border-hover bg-transparent font-body text-[10px] uppercase tracking-[0.12em] text-app-primary transition duration-fast hover:bg-app-hover disabled:opacity-45"
                      >
                        {busyAction === `order-status-${order.orderId}` ? "Додавання..." : "Додати статус"}
                      </button>
                    </div>
                  </div>
                </GlassPanel>
              );
            })}

            {filteredOrders.length === 0 ? (
              <div className="app-subtle-surface rounded-soft border border-app-border-light p-l">
                <p className="font-body text-sm text-app-secondary">Замовлень за поточним пошуком не знайдено.</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeTab === "users" ? (
        <div className="space-y-5">
          <GlassPanel className="p-m">
            <div className="flex flex-wrap items-center gap-s">
              <p className="font-display text-[28px] text-app-primary">Користувачі та ролі</p>
              <div className="ml-auto flex w-full flex-wrap items-center gap-s mobile:w-auto">
                <label className="inline-flex items-center gap-2 rounded-pill border border-app-border-light px-s py-s font-body text-xs text-app-secondary">
                  <input
                    type="checkbox"
                    checked={adminOnlyFilter}
                    onChange={(event) => setAdminOnlyFilter(event.target.checked)}
                    className="h-4 w-4 rounded border-app-border-light bg-transparent accent-white"
                  />
                  Лише адміністратори
                </label>

                <input
                  value={usersQuery}
                  onChange={(event) => setUsersQuery(event.target.value)}
                  placeholder="Пошук: ім'я, email"
                  className="app-subtle-surface h-[42px] w-full rounded-sharp border border-app-border-light px-m font-body text-sm text-app-primary outline-none placeholder:text-app-muted focus:border-app-border-hover mobile:w-[280px]"
                />
              </div>
            </div>
          </GlassPanel>

          <div className="space-y-s">
            {filteredUsers.map((user) => {
              const willSetAdmin = !user.isAdmin;

              return (
                <GlassPanel key={user.customerId} className="p-m mobile:p-l">
                  <div className="space-y-s">
                    <div className="flex flex-wrap items-start gap-s">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-s">
                          <p className="font-display text-[26px] leading-tight text-app-primary">
                            {user.fullName}
                          </p>
                          <span
                            className={cn(
                              "rounded-pill border px-3 py-1 font-body text-[10px] uppercase tracking-[0.1em]",
                              user.isAdmin
                                ? "border-app-info/45 bg-app-info/10 text-app-info"
                                : "border-app-border-light app-subtle-surface-strong text-app-secondary",
                            )}
                          >
                            {user.isAdmin ? "Адміністратор" : "Користувач"}
                          </span>

                          {user.customerId === currentAdminId ? (
                            <span className="app-subtle-surface-strong rounded-pill border border-app-border-light px-3 py-1 font-body text-[10px] uppercase tracking-[0.1em] text-app-primary">
                              Ваш акаунт
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 font-body text-sm text-app-secondary">{user.email}</p>
                        <p className="mt-1 font-body text-xs text-app-muted">
                          Реєстрація: {formatDate(user.joinDate)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-s mobile:grid-cols-2 compact:grid-cols-4">
                      <div className="app-subtle-surface flex min-h-[78px] flex-col justify-between rounded-soft border border-app-border-light px-m py-s">
                        <p className={PANEL_LABEL_CLASS}>Бонусні бали</p>
                        <p className={PANEL_VALUE_CLASS}>
                          {user.loyaltyPoints}
                        </p>
                      </div>
                      <div className="app-subtle-surface flex min-h-[78px] flex-col justify-between rounded-soft border border-app-border-light px-m py-s">
                        <p className={PANEL_LABEL_CLASS}>Замовлення</p>
                        <p className={PANEL_VALUE_CLASS}>
                          {user.ordersCount}
                        </p>
                      </div>
                      <div className="app-subtle-surface flex min-h-[78px] flex-col justify-between rounded-soft border border-app-border-light px-m py-s">
                        <p className={PANEL_LABEL_CLASS}>Коментарі</p>
                        <p className={PANEL_VALUE_CLASS}>
                          {user.commentsCount}
                        </p>
                      </div>

                      <div className="app-subtle-surface flex min-h-[78px] flex-col justify-between rounded-soft border border-app-border-light px-m py-s">
                        <p className={PANEL_LABEL_CLASS}>Дії</p>
                        <div className="mt-3 flex h-[44px] items-center">
                          <button
                            type="button"
                            onClick={() => void submitToggleAdminRole(user.customerId, willSetAdmin)}
                            disabled={busyAction === `toggle-user-${user.customerId}`}
                            className={cn(
                              "inline-flex h-[44px] w-full items-center justify-center rounded-soft border px-m font-body text-[10px] uppercase tracking-[0.12em] transition duration-fast disabled:opacity-45",
                              user.isAdmin
                                ? "border-app-warning text-app-warning hover:bg-app-warning/20"
                                : "border-app-info text-app-info hover:bg-app-info/20",
                            )}
                          >
                            {busyAction === `toggle-user-${user.customerId}`
                              ? "Оновлення..."
                              : user.isAdmin
                                ? "Зняти роль admin"
                                : "Призначити admin"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassPanel>
              );
            })}

            {filteredUsers.length === 0 ? (
              <div className="app-subtle-surface rounded-soft border border-app-border-light p-l">
                <p className="font-body text-sm text-app-secondary">Користувачів за поточним фільтром не знайдено.</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

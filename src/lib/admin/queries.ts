import { Prisma } from "@prisma/client";

import { queryFirst, queryRows } from "@/lib/db/raw";
import { prisma } from "@/lib/prisma";
import type {
  AdminBookEntry,
  AdminCommentEntry,
  AdminCreateBookInput,
  AdminDashboardData,
  AdminOrderEntry,
  AdminPublisherEntry,
  AdminUpdateBookInput,
  AdminUserEntry,
} from "@/lib/admin/types";

type AdminBookRow = {
  bookId: number;
  title: string;
  authors: string | null;
  price: number | string | null;
  stockQuantity: number | null;
  genre: string | null;
  language: string | null;
  coverImagePath: string | null;
  description: string | null;
  isbn: string | null;
  pageCount: number | null;
  publicationDate: Date | string | null;
  publisherId: number | null;
  publisherName: string | null;
  commentCount: number | null;
};

type AdminCommentRow = {
  commentId: number;
  bookId: number;
  bookTitle: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  commentText: string;
  commentDate: Date | string;
  rating: number | null;
};

type AdminOrderRow = {
  orderId: number;
  orderDate: Date | string;
  totalAmount: number | string | null;
  shippingAddress: string;
  paymentMethod: string | null;
  customerId: number | null;
  customerName: string | null;
  customerEmail: string | null;
  itemCount: number | null;
  statusCount: number | null;
  currentStatus: string | null;
  currentStatusDate: Date | string | null;
  trackingNumber: string | null;
};

type AdminUserRow = {
  customerId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  joinDate: Date | string;
  loyaltyPoints: number | null;
  loyaltyProgram: boolean | null;
  isAdmin: boolean | null;
  ordersCount: number | null;
  commentsCount: number | null;
};

type AdminPublisherRow = {
  publisherId: number;
  name: string;
};

class AdminServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function asString(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function asNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
}

function asInt(value: number | null | undefined): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.floor(parsed));
}

function toIsoString(value: Date | string | null | undefined): string {
  if (!value) {
    return "";
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString();
}

function toNullableText(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableDate(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new AdminServiceError("Некоректна дата видання", 400);
  }

  return trimmed;
}

function toNullableInt(value: number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new AdminServiceError("Некоректне числове значення", 400);
  }

  return value;
}

function assertBookId(bookId: number): number {
  if (!Number.isInteger(bookId) || bookId <= 0) {
    throw new AdminServiceError("Некоректний ідентифікатор книги", 400);
  }

  return bookId;
}

function assertCommentId(commentId: number): number {
  if (!Number.isInteger(commentId) || commentId <= 0) {
    throw new AdminServiceError("Некоректний ідентифікатор коментаря", 400);
  }

  return commentId;
}

function assertOrderId(orderId: number): number {
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new AdminServiceError("Некоректний ідентифікатор замовлення", 400);
  }

  return orderId;
}

function assertCustomerId(customerId: number): number {
  if (!Number.isInteger(customerId) || customerId <= 0) {
    throw new AdminServiceError("Некоректний ідентифікатор користувача", 400);
  }

  return customerId;
}

function mapBookRow(row: AdminBookRow): AdminBookEntry {
  const stockQuantity = asInt(row.stockQuantity);

  return {
    bookId: row.bookId,
    title: row.title,
    authors: asString(row.authors) || "Невідомий автор",
    price: Number(asNumber(row.price).toFixed(2)),
    stockQuantity,
    genre: asString(row.genre),
    language: asString(row.language),
    coverImagePath: asString(row.coverImagePath),
    description: asString(row.description),
    isbn: asString(row.isbn),
    pageCount: asInt(row.pageCount),
    publicationDate: toIsoString(row.publicationDate),
    publisherId: row.publisherId,
    publisherName: asString(row.publisherName),
    commentCount: asInt(row.commentCount),
    lowStock: stockQuantity <= 3,
  };
}

function mapCommentRow(row: AdminCommentRow): AdminCommentEntry {
  return {
    commentId: row.commentId,
    bookId: row.bookId,
    bookTitle: row.bookTitle,
    customerId: row.customerId,
    customerName: asString(row.customerName) || "Користувач",
    customerEmail: asString(row.customerEmail),
    commentText: row.commentText,
    commentDate: toIsoString(row.commentDate),
    rating: asInt(row.rating),
  };
}

function mapOrderRow(row: AdminOrderRow): AdminOrderEntry {
  return {
    orderId: row.orderId,
    orderDate: toIsoString(row.orderDate),
    totalAmount: Number(asNumber(row.totalAmount).toFixed(2)),
    shippingAddress: asString(row.shippingAddress),
    paymentMethod: asString(row.paymentMethod) || "Не вказано",
    customerId: row.customerId,
    customerName: asString(row.customerName) || "Невідомий користувач",
    customerEmail: asString(row.customerEmail),
    itemCount: asInt(row.itemCount),
    statusCount: asInt(row.statusCount),
    currentStatus: asString(row.currentStatus) || "Нове",
    currentStatusDate: toIsoString(row.currentStatusDate) || toIsoString(row.orderDate),
    trackingNumber: asString(row.trackingNumber),
  };
}

function mapUserRow(row: AdminUserRow): AdminUserEntry {
  const firstName = asString(row.firstName);
  const lastName = asString(row.lastName);

  return {
    customerId: row.customerId,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim() || `Користувач #${row.customerId}`,
    email: row.email,
    phone: asString(row.phone),
    address: asString(row.address),
    joinDate: toIsoString(row.joinDate),
    loyaltyPoints: asInt(row.loyaltyPoints),
    loyaltyProgram: Boolean(row.loyaltyProgram),
    isAdmin: Boolean(row.isAdmin),
    ordersCount: asInt(row.ordersCount),
    commentsCount: asInt(row.commentsCount),
  };
}

function mapPublisherRow(row: AdminPublisherRow): AdminPublisherEntry {
  return {
    publisherId: row.publisherId,
    name: row.name,
  };
}

export async function getAdminBooksList(): Promise<AdminBookEntry[]> {
  try {
    const rows = await queryRows<AdminBookRow>(prisma, "admin/get_admin_books_list");
    return rows.map(mapBookRow);
  } catch (error) {
    console.warn("Failed to load admin books:", error);
    return [];
  }
}

export async function getAdminPublishersList(): Promise<AdminPublisherEntry[]> {
  try {
    const rows = await queryRows<AdminPublisherRow>(prisma, "admin/get_admin_publishers_list");
    return rows.map(mapPublisherRow);
  } catch (error) {
    console.warn("Failed to load admin publishers:", error);
    return [];
  }
}

export async function getAdminCommentsList(): Promise<AdminCommentEntry[]> {
  try {
    const rows = await queryRows<AdminCommentRow>(prisma, "admin/get_admin_comments_list");
    return rows.map(mapCommentRow);
  } catch (error) {
    console.warn("Failed to load admin comments:", error);
    return [];
  }
}

export async function getAdminOrdersList(): Promise<AdminOrderEntry[]> {
  try {
    const rows = await queryRows<AdminOrderRow>(prisma, "admin/get_admin_orders_list");
    return rows.map(mapOrderRow);
  } catch (error) {
    console.warn("Failed to load admin orders:", error);
    return [];
  }
}

export async function getAdminUsersList(): Promise<AdminUserEntry[]> {
  try {
    const rows = await queryRows<AdminUserRow>(prisma, "admin/get_admin_users_list");
    return rows.map(mapUserRow);
  } catch (error) {
    console.warn("Failed to load admin users:", error);
    return [];
  }
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [publishers, books, comments, orders, users] = await Promise.all([
    getAdminPublishersList(),
    getAdminBooksList(),
    getAdminCommentsList(),
    getAdminOrdersList(),
    getAdminUsersList(),
  ]);

  return {
    publishers,
    books,
    comments,
    orders,
    users,
  };
}

export async function createAdminBook(input: AdminCreateBookInput): Promise<{ bookId: number }> {
  const title = asString(input.title);
  if (title.length < 2 || title.length > 255) {
    throw new AdminServiceError("Назва книги має містити від 2 до 255 символів", 400);
  }

  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new AdminServiceError("Некоректна ціна", 400);
  }

  if (!Number.isInteger(input.stockQuantity) || input.stockQuantity < 0) {
    throw new AdminServiceError("Некоректна кількість на складі", 400);
  }

  const pageCount = toNullableInt(input.pageCount);
  const publisherId = input.publisherId === null ? null : toNullableInt(input.publisherId);

  const created = await queryFirst<{ bookId: number }>(prisma, "admin/create_book", [
    title,
    toNullableText(input.isbn),
    toNullableDate(input.publicationDate),
    publisherId,
    Number(input.price.toFixed(2)),
    input.stockQuantity,
    toNullableText(input.description),
    toNullableText(input.language),
    pageCount,
    toNullableText(input.coverImagePath),
    toNullableText(input.genre),
  ]);

  if (!created) {
    throw new AdminServiceError("Не вдалося створити книгу", 500);
  }

  return created;
}

export async function updateAdminBook(bookIdInput: number, input: AdminUpdateBookInput): Promise<void> {
  const bookId = assertBookId(bookIdInput);
  const title = asString(input.title);

  if (title.length < 2 || title.length > 255) {
    throw new AdminServiceError("Назва книги має містити від 2 до 255 символів", 400);
  }

  const pageCount = toNullableInt(input.pageCount);
  const publisherId = input.publisherId === null ? null : toNullableInt(input.publisherId);

  const updated = await queryFirst<{ bookId: number }>(prisma, "admin/update_book", [
    bookId,
    title,
    toNullableText(input.isbn),
    toNullableDate(input.publicationDate),
    publisherId,
    toNullableText(input.description),
    toNullableText(input.language),
    pageCount,
    toNullableText(input.coverImagePath),
    toNullableText(input.genre),
  ]);

  if (!updated) {
    throw new AdminServiceError("Книгу не знайдено", 404);
  }
}

export async function updateAdminBookPrice(bookIdInput: number, price: number): Promise<void> {
  const bookId = assertBookId(bookIdInput);

  if (!Number.isFinite(price) || price < 0) {
    throw new AdminServiceError("Некоректна ціна", 400);
  }

  const updated = await queryFirst<{ bookId: number }>(prisma, "admin/update_book_price", [
    bookId,
    Number(price.toFixed(2)),
  ]);

  if (!updated) {
    throw new AdminServiceError("Книгу не знайдено", 404);
  }
}

export async function incrementAdminBookStock(bookIdInput: number, incrementBy: number): Promise<void> {
  const bookId = assertBookId(bookIdInput);

  if (!Number.isInteger(incrementBy) || incrementBy <= 0) {
    throw new AdminServiceError("Кількість для додавання має бути більшою за нуль", 400);
  }

  const updated = await queryFirst<{ bookId: number }>(prisma, "admin/increment_book_stock", [
    bookId,
    incrementBy,
  ]);

  if (!updated) {
    throw new AdminServiceError("Книгу не знайдено", 404);
  }
}

export async function deleteAdminBook(bookIdInput: number): Promise<void> {
  const bookId = assertBookId(bookIdInput);

  try {
    const deleted = await queryFirst<{ bookId: number }>(prisma, "admin/delete_book", [bookId]);

    if (!deleted) {
      throw new AdminServiceError("Книгу не знайдено", 404);
    }
  } catch (error) {
    if (error instanceof AdminServiceError) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new AdminServiceError(
        "Не вдалося видалити книгу. Ймовірно, вона вже використовується у замовленнях.",
        409,
      );
    }

    throw error;
  }
}

export async function deleteAdminComment(commentIdInput: number): Promise<void> {
  const commentId = assertCommentId(commentIdInput);
  const deleted = await queryFirst<{ commentId: number }>(prisma, "admin/delete_comment", [commentId]);

  if (!deleted) {
    throw new AdminServiceError("Коментар не знайдено", 404);
  }
}

export async function createAdminOrderStatus(
  orderIdInput: number,
  statusInput: string,
  trackingNumberInput: string,
): Promise<void> {
  const orderId = assertOrderId(orderIdInput);
  const status = asString(statusInput);
  const trackingNumber = asString(trackingNumberInput);

  if (status.length === 0 || status.length > 50) {
    throw new AdminServiceError("Статус має містити від 1 до 50 символів", 400);
  }

  if (trackingNumber.length > 100) {
    throw new AdminServiceError("Трек-номер занадто довгий", 400);
  }

  const order = await queryFirst<{ orderId: number }>(prisma, "admin/get_order_exists", [orderId]);
  if (!order) {
    throw new AdminServiceError("Замовлення не знайдено", 404);
  }

  const created = await queryFirst<{ orderStatusId: number }>(prisma, "admin/create_order_status", [
    orderId,
    status,
    toNullableText(trackingNumber),
  ]);

  if (!created) {
    throw new AdminServiceError("Не вдалося додати статус", 500);
  }
}

export async function updateCustomerAdminRole(
  customerIdInput: number,
  isAdmin: boolean,
  actorCustomerId?: number,
): Promise<void> {
  const customerId = assertCustomerId(customerIdInput);

  if (actorCustomerId && actorCustomerId === customerId && !isAdmin) {
    throw new AdminServiceError("Неможливо зняти admin-роль з поточного акаунта", 400);
  }

  const target = await queryFirst<{ customerId: number; isAdmin: boolean }>(
    prisma,
    "admin/get_customer_admin_flag",
    [customerId],
  );

  if (!target) {
    throw new AdminServiceError("Користувача не знайдено", 404);
  }

  if (target.isAdmin && !isAdmin) {
    const count = await queryFirst<{ adminCount: number | null }>(prisma, "admin/get_admin_users_count");
    const adminCount = asInt(count?.adminCount ?? 0);

    if (adminCount <= 1) {
      throw new AdminServiceError("Потрібно залишити щонайменше одного адміністратора", 409);
    }
  }

  const updated = await queryFirst<{ customerId: number; isAdmin: boolean }>(
    prisma,
    "admin/update_customer_admin_role",
    [customerId, isAdmin],
  );

  if (!updated) {
    throw new AdminServiceError("Користувача не знайдено", 404);
  }
}

export function mapAdminServiceError(error: unknown): { status: number; message: string } {
  if (error instanceof AdminServiceError) {
    return {
      status: error.status,
      message: error.message,
    };
  }

  console.error("Admin service error:", error);
  return {
    status: 500,
    message: "Внутрішня помилка сервера",
  };
}

import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/admin/access";
import { deleteAdminBook, mapAdminServiceError, updateAdminBook } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    bookId: string;
  };
};

type UpdateBookPayload = {
  title?: string;
  genre?: string;
  language?: string;
  description?: string;
  coverImagePath?: string;
  isbn?: string;
  pageCount?: number | null;
  publicationDate?: string;
  publisherId?: number | null;
};

function parseBookId(value: string): number {
  return Number(value);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const bookId = parseBookId(params.bookId);
  const body = (await request.json().catch(() => null)) as UpdateBookPayload | null;

  try {
    await updateAdminBook(bookId, {
      title: body?.title ?? "",
      genre: body?.genre ?? "",
      language: body?.language ?? "",
      description: body?.description ?? "",
      coverImagePath: body?.coverImagePath ?? "",
      isbn: body?.isbn ?? "",
      pageCount:
        body?.pageCount === null || body?.pageCount === undefined
          ? null
          : Number(body.pageCount),
      publicationDate: body?.publicationDate ?? "",
      publisherId:
        body?.publisherId === null || body?.publisherId === undefined
          ? null
          : Number(body.publisherId),
    });

    return NextResponse.json({ message: "Дані книги оновлено" });
  } catch (error) {
    const mapped = mapAdminServiceError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const bookId = parseBookId(params.bookId);

  try {
    await deleteAdminBook(bookId);
    return NextResponse.json({ message: "Книгу видалено" });
  } catch (error) {
    const mapped = mapAdminServiceError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}

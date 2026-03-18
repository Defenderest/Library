import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/admin/access";
import {
  createAdminBook,
  getAdminBooksList,
  mapAdminServiceError,
} from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

type CreateBookPayload = {
  title?: string;
  price?: number;
  stockQuantity?: number;
  genre?: string;
  language?: string;
  description?: string;
  coverImagePath?: string;
  isbn?: string;
  pageCount?: number | null;
  publicationDate?: string;
  publisherId?: number | null;
};

export async function GET() {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const books = await getAdminBooksList();
    return NextResponse.json({ books });
  } catch (error) {
    const mapped = mapAdminServiceError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json().catch(() => null)) as CreateBookPayload | null;

  try {
    const created = await createAdminBook({
      title: body?.title ?? "",
      price: Number(body?.price ?? 0),
      stockQuantity: Number(body?.stockQuantity ?? 0),
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

    return NextResponse.json({
      bookId: created.bookId,
      message: "Книгу створено",
    });
  } catch (error) {
    const mapped = mapAdminServiceError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}

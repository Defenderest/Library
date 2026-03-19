import { NextResponse } from "next/server";

import { getServerSessionUser } from "@/lib/auth/server-session";
import { createBookComment, mapBookCommentServiceError } from "@/lib/catalog/comment-service";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    bookId: string;
  };
};

type CreateBookCommentPayload = {
  reviewText?: string;
  rating?: number;
};

export async function POST(request: Request, { params }: RouteContext) {
  const session = await getServerSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Щоб залишити відгук, увійдіть у профіль" },
      { status: 401 },
    );
  }

  const bookId = Number(params.bookId);
  const body = (await request.json().catch(() => null)) as CreateBookCommentPayload | null;

  try {
    await createBookComment({
      bookId,
      customerId: session.customerId,
      reviewText: body?.reviewText ?? "",
      rating: Number(body?.rating ?? 0),
    });

    return NextResponse.json({ message: "Відгук успішно додано" });
  } catch (error) {
    const mapped = mapBookCommentServiceError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}

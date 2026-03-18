import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/admin/access";
import { deleteAdminComment, mapAdminServiceError } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    commentId: string;
  };
};

function parseCommentId(value: string): number {
  return Number(value);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const commentId = parseCommentId(params.commentId);

  try {
    await deleteAdminComment(commentId);
    return NextResponse.json({ message: "Коментар видалено" });
  } catch (error) {
    const mapped = mapAdminServiceError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}

import { StarRating } from "@/components/books/star-rating";
import { formatUADate } from "@/lib/catalog/format";
import { cn } from "@/lib/cn";
import type { CommentData } from "@/lib/catalog/types";

type CommentItemProps = {
  comment: CommentData;
  className?: string;
};

export function CommentItem({ comment, className }: CommentItemProps) {
  const initial = (comment.authorName || "Читач").trim().charAt(0).toUpperCase() || "?";

  return (
    <article
      className={cn(
        "rounded-soft border border-app-border-light bg-white/[0.02] p-m",
        className,
      )}
    >
      <div className="flex items-start gap-m">
        <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full border border-app-border-light bg-white/[0.05] font-body text-xs font-semibold uppercase text-app-primary">
          {initial}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-sm font-semibold text-app-primary">
            {comment.authorName || "Читач"}
          </p>
          <p className="mt-1 font-body text-[10px] uppercase tracking-[0.08em] text-app-muted">
            {formatUADate(comment.commentDate)}
          </p>
        </div>

        {comment.rating > 0 ? <StarRating rating={comment.rating} starSize="sm" /> : null}
      </div>

      <p className="mt-m font-body text-[13px] leading-relaxed text-app-primary">{comment.commentText}</p>
    </article>
  );
}

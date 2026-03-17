import { cn } from "@/lib/cn";

type StarRatingProps = {
  rating: number;
  maximumRating?: number;
  starSize?: "sm" | "md" | "lg";
  className?: string;
};

const STAR_SIZE_CLASS = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
};

export function StarRating({
  rating,
  maximumRating = 5,
  starSize = "md",
  className,
}: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-[2px]", className)} aria-label={`Рейтинг ${rating} з ${maximumRating}`}>
      {Array.from({ length: maximumRating }).map((_, index) => (
        <span
          key={`star-${index}`}
          className={cn(
            "leading-none",
            STAR_SIZE_CLASS[starSize],
            index < Math.round(rating) ? "text-app-white" : "text-app-secondary",
          )}
        >
          {index < Math.round(rating) ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

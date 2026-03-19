import { cn } from "@/lib/cn";

import { Skeleton } from "@/components/ui/skeleton";

type CountProps = {
  count?: number;
};

type ClassNameProps = {
  className?: string;
};

export function HeadingSkeleton({ className }: ClassNameProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-3 w-28 rounded-pill" />
      <Skeleton className="h-10 w-[min(420px,82%)]" />
      <Skeleton className="h-4 w-[min(520px,92%)]" />
    </div>
  );
}

export function BookCardSkeleton({ className }: ClassNameProps) {
  return (
    <article
      className={cn(
        "flex h-full min-h-[360px] w-full flex-col overflow-hidden rounded-sharp border border-app-border-light bg-app-card p-3 mobile:min-h-[520px] mobile:p-5",
        className,
      )}
    >
      <Skeleton className="aspect-[2/3] rounded-sharp" />

      <div className="mt-4 space-y-2 mobile:mt-[25px]">
        <Skeleton className="h-5 w-[88%]" />
        <Skeleton className="h-3 w-[62%]" />
        <Skeleton className="h-4 w-[34%] pt-1" />
      </div>

      <Skeleton className="mt-auto h-[42px] w-full rounded-sharp" />
    </article>
  );
}

export function BookGridSkeleton({ count = 6 }: CountProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mobile:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] mobile:gap-10">
      {Array.from({ length: count }).map((_, index) => (
        <BookCardSkeleton key={`book-card-skeleton-${index}`} />
      ))}
    </div>
  );
}

export function AuthorCardSkeleton({ className }: ClassNameProps) {
  return (
    <article
      className={cn(
        "h-[280px] w-full rounded-sharp border border-app-border-light bg-app-card p-5",
        className,
      )}
    >
      <Skeleton className="mx-auto h-[120px] w-[120px] rounded-full" />

      <div className="mt-5 space-y-2 text-center">
        <Skeleton className="mx-auto h-7 w-[74%]" />
        <Skeleton className="mx-auto h-3 w-[56%] rounded-pill" />
      </div>
    </article>
  );
}

export function AuthorGridSkeleton({ count = 6 }: CountProps) {
  return (
    <div className="grid grid-cols-1 gap-8 mobile:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] mobile:gap-10">
      {Array.from({ length: count }).map((_, index) => (
        <AuthorCardSkeleton key={`author-card-skeleton-${index}`} />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-soft border border-app-border-light bg-white/[0.03] p-m">
      <Skeleton className="h-3 w-24 rounded-pill" />
      <Skeleton className="mt-3 h-8 w-20" />
    </div>
  );
}

export function OrderRowSkeleton() {
  return (
    <article className="grid grid-cols-[1fr_auto] gap-m border-b border-app-border-light px-m py-m mobile:grid-cols-[96px_120px_1fr_auto_auto_22px] mobile:items-center">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20 rounded-pill" />
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-3 w-16 rounded-pill" />
        <Skeleton className="h-4 w-20" />
      </div>

      <div className="col-span-2 space-y-2 mobile:col-span-1">
        <Skeleton className="h-6 w-28 rounded-pill" />
        <Skeleton className="h-3 w-36 rounded-pill" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-3 w-16 rounded-pill" />
        <Skeleton className="h-7 w-20" />
      </div>

      <div className="hidden space-y-2 mobile:block">
        <Skeleton className="h-3 w-28 rounded-pill" />
      </div>

      <div className="flex items-center justify-end">
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
    </article>
  );
}

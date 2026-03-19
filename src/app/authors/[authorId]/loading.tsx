import { BookGridSkeleton } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthorDetailsLoading() {
  return (
    <section className="space-y-10">
      <div className="h-[46px] mobile:h-[70px]">
        <Skeleton className="h-5 w-20 rounded-pill" />
      </div>

      <div className="flex flex-col gap-xxl compact:flex-row">
        <Skeleton className="mx-auto h-[120px] w-[120px] rounded-full compact:mx-0" />

        <div className="min-w-0 flex-1 space-y-m">
          <Skeleton className="h-12 w-[min(440px,86%)]" />
          <Skeleton className="h-3 w-32 rounded-pill" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>

      <section className="space-y-s">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[95%]" />
        <Skeleton className="h-4 w-[84%]" />
      </section>

      <section className="space-y-m">
        <Skeleton className="h-9 w-40" />
        <BookGridSkeleton count={4} />
      </section>
    </section>
  );
}

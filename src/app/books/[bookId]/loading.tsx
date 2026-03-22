import { BookGridSkeleton } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookDetailsLoading() {
  return (
    <section className="space-y-10">
      <div className="h-[46px] mobile:h-[70px]">
        <Skeleton className="h-5 w-20 rounded-pill" />
      </div>

      <div className="app-detail-hero-surface rounded-soft border border-app-border-light bg-app-glass p-5 mobile:p-8">
        <div className="grid items-start gap-xl compact:grid-cols-[220px_minmax(0,540px)_1fr] compact:gap-xxl">
          <Skeleton className="mx-auto h-[300px] w-full max-w-[220px] rounded-soft mobile:h-[340px] compact:h-[360px]" />

          <div className="space-y-l pt-1 compact:pt-3">
            <div className="flex flex-wrap items-center gap-s">
              <Skeleton className="h-8 w-[110px] rounded-pill" />
              <Skeleton className="h-8 w-[150px] rounded-pill" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-12 w-[74%]" />
              <Skeleton className="h-4 w-[54%]" />
            </div>

            <Skeleton className="h-10 w-[180px] rounded-pill" />
            <Skeleton className="h-12 w-[220px]" />

            <div className="flex flex-col gap-s pt-1 mobile:flex-row mobile:items-center">
              <Skeleton className="h-[48px] w-full rounded-sharp mobile:w-[260px]" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>

          <div className="hidden compact:block" />
        </div>
      </div>

      <div className="grid gap-s mobile:grid-cols-2 compact:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`book-meta-skeleton-${index}`}
            className="app-subtle-surface min-h-[88px] rounded-soft border border-app-border-light p-m"
          >
            <Skeleton className="h-3 w-20 rounded-pill" />
            <Skeleton className="mt-3 h-6 w-[78%]" />
          </div>
        ))}
      </div>

      <section className="space-y-s">
        <Skeleton className="h-9 w-24" />
        <div className="app-subtle-surface rounded-soft border border-app-border-light p-l">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-3 h-4 w-[94%]" />
          <Skeleton className="mt-3 h-4 w-[82%]" />
        </div>
      </section>

      <section className="space-y-m">
        <div className="flex flex-wrap items-center gap-m">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-3 w-24 mobile:ml-auto" />
        </div>

        <div className="app-subtle-surface rounded-soft border border-app-border-light p-m">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="mt-3 h-4 w-[64%]" />
          <Skeleton className="mt-4 h-10 w-[190px] rounded-pill" />
          <Skeleton className="mt-3 h-[120px] w-full rounded-sharp" />
        </div>

        <div className="space-y-m">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={`comment-skeleton-${index}`}
              className="app-subtle-surface rounded-soft border border-app-border-light p-m"
            >
              <div className="flex items-center gap-m">
                <Skeleton className="h-[38px] w-[38px] rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20 rounded-pill" />
                </div>
              </div>
              <Skeleton className="mt-m h-4 w-full" />
              <Skeleton className="mt-3 h-4 w-[90%]" />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-m">
        <Skeleton className="h-9 w-36" />
        <BookGridSkeleton count={3} />
      </section>
    </section>
  );
}

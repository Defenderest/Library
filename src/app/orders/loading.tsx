import { HeadingSkeleton, OrderRowSkeleton, StatCardSkeleton } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <section className="space-y-8">
      <div className="rounded-soft border border-app-border-light bg-app-glass p-4 mobile:p-6">
        <HeadingSkeleton className="max-w-[620px]" />

        <div className="mt-m grid gap-s mobile:grid-cols-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>

      <div className="app-subtle-surface-soft overflow-hidden rounded-soft border border-app-border-light">
        {Array.from({ length: 4 }).map((_, index) => (
          <OrderRowSkeleton key={`order-row-skeleton-${index}`} />
        ))}
      </div>

      <div className="app-subtle-surface rounded-soft border border-app-border-light p-m">
        <Skeleton className="h-7 w-44" />
        <div className="mt-s grid gap-s mobile:grid-cols-2">
          <Skeleton className="h-[92px] w-full rounded-soft" />
          <Skeleton className="h-[92px] w-full rounded-soft" />
        </div>
      </div>
    </section>
  );
}

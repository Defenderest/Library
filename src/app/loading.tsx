import { BookGridSkeleton, HeadingSkeleton } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="space-y-10">
      <section
        className="app-home-hero-surface relative min-h-[250px] overflow-hidden border-b border-app-border-light"
        style={{ height: "min(400px, max(250px, 35vw))" }}
      >
        <div className="app-home-hero-overlay absolute inset-0" />

        <div className="pointer-events-none absolute inset-y-0 right-[4%] hidden w-[38%] max-w-[500px] items-end py-6 compact:flex">
          <Skeleton className="h-full w-full rounded-soft" />
        </div>

        <div className="relative flex h-full max-w-[620px] flex-col justify-end px-l pb-xl mobile:px-xxl mobile:pb-xxl">
          <Skeleton className="h-[42px] w-[52%]" />
          <Skeleton className="mt-2 h-[42px] w-[48%]" />
          <Skeleton className="mt-m h-4 w-[68%]" />
          <Skeleton className="mt-m h-11 w-[190px] rounded-pill" />
        </div>
      </section>

      <section className="space-y-4">
        <HeadingSkeleton className="max-w-[540px]" />
        <BookGridSkeleton count={6} />
      </section>
    </div>
  );
}

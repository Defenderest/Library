import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <section className="space-y-8">
      <div className="app-subtle-surface relative rounded-soft border border-app-border-light px-6 py-8 mobile:px-10">
        <div className="mx-auto w-full max-w-[460px] space-y-m">
          <Skeleton className="mx-auto h-10 w-[220px]" />
          <Skeleton className="mx-auto h-4 w-[88%]" />
          <Skeleton className="mx-auto h-4 w-[70%]" />
          <Skeleton className="mx-auto h-[46px] w-[250px] rounded-pill" />

          <div className="space-y-s pt-2">
            <Skeleton className="h-[50px] w-full rounded-soft" />
            <Skeleton className="h-[50px] w-full rounded-soft" />
            <Skeleton className="h-[50px] w-full rounded-soft" />
          </div>
        </div>
      </div>

      <div className="app-subtle-surface rounded-soft border border-app-border-light p-l">
        <div className="flex items-center gap-l pb-2">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-3 w-28 rounded-pill" />
            <Skeleton className="h-3 w-24 rounded-pill" />
          </div>
        </div>

        <div className="mt-m grid max-w-[800px] grid-cols-1 gap-x-10 gap-y-6 compact:grid-cols-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </section>
  );
}

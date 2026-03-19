import { BookGridSkeleton } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function BooksLoading() {
  return (
    <section className="relative">
      <div className="flex flex-wrap items-center gap-m">
        <Skeleton className="h-[45px] w-[126px] rounded-pill" />
        <div className="w-full text-right mobile:ml-auto mobile:w-auto">
          <Skeleton className="ml-auto h-4 w-28" />
        </div>
      </div>

      <Skeleton className="mt-m h-3 w-[120px] rounded-pill" />

      <div className="mt-8 mobile:mt-10">
        <BookGridSkeleton count={8} />
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-s">
        <Skeleton className="h-[44px] w-[92px] rounded-pill" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-[44px] w-[82px] rounded-pill" />
      </div>
    </section>
  );
}

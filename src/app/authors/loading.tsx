import { AuthorGridSkeleton } from "@/components/ui/loading-skeletons";

export default function AuthorsLoading() {
  return (
    <section className="space-y-8">
      <AuthorGridSkeleton count={8} />
    </section>
  );
}

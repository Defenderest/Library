import { AuthorCard } from "@/components/authors/author-card";
import { getAuthorsList } from "@/lib/catalog/queries";

export const revalidate = 900;

export default async function AuthorsPage() {
  const authors = await getAuthorsList();

  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 gap-8 mobile:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] mobile:gap-10">
        {authors.map((author) => (
          <AuthorCard key={author.authorId} author={author} />
        ))}
      </div>

      {authors.length === 0 ? (
        <div className="rounded-soft border border-app-border-light bg-app-card p-8 text-center">
          <p className="font-display text-2xl text-app-primary">Авторів не знайдено</p>
          <p className="mt-2 font-body text-sm text-app-secondary">Спробуйте оновити сторінку пізніше.</p>
        </div>
      ) : null}
    </section>
  );
}

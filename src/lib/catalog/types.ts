export type BookCardData = {
  bookId: number;
  title: string;
  authors: string;
  price: number;
  coverImagePath: string;
  stockQuantity: number;
  genre: string;
};

export type CommentData = {
  authorName: string;
  commentDate: string;
  rating: number;
  commentText: string;
};

export type BookDetailsData = BookCardData & {
  description: string;
  language: string;
  publisherName: string;
  publicationDate: string;
  isbn: string;
  pageCount: number;
  averageRating: number;
  comments: CommentData[];
};

export type AuthorCardData = {
  authorId: number;
  firstName: string;
  lastName: string;
  nationality: string;
  imagePath: string;
};

export type AuthorDetailsData = AuthorCardData & {
  fullName: string;
  biography: string;
  birthDate: string;
  books: BookCardData[];
};

export type SearchSuggestionData = {
  displayText: string;
  type: "book" | "author";
  id: number;
  imagePath?: string;
  price?: number;
};

export type BooksCatalogFilters = {
  query?: string;
  genre?: string;
  language?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  page?: number;
  pageSize?: number;
};

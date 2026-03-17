import type {
  AuthorCardData,
  AuthorDetailsData,
  BookCardData,
  BookDetailsData,
  SearchSuggestionData,
} from "@/lib/catalog/types";

export const FALLBACK_BOOKS: BookCardData[] = [
  {
    bookId: 101,
    title: "Кобзар",
    authors: "Тарас Шевченко",
    price: 279,
    coverImagePath: "",
    stockQuantity: 18,
    genre: "Поезія",
  },
  {
    bookId: 102,
    title: "Захар Беркут",
    authors: "Іван Франко",
    price: 315,
    coverImagePath: "",
    stockQuantity: 11,
    genre: "Історичний роман",
  },
  {
    bookId: 103,
    title: "Лісова пісня",
    authors: "Леся Українка",
    price: 260,
    coverImagePath: "",
    stockQuantity: 9,
    genre: "Драма-феєрія",
  },
  {
    bookId: 104,
    title: "1984",
    authors: "Джордж Орвелл",
    price: 390,
    coverImagePath: "",
    stockQuantity: 14,
    genre: "Антиутопія",
  },
  {
    bookId: 105,
    title: "Місто",
    authors: "Валер'ян Підмогильний",
    price: 310,
    coverImagePath: "",
    stockQuantity: 7,
    genre: "Урбаністичний роман",
  },
  {
    bookId: 106,
    title: "Тигролови",
    authors: "Іван Багряний",
    price: 335,
    coverImagePath: "",
    stockQuantity: 5,
    genre: "Пригодницький роман",
  },
];

export const FALLBACK_AUTHORS: AuthorCardData[] = [
  {
    authorId: 201,
    firstName: "Тарас",
    lastName: "Шевченко",
    nationality: "Україна",
    imagePath: "",
  },
  {
    authorId: 202,
    firstName: "Іван",
    lastName: "Франко",
    nationality: "Україна",
    imagePath: "",
  },
  {
    authorId: 203,
    firstName: "Леся",
    lastName: "Українка",
    nationality: "Україна",
    imagePath: "",
  },
  {
    authorId: 204,
    firstName: "Джордж",
    lastName: "Орвелл",
    nationality: "Велика Британія",
    imagePath: "",
  },
  {
    authorId: 205,
    firstName: "Валер'ян",
    lastName: "Підмогильний",
    nationality: "Україна",
    imagePath: "",
  },
  {
    authorId: 206,
    firstName: "Іван",
    lastName: "Багряний",
    nationality: "Україна",
    imagePath: "",
  },
];

export const FALLBACK_BOOK_DETAILS: Record<number, BookDetailsData> = {
  101: {
    ...FALLBACK_BOOKS[0],
    description:
      "Збірка поезій, що формує основу українського літературного канону та залишається одним із найважливіших текстів нашої культури.",
    language: "Українська",
    publisherName: "Видавництво Старого Лева",
    publicationDate: "1840-04-18",
    isbn: "978-617-679-000-1",
    pageCount: 384,
    averageRating: 4.8,
    comments: [
      {
        authorName: "Марія К.",
        commentDate: "2026-01-10T10:30:00Z",
        rating: 5,
        commentText: "Сильне видання, дуже якісний папір і примітки редактора.",
      },
      {
        authorName: "Олег В.",
        commentDate: "2026-02-01T15:20:00Z",
        rating: 4,
        commentText: "Класика, до якої хочеться повертатися.",
      },
    ],
  },
  102: {
    ...FALLBACK_BOOKS[1],
    description:
      "Історична повість про громаду, гідність і відповідальність. Одна з найвідоміших прозових робіт Івана Франка.",
    language: "Українська",
    publisherName: "А-БА-БА-ГА-ЛА-МА-ГА",
    publicationDate: "1883-09-01",
    isbn: "978-617-585-001-0",
    pageCount: 256,
    averageRating: 4.6,
    comments: [
      {
        authorName: "Світлана Р.",
        commentDate: "2026-01-21T08:50:00Z",
        rating: 5,
        commentText: "Чітка мова і сильний сюжет, читається дуже швидко.",
      },
    ],
  },
  103: {
    ...FALLBACK_BOOKS[2],
    description:
      "Поетична драма, де міф і природа зливаються у глибоку історію про свободу, любов і вибір.",
    language: "Українська",
    publisherName: "Фоліо",
    publicationDate: "1911-01-01",
    isbn: "978-617-551-123-2",
    pageCount: 208,
    averageRating: 4.7,
    comments: [
      {
        authorName: "Катерина Л.",
        commentDate: "2026-02-14T11:40:00Z",
        rating: 5,
        commentText: "Неймовірно музичний текст, особливо у цьому оформленні.",
      },
    ],
  },
  104: {
    ...FALLBACK_BOOKS[3],
    description:
      "Антиутопія про тотальний контроль, мову влади і втрату приватності. Один із ключових романів ХХ століття.",
    language: "Англійська",
    publisherName: "Penguin Books",
    publicationDate: "1949-06-08",
    isbn: "978-0-452-28423-4",
    pageCount: 328,
    averageRating: 4.9,
    comments: [
      {
        authorName: "Andriy M.",
        commentDate: "2026-03-02T09:15:00Z",
        rating: 5,
        commentText: "Дуже влучний переклад і якісна палітурка.",
      },
      {
        authorName: "Yana D.",
        commentDate: "2026-03-06T17:05:00Z",
        rating: 5,
        commentText: "Після прочитання інакше дивишся на новини та медіа.",
      },
    ],
  },
  105: {
    ...FALLBACK_BOOKS[4],
    description:
      "Один з найяскравіших модерністських романів, що показує трансформацію людини у ритмі великого міста.",
    language: "Українська",
    publisherName: "Книголав",
    publicationDate: "1928-01-01",
    isbn: "978-617-7286-18-3",
    pageCount: 320,
    averageRating: 4.5,
    comments: [
      {
        authorName: "Роман Г.",
        commentDate: "2026-02-24T13:00:00Z",
        rating: 4,
        commentText: "Чудовий урбаністичний настрій і живі діалоги.",
      },
    ],
  },
  106: {
    ...FALLBACK_BOOKS[5],
    description:
      "Напружений пригодницький роман про втечу, гідність і боротьбу за свободу в екстремальних умовах.",
    language: "Українська",
    publisherName: "Навчальна книга",
    publicationDate: "1944-01-01",
    isbn: "978-966-329-502-7",
    pageCount: 352,
    averageRating: 4.6,
    comments: [
      {
        authorName: "Ірина Т.",
        commentDate: "2026-03-09T18:10:00Z",
        rating: 5,
        commentText: "Динамічно і дуже кінематографічно.",
      },
    ],
  },
};

export const FALLBACK_AUTHOR_DETAILS: Record<number, AuthorDetailsData> = {
  201: {
    ...FALLBACK_AUTHORS[0],
    fullName: "Тарас Шевченко",
    biography:
      "Український поет, художник і мислитель. Його творчість стала одним із фундаментів сучасної української культурної ідентичності.",
    birthDate: "1814-03-09",
    books: [FALLBACK_BOOKS[0]],
  },
  202: {
    ...FALLBACK_AUTHORS[1],
    fullName: "Іван Франко",
    biography:
      "Письменник, публіцист і науковець, який суттєво вплинув на розвиток української прози та літературної критики.",
    birthDate: "1856-08-27",
    books: [FALLBACK_BOOKS[1]],
  },
  203: {
    ...FALLBACK_AUTHORS[2],
    fullName: "Леся Українка",
    biography:
      "Поетеса і драматургиня, авторка творів, у яких поєднано філософську глибину і виразну художню форму.",
    birthDate: "1871-02-25",
    books: [FALLBACK_BOOKS[2]],
  },
  204: {
    ...FALLBACK_AUTHORS[3],
    fullName: "Джордж Орвелл",
    biography:
      "Британський письменник і есеїст, відомий антиутопічною прозою та критикою тоталітарних режимів.",
    birthDate: "1903-06-25",
    books: [FALLBACK_BOOKS[3]],
  },
  205: {
    ...FALLBACK_AUTHORS[4],
    fullName: "Валер'ян Підмогильний",
    biography:
      "Український прозаїк доби Розстріляного відродження, який сформував урбаністичний тон українського роману.",
    birthDate: "1901-02-02",
    books: [FALLBACK_BOOKS[4]],
  },
  206: {
    ...FALLBACK_AUTHORS[5],
    fullName: "Іван Багряний",
    biography:
      "Український письменник і політичний діяч. Його романи поєднують драматизм, динаміку і моральний вибір героя.",
    birthDate: "1906-10-02",
    books: [FALLBACK_BOOKS[5]],
  },
};

export const FALLBACK_SEARCH_SUGGESTIONS: SearchSuggestionData[] = [
  { id: 101, type: "book", displayText: "Кобзар", price: 279 },
  { id: 102, type: "book", displayText: "Захар Беркут", price: 315 },
  { id: 104, type: "book", displayText: "1984", price: 390 },
  { id: 105, type: "book", displayText: "Місто", price: 310 },
  { id: 201, type: "author", displayText: "Тарас Шевченко" },
  { id: 202, type: "author", displayText: "Іван Франко" },
  { id: 204, type: "author", displayText: "Джордж Орвелл" },
  { id: 205, type: "author", displayText: "Валер'ян Підмогильний" },
];

export const FALLBACK_NEW_ARRIVAL_IDS = [106, 105, 104, 103, 102, 101] as const;

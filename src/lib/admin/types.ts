export type AdminPublisherEntry = {
  publisherId: number;
  name: string;
};

export type AdminBookEntry = {
  bookId: number;
  title: string;
  authors: string;
  price: number;
  stockQuantity: number;
  genre: string;
  language: string;
  coverImagePath: string;
  description: string;
  isbn: string;
  pageCount: number;
  publicationDate: string;
  publisherId: number | null;
  publisherName: string;
  commentCount: number;
  lowStock: boolean;
};

export type AdminCommentEntry = {
  commentId: number;
  bookId: number;
  bookTitle: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  commentText: string;
  commentDate: string;
  rating: number;
};

export type AdminOrderEntry = {
  orderId: number;
  orderDate: string;
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: string;
  customerId: number | null;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  statusCount: number;
  currentStatus: string;
  currentStatusDate: string;
  trackingNumber: string;
};

export type AdminUserEntry = {
  customerId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
  loyaltyPoints: number;
  loyaltyProgram: boolean;
  isAdmin: boolean;
  ordersCount: number;
  commentsCount: number;
};

export type AdminDashboardData = {
  publishers: AdminPublisherEntry[];
  books: AdminBookEntry[];
  comments: AdminCommentEntry[];
  orders: AdminOrderEntry[];
  users: AdminUserEntry[];
};

export type AdminCreateBookInput = {
  title: string;
  price: number;
  stockQuantity: number;
  genre: string;
  language: string;
  description: string;
  coverImagePath: string;
  isbn: string;
  pageCount: number | null;
  publicationDate: string;
  publisherId: number | null;
};

export type AdminUpdateBookInput = {
  title: string;
  genre: string;
  language: string;
  description: string;
  coverImagePath: string;
  isbn: string;
  pageCount: number | null;
  publicationDate: string;
  publisherId: number | null;
};

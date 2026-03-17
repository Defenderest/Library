export type CartItemData = {
  bookId: number;
  title: string;
  author: string;
  price: number;
  quantity: number;
  coverImagePath: string;
  subtotal: number;
  stockQuantity: number;
};

export type CartSummaryData = {
  items: CartItemData[];
  totalItems: number;
  totalPrice: number;
};

export type CheckoutResult = {
  orderId: number;
  totalAmount: number;
};

import { z } from "zod";

export const createBookCommentSchema = z.object({
  reviewText: z
    .string({ required_error: "Введіть текст відгуку" })
    .trim()
    .min(5, "Відгук має містити щонайменше 5 символів")
    .max(1000, "Відгук не може перевищувати 1000 символів"),
  rating: z
    .number({ invalid_type_error: "Оберіть оцінку від 1 до 5" })
    .int("Оцінка має бути цілим числом")
    .min(1, "Оберіть оцінку від 1 до 5")
    .max(5, "Оберіть оцінку від 1 до 5"),
});

export type CreateBookCommentInput = z.infer<typeof createBookCommentSchema>;

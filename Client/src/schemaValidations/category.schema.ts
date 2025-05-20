import { DishStatusValues } from "@/constants/type";
import z from "zod";

export const CreateCategoryBody = z.object({
  name: z
    .string()
    .min(1, { message: "Tên danh mục không được để trống" })
    .max(256),
  description: z.string().max(10000),
  status: z
    .enum(DishStatusValues, {
      errorMap: () => ({ message: "Trạng thái danh mục không hợp lệ" }),
    })
    .optional(),
});

export type CreateCategoryBodyType = z.TypeOf<typeof CreateCategoryBody>;

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  status: z.enum(DishStatusValues),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CategoryRes = z.object({
  data: CategorySchema,
  message: z.string(),
});

export type CategoryResType = z.TypeOf<typeof CategoryRes>;

export const CategoryListRes = z.object({
  data: z.array(CategorySchema),
  message: z.string(),
});

export type CategoryListResType = z.TypeOf<typeof CategoryListRes>;

export const UpdateCategoryBody = CreateCategoryBody;
export type UpdateCategoryBodyType = CreateCategoryBodyType;
export const CategoryParams = z.object({
  id: z.coerce.number(),
});
export type CategoryParamsType = z.TypeOf<typeof CategoryParams>;

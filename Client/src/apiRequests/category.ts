import http from "@/lib/http";
import {
  CreateCategoryBodyType,
  CategoryListResType,
  CategoryResType,
  UpdateCategoryBodyType,
} from "@/schemaValidations/category.schema";

const categoryApiRequest = {
  list: () =>
    http.get<CategoryListResType>("categoryes", {
      next: { tags: ["categoryes"] },
    }),
  add: (body: CreateCategoryBodyType) =>
    http.post<CategoryResType>("categoryes", body),
  getCategory: (id: number) => http.get<CategoryResType>(`categoryes/${id}`),
  updateCategory: (id: number, body: UpdateCategoryBodyType) =>
    http.put<CategoryResType>(`categoryes/${id}`, body),
  deleteCategory: (id: number) =>
    http.delete<CategoryResType>(`categoryes/${id}`),
};

export default categoryApiRequest;

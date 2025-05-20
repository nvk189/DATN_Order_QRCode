import http from "@/lib/http";
import {
  CreateDishBodyType,
  DishListResType,
  DishResType,
  UpdateDishBodyType,
} from "@/schemaValidations/dish.schema";
import { CategoryListResType } from "@/schemaValidations/category.schema";
const dishApiRequest = {
  liststatuCategory: () =>
    http.get<CategoryListResType>("categoryes/status", {
      next: { tags: ["categoryes"] },
    }),
  list: () =>
    http.get<DishListResType>("dishes", { next: { tags: ["dishes"] } }),
  add: (body: CreateDishBodyType) => http.post<DishResType>("dishes", body),
  getDishCategory: (id: number) =>
    http.get<DishListResType>(`dishes/category/${id}`), // ✅ dùng DishListResType
  getDish: (id: number) => http.get<DishResType>(`dishes/${id}`),
  updateDish: (id: number, body: UpdateDishBodyType) =>
    http.put<DishResType>(`dishes/${id}`, body),
  deleteDish: (id: number) => http.delete<DishResType>(`dishes/${id}`),
};

export default dishApiRequest;

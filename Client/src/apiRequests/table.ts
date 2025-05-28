import http from "@/lib/http";
import {
  CreateTableBodyType,
  TableListResType,
  TableResType,
  UpdateTableBodyType,
} from "@/schemaValidations/table.schema";
import envConfig from "@/config";
const tableApiRequest = {
  list: () => http.get<TableListResType>("tables"),
  add: (body: CreateTableBodyType) => http.post<TableResType>("tables", body),
  getTable: (id: number) => http.get<TableResType>(`tables/${id}`),
  updateTable: (id: number, body: UpdateTableBodyType) =>
    http.put<TableResType>(`tables/${id}`, body),
  deleteTable: (id: number) => http.delete<TableResType>(`tables/${id}`),
};
export async function getTableServer(id: number): Promise<TableResType> {
  const res = await fetch(
    `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/tables/${id}`,
    {
      next: { revalidate: 0 }, // hoặc `cache: 'no-store'` nếu muốn luôn lấy mới
    }
  );
  if (!res.ok) throw new Error("Failed to fetch table");
  return res.json();
}
export default tableApiRequest;

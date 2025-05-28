import { Role } from "@/constants/type";
import { OrderSchema } from "@/schemaValidations/order.schema";
import z from "zod";

export const GuestLoginBody = z
  .object({
    name: z
      .string({ required_error: "Nhập tên" })
      .min(2, { message: "Nhập tên" })
      .max(50, { message: "Nhập tên" }),

    address: z
      .string({ required_error: "Nhập địa chỉ" })
      .min(1, { message: "Nhập địa chỉ" }),

    phone: z
      .string({ required_error: "Nhập số điện thoại" })
      .min(10, { message: "Nhập số điện thoại" })
      .max(10, { message: "Nhập số điện thoại" }),

    tableNumber: z.number({
      required_error: "Nhập số bàn",
      invalid_type_error: "Nhập số bàn",
    }),

    token: z.string({ required_error: "Thiếu mã token" }),
  })
  .strict();

export type GuestLoginBodyType = z.TypeOf<typeof GuestLoginBody>;

export const GuestLoginRes = z.object({
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    guest: z.object({
      id: z.number(),
      name: z.string(),
      address: z.string(),
      phone: z.string(),
      role: z.enum([Role.Guest]),
      tableNumber: z.number().nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }),
  }),
  message: z.string(),
});

export type GuestLoginResType = z.TypeOf<typeof GuestLoginRes>;
//  mới
export const GuestSchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  role: z.enum([Role.Guest]),
  tableNumber: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const GuestSchema1 = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  tableNumber: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type GuestUpdateOrdersBodyType = z.TypeOf<typeof GuestSchema1>;
export const GuestRes = z.object({
  data: GuestSchema,
  message: z.string(),
});

export type GuestResType = z.TypeOf<typeof GuestRes>;
//
export const GuestCreateOrdersBody = z.array(
  z.object({
    dishId: z.number(),
    quantity: z.number(),
  })
);

export type GuestCreateOrdersBodyType = z.TypeOf<typeof GuestCreateOrdersBody>;

export const GuestCreateOrdersRes = z.object({
  message: z.string(),
  data: z.array(OrderSchema),
});

export type GuestCreateOrdersResType = z.TypeOf<typeof GuestCreateOrdersRes>;

export const GuestGetOrdersRes = GuestCreateOrdersRes;

export type GuestGetOrdersResType = z.TypeOf<typeof GuestGetOrdersRes>;

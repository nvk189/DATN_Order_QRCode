"use client";

import { useAppStore } from "@/components/app-provider";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { OrderStatus } from "@/constants/type";
import envConfig from "@/config";
import {
  formatCurrency,
  getVietnameseOrderStatus,
  handleErrorApi,
} from "@/lib/utils";
import { useGuestGetOrderListQuery } from "@/queries/useGuest";
import {
  PayGuestOrdersResType,
  UpdateOrderResType,
  UpdateOrderBodyType,
} from "@/schemaValidations/order.schema";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import orderApiRequest from "@/apiRequests/order";
import guestApiRequest from "@/apiRequests/guest";
import { boolean, number } from "zod";
const useDeleteOrderMutation = () => {
  return useMutation({
    mutationFn: ({
      orderId,
      ...body
    }: UpdateOrderBodyType & { orderId: number }) =>
      orderApiRequest.deleteOrder(orderId, body),
  });
};

function AlertDialogDeleteOrder({
  order,
  onClose,
  onSuccess,
}: {
  order: any | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { mutateAsync } = useDeleteOrderMutation();

  const handleDelete = async () => {
    if (!order) return;

    const store = useAppStore.getState();
    const { socket } = store;

    try {
      store.setRole("Owner");

      await mutateAsync({
        orderId: order.id,
        status: "Rejected",
        dishId: order.dishSnapshot.id,
        quantity: order.quantity,
      });

      socket?.on("order-status-updated", (data) => {
        toast({
          description: `Đơn hàng #${
            data.orderId
          } đã được cập nhật trạng thái: ${getVietnameseOrderStatus(
            data.newStatus
          )}`,
        });
      });

      store.setRole("Guest");

      onClose();
      onSuccess();
    } catch (error) {
      store.setRole("Guest");
      handleErrorApi({ error });
    }
  };

  return (
    <AlertDialog open={!!order} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bạn có chắc muốn hủy món này?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="bg-foreground text-primary-foreground rounded px-1">
              {order?.dishSnapshot.name}
            </span>{" "}
            (x{order?.quantity}) sẽ bị hủy khỏi đơn hàng.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Không</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Hủy món</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
const guestPhoneData = JSON.parse(localStorage.getItem("phone_guest") || "{}");
const phone = guestPhoneData?.payload?.data?.phone || "";
const hasPhone = !phone || phone.trim() === "";
// Modal chọn phương thức thanh toán
function PaymentMethodDialog({
  open,
  onOpenChange,
  onOnlinePayment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOnlinePayment: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
          aria-label="Close"
        >
          ✕
        </button>
        <AlertDialogHeader>
          <AlertDialogTitle>Chọn phương thức thanh toán</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-between">
          {
            <AlertDialogCancel
              className="bg-gray-300 text-gray-800"
              onClick={() => {
                toast({ description: "Mời quý khách thanh toán tại quầy" });
                onOpenChange(false);
              }}
            >
              Thanh toán tại quầy
            </AlertDialogCancel>
          }
          <AlertDialogAction
            className="bg-blue-600 text-white"
            onClick={() => {
              onOnlinePayment();
              onOpenChange(false);
            }}
          >
            Thanh toán online
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function OrdersCart() {
  const [orderToDelete, setOrderToDelete] = useState<any | null>(null);
  const { data, refetch } = useGuestGetOrderListQuery();
  const orders = useMemo(() => data?.payload.data ?? [], [data]);
  const socket = useAppStore((state) => state.socket);
  const [address, setAddress] = useState("");
  const [guestInfor, setguestInfo] = useState({});
  const [phone, setPhone] = useState("");
  const [statusAddress, setStatusAddress] = useState(false);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  useEffect(() => {
    async function fetchGuestInfo() {
      const guestPhone = JSON.parse(
        localStorage.getItem("phone_guest") || "null"
      );
      if (
        !guestPhone ||
        typeof guestPhone !== "string" ||
        guestPhone.trim() === ""
      ) {
        setStatusAddress(false);
      } else {
        try {
          const guestInfo = await guestApiRequest.getGuest(guestPhone);
          const guestData = guestInfo?.payload?.data;
          setguestInfo(guestData);
          console.log(guestInfo);
          if (guestData) {
            const currentAddress = guestData?.address || "";
            const currentPhone = guestData?.phone || "";
            setAddress(currentAddress);
            setPhone(currentPhone);
            setStatusAddress(true);
          }
        } catch (error) {
          console.error("Lỗi khi lấy thông tin khách:", error);
          setStatusAddress(false);
        }
      }
    }
    fetchGuestInfo();
  }, []);

  const handlePaymentDialogOpen = async () => {
    const guestPhone = JSON.parse(
      localStorage.getItem("phone_guest") || "null"
    );

    console.log(guestPhone);
    if (
      !guestPhone ||
      typeof guestPhone !== "string" ||
      guestPhone.trim() === ""
    ) {
      setPhone(guestPhone);
      setStatusAddress(false);
      setIsPaymentDialogOpen(true);
      console.log(statusAddress);
    } else {
      try {
        if (!address || address.trim() === "") {
          toast({
            description:
              "Vui lòng cập nhật địa chỉ nhận hàng trước khi thanh toán.",
          });
          return;
        }
        console.log(guestInfor);
        const info = guestInfor as {
          id: number;
          name: string;
          address: string;
          phone: string;
          tableNumber: number;
          createdAt: string;
          updatedAt: string;
        };

        console.log(info);
        await guestApiRequest.update(info.id, {
          name: info.name,
          tableNumber: info.tableNumber,
          createdAt: new Date(info.createdAt),
          updatedAt: new Date(),
          address: address, // dùng từ state
          phone: phone, // dùng từ state
        });

        setIsPaymentDialogOpen(true);
      } catch (error) {
        console.error("Lỗi khi xử lý thanh toán:", error);
        toast({
          description: "Đã xảy ra lỗi. Vui lòng thử lại sau.",
        });
      }
    }
  };

  const { waitingForPaying, paid } = useMemo(() => {
    return orders.reduce(
      (result, order) => {
        if (
          order.status === OrderStatus.Delivered ||
          order.status === OrderStatus.Processing ||
          order.status === OrderStatus.Pending
        ) {
          return {
            ...result,
            waitingForPaying: {
              price:
                result.waitingForPaying.price +
                order.dishSnapshot.price * order.quantity,
              quantity: result.waitingForPaying.quantity + order.quantity,
            },
          };
        }
        if (order.status === OrderStatus.Paid) {
          return {
            ...result,
            paid: {
              price:
                result.paid.price + order.dishSnapshot.price * order.quantity,
              quantity: result.paid.quantity + order.quantity,
            },
          };
        }
        return result;
      },
      {
        waitingForPaying: {
          price: 0,
          quantity: 0,
        },
        paid: {
          price: 0,
          quantity: 0,
        },
      }
    );
  }, [orders]);

  useEffect(() => {
    if (socket?.connected) {
      function onConnect() {
        console.log("Connected: ", socket?.id);
      }
      function onDisconnect() {
        console.log("Disconnected");
      }
      function onUpdateOrder(data: UpdateOrderResType["data"]) {
        toast({
          description: `Món ${data.dishSnapshot.name} (SL: ${
            data.quantity
          }) vừa được cập nhật sang trạng thái "${getVietnameseOrderStatus(
            data.status
          )}"`,
        });
        refetch();
      }
      function onPayment(data: PayGuestOrdersResType["data"]) {
        const { guest } = data[0];
        toast({
          description: `${guest?.name} tại bàn ${guest?.tableNumber} đã thanh toán ${data.length} đơn`,
        });
        refetch();
      }

      socket.on("update-order", onUpdateOrder);
      socket.on("payment", onPayment);
      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);

      return () => {
        socket.off("update-order", onUpdateOrder);
        socket.off("payment", onPayment);
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
      };
    }
  }, [refetch, socket]);

  const handleOnlinePayment = async () => {
    try {
      if (waitingForPaying.quantity === 0) {
        toast({
          description: "Không có đơn chưa thanh toán để thanh toán online",
        });
        return;
      }
      if (phone && address === "") {
        toast({
          description: "Cập nhật địa chỉ nhận hàng",
        });
        return;
      }

      // Lấy danh sách orderIds cần thanh toán
      const orderIds = orders
        .filter(
          (o) =>
            o.status === OrderStatus.Pending ||
            o.status === OrderStatus.Processing ||
            o.status === OrderStatus.Delivered
        )
        .map((o) => o.id);

      // Gửi request lên backend
      const response = await fetch(
        `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/payments/create-payment-link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: waitingForPaying.price,
            orderIds,
            description: "Thanh toán đơn hàng",
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Lỗi thanh toán:", response.status, errorText);
        throw new Error(
          `Lỗi khi tạo link thanh toán: ${errorText || response.status}`
        );
      }

      const data = await response.json();

      if (!data.checkoutUrl) {
        throw new Error("Backend không trả về checkoutUrl");
      }

      // Mở link thanh toán mới
      window.open(data.checkoutUrl, "_blank");
    } catch (error) {
      toast({
        description: `Thanh toán online thất bại: ${
          (error as Error).message || "Lỗi không xác định"
        }`,
      });
    }
  };

  return (
    <>
      {orders.map((order, index) => (
        <div key={order.id} className="flex gap-4 mb-4">
          <div className="text-sm font-semibold">{index + 1}</div>
          <div className="flex-shrink-0 relative">
            <Image
              src={order.dishSnapshot.image}
              alt={order.dishSnapshot.name}
              height={100}
              width={100}
              quality={100}
              className="object-cover w-[80px] h-[80px] rounded-md"
            />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm">{order.dishSnapshot.name}</h3>
            <div className="text-xs font-semibold">
              {formatCurrency(order.dishSnapshot.price)} x{" "}
              <Badge className="px-1">{order.quantity}</Badge>
            </div>
          </div>
          <div className="flex-shrink-0 ml-auto flex justify-center items-center gap-2">
            <Badge variant="outline">
              {getVietnameseOrderStatus(order.status)}
            </Badge>
            {order.status === "Pending" && (
              <span
                className="text-sm text-red-500 cursor-pointer"
                onClick={() => setOrderToDelete(order)}
              >
                Hủy
              </span>
            )}
          </div>
        </div>
      ))}

      {paid.quantity !== 0 && (
        <div className="sticky bottom-0 ">
          <div className="w-full flex space-x-4 text-xl font-semibold">
            <span>Đơn đã thanh toán · {paid.quantity} món</span>
            <span>{formatCurrency(paid.price)}</span>
          </div>
        </div>
      )}
      <div className="sticky bottom-0 ">
        <div className="w-full flex space-x-4 text-xl font-semibold">
          <span>Đơn chưa thanh toán · {waitingForPaying.quantity} món</span>
          <span>{formatCurrency(waitingForPaying.price)}</span>
        </div>
      </div>

      {statusAddress && (
        <div className="sticky bottom-0">
          <div className="w-full flex items-start gap-3">
            <p className="text-lg font-medium mt-1">Địa chỉ:</p>
            <textarea
              id="address"
              className="flex-1 border rounded-md p-2 resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Nhập địa chỉ của bạn..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            ></textarea>
          </div>
        </div>
      )}

      <div className="sticky bottom-0 ">
        <div className="w-full flex justify-center">
          <button
            onClick={handlePaymentDialogOpen}
            className="bg-blue-500 text-white text-xl font-semibold px-6 py-1 rounded-lg shadow hover:bg-blue-600 transition duration-300"
          >
            Thanh toán để xác nhận đơn hàng
          </button>
        </div>
      </div>

      <PaymentMethodDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        onOnlinePayment={handleOnlinePayment}
      />

      <AlertDialogDeleteOrder
        order={orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onSuccess={() => refetch()}
      />
    </>
  );
}

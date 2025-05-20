"use client";

import { useAppStore } from "@/components/app-provider";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { OrderStatus } from "@/constants/type";
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
    console.log(order);
    // if (!order) return;
    // try {
    //   const result = await mutateAsync({
    //     orderId: order.id,
    //     status: "Rejected",
    //     dishId: order.dishSnapshot.id,
    //     quantity: order.quantity,
    //   });
    //   toast({
    //     title: result.payload.message,
    //   });
    //   onClose();
    //   onSuccess();
    // } catch (error) {
    //   handleErrorApi({ error });
    // }
  };

  return (
    <AlertDialog open={!!order} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bạn có chắc muốn hủy món này?</AlertDialogTitle>
          <AlertDialogDescription>
            Món{" "}
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

export default function OrdersCart() {
  const [orderToDelete, setOrderToDelete] = useState<any | null>(null);
  const { data, refetch } = useGuestGetOrderListQuery();
  const orders = useMemo(() => data?.payload.data ?? [], [data]);
  const socket = useAppStore((state) => state.socket);

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
      onConnect();
    }

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

    socket?.on("update-order", onUpdateOrder);
    socket?.on("payment", onPayment);
    socket?.on("connect", onConnect);
    socket?.on("disconnect", onDisconnect);

    return () => {
      socket?.off("update-order", onUpdateOrder);
      socket?.off("payment", onPayment);
      socket?.off("connect", onConnect);
      socket?.off("disconnect", onDisconnect);
    };
  }, [refetch, socket]);

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

      <AlertDialogDeleteOrder
        order={orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onSuccess={() => refetch()}
      />
    </>
  );
}

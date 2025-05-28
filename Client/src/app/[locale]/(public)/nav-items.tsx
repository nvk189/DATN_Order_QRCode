"use client";
import { useAppStore } from "@/components/app-provider";
import { Role } from "@/constants/type";
import { cn, handleErrorApi } from "@/lib/utils";
import { useLogoutMutation } from "@/queries/useAuth";
import { RoleType } from "@/types/jwt.types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useDishListStatusQuery } from "@/queries/useDish";

const staticMenuItems: {
  title: string;
  href: string;
  role?: RoleType[];
  hideWhenLogin?: boolean;
}[] = [
  {
    title: "home",
    href: "/",
  },
  {
    title: "orders",
    href: "/guest/orders",
    role: [Role.Guest, Role.Owner],
  },
  {
    title: "login",
    href: "/login",
    hideWhenLogin: true,
  },
  {
    title: "manage",
    href: "/manage/dashboard",
    role: [Role.Owner, Role.Employee],
  },
];

export default function NavItems({ className }: { className?: string }) {
  const { data: categories, isLoading } = useDishListStatusQuery();
  const categoryList = categories?.payload?.data ?? [];
  const t = useTranslations("NavItem");
  const role = useAppStore((state) => state.role);
  const setRole = useAppStore((state) => state.setRole);
  const disconnectSocket = useAppStore((state) => state.disconnectSocket);
  const logoutMutation = useLogoutMutation();
  const router = useRouter();

  const logout = async () => {
    if (logoutMutation.isPending) return;
    try {
      await logoutMutation.mutateAsync();
      setRole();
      disconnectSocket();
      router.push("/");
    } catch (error: any) {
      handleErrorApi({ error });
    }
  };

  return (
    <>
      {staticMenuItems.map((item) => {
        const isAuth = item.role && role && item.role.includes(role);
        const canShow =
          (item.role === undefined && !item.hideWhenLogin) ||
          (!role && item.hideWhenLogin);
        if (isAuth || canShow) {
          return (
            <Link href={item.href} key={item.href} className={className}>
              {t(item.title as any)}
            </Link>
          );
        }
        return null;
      })}

      {role === Role.Guest && categoryList.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className={cn(className, "cursor-pointer")}>{t("menu")} ⌄</div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {categoryList.map((cat) => (
              <DropdownMenuItem asChild key={cat.id}>
                <Link href={`/guest/menu?id=${cat.id}`}>{cat.name}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Logout Button */}
      {role && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div className={cn(className, "cursor-pointer")}>{t("logout")}</div>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("logoutDialog.logoutQuestion")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("logoutDialog.logoutConfirm")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t("logoutDialog.logoutCancel")}
              </AlertDialogCancel>
              <AlertDialogAction onClick={logout}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

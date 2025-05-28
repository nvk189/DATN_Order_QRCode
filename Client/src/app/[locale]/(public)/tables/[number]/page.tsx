import GuestLoginForm from "@/app/[locale]/(public)/tables/[number]/guest-login-form";
import GuestLoginFormShip from "@/app/[locale]/(public)/tables/[number]/guest-login-form-ship";
import envConfig, { Locale } from "@/config";
import { baseOpenGraph } from "@/shared-metadata";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getTableServer } from "@/apiRequests/table";
type Props = {
  params: { number: string; locale: Locale };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: "LoginGuest",
  });

  const url =
    envConfig.NEXT_PUBLIC_URL +
    `/${props.params.locale}/tables/${props.params.number}`;

  console.log(url);
  return {
    title: `No ${props.params.number} | ${t("title")}`,
    description: t("description"),
    openGraph: {
      ...baseOpenGraph,
      title: `No ${props.params.number} | ${t("title")}`,
      description: t("description"),
      url,
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: false,
    },
  };
}

export default async function TableNumberPage({ params }: Props) {
  // Lấy dữ liệu server side
  // const res = await fetch(
  //   `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/tables/${params.number}`
  // );
  // const data = await res.json();

  const table = await getTableServer(Number(params.number));

  if (table.data?.transport === "home") {
    return <GuestLoginForm />;
  } else {
    return <GuestLoginFormShip />;
  }
}

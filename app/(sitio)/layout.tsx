import { Marco } from "@/components/sitio/Marco";

export const dynamic = "force-dynamic";

export default function LayoutSitio({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Marco>{children}</Marco>;
}

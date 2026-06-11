import { EcommerceSettingsShell } from "@/components/ecommerce/ecommerce-settings-shell";

export default function EcommerceSettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <EcommerceSettingsShell>{children}</EcommerceSettingsShell>;
}

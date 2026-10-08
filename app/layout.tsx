import type { Metadata } from "next";
import "./globals.css";
import "./storefront.css";
import { StoreProvider } from "@/components/store";
import { SiteFrame } from "@/components/site-frame";
import "./checkout.css";
import "./mobile.css";
import "./mobile-storefront.css";
export const metadata: Metadata = {
  title: "Covabra | Compras que acompanham sua rotina",
  description:
    "Suas compras essenciais, no seu tempo. Protótipo de assinaturas Covabra.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <StoreProvider>
          <SiteFrame>{children}</SiteFrame>
        </StoreProvider>
      </body>
    </html>
  );
}

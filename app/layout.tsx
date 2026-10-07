import type { Metadata } from "next";
import "./globals.css";
import "./storefront.css";
import { StoreProvider } from "@/components/store";
import { Header, Footer } from "@/components/shell";
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
          <Header />
          {children}
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}

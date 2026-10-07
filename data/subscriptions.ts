import { PrototypeState, SubscriptionItem } from "@/types";
import { products } from "./products";
const items: SubscriptionItem[] = [
  { productId: "leite", quantity: 4, frequency: "Toda semana" },
  { productId: "cafe", quantity: 2, frequency: "Todo mês" },
  { productId: "papel", quantity: 1, frequency: "A cada 15 dias" },
];
export function initialState(): PrototypeState {
  return {
    cart: products
      .filter((p) => p.id !== "substituto")
      .map((p) => ({
        productId: p.id,
        quantity: p.quantity,
        frequency: p.frequency,
      })),
    draft: {
      items: [],
      date: "2026-10-15",
      period: "08h às 12h",
      addressId: "casa",
      paymentId: "master",
    },
    addresses: [
      {
        id: "casa",
        label: "Casa",
        street: "Rua das Flores, 123 · Jardim Primavera",
        city: "Sumaré – SP",
        zip: "13170-000",
      },
      {
        id: "trabalho",
        label: "Trabalho",
        street: "Av. Rebouças, 450 · Centro",
        city: "Sumaré – SP",
        zip: "13170-020",
      },
    ],
    payments: [
      {
        id: "master",
        brand: "Mastercard",
        last4: "4821",
        holder: "Robson Ferreira",
        expiry: "08/29",
      },
      {
        id: "visa",
        brand: "Visa",
        last4: "9012",
        holder: "Robson Ferreira",
        expiry: "11/30",
      },
    ],
    lastCreated: null,
    subscriptions: [
      {
        id: "00124",
        name: "Essenciais de casa",
        status: "Ativa",
        items,
        date: "2026-10-18",
        period: "08h às 12h",
        addressId: "casa",
        paymentId: "master",
        events: ["Assinatura criada em 18/06/2026"],
        history: [
          {
            id: "c3",
            date: "2026-09-18",
            status: "Pedido entregue",
            amount: 198.42,
          },
          {
            id: "c2",
            date: "2026-08-18",
            status: "Pedido entregue",
            amount: 204.17,
          },
          {
            id: "c1",
            date: "2026-07-18",
            status: "Pagamento aprovado",
            amount: 194.9,
          },
        ],
      },
      {
        id: "00125",
        name: "Despensa sempre em dia",
        status: "Pausada",
        items: items.filter((i) => i.productId !== "cafe"),
        date: "2026-11-05",
        pausedUntil: "2026-11-05",
        period: "12h às 18h",
        addressId: "casa",
        paymentId: "visa",
        events: ["Pausa solicitada até 05/11/2026"],
        history: [],
      },
      {
        id: "00126",
        name: "Minha compra do mês",
        status: "Pagamento recusado",
        items: items.filter((i) => i.productId !== "cafe"),
        date: "2026-10-12",
        period: "18h às 21h",
        addressId: "casa",
        paymentId: "master",
        events: ["Cobrança recusada. Atualize a forma de pagamento."],
        history: [
          {
            id: "falha",
            date: "2026-10-05",
            status: "Pagamento recusado",
            amount: 44.86,
          },
        ],
      },
    ],
  };
}

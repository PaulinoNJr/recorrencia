export type Frequency =
  "Toda semana" | "A cada 15 dias" | "Todo mês" | "A cada 2 meses";
export type Status = "Ativa" | "Pausada" | "Pagamento recusado" | "Cancelada";
export interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
  price: number;
  previousPrice?: number;
  eligible: boolean;
  stock: number;
  quantity: number;
  frequency: Frequency;
}
export interface SubscriptionItem {
  productId: string;
  quantity: number;
  frequency: Frequency;
  substituteId?: string;
  skipOnce?: boolean;
}
export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  zip: string;
}
export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  holder: string;
  expiry: string;
}
export interface SubscriptionCycle {
  id: string;
  date: string;
  status: string;
  amount: number;
}
export interface Subscription {
  id: string;
  name: string;
  status: Status;
  items: SubscriptionItem[];
  date: string;
  period: string;
  addressId: string;
  paymentId: string;
  pausedUntil?: string;
  events: string[];
  history: SubscriptionCycle[];
}
export interface Draft {
  frequencyPending?: string[];
  source?: "cart" | "catalog";
  items: SubscriptionItem[];
  date: string;
  period: string;
  addressId: string;
  paymentId: string;
}
export interface PrototypeState {
  purchase?: {
    substitute?: string;
    invoice?: string;
    cpf?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    addressId?: string;
    paymentId?: string;
    date?: string;
    period?: string;
  };
  cart: SubscriptionItem[];
  draft: Draft;
  subscriptions: Subscription[];
  addresses: Address[];
  payments: PaymentMethod[];
  lastCreated: string | null;
}

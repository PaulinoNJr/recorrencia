import { PaymentMethod, PrototypeState } from "@/types";
import { CUSTOMER_NAME } from "./customer";

export const DEFAULT_PAYMENT_ID = "master";

export function fakePayments(): PaymentMethod[] {
  return [{ id: DEFAULT_PAYMENT_ID, brand: "Mastercard", last4: "1234", holder: CUSTOMER_NAME, expiry: "12/30" }];
}

export function withFakePayments(state: PrototypeState): PrototypeState {
  const payments = [...fakePayments(), ...state.payments.filter((payment) => payment.id !== DEFAULT_PAYMENT_ID)];
  const paymentId = (id?: string) => payments.some((payment) => payment.id === id) ? id! : DEFAULT_PAYMENT_ID;
  return {
    ...state,
    payments,
    draft: { ...state.draft, paymentId: paymentId(state.draft.paymentId) },
    ...(state.purchase ? { purchase: { ...state.purchase, paymentId: paymentId(state.purchase.paymentId) } } : {}),
    subscriptions: state.subscriptions.map((subscription) => ({ ...subscription, paymentId: paymentId(subscription.paymentId) })),
  };
}

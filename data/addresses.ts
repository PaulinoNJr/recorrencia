import { Address, PrototypeState } from "@/types";

export function fakeAddresses(): Address[] {
  return [
    { id: "casa", label: "Casa", street: "Rua das Flores, 123 · Jardim Primavera", city: "Sumaré – SP", zip: "13170-000" },
    { id: "trabalho", label: "Trabalho", street: "Av. Rebouças, 450 · Centro", city: "Sumaré – SP", zip: "13170-020" },
  ];
}

export function withFakeAddresses(state: PrototypeState): PrototypeState {
  const defaults = fakeAddresses();
  const addresses = [...defaults, ...state.addresses.filter((address) => !defaults.some((item) => item.id === address.id))];
  const addressId = (id?: string) => addresses.some((address) => address.id === id) ? id! : "casa";
  return {
    ...state,
    addresses,
    draft: { ...state.draft, addressId: addressId(state.draft.addressId) },
    ...(state.purchase ? { purchase: { ...state.purchase, addressId: addressId(state.purchase.addressId) } } : {}),
    subscriptions: state.subscriptions.map((subscription) => ({ ...subscription, addressId: addressId(subscription.addressId) })),
  };
}

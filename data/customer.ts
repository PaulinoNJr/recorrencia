import { PrototypeState } from "@/types";

export const CUSTOMER_NAME = "Paulino";
export const CUSTOMER_CPF = "123.456.789-99";

export function withFakeCustomer(state: PrototypeState): PrototypeState {
  if (!state.customer) return state;
  const customer = { ...state.customer, firstName: CUSTOMER_NAME, cpf: CUSTOMER_CPF };
  return {
    ...state,
    customer,
    purchase: { ...state.purchase, email: state.purchase?.email ?? customer.email, firstName: CUSTOMER_NAME, cpf: CUSTOMER_CPF },
    payments: state.payments.map((payment) => ({ ...payment, holder: `${customer.firstName} ${customer.lastName}`.trim() })),
  };
}

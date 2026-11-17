import { productById } from "@/data/products";
import type { Frequency, SubscriptionItem } from "@/types";

export const MAX_SUBSCRIPTION_NAME_LENGTH = 60;

export function normalizeSubscriptionName(value?: string) {
  return Array.from((value ?? "").normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim())
    .slice(0, MAX_SUBSCRIPTION_NAME_LENGTH).join("");
}

export function suggestSubscriptionNames(items: SubscriptionItem[]) {
  const products = items.map((item) => productById(item.productId));
  let main = "Essenciais da casa";
  if (products.length) {
    if (products.every((product) => ["leite", "cafe", "pao", "ovos"].includes(product.id))) main = "Café da manhã";
    else if (products.every((product) => /Higiene|Limpeza/.test(product.category))) main = "Cuidados da casa";
    else if (products.every((product) => product.category.startsWith("Hortifruti"))) main = "Frutas e frescos";
    else if (products.every((product) => product.category.startsWith("Mercearia"))) main = "Despensa em dia";
  }
  return [...new Set([
    main,
    products.length ? "Reposição de " + products[0].name : "Compras da família",
    "Essenciais da casa",
    "Minha despensa",
  ].map(normalizeSubscriptionName))].slice(0, 3);
}

export function resolveSubscriptionName(value: string | undefined, items: SubscriptionItem[]) {
  return normalizeSubscriptionName(value) || suggestSubscriptionNames(items)[0];
}

export function cycleSubscriptionName(name: string, frequency: Frequency, multiple: boolean) {
  const suffix = multiple ? " · " + frequency : "";
  const base = Array.from(normalizeSubscriptionName(name)).slice(0, MAX_SUBSCRIPTION_NAME_LENGTH - Array.from(suffix).length).join("").trimEnd();
  return base + suffix;
}

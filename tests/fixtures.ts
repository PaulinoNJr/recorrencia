import { test as base, expect } from "@playwright/test";
import { initialState } from "../data/subscriptions";

// Existing management tests explicitly use a populated demonstration account.
// The application itself always starts with an anonymous, empty session.
export const test = base.extend({
  page: async ({ page }, providePage) => {
    await page.addInitScript((state) => {
      if (!localStorage.getItem("covabra-prototype-v1")) {
        localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
      }
    }, initialState());
    await providePage(page);
  },
});
export { expect };

import { test, expect } from "./fixtures";
test("checkout de compra unica segue as etapas e preserva os dados", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/carrinho");
  await page.getByRole("button", { name: "Aumentar quantidade" }).first().waitFor();
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("covabra-prototype-v1")!);
    state.customer = null;
    delete state.purchase;
    localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
  });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Finalizar pedido", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("radio", { name: "Reembolso do valor", exact: true })
    .check();
  await page.getByRole("radio", { name: "Não", exact: true }).check();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-real-cart.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Finalizar pedido", exact: true })
    .click();
  await expect(page).toHaveURL("/checkout");
  await page
    .getByRole("textbox", { name: "E-mail", exact: true })
    .fill("cliente@example.com");
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-checkout-email.png`,
    fullPage: true,
  });
  await page.getByLabel("Senha", { exact: true }).fill("teste");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("/checkout/entrega");
  await page.reload();
  await expect(page.locator(".checkout-saved-info").first()).toContainText("Paulino");
  await page.getByRole("button", { name: /Trabalho/ }).click();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-checkout-delivery.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Ir para pagamento", exact: true })
    .click();
  await page.getByRole("button", { name: "Adicionar cartão fictício" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Adicionar cartão", exact: true }).click();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-checkout-payment.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Compra realizada!" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Gostaria de tornar essa compra recorrente?",
    }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-purchase-recurrence.png`,
    fullPage: true,
  });
  const completed = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("covabra-prototype-v1")!).purchase
        .completedItems,
  );
  await page.reload();
  await page.getByRole("button", { name: "Sim, tornar recorrente" }).click();
  await expect(page).toHaveURL("/assinatura/configurar");
  const draft = await page.evaluate(
    () => JSON.parse(localStorage.getItem("covabra-prototype-v1")!).draft,
  );
  expect(draft.source).toBe("purchase");
  expect(draft.items).toEqual(
    completed.filter(
      (item: { productId: string }) => item.productId !== "abacaxi",
    ),
  );
  expect(draft.frequencyPending).toEqual(
    draft.items.map((item: { productId: string }) => item.productId),
  );
  await expect(page.getByRole("checkbox", { name: /Abacaxi/ })).toHaveCount(0);
  await expect(
    page.getByLabel("Frequência de Leite integral Shefa"),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Continuar para frequência" }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("checkbox", {
      name: "Incluir Leite integral Shefa na assinatura",
    }),
  ).toBeChecked();
  expect(errors).toEqual([]);
});

test("convite usa a compra concluida e permite recusar sem criar assinatura", async ({
  page,
}) => {
  await page.goto("/carrinho");
  await page
    .getByRole("button", { name: "Criar assinatura", exact: true })
    .click();
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("covabra-prototype-v1")!);
    state.purchase = {
      completedItems: [
        {
          ...state.cart.find(
            (item: { productId: string }) => item.productId === "leite",
          ),
          quantity: 7,
        },
      ],
    };
    state.cart = [];
    localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
  });
  await page.goto("/checkout/sucesso");
  await page.getByRole("link", { name: "Não, continuar comprando" }).click();
  await expect(page).toHaveURL("/loja");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("covabra-prototype-v1")!).draft.source,
    ),
  ).not.toBe("purchase");
  await page.goto("/checkout/sucesso");
  await page.getByRole("button", { name: "Sim, tornar recorrente" }).click();
  await expect(
    page.getByRole("checkbox", {
      name: "Incluir Leite integral Shefa na assinatura",
    }),
  ).toBeChecked();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("covabra-prototype-v1")!).draft.items[0]
          .quantity,
    ),
  ).toBe(7);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("covabra-prototype-v1")!).cart,
    ),
  ).toEqual([]);
});

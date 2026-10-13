export function accountReturnPath(value?: string) {
  return value && /^\/(?:loja|listas|minhas-assinaturas(?:\/[0-9]+(?:\/(?:editar|historico))?)?|assinatura\/(?:entrega|pagamento|revisao|sucesso)|checkout(?:\/(?:dados|entrega|pagamento|sucesso))?)$/.test(value)
    ? value : "/loja";
}

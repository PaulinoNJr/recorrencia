# Covabra · Compras recorrentes

Protótipo navegável de alta fidelidade para demonstrar a criação e o gerenciamento de assinaturas dentro de um e-commerce de supermercado. Toda a interface está em português. Não existe autenticação, integração com VTEX, cobrança real, processamento de pedidos ou backend.

## Executar

Requer Node.js 20.9 ou superior e npm.

```bash
npm install
npm run dev
```

Abra http://localhost:3000/carrinho.

```bash
npm run lint
npm run build
npm run start
```

## Publicar na Vercel

Envie esta pasta a um repositório GitHub. Na Vercel, escolha **Add New → Project**, importe o repositório e selecione o preset **Next.js**. Use a raiz como Root Directory, `npm run build` como Build Command e mantenha o diretório de saída padrão. Não são necessárias variáveis de ambiente, banco ou serviços externos. O projeto não foi publicado automaticamente.

## Stack e organização

Next.js com App Router, React, TypeScript estrito, Tailwind CSS 4, Lucide e Context com localStorage.

```text
app/                 Rotas, layout e estilos globais
components/          Carrinho, checkout, conta, catálogo, operação e UI
data/                Produtos, endereços, cartões e assinaturas tipados
lib/                 Formatação de preços e cálculo de ciclos
types/               Contratos do estado e dos mocks
public/fonts/        Basic Sans em arquivos locais
public/products/     Fotografias locais e ilustrações substituíveis
tests/               Fluxos funcionais e layout em desktop/mobile
```

## Rotas

| Rota | Experiência |
| --- | --- |
| `/` | Página inicial com categorias, banners e ofertas da referência Covabra |
| `/carrinho` | Quantidades, remoção, compra única ou assinatura |
| `/comprar` | Catálogo, busca e produtos para adicionar |
| `/cupons`, `/listas` | Páginas auxiliares da navegação |
| `/assinatura/configurar` | Seleção explícita e frequência por produto |
| `/assinatura/entrega` | Endereço, data e período |
| `/assinatura/pagamento` | Cartões salvos e inclusão de cartão fictício |
| `/assinatura/revisao` | Revisão, edição e aceite dos termos |
| `/assinatura/sucesso` | Confirmação e acesso à assinatura criada |
| `/minhas-assinaturas` | Cards e filtros por status |
| `/minhas-assinaturas/[id]` | Ciclo, produtos e gerenciamento |
| `/minhas-assinaturas/[id]/editar` | Inclusão, remoção, quantidade e frequência |
| `/minhas-assinaturas/[id]/historico` | Ciclos e atividades |
| `/operacao` | Indicadores e lista interna |
| `/operacao/assinaturas/[id]` | Cliente, produtos, cobrança e eventos |

## Demonstração

1. No carrinho, clique em **Criar assinatura**. Nenhum produto é selecionado automaticamente.
2. Selecione produtos, altere quantidades/frequências e avance por entrega e pagamento.
3. Revise, aceite os termos e confirme. A assinatura aparece na conta e na operação.
4. No detalhe, edite produtos, altere cartão/entrega, pule um ciclo ou pause.
5. Visualize o histórico; reative ou cancele quando desejar.
6. Recarregue a página para verificar a persistência. O rodapé oferece **Restaurar dados do protótipo**.

Mocks iniciais: `00124` ativa com café indisponível e histórico; `00125` pausada; `00126` pagamento recusado. Ciclo pulado e cancelamento podem ser demonstrados pelas ações do detalhe e ficam registrados nos eventos.

## Alterar conteúdo e identidade

- **Cores, medidas e responsividade:** tokens no início de `app/globals.css`. Tailwind é carregado pelo PostCSS; componentes reutilizáveis usam classes semânticas para concentrar os ajustes visuais.
- **Logo:** `public/logo.webp`, utilizado em `components/shell.tsx`.
- **Página inicial:** `components/storefront.tsx`, `app/storefront.css` e `data/home-assets.json`; imagens oficiais salvas em `public/home/`.
- **Produtos:** `data/products.ts`; imagens em `public/products/`.
- **Assinaturas, endereços e pagamentos:** `data/subscriptions.ts`, na função `initialState`.
- **Persistência:** `components/store.tsx`, chave `covabra-prototype-v1`. Restaure os dados após mudar os mocks.
- **Ciclos e preços:** `lib/utils.ts`.

## Referência e suposições

Referência consultada: https://www.covabra.com.br/ em 06/10/2026. O HTML do site identifica Basic Sans, cores `#018530` e `#127439`, a navegação com Ofertas, Cupons e Minhas Listas e o logo utilizado. A fonte, o logo e seis fotografias foram baixados dos endereços públicos do site para permitir uma demonstração sem dependência de CDN. O verde principal `#018530` foi observado no site; fundos, bordas, verde escuro e demais tokens são adaptações deste protótipo, sem afirmação de que sejam tokens oficiais.

Preços, disponibilidade, cliente, endereços e cartões são fictícios. Café e papel possuem ilustrações locais de embalagem, fáceis de substituir. O catálogo utiliza oito produtos e um substituto; feijão, óleo, pão, ovos e abacaxi complementam o conjunto para aproveitar fotografias disponíveis. Abacaxi demonstra inelegibilidade. Café demonstra indisponibilidade no próximo ciclo, mantendo a possibilidade de assinatura futura.

Frete de R$ 9,90 é uma hipótese demonstrativa fixa, exibida no resumo, sem promessa de gratuidade ou desconto. Datas da demonstração se baseiam em outubro de 2026. Semanas e quinzenas usam 7 e 15 dias; mês e dois meses usam 30 e 60 dias. Ao pular uma entrega, a próxima data geral usa a menor frequência entre os itens e os ciclos reiniciam a partir dela. Isso simplifica o agendamento de frequências diferentes e não representa um calendário de logística de produção.

Itens não incluídos permanecem no carrinho para compra única; criar uma assinatura não os compra. Atualizar um cartão em uma assinatura recusada simula uma nova aprovação. Pausar por 15/30/60 dias usa 06/10/2026 como referência e impede que a próxima entrega fique antes da retomada. O histórico preserva os valores registrados sem recalculá-los quando os produtos atuais mudam. Alterações do próximo ciclo não geram cronogramas ou cobranças reais.

Somente bandeira e dados fixos de demonstração podem ser adicionados no cartão fictício. Não existe campo para número completo ou CVV. Dados ficam apenas no navegador; restaurar o protótipo remove alterações locais.

## Verificação automatizada

```bash
npx playwright install chromium
npm run build
npm run test:e2e
```

Os testes exercitam criação, edição, persistência após reload, pausa/reativação, pulo, cancelamento, cartão fictício, substituição, histórico, rotas e ausência de overflow em desktop e iPhone. O servidor de produção é iniciado pelo Playwright quando necessário. Capturas de tela são gravadas em `test-results/` para revisão visual.

`tests/home.spec.ts` verifica também a nova página inicial, a troca de banners, o dropdown por hover/toque, links, navegação por teclado e Escape. Os dois testes da página inicial passaram em desktop/mobile, além dos seis testes do fluxo de assinatura.

Se o Google Drive apresentar erros de gravação ao instalar dependências, copie o projeto para uma pasta local fora da unidade sincronizada e execute os mesmos comandos. `node_modules` e `.next` não devem ser enviados ao GitHub.

## Validação realizada

A página inicial foi atualizada em 07/10/2026 com a composição e as imagens públicas do site Covabra: categorias, carrossel de 11 banners (desktop/mobile), mosaico e vitrine. Os materiais promocionais são uma fotografia da referência nessa data; não representam condições comerciais reais do protótipo. O catálogo e seus preços continuam mockados. Minhas listas e Recorrências ficam no dropdown de Robson, acessível por hover em desktop, clique/toque, Enter, seta para baixo e Escape. A raiz e o logo abrem a página inicial; o carrinho permanece em `/carrinho`.

Instalação limpa, servidor de desenvolvimento (HTTP 200 em `/carrinho`), lint sem avisos, build de produção e os seis testes Playwright passaram em desktop e mobile. Carrinho, lista, detalhe, configuração, revisão e sucesso também foram revisados por capturas de tela.

Neste computador, a validação utilizou a cópia local em `C:\Users\paulino.rodrigues\AppData\Local\covabra-validation`, porque a unidade Google Drive apresentou erros de escrita de dependências. A tentativa incompleta foi preservada em `.install-failed/`, ignorada pelo Git e pelo lint. Ela não faz parte da aplicação. O código entregue permanece na pasta original.

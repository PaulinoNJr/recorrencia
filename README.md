# Covabra · Compras recorrentes

Protótipo navegável de alta fidelidade para demonstrar a criação e o gerenciamento de assinaturas dentro de um e-commerce de supermercado. Toda a interface está em português. Não existe autenticação, integração com VTEX, cobrança real, processamento de pedidos ou backend.

## Executar

Requer Node.js 20.9 ou superior e npm.

```bash
npm install
npm run dev
```

Abra http://localhost:3000/. A primeira tela é a entrada do teste. **Iniciar uma nova experiência com a recorrência** limpa o armazenamento desta origem e abre `/loja` como visitante, sem cliente, compras, assinaturas, endereços adicionados ou cartões anteriores. Os endereços fictícios **Casa** e **Trabalho** sempre ficam disponíveis, independentemente do usuário, inclusive após login, cadastro, saída, restauração e recuperação de sessões antigas. Endereços adicionais e escolhas válidas são preservados durante a sessão. Abrir a entrada sem iniciar novamente preserva o progresso.

A loja começa sem identificação. O menu oferece **Entrar** e **Cadastrar-se** separadamente. Entrar aceita qualquer e-mail válido e qualquer senha preenchida, sem exigir cadastro prévio; a senha não é persistida. O cadastro solicita os dados pessoais fictícios. Quem já estiver identificado segue diretamente para a entrega, sem repetir os dados pessoais. O participante pode escolher produtos antes de se identificar. Depois, escolhe Casa ou Trabalho (ou adiciona outro endereço) e um cartão fictício. Os dados informados são usados no cabeçalho, no titular do cartão e na visão de operação. Essa identificação existe apenas no navegador; não é autenticação real nem cria uma conta externa.

Na demonstração local já iniciada neste computador, use http://localhost:3001/ como link de entrada do protótipo.

Sempre existe um cartão fictício **Mastercard · final 1234 · validade 12/30**, selecionado por padrão quando não há outro cartão escolhido. Ele permanece disponível após login, cadastro, saída, restauração e nova experiência, tanto na compra quanto na recorrência. Sessões antigas sem cartão também são recuperadas automaticamente. Adicionar outro cartão fictício continua opcional.

Para continuar como visitante na compra, recorrência ou conta, a identificação solicita somente **e-mail e senha**, usando a mesma tela de Entrar. Depois do login, o fluxo retoma a etapa solicitada sem pedir nome, CPF, sobrenome ou telefone. O cadastro completo permanece como opção separada em `/cadastro`.

Após a identificação, o nome é sempre **Paulino** e o CPF é sempre **123.456.789-99**, independentemente do e-mail ou dos valores informados no cadastro. Esses dados fictícios são aplicados ao perfil, checkout, CPF da nota e titular dos cartões, inclusive ao recuperar sessões antigas. Nome e CPF ficam fixos nos formulários do usuário identificado; e-mail, sobrenome e telefone permanecem como os dados informados no teste.

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
| `/` | Redireciona para `/home` |
| `/home` | Entrada do teste: nova experiência e formulário |
| `/loja` | Página inicial com categorias, banners e ofertas da referência Covabra |
| `/identificacao` | Identificação local do participante com dados fictícios |
| `/entrar` | Entrada simulada com e-mail e senha livres |
| `/cadastro` | Cadastro local com dados pessoais fictícios |
| `/recorrencias` | Landing page educativa: 3 passos e criação de assinatura pelo carrinho ou catálogo |
| `/carrinho` | Layout do checkout Covabra: substituição, produtos, CPF na nota e resumo; compra única ou assinatura |
| `/checkout` | Identificação por e-mail |
| `/checkout/dados`, `/checkout/entrega`, `/checkout/pagamento` | Dados pessoais, entrega e pagamento da compra única |
| `/checkout/sucesso` | Confirmação de compra de demonstração |
| `/comprar` | Catálogo, busca e produtos para adicionar |
| `/cupons`, `/listas` | Páginas auxiliares da navegação |
| `/assinatura/configurar` | Produtos, quantidades e frequências no mesmo card; aplicação de frequência a todos |
| `/assinatura/frequencia` | Redireciona para a configuração unificada de produtos e frequências |
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

Carrinho e recorrência têm produtos e quantidades independentes. Ao iniciar pelo carrinho, seus produtos são disponibilizados para montar a assinatura. Ao iniciar pelo catálogo, a recorrência começa vazia. A busca e o “Compre também” adicionam diretamente à recorrência; adicionar, alterar quantidades ou remover itens nessa etapa não modifica o carrinho. Alterar o carrinho também não modifica uma recorrência em montagem.

1. No carrinho, clique em **Criar assinatura**. Nenhum produto é selecionado automaticamente.
2. Ao marcar um produto, a quantidade começa em 0. Defina pelo menos 1 unidade e a frequência no mesmo card. Use **Aplicar frequência a todos** para os produtos incluídos e ajuste exceções individualmente. Depois, siga direto para a entrega. A edição também bloqueia o salvamento de produtos com quantidade 0.
3. Revise, aceite os termos e confirme. A assinatura aparece na conta e na operação.
4. No detalhe, edite produtos, altere cartão/entrega, pule um ciclo ou pause.
5. Visualize o histórico; reative ou cancele quando desejar.
6. Recarregue a página para verificar a persistência. O rodapé oferece **Restaurar dados do protótipo**.

Os testes de gerenciamento usam explicitamente uma conta de demonstração em `tests/fixtures.ts`: `00124` ativa com café indisponível e histórico; `00125` pausada; `00126` ativa com aviso de pagamento recusado. Esses dados não são carregados na experiência do participante. `tests/guest-flow.spec.ts` verifica os fluxos desde a sessão vazia, incluindo identificação, entrega, pagamento, gerenciamento e reinício.

## Alterar conteúdo e identidade

- **Cores, medidas e responsividade:** tokens no início de `app/globals.css`. Tailwind é carregado pelo PostCSS; componentes reutilizáveis usam classes semânticas para concentrar os ajustes visuais.
- **Mobile:** `app/mobile.css` é carregado após os estilos compartilhados. Controles de toque, formulários com fonte de 16 px, produtos, modais e linha do tempo se adaptam ao celular. `tests/mobile.spec.ts` verifica todas as telas em 320, 360, 390, 430 e 768 px, além do menu e dos modais na horizontal.
- **Logo:** `public/logo.webp`, utilizado em `components/shell.tsx`.
- **Página inicial:** `components/storefront.tsx`, `app/storefront.css` e `data/home-assets.json`; imagens oficiais salvas em `public/home/`.
- **Produtos:** `data/products.ts`; imagens em `public/products/`.
- **Assinaturas, endereços e pagamentos:** `data/subscriptions.ts`, na função `initialState`.
- **Persistência:** `components/store.tsx`, chave `covabra-prototype-v1`. Restaure os dados após mudar os mocks.
- **Ciclos e preços:** `lib/utils.ts`.

## Referência e suposições

Referência consultada: https://www.covabra.com.br/ em 06/10/2026. O HTML do site identifica Basic Sans, cores `#018530` e `#127439`, a navegação com Ofertas, Cupons e Minhas Listas e o logo utilizado. A fonte, o logo e seis fotografias foram baixados dos endereços públicos do site para permitir uma demonstração sem dependência de CDN. O verde principal `#018530` foi observado no site; fundos, bordas, verde escuro e demais tokens são adaptações deste protótipo, sem afirmação de que sejam tokens oficiais.

Preços, disponibilidade, cliente, endereços e cartões são fictícios. Café e papel possuem ilustrações locais de embalagem, fáceis de substituir. O catálogo utiliza oito produtos e um substituto; feijão, óleo, pão, ovos e abacaxi complementam o conjunto para aproveitar fotografias disponíveis. Abacaxi demonstra inelegibilidade. Café demonstra indisponibilidade no próximo ciclo, mantendo a possibilidade de assinatura futura.

Frete de R$ 9,90 é uma hipótese demonstrativa fixa, exibida no resumo, sem promessa de gratuidade ou desconto. Datas da demonstração se baseiam em outubro de 2026. As frequências disponíveis são Semanal (7 dias), Quinzenal (14 dias) e Mensal (30 dias). Ao pular uma entrega, a próxima data geral usa a menor frequência entre os itens e os ciclos reiniciam a partir dela. Isso simplifica o agendamento de frequências diferentes e não representa um calendário de logística de produção.

A compra de hoje e a próxima recorrência têm resumos separados. Todos os produtos e quantidades do carrinho original permanecem intactos, inclusive os selecionados para compra recorrente. Ajustar ou confirmar a recorrência não altera nem finaliza a compra de hoje. Atualizar um cartão em uma assinatura recusada simula uma nova aprovação. Pausar por 15/30/60 dias usa 06/10/2026 como referência e impede que a próxima entrega fique antes da retomada. O histórico preserva os valores registrados sem recalculá-los quando os produtos atuais mudam. Alterações do próximo ciclo não geram cronogramas ou cobranças reais.

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

## Estados da compra recorrente

- **Ativa:** recebimentos programados. Falhas de pagamento são avisos separados do estado.
- **Pausada:** interrupção temporária, com retomada prevista e reativação antecipada.
- **Cancelada:** sem novas cobranças ou entregas; permite reativar confirmando uma nova entrega.

Ao reativar uma compra pausada ou cancelada, a próxima entrega é calculada a partir da data da reativação e da frequência salva: Semanal em 7 dias, Quinzenal em 14 dias e Mensal em 30 dias. O período, os produtos e o histórico são preservados. Na confirmação de reativação de uma cancelada, a data calculada e o período continuam disponíveis para ajuste.

Pausar e cancelar preservam produtos, preferências e histórico. A listagem não tem exclusão como ação principal. A exclusão de histórico fica em **Opções avançadas** de compras canceladas, exige confirmação explícita e mantém o cadastro para reativação futura. Sessões antigas com estado Pagamento recusado são migradas para Ativa com aviso de pagamento, preservando os dados.

## Financeiro

Em **Minhas compras recorrentes → Financeiro** (`/minhas-assinaturas/financeiro`), os quadros mostram o mês atual e os dois seguintes do calendário (por exemplo, novembro, dezembro e janeiro), somando as entregas previstas entre o primeiro e o último dia de cada mês. Cada quadro separa produtos e fretes estimados. Selecionar um mês atualiza as próximas cobranças e o detalhamento por recorrência. A lista de próximas cobranças mostra apenas datas a partir de hoje no mês selecionado. As datas são referências de entrega, com cobrança antes do ciclo e data exata a confirmar.

Somente recorrências ativas entram na projeção. Pausadas e canceladas ficam fora, e falhas de pagamento aparecem como avisos. Cada entrega inclui um único frete estimado de R$ 9,90; itens do mesmo ciclo compartilham esse frete. Entregas puladas não geram produtos ou frete naquela ocorrência. Os intervalos são de 7, 14 ou 30 dias. O cálculo parte da data salva, sem criar entregas anteriores a ela. O total do mês atual inclui as ocorrências previstas em datas já transcorridas, sem comprovar entregas ou pagamentos realizados e sem modificar a agenda salva. A compra de hoje não entra nesses valores.

Todos os valores são estimados, com preços e fretes sujeitos a variação a cada ciclo. O painel é somente de consulta e não efetua cobranças.

## Nomes das recorrências

A configuração e a revisão preenchem o nome automaticamente pelos produtos selecionados, como Café da manhã, Cuidados da casa ou Despensa em dia. O campo permite escrever um nome de até 60 caracteres, sem botões de sugestões. Um nome personalizado é preservado ao alterar os produtos e ao recarregar. Limpar o campo recupera o nome automático. Cada nova configuração começa com uma sugestão nova.

Quando a configuração cria recorrências com frequências diferentes, cada nome recebe a frequência como complemento. Em **Editar nome**, nos detalhes, qualquer recorrência pode ser renomeada, inclusive pausadas ou canceladas, sem alterar produtos, agenda ou histórico. O nome aparece na confirmação, na listagem, no Financeiro, na operação e nos avisos do aplicativo. As alterações de nome ficam registradas no histórico de atividades.

As únicas frequências disponíveis são **Semanal / Quinzenal / Mensal**, com intervalos de 7, 14 e 30 dias. Sessões de versões anteriores são recuperadas com os novos nomes. A opção descontinuada é convertida para Mensal, mantendo os produtos, o histórico e a próxima entrega salva. Links antigos com o parâmetro de ciclo também continuam funcionando.

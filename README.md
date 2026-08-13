# RedeCORR · Apresentação institucional CORE5®

Apresentação institucional da RedeCORR, o ecossistema de crescimento para corretores de planos de saúde, e da metodologia CORE5®.

**Ao vivo:** https://cauelimsia.github.io/redecorr-apresentacao/

## Navegação

- `←` `→` `Espaço` `PgUp` `PgDn` — trocar de slide
- `Esc` — abre e fecha o índice
- `P` — abre e fecha o modo apresentador
- `Home` / `End` — primeiro e último slide
- Swipe no celular, scroll do mouse, botões na tela
- Cada slide tem URL própria (`#9` abre direto o CORE5®)

## Modo apresentador

Tecla `P`. Abre um painel na base com cronômetro, capítulo, slide atual, **o slide seguinte** e o roteiro de fala daquele slide. O deck encolhe para caber acima do painel, então funciona numa tela só — e o roteiro nunca aparece se você projetar apenas o deck em tela cheia.

O roteiro de cada slide vive no HTML, em `data-notes`, e é editável sem tocar em código:

```html
<section class="slide" data-notes="Aqui é escuta, não fala. Pergunte: ...">
```

## O organismo CORE5®

Uma única nuvem de 2.800 partículas em WebGL atravessa o deck inteiro e muda de forma conforme a narrativa:

| Formação | Onde aparece |
|---|---|
| `pentagon` | a capa e a metodologia CORE5®, travada em formação |
| `chaos` | o corretor que trabalha sozinho, sem estrutura |
| `grid` | o chão de dados do slide de mercado |
| `constellation` | o ecossistema, aberto |
| `burst` | o convite final |

Nos slides de pilar o nó correspondente acende e a formação gira para apresentá-lo. Os rótulos dos pilares são HTML posicionado a cada quadro sobre os nós 3D, então continuam nítidos em qualquer resolução.

A capa já abre no pentágono: o CORE5® é o assunto da apresentação, então ele é a primeira coisa que a sala vê, ainda sem os nomes dos pilares (a nomeação é a virada do capítulo da metodologia).

A formação é de cinco pontos de luz, sem nenhuma linha ligando um ao outro. Qualquer traço entre os vértices puxa a leitura para estrela, e o grafo completo desenha literalmente um pentagrama. Os cinco pilares aparecem como cinco núcleos, que é o que a metodologia é.

Cada núcleo respira e gira em torno do próprio eixo, em fase própria: é o que separa cinco manchas paradas de cinco coisas vivas. O movimento acontece no shader, a partir do centro do nó que a partícula pertence, e custa zero de CPU.

A cena tem três camadas: um campo distante que gira ao contrário e cria paralaxe, o organismo de 2.800 partículas e núcleos com brilho aditivo nos cinco vértices. Os rótulos fogem radialmente do centro, a uma distância proporcional ao tamanho do nó em tela, então ficam fora do halo em qualquer zoom ou proporção. A câmera voa entre cinco enquadramentos (`wide`, `close`, `low`, `hover`, `inside`) conforme a formação, e o deslocamento lateral é derivado do campo de visão, então a composição não estoura em nenhuma proporção de tela.

Cada slide declara seu estado por atributo, sem tocar no JavaScript:

```html
<section class="slide" data-fx="pentagon" data-fx-focus="3" data-fx-dim="1" data-fx-x="center">
```

- `data-fx` — formação
- `data-fx-focus` — pilar em destaque (1 a 5)
- `data-fx-dim` — recua a cena sob conteúdo denso
- `data-fx-x` — `center` quando a cena é o assunto do slide
- `data-fx-labels="off"` — mostra a formação sem nomear os pilares
- `data-fx-scale` e `data-fx-off` — afinam tamanho e deslocamento quando o slide tem texto grande do lado esquerdo

## Vídeos reais do produto

Os slides do pilar Tecnologia e da plataforma CRM mostram **gravações reais do CRM em modo demonstração** — o modo do próprio produto que serve dados fictícios em regime somente-leitura, com a faixa "Modo Demonstração — Dados fictícios" visível no topo. Nada foi desenhado ou retocado: é o software de produção sendo navegado.

- **Pipeline** (pilar 1): o kanban de leads percorrido da primeira à última etapa, com hover real nos cards.
- **Conversas** (plataforma CRM): a central de WhatsApp com uma negociação completa em tela e a busca filtrando a lista ao vivo, tecla a tecla.

Os vídeos são MP4 (H.264) de ~100 KB servidos do próprio repositório, em loop mudo (`autoplay muted loop playsinline`), com poster JPEG para o primeiro paint. Com `prefers-reduced-motion`, ficam parados no poster. Foram gravados como sequência de frames via Playwright e montados com ffmpeg — o rAF de aba oculta não estrangula screenshot, então a cadência é estável.

Limite conhecido do modo demonstração: o dashboard BI mistura widgets com dados reais (o card diário "Ontem" expõe nome de corretor real), então o dashboard ficou fora dos vídeos. A Academia de Vendas segue com o mockup de simulação até existir acesso ao app para gravar do mesmo jeito.

## Parceiros (slide 19)

Fecho do capítulo das plataformas: as sete operadoras e administradoras parceiras (Plano A, Select, GoCare, Salv, OdontoGroup, Saúde Prime e Rede Total) com **as logos oficiais** numa grade retangular 4 + 3 com divisores de 1px e numeração em Mono. As logos vieram dos sites oficiais de cada operadora (`assets/partners/`; Plano A é a administradora, de admplanoa.com.br), sem redesenho — apenas altura normalizada por formato.

## Simulação ao vivo (slide 22)

O slide **Simulação** não é uma imagem: são três controles que o apresentador mexe na frente do cliente, com os números dele. Leads por mês, taxa de fechamento e ticket médio entram; contratos por mês, receita mensal nova e o acumulado de doze meses saem.

O cenário comparado é sempre o mesmo: **um fechamento a mais por semana** (4,3 por mês). Toda a conta está escrita no rodapé do slide e não há coeficiente escondido, nem promessa de resultado — é aritmética com o que o cliente informar.

Com o foco num controle, as setas ajustam o valor em vez de trocar de slide.

## Mockups que respondem

As janelas de produto (telas reais do CRM, mockup da Academia) inclinam seguindo o ponteiro, em perspectiva real. A flutuação e a inclinação dividem a mesma transformação: como animação CSS sobrepõe `transform` inline, o ângulo entra por variável (`--tilt-x` / `--tilt-y`) dentro dos próprios keyframes.

## Degradação

- **Sem WebGL:** a cena não é criada e os diagramas SVG originais continuam no lugar.
- **`prefers-reduced-motion`:** a cena congela num estado estático e redesenha só na troca de slide.
- **Aba em segundo plano ou índice aberto:** o loop de render para.
- **Tela estreita:** a formação volta ao centro, encolhe e os rótulos sumem.

## Stack

HTML, CSS e JavaScript puro. Three.js para a cena 3D e GSAP para as transições, **ambos servidos do próprio repositório** (`vendor/`): a apresentação roda sem internet e nenhum CDN pode derrubá-la no meio de uma reunião.

Tipografia IBM Plex (Serif nos títulos, Sans no texto, Mono nos dados), carregada do Google Fonts com fallback de sistema.

Sem build: é só servir a pasta.

## Deploy

GitHub Pages servindo a branch `main` (raiz).

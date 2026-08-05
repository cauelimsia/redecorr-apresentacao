# RedeCORR · Apresentação institucional CORE5®

Apresentação institucional da RedeCORR, o ecossistema de crescimento para corretores de planos de saúde, e da metodologia CORE5®.

**Ao vivo:** https://clsolucoesweb.github.io/redecorr-apresentacao/

## Navegação

- `←` `→` `Espaço` `PgUp` `PgDn` — trocar de slide
- `Esc` — abre e fecha o índice
- `Home` / `End` — primeiro e último slide
- Swipe no celular, scroll do mouse, botões na tela
- Cada slide tem URL própria (`#9` abre direto o CORE5®)

## O organismo CORE5®

Uma única nuvem de 2.000 partículas em WebGL atravessa o deck inteiro e muda de forma conforme a narrativa:

| Formação | Onde aparece |
|---|---|
| `chaos` | o corretor que trabalha sozinho, sem estrutura |
| `pentagon` | a metodologia CORE5®, travada em formação |
| `grid` | o chão de dados do slide de mercado |
| `constellation` | o ecossistema, aberto |
| `burst` | o convite final |

Nos slides de pilar o nó correspondente acende e a formação gira para apresentá-lo. Os rótulos dos pilares são HTML posicionado a cada quadro sobre os nós 3D, então continuam nítidos em qualquer resolução.

Cada slide declara seu estado por atributo, sem tocar no JavaScript:

```html
<section class="slide" data-fx="pentagon" data-fx-focus="3" data-fx-dim="1" data-fx-x="center">
```

- `data-fx` — formação
- `data-fx-focus` — pilar em destaque (1 a 5)
- `data-fx-dim` — recua a cena sob conteúdo denso
- `data-fx-x` — `center` quando a cena é o assunto do slide

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

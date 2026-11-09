# POC Unimed (React Native + Expo)

Migração para **React Native com Expo** do app Flutter `poc_unimed` (`C:\git\pocs\flutter\poc_unimed`).

O app reproduz o mesmo fluxo:

- Splash que restaura a sessão.
- Login OAuth em duas etapas com refresh token.
- Home com os dados do beneficiário.
- Menu dinâmico, carregado de JSON.
- Cartão virtual.
- Telas de teste de recursos do dispositivo e de modais configuráveis.

| Item | Versão |
|---|---|
| Expo SDK | 58 |
| React Native | 0.88 |
| React | 19.3 (React Compiler ativado) |
| Navegação | Expo Router (rotas em arquivos, dentro de `src/app/`) |
| Estado | Zustand |
| HTTP | Axios |
| Linguagem | TypeScript (strict) |

---

## Como rodar

```powershell
cd C:\git\pocs\React\MeuApp
npm install
```

| Alvo | Comando | Observação |
|---|---|---|
| Celular (Expo Go) | `npx expo start` | Leia o QR code com o app **Expo Go**. Se a rede bloquear, use `npx expo start --tunnel`. |
| Android (emulador) | `npm run android` | |
| iOS (simulador) | `npm run ios` | Precisa de macOS. |
| Web | `npm run web` | As chamadas passam pelo proxy de desenvolvimento ([veja abaixo](#proxy-de-desenvolvimento-web)). |

Todas as bibliotecas nativas usadas fazem parte do Expo SDK. Por isso o app roda no **Expo Go**, sem development build.

### Rede corporativa (certificado)

O proxy da rede corporativa intercepta o TLS. Comandos do Expo CLI que acessam a internet, como `npx expo install`, falham com `unable to get local issuer certificate`. Para que o Node use os certificados do Windows:

```powershell
$env:NODE_OPTIONS='--use-system-ca'
```

O script `npm run web` já inclui essa opção.

### Credenciais de desenvolvimento

Em modo de desenvolvimento, o login é pré-preenchido com variáveis lidas de `.env.local`. Esse arquivo é ignorado pelo git e precisa ser criado em cada máquina:

```
EXPO_PUBLIC_DEV_CPF=<cpf>
EXPO_PUBLIC_DEV_SENHA=<senha>
```

Em builds de produção (`__DEV__ === false`), os campos começam vazios.

### Verificações

```powershell
npx tsc --noEmit        # typecheck
npx eslint src          # lint
```

---

## Estrutura de pastas

```
src/
├── app/                        # Rotas (Expo Router): cada arquivo é uma tela
│   ├── _layout.tsx             # Stack raiz + host do modal de alerta
│   ├── index.tsx               # Splash
│   ├── login.tsx
│   ├── home.tsx
│   ├── menu.tsx
│   ├── cartao.tsx              # Cartão virtual
│   ├── device/                 # camera, gallery, files, location
│   ├── components/
│   │   └── alert-dialog.tsx    # Demonstração dos modais
│   └── api/proxy/[...path]+api.ts   # Proxy de desenvolvimento (Web)
├── components/                 # Componentes reutilizáveis
│   ├── AppAlertDialog.tsx      # Modal configurável + showAppAlert()
│   ├── AppBottomNav.tsx        # Bottom navigation dinâmica (JSON)
│   ├── AppButton.tsx           # Botão (filled | outlined | text | elevated)
│   ├── AppCard.tsx · AppHeader.tsx · AppLoading.tsx · AppLogo.tsx
│   ├── Icon.tsx                # Material Icons (@expo/vector-icons)
│   └── Snackbar.tsx
├── features/                   # Componentes específicos de cada tela
│   ├── device/components.tsx   # PermissionHeader, MessageCard e helpers de status
│   ├── home/                   # HomeHeader, MiniCard, QuickActionCard
│   └── menu/RecursiveMenuTile.tsx
├── core/
│   ├── constants/api.ts        # URLs e identificadores da API
│   ├── network/apiClient.ts    # Instância do Axios
│   ├── storage/secureStorage.ts# Sessão (SecureStore / localStorage na Web)
│   ├── theme/appTheme.ts       # Cores (Colors) e tipografia (TextStyles)
│   ├── theme/designSystem.ts   # Espaçamentos, raios e tamanhos (DS)
│   └── utils/appLogger.ts      # Logs por escopo (somente em __DEV__)
├── models/                     # Tipos e parsers de JSON
├── services/                   # Chamadas HTTP e fontes de dados (mocks)
├── repositories/               # Regras de negócio sobre os services
├── stores/                     # Estado global (Zustand)
└── hooks/useGoBack.ts

assets/
├── images/logo.png
└── mocks/                      # menu.json, bottom_navigation.json, alert_dialogs.json
```

---

## Arquitetura

As camadas seguem as do projeto Flutter:

```
Tela (src/app)  →  Store (Zustand)  →  Repository  →  Service / DataSource  →  API ou JSON mock
```

| Camada | Responsabilidade |
|---|---|
| **Telas** (`src/app`) | Interface e navegação. Usam stores, repositories e componentes. |
| **Stores** (`src/stores`) | Estado compartilhado entre telas: `useAuthStore` (sessão) e `useHomeStore` (titular e plano ativo). |
| **Repositories** | Regras de negócio: sessão e refresh, filtro de itens habilitados, ordenação, cache e fallback. |
| **Services / DataSources** | Acesso a dados: HTTP (Axios) ou JSON em `assets/mocks`. |
| **Models** | Interfaces TypeScript e funções `parseX(json)` que validam os dados recebidos. |

### Correspondência com o Flutter

| Flutter | Expo / React Native |
|---|---|
| `go_router` | Expo Router (`router.replace` ≈ `context.go`, `router.push` para telas de detalhe) |
| `provider` / `ChangeNotifier` | `zustand` |
| `dio` | `axios` |
| `flutter_secure_storage` | `expo-secure-store` |
| `image_picker` | `expo-image-picker` |
| `file_picker` | `expo-document-picker` |
| `geolocator` | `expo-location` |
| `permission_handler` → `openAppSettings()` | `Linking.openSettings()` |
| `Icons.*` (Material) | `@expo/vector-icons/MaterialIcons` |
| `showDialog` | `showAppAlert(config)` com `<Modal>` |
| `AppTheme` / `DS` | `Colors` + `TextStyles` / `DS` |
| `AppLogger` (`kDebugMode`) | `AppLogger` (`__DEV__`) |

---

## Autenticação e sessão

Arquivos principais: `services/authService.ts`, `repositories/authRepository.ts`, `core/storage/secureStorage.ts`.

1. **Login.** O app chama duas APIs em sequência:
   - **API 1:** `POST /uniId/v1/authorization` com CPF e senha. Devolve um token de identidade e um `code`.
   - **API 2:** `POST /controle-acesso-sistemas/v1/access-token` com `grant_type=authorization_code`. Devolve o `access_token` e o `refresh_token`.
2. **Sessão.** O `AuthSession` guarda os tokens, a validade de cada um e o CPF. Fica no `expo-secure-store` (Keychain no iOS, Keystore no Android). **A senha não é armazenada.**
3. **Restauração na Splash.** O `restoreSession()`:
   - Lê a sessão salva.
   - Se o `access_token` vale por mais 2 minutos, segue para a Home.
   - Senão, tenta o refresh. Sem sessão válida, vai para o Login.
4. **Refresh.** O `refreshSession()` faz o refresh com `grant_type=refresh_token` e o token de identidade.
   - Se várias chamadas pedirem refresh ao mesmo tempo, todas aguardam a mesma requisição.
   - Se o token de identidade tiver expirado, ou se o refresh falhar, o app faz logout.
5. **Token válido.** O `getValidAccessToken()` devolve um token utilizável e renova antes, se precisar. É usado pela API de família.
6. **Erro 401.** Na API de família, um 401 limpa a sessão e lança `SessionExpiredError`. A Home então mostra o botão "Fazer login".

O `authRepository` é um **singleton**. Assim, a sessão em memória e o refresh em andamento são compartilhados por todo o app.

---

## Telas

| Rota | Tela | Descrição |
|---|---|---|
| `/` | Splash | Logo e barra de progresso. Restaura a sessão (no mínimo 5 s) e vai para `/home` ou `/login`. |
| `/login` | Login | CPF e senha. Em caso de falha, mostra um Snackbar. |
| `/home` | Home | Carrega a família (`GET /uniid/beneficiario/v1/beneficiarios/{cpf}/familia/agrupados`) e usa o primeiro plano com status "ativo". Mostra a saudação, o cartão resumido, os atalhos, o banner e os serviços. |
| `/menu` | Menu | Menu em árvore (`assets/mocks/menu.json`). A busca ignora acentos e expande os grupos que têm resultado. Puxar para baixo recarrega. |
| `/cartao` | Cartão virtual | Frente e verso animados, com abas "Meus Cartões" e "QR Code/Token". Usa o `planoAtivo` do `useHomeStore`. Sem plano carregado, volta para `/home`. |
| `/device/camera` | Câmera | Pede a permissão e tira uma foto (`expo-image-picker`). |
| `/device/gallery` | Galeria | Pede a permissão e escolhe uma imagem. No iOS o acesso pode ser limitado. |
| `/device/files` | Arquivos | Seletor nativo de documentos (PDF, JPG e PNG), sem pedir acesso amplo ao armazenamento. |
| `/device/location` | Localização | Verifica se a localização está ligada, pede a permissão e mostra latitude, longitude e precisão (limite de 20 s). |
| `/components/alert-dialog` | Modal de aviso | Lista os modais de `alert_dialogs.json`, abre o escolhido e mostra o último resultado. |

---

## Conteúdo dinâmico (JSON)

Menu, bottom navigation e modais vêm de arquivos JSON em `assets/mocks/`. Para cada um, o código já tem uma variante de API (`apiMenuDataSource`, `apiBottomNavDataSource`, `apiAlertDialogDataSource`) para quando os endpoints existirem. Os repositories aceitam uma fonte principal e uma de reserva:

```ts
// Exemplo: usar a API e cair no mock local se ela falhar
export const menuRepository = createMenuRepository(
  apiMenuDataSource(() => apiClient.get('/menu').then((r) => r.data)),
  assetMenuDataSource,
);
```

### `menu.json`

```json
{
  "version": 1,
  "items": [
    {
      "id": "schedules",
      "title": "Agendamentos",
      "icon": "calendar_month",
      "color": "menuTerracotta",
      "route": "/home",
      "enabled": true,
      "children": [ /* mesma estrutura, aninhamento livre */ ]
    }
  ]
}
```

- `icon`: um nome do mapa em `features/menu/RecursiveMenuTile.tsx` (`ICONS`).
- `color`: `menuGreen`, `menuLime`, `menuTerracotta`, `menuLightGreen`, `menuBlue`, `menuRose` ou `menuOrange`.
- Itens com `"enabled": false` são removidos em todos os níveis.

### `bottom_navigation.json`

Campos de cada item: `id`, `label`, `icon`, `activeIcon`, `route`, `enabled` e `order`. A barra mostra os itens habilitados, ordenados por `order`, e guarda o resultado em cache. Se o JSON falhar, usa uma lista fixa de reserva que está no código.

### `alert_dialogs.json`

Campos de cada item:

| Campo | Valores / regra |
|---|---|
| `id` | Obrigatório. |
| `type` | `information`, `success`, `warning`, `error` ou `confirmation`. |
| `title`, `message`, `confirmLabel` | Obrigatórios. |
| `cancelLabel` | Opcional. |
| `icon` | `info`, `success`, `warning`, `error` ou `question`. |
| `dismissible` | Se `true`, o modal fecha ao tocar fora ou no botão voltar. |
| `enabled` | Se `false`, o modal não aparece. |

Uso no código:

```ts
import { showAppAlert } from '@/components/AppAlertDialog';

const result = await showAppAlert(config); // 'confirmed' | 'cancelled' | 'dismissed'
```

O `<AppAlertDialogHost />` já está no `_layout.tsx` raiz.

---

## Tema

- **`Colors`** (`core/theme/appTheme.ts`) tem a paleta da Unimed (`primary #00995D`, `secondary #006B57`, `lime #D1DF48`…) e as cores com nome de uso (`bottomNavBackground`, `virtualCardHeader`, `menuGreen`…).
- **`TextStyles`** tem os estilos de texto com os mesmos nomes do `AppTheme` do Flutter (`titleLarge`, `virtualCardNumber`, `menuItemTitle`…).
- **`DS`** (`core/theme/designSystem.ts`) tem espaçamentos (`spaceXs`…`spaceXXl`), raios e tamanhos de componentes.
- **`withAlpha(hex, alpha)`** aplica transparência a uma cor.

---

## Proxy de desenvolvimento (Web)

A API de homologação só aceita chamadas de navegador vindas de `https://id-hml.unimedpoa.com.br`, por causa do CORS. Por isso, na web em desenvolvimento, o `apiClient` usa `baseURL = '/api/proxy'`.

A rota `src/app/api/proxy/[...path]+api.ts` roda no servidor local do Expo e repassa:

```
/api/proxy/<caminho>?<query>  →  https://api-hml.unimedpoa.com.br/<caminho>?<query>
```

- Ela só repassa os cabeçalhos `Content-Type`, `Authorization`, `x-authorization` e `Accept`.
- Em produção, responde 404.
- Se não conseguir falar com a API, responde **502** e escreve `[PROXY][ERROR] ...` no terminal.

No Android e no iOS o app chama a API direto, sem proxy.

> Na Web a sessão fica no `localStorage`, sem criptografia, porque o `expo-secure-store` não existe no navegador. Isso serve só para desenvolvimento.

---

## Pontos de atenção / pendências

- **Segredo no app:** `ApiConstants.xAuthorization` (o `client_id:secret` em Base64) está dentro do código, como no Flutter. O ideal é levar a troca de tokens para um backend (BFF).
- **Credenciais no histórico do git:** o projeto Flutter tinha CPF e senha escritos em `login_page.dart`, e esses arquivos foram commitados. Troque essa senha.
- **Dados fixos no código, herdados do Flutter:** "Olá, Cleber" no Menu, e o nome, a validade, o CNS e as coberturas no Cartão virtual.
- **Sem ação ainda:** "Esqueci minha senha", "Primeiro acesso", "Gerar Token", busca da Home e "Mais informações". Todos são placeholders, como no Flutter.
- **Diferenças em relação ao Flutter:**
  - As abas do Cartão trocam por toque, não por deslizar o dedo.
  - As telas de detalhe (cartão, dispositivo, modais) abrem com `router.push`, então "Voltar" retorna à tela anterior.

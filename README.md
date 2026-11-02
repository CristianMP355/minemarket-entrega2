# ⛏ MineMarket

**Plataforma Transaccional para Servidores de Minecraft** — Entrega Parcial 2 (Semana 12), Ingeniería de Software II.

Marketplace donde los dueños de servidores de Minecraft (VENDEDORES) publican ítems digitales (rangos, kits, llaves, cosméticos, monedas) que los jugadores (COMPRADORES) pueden explorar.

## Arquitectura

```
.
├── backend/                 API REST Node.js + Express
│   ├── src/
│   │   ├── config/          Variables de entorno (puerto, JWT, bcrypt)
│   │   ├── controllers/     authController, itemController
│   │   ├── data/store.js    Repositorio en memoria (USUARIO, ITEM_DIGITAL) + datos semilla
│   │   ├── middleware/      authenticate (JWT), authorize (RBAC), manejo de errores
│   │   ├── routes/          /api/auth, /api/items
│   │   ├── services/        authService (bcrypt + JWT)
│   │   └── utils/           validadores, constantes, HttpError
│   ├── tests/unit/          Pruebas unitarias (bcrypt, JWT, RBAC, validadores)
│   ├── tests/integration/   Pruebas de API con Supertest
│   └── sonar-project.properties
├── frontend/                React 18 + Vite
│   ├── src/components/      LoginForm, RegisterForm, Catalog, ItemCard, ItemForm
│   ├── src/services/api.js  Cliente HTTP (fetch + token Bearer)
│   ├── src/utils/           Sesión JWT (localStorage), permisos, formato COP
│   ├── tests/unit/          Pruebas unitarias con Vitest + Testing Library
│   ├── e2e/                 Pruebas E2E con Playwright (basadas en Gherkin)
│   └── sonar-project.properties
└── docs/HISTORIAS_DE_USUARIO.md   Historias de usuario + escenarios Gherkin
```

## Requisitos

- Node.js 18+ (probado con Node 22)
- (Opcional) SonarQube + SonarScanner

## Instalación

```bash
npm run install:all      # instala backend, frontend y el navegador Chromium de Playwright
```

O por separado: `cd backend && npm install`, `cd frontend && npm install && npx playwright install chromium`.

## Ejecución

```bash
# Terminal 1 - API en http://localhost:4000
cd backend && npm start

# Terminal 2 - Frontend en http://localhost:5173 (proxy /api -> :4000)
cd frontend && npm run dev
```

**Usuario administrador semilla:** `admin@minemarket.com` / `Admin1234`

> Los datos se guardan en memoria: al reiniciar el backend se restablecen los datos semilla.
> El repositorio (`backend/src/data/store.js`) está aislado para reemplazarlo por una base de datos real.

## API REST

| Método | Endpoint | Acceso | Descripción |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Público | Registra usuario (bcrypt + `gamertag_minecraft`) |
| POST | `/api/auth/login` | Público | Retorna `{ token, usuario }` con JWT firmado |
| GET | `/api/auth/me` | JWT | Usuario autenticado |
| GET | `/api/items?tipo=&q=` | Público | Lista el catálogo (filtros opcionales) |
| GET | `/api/items/:id` | Público | Detalle de un ítem |
| POST | `/api/items` | JWT + VENDEDOR/ADMIN | Crea un ítem |
| PUT | `/api/items/:id` | JWT + propietario o ADMIN | Actualiza un ítem |
| DELETE | `/api/items/:id` | JWT + propietario o ADMIN | Elimina un ítem |

Ejemplo:

```bash
curl -X POST http://localhost:4000/api/auth/register -H "Content-Type: application/json" \
  -d '{"nombre":"Steve","email":"steve@mm.com","password":"Diamante123","gamertag_minecraft":"Steve_MC","rol":"VENDEDOR"}'
```

## Pruebas

| Comando | Dónde | Qué hace |
|---------|-------|----------|
| `npm run test` | raíz | Ejecuta las pruebas unitarias de backend (Jest) y frontend (Vitest) con cobertura |
| `npm run test` | `backend/` | Jest + Supertest → `backend/coverage/lcov.info` |
| `npm run test` | `frontend/` | Vitest → `frontend/coverage/lcov.info` |
| `npm run tests:e2e` | raíz o `frontend/` | Playwright: levanta backend y frontend automáticamente y ejecuta los escenarios E2E |

Las pruebas E2E están trazadas a los escenarios Gherkin de `docs/HISTORIAS_DE_USUARIO.md` (ver tabla de trazabilidad al final de ese documento).

## SonarQube

Cada módulo tiene su propio `sonar-project.properties` (proyectos `minemarket-backend` y `minemarket-frontend`) apuntando a su reporte `coverage/lcov.info`:

```bash
cd backend  && npm run test && npx sonar-scanner -Dsonar.token=$SONAR_TOKEN
cd frontend && npm run test && npx sonar-scanner -Dsonar.token=$SONAR_TOKEN
```

(Ajustar `sonar.host.url` si el servidor no está en `http://localhost:9000`.)

# MineMarket — Historias de Usuario y Escenarios Gherkin

**Proyecto:** MineMarket – Plataforma Transaccional para Servidores de Minecraft
**Entrega:** Parcial 2 (Semana 12) – Ingeniería de Software II

## Roles del sistema

| Rol | Descripción |
|-----|-------------|
| **Visitante** | Persona sin sesión. Puede consultar el catálogo público. |
| **COMPRADOR** | Jugador registrado que adquiere ítems digitales para su cuenta de Minecraft. |
| **VENDEDOR** | Dueño/administrador de un servidor de Minecraft que publica ítems digitales (rangos, kits, llaves, etc.). |
| **ADMIN** | Administrador de la plataforma. Puede gestionar cualquier ítem. |

## Entidades principales

- **USUARIO**: `id_usuario`, `nombre`, `email`, `password_hash` (bcrypt), `gamertag_minecraft`, `rol`, `fecha_registro`.
- **ITEM_DIGITAL**: `id_item`, `nombre`, `descripcion`, `tipo` (RANGO, KIT, LLAVE, COSMETICO, MONEDA), `precio`, `stock`, `servidor`, `id_vendedor`, `fecha_creacion`.

## Resumen del backlog

| ID | Historia | Prioridad | Estimación | Endpoint(s) |
|----|----------|-----------|------------|-------------|
| HU-01 | Registro de usuario con gamertag | Alta | 5 pts | `POST /api/auth/register` |
| HU-02 | Inicio de sesión con JWT | Alta | 3 pts | `POST /api/auth/login` |
| HU-03 | Consulta del catálogo de ítems | Alta | 3 pts | `GET /api/items`, `GET /api/items/:id` |
| HU-04 | Gestión (CRUD) de ítems digitales | Alta | 8 pts | `POST`, `PUT`, `DELETE /api/items` |

---

## HU-01 — Registro de usuario

> **Como** jugador de Minecraft
> **quiero** registrarme en MineMarket con mi email, contraseña y gamertag de Minecraft
> **para** poder comprar o vender ítems digitales asociados a mi cuenta de juego.

### Criterios de aceptación

1. El email debe tener formato válido y ser único en la plataforma.
2. La contraseña debe tener mínimo 8 caracteres e incluir letras y números; se almacena encriptada con **bcrypt** (nunca en texto plano).
3. El `gamertag_minecraft` debe cumplir las reglas de Minecraft (3–16 caracteres: letras, números o `_`) y ser único (sin distinguir mayúsculas).
4. El usuario puede elegir el rol COMPRADOR o VENDEDOR; si no lo elige se asigna COMPRADOR. El rol ADMIN no es auto-asignable.
5. La respuesta nunca incluye la contraseña ni su hash.

```gherkin
# language: es
Característica: Registro de usuarios en MineMarket
  Como jugador de Minecraft
  Quiero registrarme con mi gamertag
  Para comprar o vender ítems digitales

  Antecedentes:
    Dado que el visitante se encuentra en la página de registro

  Escenario: Registro exitoso
    Cuando ingresa el nombre "Steve", el email "steve@minemarket.com", la contraseña "Diamante123" y el gamertag "Steve_MC"
    Y selecciona el tipo de cuenta "COMPRADOR"
    Y envía el formulario de registro
    Entonces el sistema crea el usuario con la contraseña encriptada con bcrypt
    Y ve el mensaje "Registro exitoso. Ahora puedes iniciar sesión."
    Y es redirigido al formulario de inicio de sesión

  Escenario: Registro con email ya existente
    Dado que ya existe un usuario con el email "steve@minemarket.com"
    Cuando intenta registrarse con el email "steve@minemarket.com"
    Entonces ve el mensaje "El email ya está registrado"
    Y no se crea un nuevo usuario

  Escenario: Registro con gamertag ya existente
    Dado que ya existe un usuario con el gamertag "Steve_MC"
    Cuando intenta registrarse con el gamertag "steve_mc"
    Entonces ve el mensaje "El gamertag ya está registrado"

  Esquema del escenario: Registro con datos inválidos
    Cuando intenta registrarse con el campo "<campo>" con valor "<valor>"
    Entonces ve el mensaje de error "<mensaje>"

    Ejemplos:
      | campo              | valor        | mensaje                                                               |
      | email              | steve@       | El email no es válido                                                 |
      | password           | abc123       | La contraseña debe tener mínimo 8 caracteres, con letras y números   |
      | gamertag_minecraft | St           | El gamertag de Minecraft debe tener 3-16 caracteres (letras, números o _) |
      | gamertag_minecraft | Steve-MC!    | El gamertag de Minecraft debe tener 3-16 caracteres (letras, números o _) |
```

---

## HU-02 — Inicio de sesión

> **Como** usuario registrado
> **quiero** iniciar sesión con mi email y contraseña
> **para** acceder a las funcionalidades según mi rol de forma segura.

### Criterios de aceptación

1. Con credenciales válidas, el backend retorna un **JWT firmado** (HS256) con `sub`, `email`, `rol`, `gamertag` y expiración (2 h por defecto).
2. El frontend almacena el token y lo envía en el header `Authorization: Bearer <token>` en las peticiones protegidas.
3. Con credenciales inválidas se responde `401` con el mensaje genérico "Credenciales inválidas" (no se revela si el email existe).
4. Si el token expira o es inválido, el usuario es enviado nuevamente al login.
5. El usuario puede cerrar sesión, lo que elimina el token del navegador.

```gherkin
# language: es
Característica: Inicio de sesión con JWT
  Como usuario registrado
  Quiero iniciar sesión
  Para acceder a MineMarket según mi rol

  Antecedentes:
    Dado que existe el usuario "steve@minemarket.com" con contraseña "Diamante123" y gamertag "Steve_MC"
    Y el usuario se encuentra en la página de inicio de sesión

  Escenario: Login exitoso
    Cuando ingresa el email "steve@minemarket.com" y la contraseña "Diamante123"
    Y presiona "Ingresar"
    Entonces el sistema genera un token JWT firmado
    Y el token se almacena en el navegador
    Y ve su gamertag "Steve_MC" y su rol en la barra de navegación

  Escenario: Login con credenciales inválidas
    Cuando ingresa el email "steve@minemarket.com" y la contraseña "ClaveIncorrecta1"
    Y presiona "Ingresar"
    Entonces ve el mensaje "Credenciales inválidas"
    Y no se crea ninguna sesión

  Escenario: Acceso con token expirado
    Dado que el usuario tiene una sesión con un token expirado
    Cuando intenta realizar una acción protegida
    Entonces el sistema responde "El token ha expirado"
    Y el usuario es redirigido al inicio de sesión

  Escenario: Cierre de sesión
    Dado que el usuario ha iniciado sesión
    Cuando presiona "Cerrar sesión"
    Entonces el token se elimina del navegador
    Y ve el formulario de inicio de sesión
```

---

## HU-03 — Catálogo de ítems digitales

> **Como** visitante o comprador
> **quiero** explorar el catálogo de ítems digitales de los servidores de Minecraft
> **para** encontrar rangos, kits o llaves que me interesen.

### Criterios de aceptación

1. El catálogo es público (no requiere sesión).
2. Cada ítem muestra nombre, tipo, descripción, servidor, precio en COP y stock (o "Agotado" si el stock es 0).
3. Se puede filtrar por tipo y buscar por nombre o servidor.
4. Los visitantes y compradores no ven botones de gestión (publicar/editar/eliminar).

```gherkin
# language: es
Característica: Catálogo de ítems digitales
  Como visitante
  Quiero explorar el catálogo
  Para encontrar ítems de mi servidor favorito

  Antecedentes:
    Dado que existen los siguientes ítems publicados:
      | nombre           | tipo  | servidor        | precio | stock |
      | Rango VIP        | RANGO | CraftLand       | 15000  | 100   |
      | Kit Guerrero     | KIT   | CraftLand       | 8000   | 50    |
      | Llave Legendaria | LLAVE | SkyBlock Andino | 5000   | 200   |

  Escenario: Visualizar el catálogo completo sin iniciar sesión
    Cuando el visitante ingresa a MineMarket
    Entonces ve 3 ítems en el catálogo con su precio en pesos colombianos
    Y no ve el botón "+ Publicar ítem"

  Escenario: Filtrar el catálogo por tipo
    Cuando el visitante filtra por el tipo "LLAVE"
    Entonces solo ve ítems de tipo "LLAVE"

  Escenario: Buscar por servidor
    Cuando el visitante busca "skyblock"
    Entonces ve únicamente el ítem "Llave Legendaria"

  Escenario: Ítem sin stock
    Dado que el ítem "Kit Guerrero" tiene stock 0
    Cuando el visitante consulta el catálogo
    Entonces el ítem "Kit Guerrero" se muestra como "Agotado"
```

---

## HU-04 — Gestión (CRUD) de ítems digitales

> **Como** vendedor (dueño de un servidor de Minecraft)
> **quiero** publicar, editar y eliminar mis ítems digitales
> **para** mantener actualizada la oferta de mi servidor en MineMarket.

### Criterios de aceptación

1. Solo usuarios autenticados con rol **VENDEDOR** o **ADMIN** pueden crear ítems (RBAC). Sin token → `401`; rol COMPRADOR → `403`.
2. Campos obligatorios: nombre, descripción, tipo (RANGO, KIT, LLAVE, COSMETICO, MONEDA), precio (> 0), stock (entero ≥ 0) y servidor.
3. Un VENDEDOR solo puede editar/eliminar **sus propios** ítems; el ADMIN puede gestionar cualquiera (`403` en caso contrario).
4. El campo `id_vendedor` no puede modificarse mediante la edición.
5. La eliminación requiere confirmación del usuario.

```gherkin
# language: es
Característica: Gestión de ítems digitales
  Como vendedor
  Quiero administrar mis ítems digitales
  Para ofrecerlos a los jugadores

  Antecedentes:
    Dado que el usuario "alex@minemarket.com" con rol "VENDEDOR" ha iniciado sesión

  Escenario: Publicar un ítem digital
    Cuando presiona "+ Publicar ítem"
    Y diligencia nombre "Kit Explorador", descripción "Brújula, mapa y botas", tipo "KIT", servidor "CraftLand", precio 3500 y stock 20
    Y presiona "Publicar ítem"
    Entonces ve el mensaje "Ítem publicado exitosamente"
    Y el ítem "Kit Explorador" aparece en el catálogo con "Stock: 20"

  Escenario: Publicar un ítem con datos inválidos
    Cuando intenta publicar un ítem con precio 0
    Entonces ve el mensaje "El precio debe ser un número mayor a 0"
    Y el ítem no se crea

  Escenario: Editar un ítem propio
    Dado que el vendedor publicó el ítem "Kit Explorador" con stock 20
    Cuando edita el ítem y cambia el stock a 0
    Y presiona "Guardar cambios"
    Entonces ve el mensaje "Ítem actualizado exitosamente"
    Y el ítem "Kit Explorador" se muestra como "Agotado"

  Escenario: Eliminar un ítem propio
    Dado que el vendedor publicó el ítem "Kit Explorador"
    Cuando presiona "Eliminar" y confirma la acción
    Entonces ve el mensaje "Ítem eliminado"
    Y el ítem ya no aparece en el catálogo

  Escenario: Un vendedor intenta modificar un ítem ajeno
    Dado que el ítem "Rango VIP" pertenece a otro vendedor
    Cuando intenta editarlo mediante la API
    Entonces el sistema responde con estado 403
    Y el mensaje "Solo el vendedor propietario o un administrador puede modificar este ítem"

  Escenario: Un comprador intenta publicar un ítem
    Dado que el usuario con rol "COMPRADOR" ha iniciado sesión
    Cuando intenta crear un ítem mediante la API
    Entonces el sistema responde con estado 403
    Y el mensaje "No tienes permisos para realizar esta acción"
```

---

## Trazabilidad Historias ↔ Pruebas

| Historia | Pruebas unitarias / integración (Jest, Vitest) | Pruebas E2E (Playwright) |
|----------|-----------------------------------------------|--------------------------|
| HU-01 | `backend/tests/unit/authService.test.js` (bcrypt), `backend/tests/unit/validators.test.js`, `backend/tests/integration/auth.api.test.js`, `frontend/tests/unit/authForms.test.jsx` | `frontend/e2e/auth.spec.js` → *Registro exitoso…* |
| HU-02 | `backend/tests/unit/authService.test.js` (JWT), `backend/tests/unit/authMiddleware.test.js`, `frontend/tests/unit/session.test.js` | `frontend/e2e/auth.spec.js` → *Login con credenciales inválidas* |
| HU-03 | `backend/tests/integration/items.api.test.js`, `frontend/tests/unit/catalog.test.jsx` | `frontend/e2e/items.spec.js` → *Visitante consulta y filtra el catálogo* |
| HU-04 | `backend/tests/unit/authMiddleware.test.js` (RBAC), `backend/tests/integration/items.api.test.js`, `frontend/tests/unit/catalog.test.jsx` | `frontend/e2e/items.spec.js` → *Vendedor publica, edita y elimina…* |

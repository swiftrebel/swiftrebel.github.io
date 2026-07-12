# Arquitectura — Viexsa Cotizaciones v1

Este documento describe cómo pasar del prototipo actual (todo en `index.html`, datos en memoria)
a una aplicación real: con backend, almacenamiento persistente y seguridad, manteniendo el
frontend en HTML/CSS/JS vanilla.

---

## 1. Objetivo y alcance

**Problema que resuelve:** reemplazar las hojas de cálculo para cotizar desde el teléfono.

**Lo que la app debe hacer (v1):**
- Guardar TODAS las cotizaciones de forma permanente (sobrevivir reinicios, cambios de teléfono).
- Crear, editar y consultar cotizaciones desde el teléfono.
- Exportar PDF y compartirlo por WhatsApp (esto ya funciona en el prototipo).
- Acceso protegido con usuario y contraseña (los datos de clientes no pueden quedar públicos).

**Lo que NO incluye la v1 (para no complicarse):**
- Multiusuario con roles/permisos (se deja la puerta abierta en el modelo de datos).
- Modo offline con sincronización (ver §9, es la fase final).
- Facturación, inventario, reportes avanzados.

---

## 2. Visión general

```
┌─────────────────────────────┐
│  Teléfono (navegador/PWA)   │
│                             │
│  Frontend vanilla:          │
│  HTML + CSS + JS (módulos)  │
│  jsPDF genera el PDF aquí   │
└──────────────┬──────────────┘
               │ HTTPS (JSON)
               ▼
┌─────────────────────────────┐
│  Servidor (VPS o PaaS)      │
│                             │
│  Node.js + Express          │
│  - API REST /api/...        │
│  - Sesiones (login)         │
│  - Sirve los archivos       │
│    estáticos del frontend   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  SQLite (un archivo .db)    │
│  + backups automáticos      │
└─────────────────────────────┘
```

Tres piezas, un solo servidor. El mismo proceso de Node sirve el frontend y la API,
así no hay problemas de CORS ni dos despliegues que coordinar.

---

## 3. Decisiones de stack (y por qué)

| Pieza | Elección | Por qué |
|---|---|---|
| Frontend | HTML/CSS/JS vanilla, sin build | Es lo que quieres entender. Con módulos ES (`<script type="module">`) se puede organizar en archivos sin necesitar Webpack/Vite. |
| Backend | Node.js + Express | Mismo lenguaje que el frontend: solo aprendes/repasas JavaScript. Express es el framework con más documentación y ejemplos que existe. |
| Base de datos | SQLite (paquete `better-sqlite3`) | Es un archivo, no un servidor: nada que instalar ni administrar, backups = copiar el archivo. Para un negocio con cientos o miles de cotizaciones al año sobra muchísimo. |
| Autenticación | Sesiones con cookie (`express-session`) + `bcrypt` | Más simple y más segura de implementar bien que JWT para una app con un solo servidor. |
| PDF | jsPDF en el cliente (como ahora) | Ya funciona, y el flujo de compartir por WhatsApp usa la Web Share API del navegador, que necesita que el PDF exista en el cliente de todas formas. |
| HTTPS / dominio | Caddy como proxy inverso (VPS) o automático (PaaS) | HTTPS es obligatorio: sin él la Web Share API y el service worker no funcionan, y las contraseñas viajarían en claro. |

**Tecnologías descartadas a propósito:** React/Vue (no aportan nada a una app de 5 pantallas y
te alejan del objetivo de entender), PostgreSQL/MySQL (un servidor de BD que administrar sin
necesidad), TypeScript (recomendable más adelante, pero es una cosa más que aprender ahora).

---

## 4. Estructura de carpetas propuesta

```
viexsa-cotizaciones/
├── ARQUITECTURA.md
├── package.json
├── server/
│   ├── index.js          # arranque de Express, middleware, rutas
│   ├── db.js             # conexión SQLite + creación de tablas (migraciones)
│   ├── auth.js           # login, logout, middleware "requiereSesion"
│   └── routes/
│       ├── quotes.js     # CRUD de cotizaciones
│       └── company.js    # datos de la empresa
├── public/               # lo que se sirve al navegador (el frontend)
│   ├── index.html        # solo estructura HTML
│   ├── css/
│   │   └── app.css       # el <style> actual, extraído
│   ├── js/
│   │   ├── app.js        # arranque, navegación entre vistas
│   │   ├── api.js        # TODAS las llamadas fetch al backend viven aquí
│   │   ├── quotes.js     # lógica de cotizaciones (form, totales, listado)
│   │   ├── pdf.js        # renderDocPage + buildQuotePdf (juntos, ver nota)
│   │   └── utils.js      # escapeHtml, formatMoney, fechas...
│   ├── vendor/jspdf.umd.min.js
│   ├── manifest.json
│   ├── sw.js
│   ├── icons/
│   └── assets/
└── data/                 # NO se sube a git
    ├── viexsa.db         # la base de datos
    └── backups/
```

Nota: `renderDocPage` (vista previa HTML) y `buildQuotePdf` (PDF) dibujan el mismo documento
dos veces. Mantenerlos en el mismo archivo (`pdf.js`) reduce el riesgo de que se desincronicen
cuando cambies el formato de la cotización.

---

## 5. Modelo de datos (SQLite)

```sql
-- Quién puede entrar. Aunque hoy seas solo tú, la tabla permite añadir gente después.
CREATE TABLE users (
  id            INTEGER PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,            -- bcrypt, NUNCA la contraseña en claro
  name          TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Datos de la empresa y valores por defecto (hoy en localStorage "viexsa-company").
-- Una sola fila.
CREATE TABLE company_settings (
  id        INTEGER PRIMARY KEY CHECK (id = 1),
  name      TEXT, address TEXT, phones TEXT, email TEXT, ruc TEXT,
  encargado TEXT, delivery TEXT, warranty TEXT, validity TEXT,
  itbms     REAL NOT NULL DEFAULT 7
);

CREATE TABLE quotes (
  id           INTEGER PRIMARY KEY,
  client_name  TEXT NOT NULL,
  address      TEXT,
  status       TEXT NOT NULL DEFAULT 'pendiente'
               CHECK (status IN ('pendiente','enviada','aceptada')),
  tax_enabled  INTEGER NOT NULL DEFAULT 0,  -- SQLite no tiene booleanos: 0/1
  subtotal     REAL NOT NULL,
  tax          REAL NOT NULL,
  total        REAL NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  created_by   INTEGER REFERENCES users(id)
);

-- Cada línea de producto de una cotización.
CREATE TABLE quote_items (
  id        INTEGER PRIMARY KEY,
  quote_id  INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  desc      TEXT,
  qty       REAL NOT NULL DEFAULT 1,
  width     TEXT,           -- medidas como texto libre, igual que en el prototipo
  height    TEXT,
  price     REAL NOT NULL,
  position  INTEGER NOT NULL DEFAULT 0   -- orden de las líneas en el documento
);
```

Diferencias con el prototipo: las fechas se guardan en formato ISO (`2026-07-03 14:00:00`) y la
etiqueta bonita ("3 Jul 2026") se calcula al mostrar; los totales se guardan calculados para que
el historial no cambie si mañana cambias el ITBMS por defecto.

---

## 6. API REST

Todas las rutas bajo `/api`, todas devuelven JSON, todas (menos login) requieren sesión activa.

```
POST   /api/login              { email, password } → cookie de sesión
POST   /api/logout
GET    /api/me                 → usuario actual (para saber si hay sesión al abrir la app)

GET    /api/quotes             → lista (acepta ?status=pendiente&search=texto)
POST   /api/quotes             → crea cotización con sus items
GET    /api/quotes/:id         → una cotización con sus items
PUT    /api/quotes/:id         → edita (reemplaza items)
PATCH  /api/quotes/:id/status  → solo cambia el estado
DELETE /api/quotes/:id

GET    /api/company            → datos de empresa
PUT    /api/company            → actualiza datos de empresa
```

Reglas:
- **El servidor recalcula los totales.** El cliente los muestra en vivo, pero al guardar,
  el backend vuelve a calcular subtotal/ITBMS/total a partir de los items. Nunca confíes
  en números que llegan del navegador.
- **El servidor valida todo lo que entra** (campos obligatorios, tipos, longitudes) antes
  de tocar la base de datos. Una librería ligera como `zod` ayuda, o validación manual.
- Errores en JSON con código HTTP correcto: `401` sin sesión, `400` datos inválidos,
  `404` no existe, `500` error interno (sin filtrar detalles internos al cliente).

---

## 7. Seguridad (lo mínimo serio)

1. **HTTPS siempre.** Sin excepciones. Caddy o el PaaS lo dan gratis con Let's Encrypt.
2. **Contraseñas con `bcrypt`** (coste 12). El usuario inicial se crea con un script
   (`node server/scripts/crear-usuario.js`), no hay registro público.
3. **Cookie de sesión** con `httpOnly` (JS no puede leerla → protege contra XSS),
   `secure` (solo HTTPS) y `sameSite: 'lax'` (protege contra CSRF en la práctica para
   esta app; al ser `lax`, los POST desde otros sitios no llevan la cookie).
4. **Rate limiting en `/api/login`** (`express-rate-limit`, p. ej. 5 intentos/minuto)
   para frenar fuerza bruta.
5. **Consultas SIEMPRE parametrizadas** (`db.prepare('... WHERE id = ?').get(id)`).
   `better-sqlite3` lo hace natural; nunca concatenar strings en SQL.
6. **XSS:** mantener la disciplina actual de `escapeHtml` en todo dato que se
   interpola en `innerHTML`. Regla simple: si el texto lo escribió un humano, se escapa.
7. **Cabeceras de seguridad** con `helmet` (una línea de Express).
8. **Backups:** un cron diario que copie `viexsa.db` a `data/backups/` con fecha, y
   idealmente una copia fuera del servidor (rclone a Google Drive/S3). Una base de
   datos sin backup es una hoja de cálculo con pasos extra.
9. **Secretos** (clave de sesión) en variables de entorno (`.env` fuera de git), no en el código.

---

## 8. Frontend: qué cambia respecto al prototipo

- `index.html` se parte en HTML + `css/app.css` + módulos JS (§4). Mismo código, mejor organizado.
- El array `quotes` en memoria y el seed de demostración **desaparecen**: los datos vienen de
  `api.js` con `fetch`. Las funciones de render (`renderQuoteList`, `renderRecientes`,
  `renderStats`) reciben los datos como parámetro en vez de leer una variable global.
- Los datos de empresa dejan de vivir en localStorage y pasan al backend (así se comparten
  entre dispositivos).
- Pantalla nueva: **login** (la primera vista si `GET /api/me` devuelve 401).
- El resto (navegación por vistas, formulario, vista previa, PDF, WhatsApp) se queda igual.
- El service worker en esta fase cachea solo el "app shell" (HTML/CSS/JS/iconos), **no** las
  respuestas de `/api`. Cachear datos con sesión es la fuente de bugs más rara de depurar;
  se aborda en la fase offline con calma.

---

## 9. Plan por fases (cada una termina con algo que funciona)

**Fase 0 — Reorganizar el prototipo** *(sin backend todavía)*
Partir `index.html` en archivos según §4. Objetivo: entender tu propio código pieza por pieza.
La app sigue funcionando exactamente igual.

**Fase 1 — Backend con datos reales** *(en tu computadora)*
Express + SQLite + endpoints de cotizaciones y empresa. El frontend pasa de array en memoria
a `fetch`. Sin login todavía (solo accesible en `localhost`). Al terminar: las cotizaciones
sobreviven al recargar.

**Fase 2 — Autenticación**
Tabla `users`, login/logout, middleware de sesión, pantalla de login, rate limiting.
Al terminar: nadie sin contraseña puede ver ni tocar datos.

**Fase 3 — Producción**
VPS pequeño (Hetzner/DigitalOcean, ~5 USD/mes) con Caddy + Node, o un PaaS (Railway/Render,
cuidando que el archivo SQLite esté en un volumen persistente). Dominio + HTTPS + backups.
Al terminar: usas la app desde tu teléfono en el día a día. **Aquí ya reemplazaste la hoja de cálculo.**

**Fase 4 — Offline (opcional, solo si te duele en la práctica)**
Si te quedas sin señal donde cotizas: cache de lectura de cotizaciones (IndexedDB) y cola de
"pendientes de subir" al recuperar conexión. Es la fase más compleja conceptualmente; solo
vale la pena si la necesidad es real.

---

## 10. Riesgos conocidos

- **Doble render del documento** (preview HTML vs PDF jsPDF): cualquier cambio de formato hay
  que hacerlo en los dos sitios. Aceptable por ahora; si duele mucho, la alternativa futura es
  generar el PDF en el servidor con Puppeteer a partir del mismo HTML de la preview (una sola
  fuente de verdad, a cambio de más peso en el servidor).
- **Service worker con cache vieja**: ya lo viste en el prototipo. Bumpear `CACHE_NAME` en cada
  despliegue (puede automatizarse con un pequeño script de deploy).
- **SQLite y concurrencia**: escribe un proceso a la vez. Para uno o pocos usuarios es
  irrelevante; si algún día hay muchos usuarios simultáneos, la migración natural es PostgreSQL
  y el modelo de datos de §5 se traslada casi sin cambios.

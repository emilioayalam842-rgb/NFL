# Zona Roja

Estadísticas, resultados, calendario y recomendaciones de apuesta de la NFL, con suscripción
pagada por transferencia SPEI. Next.js + Prisma + Auth.js.

## Qué incluye

- **Estadísticas, resultados y calendario** — vía los endpoints públicos (no oficiales) de ESPN,
  con datos de muestra como respaldo si ESPN no responde.
- **Picks/recomendaciones** (spread, moneyline, over/under, props de jugador) generados con un
  modelo estadístico simple a partir de la forma reciente de equipos y jugadores
  (`src/lib/recommendations/engine.ts`). Es un análisis informativo, no una garantía de resultado.
- **Login** con Google, Apple y correo/contraseña (Auth.js v5).
- **Suscripciones pagadas por transferencia SPEI**: el usuario transfiere a tu CLABE y reporta el
  folio (clave de rastreo); un bot intenta verificarlo automáticamente contra el **CEP de Banxico**
  (`src/lib/banxico/cep.ts`) y, si no puede confirmar, lo deja en revisión manual para el admin.
- **Panel de admin**: usuarios, pagos, sincronización de datos de ESPN, líneas de mercado por
  juego, generación y publicación de picks.
- Aviso y controles básicos de **juego responsable** (auto-exclusión en `/cuenta`, disclaimer en
  el footer).

## Antes de usarlo en producción

- **Banxico CEP no es una API oficial.** El scraping en `src/lib/banxico/cep.ts` puede romperse si
  Banxico cambia su HTML o agrega un CAPTCHA — por diseño, cualquier resultado que no sea un match
  claro cae en revisión manual (`MANUAL_REVIEW`) en vez de rechazar o aprobar solo. Un admin sigue
  siendo el respaldo real.
- **ESPN tampoco tiene API oficial ni SLA.** Si deja de responder, la app usa datos de muestra
  (`src/lib/demo-data.ts`) para no quedar en blanco.
- Configura tu cuenta bancaria real en `.env` (`PAYOUT_CLABE`, `PAYOUT_BANK_NAME`,
  `PAYOUT_BENEFICIARY`) antes de cobrar de verdad.
- Este entorno de desarrollo no tiene salida a internet hacia ESPN/Banxico, así que esos dos
  flujos no se pudieron probar contra los servicios reales — sí se probaron con datos de muestra
  y con el flujo de revisión manual.

## Configuración

```bash
cp .env.example .env
# llena AUTH_SECRET (openssl rand -base64 32), credenciales de Google/Apple OAuth,
# y tu cuenta bancaria (PAYOUT_*)

npm install
npx prisma migrate dev
npm run db:seed        # crea los planes (Semanal, Mensual, Temporada)
npm run dev
```

Para volverte admin después de registrarte con tu correo:

```bash
npm run make-admin -- tu@correo.com
```

## Estructura relevante

- `prisma/schema.prisma` — modelos (usuarios, suscripciones, pagos, equipos, juegos, stats, picks).
- `src/lib/espn/` — cliente de datos de ESPN + sincronización a la base de datos.
- `src/lib/recommendations/` — motor de picks.
- `src/lib/banxico/` — verificación de transferencias vía CEP.
- `src/app/admin/` — panel de administración.
- `src/app/suscripcion/` — flujo de compra por transferencia.

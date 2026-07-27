# Billetera

Aplicación de finanzas personales construida con React, Vite, Tailwind CSS y Supabase.

## Inicio

```bash
npm install
npm run dev
```

Las variables requeridas están documentadas en `.env.example`.

## Base de datos

Para una instalación nueva o para reparar un proyecto sin tablas, ejecutar `supabase/migrations/202607270003_supabase_bootstrap.sql` en el SQL Editor de Supabase. El archivo es idempotente y crea o repara perfiles, categorías, movimientos, vencimientos, índices, triggers, permisos y políticas RLS.

## Comandos

- `npm run dev`: servidor de desarrollo
- `npm run build`: build de producción
- `npm run lint`: análisis estático
- `npm run preview`: previsualización del build

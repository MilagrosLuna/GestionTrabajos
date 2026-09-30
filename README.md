# Gestión de Trabajos — Imprenta Phoenix

Sistema interno para una imprenta gráfica: registra cada trabajo desde la seña hasta la entrega, lleva las cuentas de los clientes, la caja y los presupuestos, y genera las órdenes de trabajo en PDF.

## Funcionalidades

| Módulo | Qué hace |
| --- | --- |
| **Trabajos** | Alta con seña y comprobante, listado paginado con búsqueda y varios órdenes, edición, pagos parciales, comentarios y orden de trabajo en PDF (3 copias). Numeración automática con contador atómico. |
| **Clientes** | Alta y listado; filtro de todos los trabajos de un cliente; distinción de clientes de gremio. |
| **Caja** | Movimientos en efectivo y transferencia, retiros. |
| **Cuentas** | Cuentas bancarias de cobro y aprobación de usuarios. |
| **Presupuestos** | Alta y seguimiento por estado: pendiente, aprobado, rechazado o convertido. |
| **Gráficos** | Dashboard de trabajos e ingresos con ECharts. |
| **Auditoría** | Registro inmutable de las acciones hechas en el sistema. |

## Stack

- Angular 17 (módulos, SCSS, TypeScript strict)
- Firebase: Authentication, Firestore, Storage y Hosting
- Angular Material + MDB Angular UI Kit
- ECharts (gráficos), pdfmake (PDF), SweetAlert2, EmailJS

## Correr el proyecto en local

Requisitos: Node 18+ y npm.

```bash
git clone https://github.com/MilagrosLuna/GestionTrabajos.git
cd GestionTrabajos
npm install
npm run dev      # http://localhost:4200, usa el proyecto de Firebase de desarrollo
```

### Entornos

| Archivo | Proyecto de Firebase | Se usa en |
| --- | --- | --- |
| `src/environments/environment.development.ts` | `phoenix-2e79a` (dev) | `npm run dev` |
| `src/environments/environment.ts` | `graficas3197` (prod) | `npm run build` / `npm run deploy` |

`environment.ts` está en `.gitignore`: para un build de producción hay que crearlo con la misma forma que el de desarrollo y la configuración del proyecto de producción.

## Acceso y roles

1. El usuario se registra y verifica su mail.
2. Un administrador lo aprueba desde **Cuentas**.
3. Si el admin le quita la aprobación, la sesión activa se cierra sola (escucha en tiempo real sobre `usuarios/{uid}`).

Los administradores se cargan a mano en la colección `admins`, **con el UID del usuario como ID del documento** (las reglas lo buscan así). Borrar trabajos, clientes y presupuestos, o editar cuentas, queda reservado a administradores.

## Seguridad

Reglas en [`firestore.rules`](firestore.rules) y [`storage.rules`](storage.rules):

- Solo operan usuarios autenticados **y aprobados**.
- `movimientos` (pagos) y `auditorias` son inmutables: se pueden crear, nunca editar ni borrar.
- Los comprobantes en Storage aceptan solo imágenes o PDF de hasta 10 MB.

Las reglas se publican en los dos proyectos:

```bash
firebase use dev  && firebase deploy --only firestore:rules,storage
firebase use prod && firebase deploy --only firestore:rules,storage
```

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (entorno dev) |
| `npm run build` | Build de producción en `dist/grafica-angular` |
| `npm run deploy` | Build + deploy a Firebase Hosting (prod) |
| `npm test` | Tests unitarios (Karma + Jasmine) |

## Estructura

```
src/app/
├── clases/            # Modelos: Laburo, Cliente, Cuenta, Movimiento, Presupuesto
├── components/        # Vistas por módulo (alta, listado, caja, cuentas, presupuestos, gráficos, auditoría…)
│   └── modals/        # Edición, pago, retiro, comentario, comprobante, historial, borrado
├── inicio/            # Login, registro y recuperación de contraseña
├── constants/         # Constantes de EmailJS
└── servicesAndUtils/  # Auth, Firestore, Storage, admin, auditoría, guard, alertas
```

## Autora

[@MilagrosLuna](https://github.com/MilagrosLuna)

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GestionTrabajos** is an Angular 17 application for managing printing jobs, clients, accounts, and payments. The project uses Firebase (Firestore) for backend data storage and authentication, with deployment to Firebase Hosting. It's built for a graphics printing business ("Phoenix") to track jobs, clients, payments, and generate PDF reports.

## Tech Stack

- **Framework**: Angular 17 (17.3.12)
- **Language**: TypeScript 5.1
- **Styling**: SCSS
- **UI Components**: 
  - Material Design (Angular Material)
  - MDB Angular UI Kit
  - ECharts (for data visualizations)
- **Backend**: Firebase (Firestore, Authentication)
- **PDF Generation**: pdfmake
- **State Management**: RxJS (BehaviorSubjects, Observables)
- **Email**: EmailJS
- **Testing**: Karma + Jasmine
- **Build Tool**: Angular CLI 16

## Development Commands

```bash
# Start development server (http://localhost:4200)
npm start
# or
ng serve

# Development with explicit config flag
npm run dev

# Build for production
npm run build

# Build and deploy to Firebase Hosting
npm run deploy

# Run unit tests (Karma)
npm run test

# Watch mode for development (rebuilds on file changes)
npm run watch

# Generate new Angular component/service/module
ng generate component components/component-name
ng generate service servicesAndUtils/service-name
```

## Project Architecture

### Directory Structure

```
src/
├── app/
│   ├── clases/           # Domain models (Laburo, Cliente, Cuenta, Movimiento, Presupuesto)
│   ├── components/       # Feature components (UI views)
│   │   ├── home/
│   │   ├── alta/         # Job creation form
│   │   ├── listado/      # Job listing with sorting/filtering
│   │   ├── caja/         # Cash management
│   │   ├── cuentas/      # Account management
│   │   ├── graficos/     # Charts/dashboard
│   │   ├── presupuestos/ # Budget management
│   │   ├── altaCliente/  # Client creation
│   │   ├── listado-clientes/
│   │   ├── modals/       # Reusable modal dialogs
│   │   └── navbar, footer/
│   ├── inicio/           # Auth pages (login, register, reset-password)
│   ├── servicesAndUtils/ # Services and guards
│   │   ├── auth.service.ts       # Firebase authentication
│   │   ├── firebase.service.ts   # Firestore CRUD operations
│   │   ├── guard.ts              # Route protection (AuthGuard)
│   │   ├── alerts.service.ts     # SweetAlert2 notifications
│   │   ├── confirmation.service.ts # Event-driven state
│   │   └── storage.service.ts
│   ├── app.module.ts     # Root module with Firebase/Material setup
│   ├── app-routing.module.ts
│   └── app.component.ts
├── environments/         # Config per environment
├── main.ts              # Bootstrap + Firebase initialization
├── styles.scss          # Global styles
└── index.html
```

### Core Architecture Concepts

#### 1. Authentication & Authorization
- **AuthService** (`servicesAndUtils/auth.service.ts`):
  - Uses Firebase Authentication (email/password)
  - Manages user state via `BehaviorSubject<boolean>` (user$.asObservable())
  - Handles registration, login, logout, password reset, email verification
  - Stores user data in localStorage: `{ uid, email, displayName }`
  - Method: `isUserAuthenticatedSnapshot()` checks both Firebase auth and localStorage
  - **Real-time session revocation**: `iniciarEscuchaAprobacion(uid)` uses `onSnapshot` to listen for changes to the user's `aprobado` field — if set to `false` while logged in, calls `logout()` automatically
  - Registration uses `guardarConId` to store the user document with UID as document ID (required by Firestore rules)
  - `signOut` is always called in `finally` block after registration to prevent auto-login
  
- **AuthGuard** (`servicesAndUtils/guard.ts`):
  - Protects routes under `/home` path
  - Requires both Firebase authentication AND `localStorage.getItem('logueado')`
  - Redirects unauthenticated users to `/login`

- **AdminService** (`servicesAndUtils/admin.service.ts`):
  - Uses `InjectionToken ON_AUTH_STATE_CHANGED` for `onAuthStateChanged` (makes it mockable in tests)
  - Checks if current user UID is in the `admins` collection
  - Exposes `getEsAdmin(): Observable<boolean>` and `getEsAdminSnapshot(): boolean`

#### 2. Data Layer - Firestore Service
- **FirebaseService** (`servicesAndUtils/firebase.service.ts`) is the single point for database access
- All write methods (`guardar`, `guardarConId`, `modificar`) sanitize data with `JSON.parse(JSON.stringify(...))` to prevent Firestore errors from `undefined` values or non-serializable objects (e.g. `File`)
- Methods:
  - `guardar(data, ruta)` - Create document with auto-generated ID (`addDoc`)
  - `guardarConId(data, ruta, id)` - Create/overwrite document with specific ID (`setDoc`) — used for users (UID as doc ID)
  - `escucharDocumento(ruta, id, callback)` - Real-time listener via `onSnapshot`; returns unsubscribe function
  - `obtener(ruta)` - Fetch all documents from collection
  - `obtenerUno(ruta, uid)` - Fetch single document by ID
  - `obtenerConPaginacion(ruta, ordenCampo, limiteRegistros, ultimoDoc)` - Paginated queries
  - `getWhere(path, field, value)` / `obtenerDonde()` / `obtenerDondeOrdenado()` - Filtered queries
  - `modificar(data, ruta)` - Update document (throws on error — no silent catch)
  - `borrar(data, ruta)` - Delete document
  - `incrementarContador(contadorId)` - Atomic counter increment (uses transactions)
  
- Collections in Firestore:
  - `laburos` - Job records (jobs to print)
  - `clientes` - Client data
  - `cuentas` - Bank/payment accounts
  - `usuarios` - User profiles (aprobado flag for admin approval)
  - `admins` - Admin user IDs
  - `contadores` - Counters for generating unique job numbers
  - `movimientos` - Payment/movement history
  - `presupuestos` - Budgets/quotes

#### 3. Domain Models (in `src/app/clases/`)
- **Laburo** (Job): clienteid, cliente, fecha, fechaEntrega, trabajo, detalle, precio, sena, pago, pagoEfectivo, cajaFinal, cuentaFinal, comprobanteSena, comprobantePago
- **Cliente**: clienteNumero, nombre, email, telefono, gremio (boolean)
- **Cuenta**: uid, nombre (bank account)
- **Presupuesto**: Budget/quote data
- **Movimiento**: Payment movements

#### 4. State Management Pattern
- Uses RxJS Observables and BehaviorSubjects for reactive state
- **ConfirmationService** (confirmation.service.ts) uses event-driven pattern:
  - Components emit events when data changes (add, delete, modify)
  - Other components subscribe and reload data
  - Methods: `getConfirmationState()`, `getDeleteEvent()`, `getAddPagoEvent()`, `getAddComentarioEvent()`
- This replaces traditional Redux/NgRx - lightweight but effective for this scope

#### 5. Routing Structure (app-routing.module.ts)
- `/login` - Unauthenticated entry point
- `/register` - User registration
- `/reset` - Password reset
- `/home` - Protected parent route with children:
  - `alta` - Create job
  - `altaC` - Create client
  - `listado` - List jobs (main work view with pagination, sorting, filtering)
  - `listadoC` - List clients
  - `filtro/:id` - Filter jobs by client ID
  - `graficos` - Dashboard/charts (ECharts)
  - `cuentas` - Manage accounts
  - `caja` - Cash management
  - `presupuestos` - Budget management
  - `tabla` - Alternative job table view
- `**` - 404 error page (ErrorPageComponent)

#### 6. Component Communication
- **Modals** (MDB Modal Service):
  - ModalComponent (edit job)
  - ModalDeleteComponent (confirm delete)
  - ModalPagoComponent (add payment)
  - ModalComentarioComponent (add comment)
  - ModalComprobanteComponent (receipt/voucher)
  - ModalRetiroComponent (withdrawal)
  - Data passed via modal options: `{ data: { laburo } }`
  
- **Search & Filtering** (ListadoComponent):
  - Full-text search across job fields
  - Search includes client name, email, phone, number, gremio status
  - Multiple sort orders: by date, client, price, work type, payment method
  - Pagination: loads 25 items at a time with "load more"

#### 7. PDF Generation (ListadoComponent)
- Uses pdfmake library
- `createPDF(laburo)` method generates 3-copy print orders
- Contains payment details, account info, terms/conditions footer
- Formats dates as DD/MM/YYYY and currency in Argentine format

#### 8. Firebase Configuration
- Two environments:
  - **Development** (`environment.development.ts`): Project ID `phoenix-2e79a`
  - **Production** (`environment.ts`): Project ID `graficas3197`
- Configuration imported and initialized in `main.ts`
- Firestore rules defined in `firestore.rules`
- Indexes defined in `firestore.indexes.json`

## Key Implementation Details

### User Registration & Approval Flow
1. User registers with email/password
2. Email verification sent automatically
3. User document stored in `usuarios` using UID as document ID (required for Firestore rules: `request.auth.uid == userId`)
4. User is signed out immediately after registration (in `finally` block)
5. Admin approves user in **Cuentas** section by toggling `aprobado`
6. Login checks `emailVerified` → fetches `usuarios` → checks `aprobado: true`
7. If user exists in Firebase Auth but not in Firestore (orphan), the document is auto-created on login with `aprobado: false`
8. Once approved and logged in, `AuthService.iniciarEscuchaAprobacion(uid)` watches for real-time changes — if admin sets `aprobado: false`, the active session is automatically revoked (logout triggered via `onSnapshot`)

### Job Management Workflow
1. Jobs created with initial seña (deposit) information
2. Tracked through stages: seña received, work complete, final payment
3. Payments can be in efectivo (cash) or transferencia (bank transfer)
4. Multiple payment records per job (partial payments tracked)
5. Unique job numbers generated via atomic counter increment

### Admin Checks
- **AdminService** centralizes the admin check (replaces per-component `verificar()` logic)
- Listens to `onAuthStateChanged` via `ON_AUTH_STATE_CHANGED` InjectionToken
- Compares UID against `admins` collection documents (by doc ID or `data.id` field)
- Components subscribe to `esAdmin$: Observable<boolean>` or call `getEsAdminSnapshot()`
- Controls visibility of delete, payment, and admin-only features in templates

## Firebase Firestore Rules & Indexes
- Check `firestore.rules` for security rules
- Check `firestore.indexes.json` for query optimizations
- Common patterns: User-scoped access, authenticated-only collections

## Build & Deployment

### Production Build
```bash
npm run build
# Creates optimized bundle in dist/grafica-angular/
# Budget: 5MB initial, 7MB max; 1MB component styles, 5MB max
```

### Firebase Deployment
```bash
npm run deploy
# Runs: ng build && npx firebase-tools deploy --only hosting
# Deploys to: https://graficas3197.firebaseapp.com
# SPA rewrite configured: all routes → index.html
```

### Environment Variables
- Firestore config is in `environment.ts` and `environment.development.ts`
- `.gitignore` includes `src/environments/environment.ts` (production secrets)
- Note: API keys are visible in env files (typical for client-side Firebase, but monitor for abuse)

## Testing Setup
- **Test Runner**: Karma (headless Chrome)
- **Framework**: Jasmine
- **Config**: `angular.json` test architect configuration
- Test files: `*.spec.ts` alongside components
- **59 tests total, all passing** as of 2026-05-08
- AdminService tests use `ON_AUTH_STATE_CHANGED` token to mock `onAuthStateChanged`
- Components that use `AdminService` mock it as: `{ provide: AdminService, useValue: { getEsAdmin: () => of(false), inicializar: () => Promise.resolve(), reset: () => {} } }`
- `AuditoriaService` is mocked in component tests as: `{ provide: AuditoriaService, useValue: { registrar: () => Promise.resolve() } }`

## Important Notes

### Development Considerations
1. **TypeScript Strict Mode**: Enabled in `tsconfig.json` - all strict checks active
2. **SCSS Styling**: All components use SCSS (configured in angular.json)
3. **Material Theme**: Using `indigo-pink` prebuilt Material theme
4. **Lazy Loading**: Not implemented - all modules loaded upfront
5. **Change Detection**: Default strategy (no OnPush optimization)
6. **Pagination**: Manual pagination in ListadoComponent (25 items per load)

### Common Patterns to Follow
- Modal data passed through MDB modal options (`{ data: { laburo } }`), retrieved via `@Input` in modal component
- Events emitted via ConfirmationService for cross-component communication after mutations
- Firestore documents returned wrapped as `{ id, data }` structure

### Known Issues / Quirks
- Firebase initialization happens both in `main.ts` and `app.module.ts` (redundant but harmless)
- Firestore `isAdmin()` rule checks `exists(/admins/$(uid))` by document ID; admin documents must be created using the UID as document ID in Firebase Console — if auto-generated IDs were used, the rule always returns false (UI guard is the fallback)
- Firestore rules must be deployed to **both** projects (`graficas3197` prod and `phoenix-2e79a` dev) via `firebase use <project> && firebase deploy --only firestore:rules`

### Design System — Phoenix Brand Tokens
CSS custom properties defined in `styles.scss` and available app-wide:
- `--ph-red` / `--ph-red-dark` / `--ph-amber` — brand colors
- `--ph-navy` / `--ph-dark` / `--ph-gray` / `--ph-light` — neutrals
- `--ph-success` / `--ph-transfer` — semantic colors for payments
- `--shadow-sm/md/lg` — card shadows
- `--radius` / `--radius-lg` — border radius
- `--transition` — standard transition

Navbar uses dark gradient (`--ph-navy` → `#16213e`) with `navbar-dark` class and custom `.ph-navbar` SCSS.
Home content is wrapped in `.home-content` (72px top padding) to clear the fixed navbar.

## Presupuesto Estados

`EstadoPresupuesto` is a union type: `'pendiente' | 'aprobado' | 'rechazado' | 'convertido'`
- Default on creation: `'pendiente'`
- Can be changed from the presupuestos list via the dropdown selector
- Displayed as colored Bootstrap badges
- Old documents without `estado` field default to `'pendiente'` via `getEstadoInfo(estado ?? 'pendiente')`

## Angular Upgrade Guide (16 → 17/18/19)

### Benefits of upgrading

**Angular 17 (key changes):**
- New built-in control flow: `@if`, `@for`, `@switch` replace `*ngIf`, `*ngFor`, `*ngSwitch` (no more CommonModule needed in standalone)
- `@defer` blocks for lazy-loading template sections
- New application builder (esbuild via Vite) — much faster builds
- Signals API (stable) for fine-grained reactivity
- View Transitions API support

**Angular 18 (key changes):**
- `signal()` inputs via `input()` and `output()` functions (replaces `@Input`/`@Output`)
- `model()` for two-way signal binding
- Zoneless change detection (experimental) — eliminates zone.js dependency
- Angular Material 3 (M3) components

**Angular 19 (key changes):**
- Incremental hydration for SSR
- Signal-based `resource()` API for async data fetching
- `linkedSignal()` for derived writable signals

### Migration path from Angular 17

Run one major version at a time:
```bash
ng update @angular/core@18 @angular/cli@18
ng update @angular/core@19 @angular/cli@19
```

### Breaking changes to check before upgrading

1. **@angular/fire**: Verify compatibility with target Angular version — usually matches Angular major
2. **mdb-angular-ui-kit**: v5.x is for Angular 16/17; check MDB changelog for v6+ compatibility
3. **ngx-echarts**: v17 supports Angular 17+
4. **Lazy loading**: Consider migrating to standalone components to benefit from new control flow
5. **esbuild builder**: `@angular-devkit/build-angular:browser` → `@angular-devkit/build-angular:application`

### Recommended upgrade order for this project
1. Upgrade to Angular 17 (lowest risk, most impactful for build speed)
2. Test with existing MDB + @angular/fire versions
3. Replace `*ngIf`/`*ngFor` with `@if`/`@for` progressively
4. Defer Angular 18/19 until mdb-angular-ui-kit supports it officially


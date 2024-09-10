import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './inicio/login/login.component';
import { RegisterComponent } from './inicio/register/register.component';
import { ErrorPageComponent } from './error-page/error-page.component';
import { HomeComponent } from './components/home/home.component';
import { ResetPasswordComponent } from './inicio/reset-password/reset-password.component';
import { AltaComponent } from './components/alta/alta.component';
import { ListadoComponent } from './components/listado/listado.component';
import { AuthGuard } from './servicesAndUtils/guard';
import { GraficosComponent } from './components/graficos/graficos.component';
import { CuentasComponent } from './components/cuentas/cuentas.component';
import { CajaComponent } from './components/caja/caja.component';
import { PresupuestosComponent } from './components/presupuestos/presupuestos.component';
import { AltaClienteComponent } from './components/altaCliente/altaCliente.component';
import { ListadoClientesComponent } from './components/listado-clientes/listado-clientes.component';
import { FiltroLaburosClientesComponent } from './components/filtro-laburos-clientes/filtro-laburos-clientes.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'reset', component: ResetPasswordComponent },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'alta', component: AltaComponent },
      { path: 'altaC', component: AltaClienteComponent },
      { path: 'listado', component: ListadoComponent },
      { path: 'listadoC', component: ListadoClientesComponent },
      { path: 'filtro/:id', component: FiltroLaburosClientesComponent },
      { path: 'graficos', component: GraficosComponent },
      { path: 'cuentas', component: CuentasComponent },
      { path: 'caja', component: CajaComponent },
      { path: 'presupuestos', component: PresupuestosComponent },
    ],
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', component: ErrorPageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

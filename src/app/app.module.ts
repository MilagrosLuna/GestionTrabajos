import { ErrorPageComponent } from './error-page/error-page.component';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MdbAccordionModule } from 'mdb-angular-ui-kit/accordion';
import { MdbCarouselModule } from 'mdb-angular-ui-kit/carousel';
import { MdbCheckboxModule } from 'mdb-angular-ui-kit/checkbox';
import { MdbCollapseModule } from 'mdb-angular-ui-kit/collapse';
import { MdbDropdownModule } from 'mdb-angular-ui-kit/dropdown';
import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';
import { MdbModalModule } from 'mdb-angular-ui-kit/modal';
import { MdbPopoverModule } from 'mdb-angular-ui-kit/popover';
import { MdbRadioModule } from 'mdb-angular-ui-kit/radio';
import { MdbRangeModule } from 'mdb-angular-ui-kit/range';
import { MdbRippleModule } from 'mdb-angular-ui-kit/ripple';
import { MdbScrollspyModule } from 'mdb-angular-ui-kit/scrollspy';
import { MdbTabsModule } from 'mdb-angular-ui-kit/tabs';
import { MdbTooltipModule } from 'mdb-angular-ui-kit/tooltip';
import { MdbValidationModule } from 'mdb-angular-ui-kit/validation';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './inicio/login/login.component';
import { RegisterComponent } from './inicio/register/register.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { HomeComponent } from './components/home/home.component';
import { ResetPasswordComponent } from './inicio/reset-password/reset-password.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { AltaComponent } from './components/alta/alta.component';
import { ListadoComponent } from './components/listado/listado.component';
import { ModalComponent } from './components/modals/modal/modal.component';
import { ModalDeleteComponent } from './components/modals/modal-delete/modal-delete.component';
import { CurrencyPipe } from '@angular/common';
import { ModalPagoComponent } from './components/modals/modal-pago/modal-pago.component';
import { ModalComentarioComponent } from './components/modals/modal-comentario/modal-comentario.component';
import { GraficosComponent } from './components/graficos/graficos.component';
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts from 'echarts';
import { CuentasComponent } from './components/cuentas/cuentas.component';
import { ModalComprobanteComponent } from './components/modals/modal-comprobante/modal-comprobante.component';
import { CajaComponent } from './components/caja/caja.component';
import { ModalRetiroComponent } from './components/modals/modal-retiro/modal-retiro.component';
import { PresupuestosComponent } from './components/presupuestos/presupuestos.component';
import { HttpClientModule } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AltaClienteComponent } from './components/altaCliente/altaCliente.component';
import { ListadoClientesComponent } from './components/listado-clientes/listado-clientes.component';
import { FiltroLaburosClientesComponent } from './components/filtro-laburos-clientes/filtro-laburos-clientes.component';


const firebaseConfig = environment.firebaseConfig;
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    ErrorPageComponent,
    HomeComponent,
    ResetPasswordComponent,
    NavbarComponent,
    FooterComponent,
    AltaComponent,
    AltaClienteComponent,
    ListadoComponent,
    ModalComponent,
    ModalDeleteComponent,
    ModalPagoComponent,
    ModalComentarioComponent,
    GraficosComponent,
    CuentasComponent,
    ModalComprobanteComponent,
    CajaComponent,
    ModalRetiroComponent,
    PresupuestosComponent,
    ListadoClientesComponent,
    FiltroLaburosClientesComponent,
  ],
  imports: [
    CurrencyPipe,
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    MdbAccordionModule,
    MdbCarouselModule,
    MdbCheckboxModule,
    MdbCollapseModule,
    MdbDropdownModule,
    MdbFormsModule,
    MdbModalModule,
    MdbPopoverModule,
    MdbRadioModule,
    MdbRangeModule,
    MdbRippleModule,
    MdbScrollspyModule,
    MdbTabsModule,
    MdbTooltipModule,
    MdbValidationModule,
    NgxEchartsModule.forRoot({ echarts }),
    BrowserAnimationsModule,
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

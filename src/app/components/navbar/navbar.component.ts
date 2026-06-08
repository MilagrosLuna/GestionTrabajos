import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AdminService } from 'src/app/servicesAndUtils/admin.service';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { AuthService } from 'src/app/servicesAndUtils/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  logueado = false;
  esAdmin = false;
  private subs = new Subscription();

  constructor(
    private router: Router,
    private authService: AuthService,
    private adminService: AdminService,
    private alerts: AlertsService
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.authService.isUserAuthenticated().subscribe(async (isLoggedIn) => {
        this.logueado = isLoggedIn;
        if (isLoggedIn) {
          await this.adminService.inicializar();
        }
      })
    );

    this.subs.add(
      this.adminService.getEsAdmin().subscribe((v) => (this.esAdmin = v))
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  goTo(ruta: string) {
    this.router.navigate(['/' + ruta]);
  }

  async logOut() {
    const result = await this.alerts.showConfirmationMessage(
      '¿Estás seguro de que querés cerrar la sesión?',
      'Confirmar cierre de sesión'
    );
    if (result.isConfirmed) {
      this.adminService.reset();
      await this.authService.logout();
    }
  }
}

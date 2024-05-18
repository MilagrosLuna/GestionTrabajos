import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { AuthService } from 'src/app/servicesAndUtils/auth.service';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnDestroy, OnInit {
  logueado: boolean = false;
  admins: any[] = [];
  esAdmin: boolean = false;
  private authSubscription: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private alerts: AlertsService,
    private firebase: FirebaseService
  ) {
    this.verificar();
    this.authSubscription = this.authService
      .isUserAuthenticated()
      .subscribe((isLoggedIn) => {
        if (isLoggedIn) {
          this.logueado = true;
        } else {
          this.logueado = false;
        }
      });
  }
  ngOnInit(): void {
    this.verificar();
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
  }

  goTo(ruta: string) {
    this.router.navigate(['/' + ruta]);
  }

  async verificar() {
    this.admins = await this.firebase.obtener('admins');
    let user = localStorage.getItem('logueado');
    this.esAdmin = this.admins.some((admin) => admin.data.id === user);
  }

  async logOut() {
    const result = await this.alerts.showConfirmationMessage(
      '¿Estás seguro de que quieres cerrar la sesión?',
      'Confirmar cierre de sesión'
    );
    if (result.isConfirmed) {
      localStorage.removeItem('logueado');
      await this.authService.logout();
    }
  }
}

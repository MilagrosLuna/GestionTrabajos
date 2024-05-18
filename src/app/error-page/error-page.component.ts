import { Component } from '@angular/core';
import { AuthService } from '../servicesAndUtils/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-error-page',
  templateUrl: './error-page.component.html',
  styleUrls: ['./error-page.component.scss'],
})
export class ErrorPageComponent {
  logueado: boolean = false;
  admins: any[] = [];
  esAdmin: boolean = false;
  private authSubscription: Subscription;

  constructor(private router: Router, private authService: AuthService) {
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

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
  }

  goTo(ruta: string) {
    this.router.navigate(['/' + ruta]);
  }
}

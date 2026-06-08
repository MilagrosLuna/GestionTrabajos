import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { NavbarComponent } from './navbar.component';
import { AuthService } from 'src/app/servicesAndUtils/auth.service';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { AdminService } from 'src/app/servicesAndUtils/admin.service';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [NavbarComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            isUserAuthenticated: () => of(false),
            logout: () => Promise.resolve(),
          },
        },
        {
          provide: AlertsService,
          useValue: {
            showConfirmationMessage: () => Promise.resolve({ isConfirmed: false }),
          },
        },
        {
          provide: AdminService,
          useValue: {
            getEsAdmin: () => of(false),
            inicializar: () => Promise.resolve(),
            reset: () => {},
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    TestBed.overrideTemplate(NavbarComponent, '');
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

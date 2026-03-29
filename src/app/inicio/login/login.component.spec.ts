import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { LoginComponent } from './login.component';
import { AuthService } from 'src/app/servicesAndUtils/auth.service';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      declarations: [LoginComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: () => Promise.resolve({ user: { uid: '1', emailVerified: true } }),
            logout: () => Promise.resolve(),
          },
        },
        {
          provide: AlertsService,
          useValue: {
            showSuccessMessageAndNavigate: () => {},
            showErrorMessage: () => {},
            showVerifyEmailMessage: () => {},
          },
        },
        {
          provide: FirebaseService,
          useValue: {
            obtenerDonde: () => Promise.resolve([{ data: { aprobado: true } }]),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

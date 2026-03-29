import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from 'src/app/servicesAndUtils/auth.service';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      declarations: [ResetPasswordComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            resetPassword: () => Promise.resolve(),
          },
        },
        {
          provide: AlertsService,
          useValue: {
            showSuccessMessageAndNavigate: () => {},
            showErrorMessage: () => {},
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

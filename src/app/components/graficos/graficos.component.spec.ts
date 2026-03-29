import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { GraficosComponent } from './graficos.component';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';

describe('GraficosComponent', () => {
  let component: GraficosComponent;
  let fixture: ComponentFixture<GraficosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [GraficosComponent],
      providers: [
        {
          provide: FirebaseService,
          useValue: {
            obtener: () => Promise.resolve([]),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(GraficosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

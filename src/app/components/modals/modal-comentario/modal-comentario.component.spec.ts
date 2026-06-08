import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { ModalComentarioComponent } from './modal-comentario.component';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { AuditoriaService } from 'src/app/servicesAndUtils/auditoria.service';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';

describe('ModalComentarioComponent', () => {
  let component: ModalComentarioComponent;
  let fixture: ComponentFixture<ModalComentarioComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [ModalComentarioComponent],
      providers: [
        {
          provide: MdbModalRef,
          useValue: {
            close: () => {},
          },
        },
        {
          provide: ConfirmationService,
          useValue: {
            setConfirmationState: () => {},
            emitAddComentarioEvent: () => {},
          },
        },
        {
          provide: FirebaseService,
          useValue: {
            obtener: () => Promise.resolve([]),
            modificar: () => Promise.resolve(true),
          },
        },
        {
          provide: AlertsService,
          useValue: {
            showErrorMessage: () => {},
          },
        },
        {
          provide: AuditoriaService,
          useValue: { registrar: () => Promise.resolve() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ModalComentarioComponent);
    component = fixture.componentInstance;
    component.laburo = {
      id: '1',
      data: {
        comentario: '',
      },
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('sanitize (via confirmar)', () => {
    it('escapa tags HTML completas', async () => {
      component.laburoCopy = { id: '1', data: { comentario: '<script>alert("xss")</script>' } };
      const spy = spyOn<any>(component, 'sanitize').and.callThrough();
      // Llama a sanitize directamente para testear aislado
      const result = (component as any).sanitize('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('escapa entidades HTML (&#60;)', () => {
      const result = (component as any).sanitize('&#60;img src=x onerror=alert(1)&#62;');
      expect(result).not.toContain('<img');
    });

    it('texto plano pasa sin modificaciones', () => {
      const result = (component as any).sanitize('Comentario normal');
      expect(result).toBe('Comentario normal');
    });

    it('respeta el límite de 500 caracteres', () => {
      const largo = 'a'.repeat(600);
      const result = (component as any).sanitize(largo);
      expect(result.length).toBeLessThanOrEqual(500);
    });

    it('hace trim del texto', () => {
      const result = (component as any).sanitize('  hola  ');
      expect(result.startsWith(' ')).toBeFalse();
    });
  });
});

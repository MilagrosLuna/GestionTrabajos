import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalComentarioComponent } from './modal-comentario.component';

describe('ModalComentarioComponent', () => {
  let component: ModalComentarioComponent;
  let fixture: ComponentFixture<ModalComentarioComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalComentarioComponent]
    });
    fixture = TestBed.createComponent(ModalComentarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalComprobanteComponent } from './modal-comprobante.component';

describe('ModalComprobanteComponent', () => {
  let component: ModalComprobanteComponent;
  let fixture: ComponentFixture<ModalComprobanteComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalComprobanteComponent]
    });
    fixture = TestBed.createComponent(ModalComprobanteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

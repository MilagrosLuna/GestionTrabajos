import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiltroLaburosClientesComponent } from './filtro-laburos-clientes.component';

describe('FiltroLaburosClientesComponent', () => {
  let component: FiltroLaburosClientesComponent;
  let fixture: ComponentFixture<FiltroLaburosClientesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FiltroLaburosClientesComponent]
    });
    fixture = TestBed.createComponent(FiltroLaburosClientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

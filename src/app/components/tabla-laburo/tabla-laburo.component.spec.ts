import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaLaburoComponent } from './tabla-laburo.component';

describe('TablaLaburoComponent', () => {
  let component: TablaLaburoComponent;
  let fixture: ComponentFixture<TablaLaburoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TablaLaburoComponent]
    });
    fixture = TestBed.createComponent(TablaLaburoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

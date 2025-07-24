import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PtsComponent } from './pts.component';

describe('PtsComponent', () => {
  let component: PtsComponent;
  let fixture: ComponentFixture<PtsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PtsComponent]
    });
    fixture = TestBed.createComponent(PtsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

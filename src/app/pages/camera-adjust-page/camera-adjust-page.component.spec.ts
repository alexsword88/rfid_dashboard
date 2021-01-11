import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CameraAdjustPageComponent } from './camera-adjust-page.component';

describe('CameraAdjustPageComponent', () => {
  let component: CameraAdjustPageComponent;
  let fixture: ComponentFixture<CameraAdjustPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CameraAdjustPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CameraAdjustPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

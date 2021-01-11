import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TagConfigDialogComponent } from './tag-config-dialog.component';

describe('TagConfigDialogComponent', () => {
  let component: TagConfigDialogComponent;
  let fixture: ComponentFixture<TagConfigDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TagConfigDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TagConfigDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

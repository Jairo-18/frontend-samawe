import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YesNoDialohComponent } from './yes-no-dialoh.component';

describe('YesNoDialohComponent', () => {
  let component: YesNoDialohComponent;
  let fixture: ComponentFixture<YesNoDialohComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YesNoDialohComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(YesNoDialohComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

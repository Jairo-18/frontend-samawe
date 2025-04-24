import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseCardWithoutActionsComponent } from './base-card-without-actions.component';

describe('BaseCardWithoutActionsComponent', () => {
  let component: BaseCardWithoutActionsComponent;
  let fixture: ComponentFixture<BaseCardWithoutActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseCardWithoutActionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BaseCardWithoutActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

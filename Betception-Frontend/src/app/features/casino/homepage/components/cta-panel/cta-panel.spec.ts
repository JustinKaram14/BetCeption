import { TestBed } from '@angular/core/testing';
import { CtaPanelComponent } from './cta-panel';

describe('CtaPanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CtaPanelComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CtaPanelComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('emits enter event when enter output fires', () => {
    const fixture = TestBed.createComponent(CtaPanelComponent);
    const component = fixture.componentInstance;
    let emitted = false;
    component.enter.subscribe(() => (emitted = true));
    component.enter.emit();
    expect(emitted).toBeTrue();
  });

  it('emits rewards event when rewards output fires', () => {
    const fixture = TestBed.createComponent(CtaPanelComponent);
    const component = fixture.componentInstance;
    let emitted = false;
    component.rewards.subscribe(() => (emitted = true));
    component.rewards.emit();
    expect(emitted).toBeTrue();
  });
});

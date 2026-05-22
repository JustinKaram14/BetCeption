import { TestBed } from '@angular/core/testing';
import { ToastContainerComponent } from './toast-container';
import { ToastService } from './toast.service';

describe('ToastContainerComponent', () => {
  let service: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
    }).compileComponents();
    service = TestBed.inject(ToastService);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ToastContainerComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('returns error label for error toasts', () => {
    const fixture = TestBed.createComponent(ToastContainerComponent);
    const component = fixture.componentInstance;
    const label = component.labelFor({ id: '1', type: 'error', message: 'err', durationMs: 1000 });
    expect(label).toBeTruthy();
  });

  it('returns success label for success toasts', () => {
    const fixture = TestBed.createComponent(ToastContainerComponent);
    const component = fixture.componentInstance;
    const label = component.labelFor({ id: '2', type: 'success', message: 'ok', durationMs: 1000 });
    expect(label).toBeTruthy();
  });

  it('returns info label for info toasts', () => {
    const fixture = TestBed.createComponent(ToastContainerComponent);
    const component = fixture.componentInstance;
    const label = component.labelFor({ id: '3', type: 'info', message: 'info', durationMs: 1000 });
    expect(label).toBeTruthy();
  });

  it('prefers custom toast labels', () => {
    const fixture = TestBed.createComponent(ToastContainerComponent);
    const component = fixture.componentInstance;
    const label = component.labelFor({
      id: '4',
      type: 'achievement',
      message: 'First win',
      durationMs: 1000,
      label: 'Achievement freigeschaltet',
    });
    expect(label).toBe('Achievement freigeschaltet');
  });

  it('trackToast returns the toast id', () => {
    const fixture = TestBed.createComponent(ToastContainerComponent);
    const component = fixture.componentInstance;
    const id = component.trackToast(0, { id: 'abc', type: 'info', message: 'hi', durationMs: 1000 });
    expect(id).toBe('abc');
  });

  it('dismiss delegates to the toast service', () => {
    const fixture = TestBed.createComponent(ToastContainerComponent);
    const component = fixture.componentInstance;
    spyOn(service, 'dismiss');
    component.dismiss('xyz');
    expect(service.dismiss).toHaveBeenCalledWith('xyz');
  });
});

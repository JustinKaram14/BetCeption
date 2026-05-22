import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('shows an error toast', fakeAsync(() => {
    service.error('something went wrong');
    let toasts: any[] = [];
    service.messages$.subscribe((msgs) => (toasts = msgs));
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('error');
    expect(toasts[0].message).toBe('something went wrong');
    tick(6000);
  }));

  it('shows a success toast', fakeAsync(() => {
    service.success('all good');
    let toasts: any[] = [];
    service.messages$.subscribe((msgs) => (toasts = msgs));
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('success');
    tick(5000);
  }));

  it('shows an info toast', fakeAsync(() => {
    service.info('heads up');
    let toasts: any[] = [];
    service.messages$.subscribe((msgs) => (toasts = msgs));
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('info');
    tick(5000);
  }));

  it('shows typed game toasts with custom labels', fakeAsync(() => {
    service.achievement('First win', 1000, 'Achievement freigeschaltet');
    service.crate('Du hast eine Kiste erhalten', 1000, 'Level Up!');

    let toasts: any[] = [];
    service.messages$.subscribe((msgs) => (toasts = msgs));

    expect(toasts.map((toast) => toast.type)).toEqual(['achievement', 'crate']);
    expect(toasts[0].label).toBe('Achievement freigeschaltet');
    expect(toasts[1].label).toBe('Level Up!');
    tick(1001);
  }));

  it('dismisses a toast by id', () => {
    service.error('test error');
    let toasts: any[] = [];
    service.messages$.subscribe((msgs) => (toasts = msgs));
    const id = toasts[0].id;
    service.dismiss(id);
    service.messages$.subscribe((msgs) => (toasts = msgs));
    expect(toasts.length).toBe(0);
  });

  it('auto-dismisses toasts after duration', fakeAsync(() => {
    service.error('auto dismiss', 1000);
    let toasts: any[] = [];
    service.messages$.subscribe((msgs) => (toasts = msgs));
    expect(toasts.length).toBe(1);
    tick(1001);
    service.messages$.subscribe((msgs) => (toasts = msgs));
    expect(toasts.length).toBe(0);
  }));

  it('removes oldest toast when max toasts is exceeded', fakeAsync(() => {
    service.error('first', 60000);
    service.error('second', 60000);
    service.error('third', 60000);
    service.error('fourth', 60000);
    let toasts: any[] = [];
    service.messages$.subscribe((msgs) => (toasts = msgs));
    expect(toasts.length).toBe(3);
    expect(toasts[0].message).toBe('second');
    expect(toasts[2].message).toBe('fourth');
    tick(0);
  }));
});

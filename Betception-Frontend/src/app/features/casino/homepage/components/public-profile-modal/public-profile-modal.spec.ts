import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';
import { I18n } from '../../../../../core/i18n/i18n';
import { PublicProfileModalComponent } from './public-profile-modal';

describe('PublicProfileModalComponent', () => {
  let fixture: ComponentFixture<PublicProfileModalComponent>;
  let component: PublicProfileModalComponent;
  let apiMock: jasmine.SpyObj<BetceptionApi>;
  let i18n: I18n;

  const publicProfile = {
    user: {
      id: '2',
      username: 'trinity',
      balance: 2500,
      xp: 900,
      level: 4,
      avatarIcon: 'crown',
      avatarColor: 'gold',
      createdAt: '2025-01-01T00:00:00Z',
      levelProgress: {
        level: 4,
        xp: 900,
        currentLevelXp: 800,
        nextLevelXp: 1200,
        xpIntoLevel: 100,
        xpToNextLevel: 300,
        progressPercent: 25,
      },
      achievements: [
        {
          code: 'FIRST_ROUND',
          category: 'starter',
          titleKey: 'achievement.FIRST_ROUND.title',
          descriptionKey: 'achievement.FIRST_ROUND.description',
          icon: 'cards',
          target: 1,
          progress: 1,
          unlocked: true,
          unlockedAt: '2025-01-01T12:00:00Z',
          seen: true,
          rewardCoins: 25,
          secret: false,
          sortOrder: 1,
        },
        {
          code: 'SECRET_BLUE_PILL_SAVE',
          category: 'secret',
          titleKey: 'achievement.SECRET_BLUE_PILL_SAVE.title',
          descriptionKey: 'achievement.SECRET_BLUE_PILL_SAVE.description',
          icon: 'pill',
          target: 1,
          progress: 0,
          unlocked: false,
          unlockedAt: null,
          seen: true,
          rewardCoins: 500,
          secret: true,
          sortOrder: 28,
        },
      ],
      unseenAchievementCount: 0,
    },
  };

  beforeEach(async () => {
    apiMock = jasmine.createSpyObj<BetceptionApi>('BetceptionApi', ['getUserById']);
    apiMock.getUserById.and.returnValue(of(publicProfile as any));

    await TestBed.configureTestingModule({
      imports: [PublicProfileModalComponent],
      providers: [{ provide: BetceptionApi, useValue: apiMock }],
    }).compileComponents();

    i18n = TestBed.inject(I18n);
    i18n.setLanguage('de');

    fixture = TestBed.createComponent(PublicProfileModalComponent);
    fixture.componentRef.setInput('userId', '2');
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('loads and renders the selected public profile', () => {
    fixture.detectChanges();

    expect(apiMock.getUserById).toHaveBeenCalledWith('2');
    expect(component.profile?.username).toBe('trinity');
    expect(fixture.nativeElement.textContent).toContain('Öffentlich');
    expect(fixture.nativeElement.textContent).toContain('trinity');
    expect(fixture.nativeElement.textContent).toContain('2.500 Coins');
  });

  it('renders public achievements and hides secret descriptions while locked', () => {
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Achievements');
    expect(text).toContain('Erster Schritt');
    expect(text).toContain('Zweite Chance');
    expect(text).not.toContain('Geheimes Achievement');
    expect(text).not.toContain('blaue Pille eine verlorene Runde retten');
  });

  it('does not render private profile sections or sensitive fields', () => {
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('Kisten');
    expect(text).not.toContain('Transaktionen');
    expect(text).not.toContain('Passwort');
    expect(text).not.toContain('Account löschen');
    expect(text).not.toContain('Gefahrenzone');
    expect(text).not.toContain('passwordHash');
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('closes from overlay and close button', () => {
    fixture.detectChanges();
    const emitSpy = spyOn(component.closed, 'emit');

    fixture.debugElement.query(By.css('.public-profile-overlay')).triggerEventHandler('click', new MouseEvent('click'));
    expect(emitSpy).toHaveBeenCalledTimes(1);

    fixture.debugElement.query(By.css('.public-profile-close')).triggerEventHandler('click', new MouseEvent('click'));
    expect(emitSpy).toHaveBeenCalledTimes(2);
  });

  it('shows an error when loading fails', () => {
    apiMock.getUserById.and.returnValue(throwError(() => ({ error: { message: 'not found' } })));

    fixture.detectChanges();

    expect(component.error).toBe('not found');
    expect(fixture.nativeElement.textContent).toContain('not found');
  });
});

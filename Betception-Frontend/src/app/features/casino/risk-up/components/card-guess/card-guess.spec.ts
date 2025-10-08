import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardGuess } from './card-guess';

describe('CardGuess', () => {
  let component: CardGuess;
  let fixture: ComponentFixture<CardGuess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardGuess]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardGuess);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Chip8 } from './chip8';

describe('Chip8', () => {
  let component: Chip8;
  let fixture: ComponentFixture<Chip8>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Chip8],
    }).compileComponents();

    fixture = TestBed.createComponent(Chip8);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

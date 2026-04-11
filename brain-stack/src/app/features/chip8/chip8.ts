import { Component } from '@angular/core';
import { Canvas } from './components/canvas/canvas';

@Component({
  selector: 'app-chip8',
  standalone: true,
  imports: [Canvas],
  templateUrl: './chip8.html',
  styleUrl: './chip8.css',
})
export class Chip8 {}

import { Component } from '@angular/core';
import { ViewChild } from '@angular/core';
import { Canvas } from './components/canvas/canvas';

@Component({
  selector: 'app-chip8',
  standalone: true,
  imports: [Canvas],
  templateUrl: './chip8.html',
  styleUrl: './chip8.css',
})

export class Chip8 {
  @ViewChild(Canvas) canvas!: Canvas;

  selectedRom = 'IBMLogo.ch8'
  isPaused = false;

  onRomChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedRom = select.value;

    this.canvas.restart(this.selectedRom);
  }

  onRestart() {
    this.canvas.initAudio();
    this.canvas.restart(this.selectedRom);
  }

  togglePause() {
    this.canvas.initAudio();

    if(this.isPaused){
      this.canvas.startLoop();
    } else {
      this.canvas.pause();
    }

    this.isPaused = !this.isPaused;
  }
}

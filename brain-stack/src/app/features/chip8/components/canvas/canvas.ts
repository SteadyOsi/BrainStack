import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';

@Component({
  selector: 'app-canvas',
  standalone: true,
  templateUrl: './canvas.html',
  styleUrl: './canvas.css',
})
export class Canvas implements AfterViewInit {

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit() {
    const ctx = this.canvasRef.nativeElement.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 50, 50);
  }

}
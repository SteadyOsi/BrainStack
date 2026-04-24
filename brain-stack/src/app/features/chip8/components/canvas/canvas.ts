import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';

declare var Module: any;

@Component({
  selector: 'app-canvas',
  standalone: true,
  templateUrl: './canvas.html',
  styleUrl: './canvas.css',
})
export class Canvas implements AfterViewInit {

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;

  private cycle!: () => void;
  private getDisplay!: () => number;
  private updateTimers!: () => void;

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    console.log("Angular ready");

    if (Module.calledRun) {
      console.log("WASM already ready");
      this.start();
    } else {
      Module.onRuntimeInitialized = () => {
        console.log("WASM ready (Angular)");
        this.start();
      };
    }
  }

  async start() {
    this.setupWasm();
    this.loop();
  }

  setupWasm() {
    const init = Module.cwrap('chip8_init', null, []);

    this.cycle = Module.cwrap('chip8_cycle', null, []);
    this.getDisplay = Module.cwrap('chip8_get_display', 'number', []);
    this.updateTimers = Module.cwrap('chip8_update_timers', null, []);

    init();
  }

  loop = () => {
    console.log("loop ready");
    this.update();
    this.render();

    requestAnimationFrame(this.loop);
  }

  update() {
    for (let i = 0; i < 10; i++) {
      this.cycle();
    }

    this.updateTimers();
  }

  render() {
    const ptr = this.getDisplay();

    const display = new Uint8Array(
      Module.HEAPU8.buffer,
      ptr,
      64 * 32
    );

    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, 64, 32);

    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 64; x++) {
        if (display[y * 64 + x]) {
          this.ctx.fillStyle = 'white';
          this.ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    console.log(display.some(v => v !== 0));

  }

  // async loadRom() {
  //   const res = await fetch('roms/Jumping X and O [Harry Kleinberg, 1977].ch8');
  //   const buffer = await res.arrayBuffer();
  //   const bytes = new Uint8Array(buffer);

  //   const ptr = Module._malloc(bytes.length);
  //   Module.HEAPU8.set(bytes, ptr);

  //   const loadRom = Module.cwrap('chip8_load_rom', null, ['number', 'number']);
  //   loadRom(ptr, bytes.length);

  //   console.log("ROM size:", bytes.length);
  // }

  loadRomByName = async (romPath: string) => {
    const res = await fetch(`roms/${romPath}`);
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const ptr = Module._malloc(bytes.length);
    Module.HEAPU8.set(bytes, ptr);

    const loadRom = Module.cwrap('chip8_load_rom', null, ['number', 'number']);
    loadRom(ptr, bytes.length);
  }

  restart = async (romPath: string) => {
    const init = Module.cwrap('chip8_init', null, []);
    init();

    await this.loadRomByName(romPath);
  }

}
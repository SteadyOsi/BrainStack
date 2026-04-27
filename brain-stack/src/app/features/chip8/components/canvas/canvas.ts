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

  private setKey!: (key: number, value: number) => void;

  private keyMap: Record<string, number> = {
    '1': 0x1,
    '2': 0x2,
    '3': 0x3,
    '4': 0xC,

    'q': 0x4,
    'w': 0x5,
    'e': 0x6,
    'r': 0xD,

    'a': 0x7,
    's': 0x8,
    'd': 0x9,
    'f': 0xE,

    'z': 0xA,
    'x': 0x0,
    'c': 0xB,
    'v': 0xF
  };

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  
  private isRunning = false;

  private lastTime = 0;
  private timerAccumulator = 0;

  private readonly CPU_SPEED = 700; //Hz
  private readonly TIMER_RATE = 60; //Hz

  private getSoundTimer!: () => number;

  private audioCtx!: AudioContext;
  private oscillator!: OscillatorNode;
  private gainNode!: GainNode;

  private isBeeping = false;

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

    window.addEventListener('keydown', (e) => {
      const key = this.keyMap[e.key.toLowerCase()];
      if (key !== undefined) {
        this.setKey(key, 1);
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = this.keyMap[e.key.toLowerCase()];
      if (key !== undefined) {
        this.setKey(key, 0);
      }
    });
  }

  async start() {
    this.setupWasm();

    this.lastTime = performance.now();
    this.startLoop()
  }

  startLoop() {
    if (this.isRunning) return;

    this.isRunning = true;

    this.lastTime = performance.now();
    this.timerAccumulator = 0;

    requestAnimationFrame(this.loop);
  }

  pause() {
    this.isRunning = false;
  }

  setupWasm() {
    this.getSoundTimer = Module.cwrap('chip8_get_sound_timer', 'number', []);
    const init = Module.cwrap('chip8_init', null, []);

    this.setKey = Module.cwrap('chip8_set_key', null, ['number', 'number']);
    this.cycle = Module.cwrap('chip8_cycle', null, []);
    this.getDisplay = Module.cwrap('chip8_get_display', 'number', []);
    this.updateTimers = Module.cwrap('chip8_update_timers', null, []);

    init();
  }

  initAudio() {
    this.audioCtx = new AudioContext();

    this.oscillator = this.audioCtx.createOscillator();
    this.gainNode = this.audioCtx.createGain();

    this.oscillator.type = 'square';
    this.oscillator.frequency.value = 440;

    this.gainNode.gain.value = 0; // start silent

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);

    this.oscillator.start();
  }

  loop = (time: number) => {
    if (!this.isRunning) return;

    const delta = (time - this.lastTime) / 1000;
    this.lastTime = time;

    // run CPU cycle
    const cycles = Math.floor(this.CPU_SPEED * delta);
    for (let i = 0; i < cycles; i++) {
      this.cycle();
    }

    // Handle timers at 60Hz
    this.timerAccumulator += delta;
    const timerInterval = 1 / this.TIMER_RATE;

    while (this.timerAccumulator >= timerInterval){
      this.updateTimers();
      this.timerAccumulator -= timerInterval;
    }

    this.render();

    requestAnimationFrame(this.loop);
    this.handleSound();
  }

handleSound() {
  if (!this.getSoundTimer) return;

  const st = this.getSoundTimer();

  if (st > 0 && !this.isBeeping) {
    this.gainNode.gain.value = 0.1;
    this.isBeeping = true;
  }

  if (st === 0 && this.isBeeping) {
    this.gainNode.gain.value = 0;
    this.isBeeping = false;
  }
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

    // console.log(display.some(v => v !== 0));

  }

  loadRomByName = async (romPath: string) => {
    this.isRunning = false;

    // ALWAYS reset first
    const init = Module.cwrap('chip8_init', null, []);
    init();

    // Clear screen immediately (optional but good UX)
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(
      0,
      0,
      this.canvasRef.nativeElement.width,
      this.canvasRef.nativeElement.height
    );

    const res = await fetch(`roms/${romPath}`);
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const ptr = Module._malloc(bytes.length);
    Module.HEAPU8.set(bytes, ptr);

    const loadRom = Module.cwrap('chip8_load_rom', null, ['number', 'number']);
    loadRom(ptr, bytes.length);

    this.startLoop();
  }

  restart = async (romPath: string) => {

    // reset emulator
    const init = Module.cwrap('chip8_init', null, []);
    init();

    // load rom again 
    await this.loadRomByName(romPath);
  }

}
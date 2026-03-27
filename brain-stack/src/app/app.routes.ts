import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell'
import { Home } from './pages/home/home'
import { Chip8 } from './features/chip8/chip8'

export const routes: Routes = [
    {
        path: '',
        component: Shell,
        children: [
            {path: '', component: Home},
            {path:'chip8', component: Chip8}
        ]
    }
];

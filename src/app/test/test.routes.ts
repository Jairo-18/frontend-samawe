import { Routes } from '@angular/router';

export const testRoutes: Routes = [
  {
    path: 'color-palette',
    loadComponent: () =>
      import('./pages/color-palette/color-palette.component').then(
        (m) => m.ColorPaletteComponent
      )
  },
  {
    path: '',
    redirectTo: 'color-palette',
    pathMatch: 'full'
  }
];

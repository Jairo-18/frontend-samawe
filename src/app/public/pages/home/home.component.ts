import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  item: boolean | null = null; // Deberías usar "boolean | null" para permitir que el valor sea null
  array = new Array(100); // Crea un arreglo de 100 elementos

  trackByIndex(index: number, item: any): number {
    return index; // Usar el índice como clave de seguimiento
  }
}

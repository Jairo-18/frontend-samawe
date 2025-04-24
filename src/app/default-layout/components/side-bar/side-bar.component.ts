import {
  Component,
  EventEmitter,
  input,
  Input,
  InputSignal,
  Output
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { User } from '../../../auth/interfaces/login.interface';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [RouterLink, MatIcon, CommonModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss'
})
export class SideBarComponent {
  currentUser: InputSignal<User | undefined> = input<User>();
  @Input() isExpanded = true;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  toggle() {
    this.toggleSidebar.emit();
  }
  currentYear: number = new Date().getFullYear();

  menuItems = [
    {
      icon: 'attach_money',
      label: 'Resumen de ganancias',
      link: '/sales/earnings-sumary'
    },
    {
      icon: 'receipt_long',
      label: 'Facturas de Venta / Compra',
      link: '/invoices/see-invoices'
    },
    {
      icon: 'inventory_2',
      label: 'Productos / Servicios',
      link: '/products/see-products'
    },
    {
      icon: 'group',
      label: 'Gestionar Usuarios',
      link: '/organizational/see-users'
    }
  ];

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }
}

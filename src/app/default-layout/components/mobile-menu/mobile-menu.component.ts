import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { ItemInterface } from '../../../shared/interfaces/menu.interface';
import {
  MENU_CONST,
  ROLE_PERMISSIONS,
  ALLOWED_MODULES_BY_ROLE
} from '../../../shared/constants/menu.constants';

@Component({
  selector: 'app-mobile-menu',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './mobile-menu.component.html',
  styleUrl: './mobile-menu.component.scss'
})
export class MobileMenuComponent implements OnInit {
  @Input() userInfo?: UserInterface;

  private readonly _router: Router = inject(Router);
  menuItems: ItemInterface[] = [];

  ngOnInit(): void {
    this.filterMenuByRole();
  }

  private filterMenuByRole(): void {
    const roleName = this.userInfo?.roleType?.name?.toUpperCase();
    if (!roleName) {
      this.menuItems = [];
      return;
    }

    const allowedItems = ROLE_PERMISSIONS[roleName] || [];
    const allowedModules = ALLOWED_MODULES_BY_ROLE[roleName] || [];

    const allItems: ItemInterface[] = [];

    MENU_CONST.filter((module) =>
      allowedModules.includes(module.module)
    ).forEach((module) => {
      module.items.forEach((item) => {
        if (allowedItems.includes(item.name) && item.route) {
          if (!allItems.find((i) => i.name === item.name)) {
            allItems.push(item);
          }
        }
      });
    });

    // Define the specific items we want in the mobile menu and their preferred order
    const mobileMenuMapping = [
      { key: 'Clientes', label: 'Usuarios', icon: 'supervised_user_circle' },
      { key: 'Productos y Servicios', label: 'Servicios', icon: 'add_shopping_cart' },
      { key: 'Inicio', label: 'Inicio', icon: 'home' },
      { key: 'Facturas', label: 'Facturas', icon: 'notes' },
      { key: 'Settings', label: 'Ajustes', icon: 'settings', route: '/settings' }
    ];

    const finalItems: ItemInterface[] = [];

    mobileMenuMapping.forEach(mapping => {
      if (mapping.key === 'Settings') {
        finalItems.push({
          name: mapping.label,
          route: mapping.route!,
          icon: mapping.icon,
          order: 99,
          subItems: []
        });
      } else {
        const found = allItems.find(item => item.name === mapping.key);
        if (found) {
          finalItems.push({
            ...found,
            name: mapping.label // Use user's preferred label
          });
        }
      }
    });

    this.menuItems = finalItems;
  }
}

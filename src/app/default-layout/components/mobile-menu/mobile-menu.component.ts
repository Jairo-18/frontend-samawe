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
  menuItems: (ItemInterface | null)[] = [null, null, null, null, null];

  ngOnInit(): void {
    this.filterMenuByRole();
  }

  private filterMenuByRole(): void {
    const roleName = this.userInfo?.roleType?.name?.toUpperCase();
    if (!roleName) {
      this.menuItems = [null, null, null, null, null];
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
          if (!allItems.find((i) => i.name === item.name) && item.name !== 'Inicio') {
            allItems.push(item);
          }
        }
      });
    });

    // Slots: [0, 1, 2(Inicio), 3, 4(Settings)]
    const finalItems: (ItemInterface | null)[] = [null, null, null, null, null];

    // Fixed Items
    const homeItem = MENU_CONST.find(m => m.items.some(i => i.name === 'Inicio'))?.items.find(i => i.name === 'Inicio');
    if (homeItem) {
      finalItems[2] = { ...homeItem };
    }

    finalItems[4] = {
      name: 'Ajustes',
      route: '/settings',
      icon: 'settings',
      order: 99,
      subItems: []
    };

    if (roleName === 'CHEF' || roleName === 'MESERO') {
      const recetas = allItems.find(i => i.name === 'Recetas');
      const restaurante = allItems.find(i => i.name === 'Restaurante');
      if (recetas) finalItems[0] = recetas;
      if (restaurante) finalItems[3] = restaurante;
    } else {
      const prioritizedKeys = [
        { key: 'Clientes', label: 'Usuarios' },
        { key: 'Productos y Servicios', label: 'Servicios' },
        { key: 'Facturas', label: 'Facturas' }
      ];

      let dynamicSlotIndex = 0;
      prioritizedKeys.forEach(p => {
        const found = allItems.find(i => i.name === p.key);
        if (found) {
          const item = { ...found, name: p.label };
          if (dynamicSlotIndex === 0) finalItems[0] = item;
          else if (dynamicSlotIndex === 1) finalItems[1] = item;
          else if (dynamicSlotIndex === 2) finalItems[3] = item;
          dynamicSlotIndex++;
        }
      });
    }

    this.menuItems = finalItems;
  }
}

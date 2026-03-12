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
          // Avoid duplicates like 'Inicio' appearing multiple times if it's in multiple modules
          if (!allItems.find((i) => i.name === item.name)) {
            allItems.push(item);
          }
        }
      });
    });

    // Sort by order if available
    this.menuItems = allItems.sort((a, b) => a.order - b.order).slice(0, 5); // Limit to 5 for bottom bar
  }
}

import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { ItemInterface } from '../../../shared/interfaces/menu.interface';
import { NavItem } from '../../../shared/interfaces/navBar.interface';
import { NAVBAR_LOGGED_CONST } from '../../../shared/constants/navbar-logged.constants';
import {
  MENU_CONST,
  ROLE_PERMISSIONS,
  ALLOWED_MODULES_BY_ROLE
} from '../../../shared/constants/menu.constants';

@Component({
  selector: 'app-mobile-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    RouterLink,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './mobile-menu.component.html',
  styleUrl: './mobile-menu.component.scss'
})
export class MobileMenuComponent implements OnInit, OnDestroy {
  private readonly _router = inject(Router);
  private readonly _cdr = inject(ChangeDetectorRef);
  private _routerSub = new Subscription();

  @Input() userInfo?: UserInterface;

  currentUrl: string = '';
  menuItems: (ItemInterface | null)[] = [null, null, null, null, null];
  loggedMenuItems: NavItem[] = [];
  settingsMenuOpen: boolean = false;

  isItemActive(route: string | undefined): boolean {
    if (!route) return false;
    return this._router.isActive(route, {
      paths: 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored'
    });
  }

  get isAjustesActive(): boolean {
    return this.loggedMenuItems.some((item) => {
      const route = item.route ?? item.children?.[0]?.route;
      return route ? this.isItemActive(route) : false;
    });
  }

  ngOnInit(): void {
    this.currentUrl = this._router.url;
    this._routerSub = this._router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.currentUrl = e.urlAfterRedirects;
        this._cdr.detectChanges();
      });
    this.filterMenuByRole();
  }

  ngOnDestroy(): void {
    this._routerSub.unsubscribe();
  }

  toggleSettingsMenu(): void {
    this.settingsMenuOpen = !this.settingsMenuOpen;
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
          if (
            !allItems.find((i) => i.name === item.name) &&
            item.name !== 'Inicio'
          ) {
            allItems.push(item);
          }
        }
      });
    });

    const finalItems: (ItemInterface | null)[] = [null, null, null, null, null];

    const homeItem = MENU_CONST.find((m) =>
      m.items.some((i) => i.name === 'Inicio')
    )?.items.find((i) => i.name === 'Inicio');
    if (homeItem) {
      finalItems[2] = { ...homeItem };
    }

    finalItems[4] = {
      name: 'Ajustes',
      icon: 'settings',
      order: 99,
      subItems: []
    };

    if (roleName === 'ADMINISTRADOR' || roleName === 'RECEPCIONISTA') {
      const usuarios = allItems.find((i) => i.name === 'Clientes');
      const servicios = allItems.find(
        (i) => i.name === 'Productos y Servicios'
      );
      const facturas = allItems.find((i) => i.name === 'Facturas');
      if (usuarios) finalItems[0] = { ...usuarios, name: 'Clientes' };
      if (servicios) finalItems[1] = { ...servicios, name: 'Servicios' };
      if (facturas) finalItems[3] = facturas;
    } else if (roleName === 'CHEF' || roleName === 'MESERO') {
      const menu = allItems.find((i) => i.name === 'Menú');
      const recetas = allItems.find((i) => i.name === 'Recetas');
      const restaurante = allItems.find((i) => i.name === 'Restaurante');
      if (menu) finalItems[0] = { ...menu, name: 'Menú' };
      if (recetas) finalItems[1] = recetas;
      if (restaurante) finalItems[3] = restaurante;
    }

    this.loggedMenuItems = NAVBAR_LOGGED_CONST[roleName] || [];
    this.menuItems = finalItems;
  }
}

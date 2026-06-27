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
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { ItemInterface } from '../../../shared/interfaces/menu.interface';
import { NavItem } from '../../../shared/interfaces/navBar.interface';
import { MOBILE_LOGGED_CONST } from '../../../shared/constants/mobile-logged.constants';
import {
  MENU_CONST,
  ROLE_PERMISSIONS,
  ALLOWED_MODULES_BY_ROLE
} from '../../../shared/constants/menu.constants';
import { LangService } from '../../../shared/services/lang.service';

@Component({
  selector: 'app-mobile-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    RouterLink,
    MatMenuModule,
    MatDividerModule,
    TranslateModule
  ],
  templateUrl: './mobile-menu.component.html',
  styleUrl: './mobile-menu.component.scss'
})
export class MobileMenuComponent implements OnInit, OnDestroy {
  private readonly _router: Router = inject(Router);
  private readonly _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  readonly langService: LangService = inject(LangService);
  private _routerSub = new Subscription();

  @Input() userInfo?: UserInterface;

  currentUrl: string = '';
  menuItems: (ItemInterface | null)[] = [null, null, null, null, null];
  loggedMenuItems: NavItem[] = [];
  /** Sub-vistas de facturación mostradas en el popup del slot 'Facturación'. */
  invoicingItems: NavItem[] = [];
  settingsMenuOpen: boolean = false;
  invoicingMenuOpen: boolean = false;

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

  get isFacturacionActive(): boolean {
    return this.invoicingItems.some((item) =>
      item.route ? this.isItemActive(item.route) : false
    );
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
    if (this.settingsMenuOpen) this.invoicingMenuOpen = false;
  }

  toggleInvoicingMenu(): void {
    this.invoicingMenuOpen = !this.invoicingMenuOpen;
    if (this.invoicingMenuOpen) this.settingsMenuOpen = false;
  }

  private filterMenuByRole(): void {
    const roleCode = this.userInfo?.roleType?.code;
    if (!roleCode) {
      this.menuItems = [null, null, null, null, null];
      return;
    }

    const allowedItems = ROLE_PERMISSIONS[roleCode] || [];
    const allowedModules = ALLOWED_MODULES_BY_ROLE[roleCode] || [];

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
      finalItems[2] = { ...homeItem, titleKey: 'sidebar.home' };
    }

    finalItems[4] = {
      name: 'Ajustes',
      titleKey: 'service_and_product.mobile_menu.settings',
      icon: 'settings',
      order: 99,
      subItems: []
    };

    if (
      roleCode === 'ADMIN' ||
      roleCode === 'SUPERADMIN' ||
      roleCode === 'EMP'
    ) {
      const usuarios = allItems.find((i) => i.name === 'Clientes');
      const servicios = allItems.find(
        (i) => i.name === 'Productos y Servicios'
      );
      // Facturación es un grupo de 4 vistas. En móvil el slot 4 abre un popup
      // con las 4 (igual que Ajustes), si el rol tiene permiso de facturación.
      const canInvoices = allowedItems.includes('Facturas de venta');
      this.invoicingItems = canInvoices
        ? [
            // {
            //   title: 'sidebar.invoices_electronic',
            //   route: '/invoice/invoices/electronic',
            //   icon: 'receipt_long'
            // },
            {
              title: 'sidebar.invoices_sales',
              route: '/invoice/invoices/sales',
              icon: 'point_of_sale'
            },
            {
              title: 'sidebar.invoices_purchases',
              route: '/invoice/invoices/purchases',
              icon: 'shopping_cart'
            },
            {
              title: 'sidebar.invoices_quotes',
              route: '/invoice/invoices/quotes',
              icon: 'request_quote'
            }
          ]
        : [];
      const facturas: ItemInterface | undefined = canInvoices
        ? {
            name: 'Facturación',
            titleKey: 'sidebar.invoices_group',
            icon: 'description',
            route: '',
            order: 0,
            subItems: []
          }
        : undefined;
      if (usuarios)
        finalItems[0] = {
          ...usuarios,
          name: 'Clientes',
          titleKey: 'sidebar.clients'
        };
      if (servicios)
        finalItems[1] = {
          ...servicios,
          name: 'Servicios',
          titleKey: 'sidebar.services'
        };
      if (facturas) finalItems[3] = facturas;
    } else if (roleCode === 'CHE' || roleCode === 'MES') {
      const menu = allItems.find((i) => i.name === 'Menú');
      const recetas = allItems.find((i) => i.name === 'Recetas');
      const restaurante = allItems.find((i) => i.name === 'Restaurante');
      if (menu)
        finalItems[0] = {
          ...menu,
          name: 'Menú',
          titleKey: 'sidebar.menu_item'
        };
      if (recetas) finalItems[1] = { ...recetas, titleKey: 'sidebar.recipes' };
      if (restaurante)
        finalItems[3] = { ...restaurante, titleKey: 'sidebar.restaurant' };
    }

    this.loggedMenuItems = MOBILE_LOGGED_CONST[roleCode || ''] || [];
    this.menuItems = finalItems;
  }
}

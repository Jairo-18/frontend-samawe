import { MenuInterface } from '../interfaces/menu.interface';
export const MENU_CONST: MenuInterface[] = [
  {
    module: 'Panel de Recepcionista',
    moduleKey: 'sidebar.module_receptionist',
    icon: 'view_list',
    order: 1,
    items: [
      {
        name: 'Inicio',
        titleKey: 'sidebar.home',
        route: '/home',
        icon: 'home',
        order: 1,
        subItems: []
      },
      {
        name: 'Clientes',
        titleKey: 'sidebar.clients',
        route: '/organizational/users/list',
        icon: 'supervised_user_circle',
        order: 2,
        subItems: []
      },
      {
        name: 'Productos y Servicios',
        titleKey: 'sidebar.products_services',
        route: '/service-and-product/general',
        icon: 'add_shopping_cart',
        order: 3,
        subItems: []
      },
      {
        name: 'Menú',
        titleKey: 'sidebar.menu_item',
        route: '/menus/general',
        icon: 'restaurant_menu',
        order: 4,
        subItems: []
      },
      {
        name: 'Recetas',
        titleKey: 'sidebar.recipes',
        route: '/recipes/general',
        icon: 'menu_book',
        order: 5,
        subItems: []
      },
      {
        name: 'Restaurante',
        titleKey: 'sidebar.restaurant',
        route: '/recipes/restaurant-order',
        icon: 'restaurant',
        order: 6,
        subItems: []
      },
      {
        name: 'Facturación',
        titleKey: 'sidebar.invoices_group',
        icon: 'description',
        order: 7,
        subItems: [
          // {
          //   name: 'Facturación electrónica',
          //   titleKey: 'sidebar.invoices_electronic',
          //   route: '/invoice/invoices/electronic',
          //   icon: 'receipt_long'
          // },
          {
            name: 'Facturas de venta',
            titleKey: 'sidebar.invoices_sales',
            route: '/invoice/invoices/sales',
            icon: 'point_of_sale'
          },
          {
            name: 'Facturas de compra',
            titleKey: 'sidebar.invoices_purchases',
            route: '/invoice/invoices/purchases',
            icon: 'shopping_cart'
          },
          {
            name: 'Cotizaciones',
            titleKey: 'sidebar.invoices_quotes',
            route: '/invoice/invoices/quotes',
            icon: 'request_quote'
          }
        ]
      },
      {
        name: 'Reportes / Ganancias',
        titleKey: 'sidebar.reports',
        route: '/sales/earnings-sumary',
        icon: 'attach_money',
        order: 8,
        subItems: []
      },
      {
        name: 'Notas de versión',
        titleKey: 'sidebar.release_notes',
        route: '/release-notes',
        icon: 'new_releases',
        order: 9,
        subItems: []
      }
    ]
  },
  {
    module: 'Panel de Chef / Mesero',
    moduleKey: 'sidebar.module_chef',
    icon: 'room_service',
    order: 2,
    items: [
      {
        name: 'Inicio',
        titleKey: 'sidebar.home',
        route: '/home',
        icon: 'home',
        order: 1,
        subItems: []
      },
      {
        name: 'Menú',
        titleKey: 'sidebar.menu_item',
        route: '/menus/general',
        icon: 'restaurant_menu',
        order: 2,
        subItems: []
      },
      {
        name: 'Recetas',
        titleKey: 'sidebar.recipes',
        route: '/recipes/general',
        icon: 'menu_book',
        order: 3,
        subItems: []
      },
      {
        name: 'Restaurante',
        titleKey: 'sidebar.restaurant',
        route: '/recipes/restaurant-order',
        icon: 'restaurant',
        order: 3,
        subItems: []
      },
      {
        name: 'Facturación',
        titleKey: 'sidebar.invoices_group',
        icon: 'description',
        order: 4,
        subItems: [
          {
            name: 'Facturación electrónica',
            titleKey: 'sidebar.invoices_electronic',
            route: '/invoice/invoices/electronic',
            icon: 'receipt_long'
          }
        ]
      },
      {
        name: 'Notas de versión',
        titleKey: 'sidebar.release_notes',
        route: '/release-notes',
        icon: 'new_releases',
        order: 5,
        subItems: []
      }
    ]
  },
  {
    module: 'Panel de Administrador',
    moduleKey: 'sidebar.module_admin',
    icon: 'work',
    order: 3,
    items: [
      {
        name: 'Gestión',
        titleKey: 'sidebar.management',
        route: '/organizational/types/manage',
        icon: 'category',
        order: 1
      },
      {
        name: 'Aplicación',
        titleKey: 'sidebar.application',
        route: '/organizational/application',
        icon: 'settings',
        order: 2
      }
    ]
  }
];
const ADMIN_ITEMS = [
  'Clientes',
  'Productos y Servicios',
  'Recetas',
  'Menú',
  'Gestión',
  'Aplicación',
  'Facturación',
  'Facturación electrónica',
  'Facturas de venta',
  'Facturas de compra',
  'Cotizaciones',
  'Reportes / Ganancias',
  'Inicio',
  'Restaurante',
  'Notas de versión'
];
const RECEPTIONIST_ITEMS = [
  'Clientes',
  'Productos y Servicios',
  'Recetas',
  'Menú',
  'Facturación',
  'Facturación electrónica',
  'Facturas de venta',
  'Facturas de compra',
  'Cotizaciones',
  'Reportes / Ganancias',
  'Inicio',
  'Restaurante',
  'Notas de versión'
];
const KITCHEN_ITEMS = [
  'Recetas',
  'Menú',
  'Inicio',
  'Restaurante',
  // Chef y mesero solo acceden a la vista de facturación electrónica
  // (consulta); el resto de vistas de facturación siguen siendo de
  // administrador y recepcionista.
  'Facturación',
  'Facturación electrónica',
  'Notas de versión'
];

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  USER: [''],
  EMP: RECEPTIONIST_ITEMS,
  ADMIN: ADMIN_ITEMS,
  SUPERADMIN: ADMIN_ITEMS,
  CHE: KITCHEN_ITEMS,
  MES: KITCHEN_ITEMS
};

export const ALLOWED_MODULES_BY_ROLE: Record<string, string[]> = {
  USER: [],
  EMP: ['Panel de Administrador', 'Panel de Recepcionista'],
  CHE: ['Panel de Chef / Mesero'],
  MES: ['Panel de Chef / Mesero'],
  ADMIN: ['Panel de Administrador', 'Panel de Recepcionista'],
  SUPERADMIN: ['Panel de Administrador', 'Panel de Recepcionista']
};

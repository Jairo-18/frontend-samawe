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
        name: 'Facturas',
        titleKey: 'sidebar.invoices',
        route: '/invoice/invoices/list',
        icon: 'notes',
        order: 7,
        subItems: []
      },
      {
        name: 'Reportes / Ganancias',
        titleKey: 'sidebar.reports',
        route: '/sales/earnings-sumary',
        icon: 'attach_money',
        order: 8,
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
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  CLIENTE: [''],
  RECEPCIONISTA: [
    'Clientes',
    'Productos y Servicios',
    'Recetas',
    'Menú',
    'Facturas',
    'Reportes / Ganancias',
    'Inicio',
    'Restaurante'
  ],
  ADMINISTRADOR: [
    'Clientes',
    'Productos y Servicios',
    'Recetas',
    'Menú',
    'Gestión',
    'Aplicación',
    'Facturas',
    'Reportes / Ganancias',
    'Inicio',
    'Restaurante'
  ],
  CHEF: ['Recetas', 'Menú', 'Inicio', 'Restaurante'],
  MESERO: ['Recetas', 'Menú', 'Inicio', 'Restaurante']
};

export const ALLOWED_MODULES_BY_ROLE: Record<string, string[]> = {
  CLIENTE: [],
  RECEPCIONISTA: ['Panel de Administrador', 'Panel de Recepcionista'],
  CHEF: ['Panel de Chef / Mesero'],
  MESERO: ['Panel de Chef / Mesero'],
  ADMINISTRADOR: ['Panel de Administrador', 'Panel de Recepcionista']
};

import { MenuInterface } from '../interfaces/menu.interface';
export const MENU_CONST: MenuInterface[] = [
  {
    module: 'Panel de Recepcionista',
    icon: 'view_list',
    order: 1,
    items: [
      {
        name: 'Inicio',
        route: '/home',
        icon: 'home',
        order: 1,
        subItems: []
      },
      {
        name: 'Clientes',
        route: '/organizational/users/list',
        icon: 'supervised_user_circle',
        order: 2,
        subItems: []
      },
      {
        name: 'Productos y Servicios',
        route: '/service-and-product/general',
        icon: 'add_shopping_cart',
        order: 3,
        subItems: []
      },
      {
        name: 'Recetas',
        route: '/recipes/general',
        icon: 'menu_book',
        order: 4,
        subItems: []
      },
      {
        name: 'Restaurante',
        route: '/recipes/restaurant-order',
        icon: 'restaurant',
        order: 5,
        subItems: []
      },
      {
        name: 'Facturas',
        route: '/invoice/invoices/list',
        icon: 'notes',
        order: 6,
        subItems: []
      },
      {
        name: 'Reportes / Ganancias',
        route: '/sales/earnings-sumary',
        icon: 'attach_money',
        order: 7,
        subItems: []
      }
    ]
  },
  {
    module: 'Panel de Chef / Mesero',
    icon: 'room_service',
    order: 2,
    items: [
      {
        name: 'Inicio',
        route: '/home',
        icon: 'home',
        order: 1,
        subItems: []
      },
      {
        name: 'Recetas',
        route: '/recipes/general',
        icon: 'menu_book',
        order: 2,
        subItems: []
      },
      {
        name: 'Restaurante',
        route: '/recipes/restaurant-order',
        icon: 'restaurant',
        order: 3,
        subItems: []
      }
    ]
  },
  {
    module: 'Panel de Administrador',
    icon: 'work',
    order: 3,
    items: [
      {
        name: 'Gestión',
        route: '/organizational/types/manage',
        icon: 'category',
        order: 1
      },
      {
        name: 'Aplicación',
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
    'Facturas',
    'Reportes / Ganancias',
    'Inicio',
    'Restaurante'
  ],
  ADMINISTRADOR: [
    'Clientes',
    'Productos y Servicios',
    'Recetas',
    'Gestión',
    'Aplicación',
    'Facturas',
    'Reportes / Ganancias',
    'Inicio',
    'Restaurante'
  ],
  CHEF: ['Recetas', 'Inicio', 'Restaurante'],
  MESERO: ['Recetas', 'Inicio', 'Restaurante']
};

export const ALLOWED_MODULES_BY_ROLE: Record<string, string[]> = {
  CLIENTE: [],
  RECEPCIONISTA: ['Panel de Administrador', 'Panel de Recepcionista'],
  CHEF: ['Panel de Chef / Mesero'],
  MESERO: ['Panel de Chef / Mesero'],
  ADMINISTRADOR: ['Panel de Administrador', 'Panel de Recepcionista']
};

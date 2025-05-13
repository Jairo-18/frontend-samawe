import { MenuInterface } from '../interfaces/menu.interface';

export const MENU_CONST: MenuInterface[] = [
  {
    module: 'Panel de empleado',
    icon: 'view_list',
    order: 1,
    items: [
      {
        name: 'Gestión de usuarios',
        route: '',
        icon: 'supervised_user_circle',
        order: 1,
        subItems: [
          {
            name: 'Crear usuarios',
            icon: 'person_add',
            route: '/organizational/users/create'
          },
          {
            name: 'Ver usuarios',
            icon: 'person',
            route: '/organizational/users/list'
          }
        ]
      },
      {
        name: 'Gestión de productos',
        route: '',
        icon: 'widgets',
        order: 2,
        subItems: [
          {
            name: 'Crear productos',
            icon: 'add_shopping_cart',
            route: '/products/product/create'
          },
          {
            name: 'Ver productos',
            icon: 'shopping_car',
            route: '/products/product/list'
          }
        ]
      },
      {
        name: 'Facturación',
        route: '',
        icon: 'attach_money',
        order: 3,
        subItems: [
          {
            name: 'Crear facturas',
            icon: 'note_add',
            route: '/invoices/create-invoices'
          },
          {
            name: 'Ver facturas',
            icon: 'description',
            route: '/invoices/see-invoices'
          }
        ]
      }
    ]
  },
  {
    module: 'Panel de administrador',
    icon: 'work',
    order: 2,
    items: [
      {
        name: 'Usuarios',
        route: '/organizational/users/list',
        icon: 'person',
        order: 1
      }
    ]
  }
];

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  Usuario: [''],
  Empleado: [
    'Gestión de usuarios',
    'Crear usuarios',
    'Ver usuarios',
    'Gestión de productos',
    'Crear productos',
    'Ver productos',
    'Facturación',
    'Crear facturas',
    'Ver facturas',
    'Usuarios'
  ],
  Administrador: [
    'Gestión de usuarios',
    'Crear usuarios',
    'Ver usuarios',
    'Gestión de productos',
    'Crear productos',
    'Ver productos',
    'Facturación',
    'Crear facturas',
    'Ver facturas',
    'Usuarios'
  ]
};

// export const ROUTE_MAP: Record<string, string> = {
//   'Crear usuario': '/organizational/users/create',
//   'Ver usuarios': '/organizational/users/list',
//   'Crear productos': '/products/create-products',
//   'Ver productos': '/products/see-products',
//   'Crear facturas': '/invoices/create-invoices',
//   'Ver facturas': '/invoices/see-invoices',
//   Usuarios: '/organizational/users/list' // del panel de admin
// };

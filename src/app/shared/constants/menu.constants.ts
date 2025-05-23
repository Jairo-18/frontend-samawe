import { MenuInterface } from '../interfaces/menu.interface';

export const MENU_CONST: MenuInterface[] = [
  {
    module: 'Panel de empleado',
    icon: 'view_list',
    order: 1,
    items: [
      {
        name: 'Usuarios',
        route: '/organizational/users/list',
        icon: 'supervised_user_circle',
        order: 1,
        subItems: []
      },
      // {
      //   name: 'Productos',
      //   route: '/products/product/list',
      //   icon: 'add_shopping_cart',
      //   order: 2,
      //   subItems: []
      // },
      {
        name: 'Productos y servicios',
        route: '/service-and-product/general',
        icon: 'add_shopping_cart',
        order: 3,
        subItems: []
      }
    ]
  },
  {
    module: 'Panel de administrador',
    icon: 'work',
    order: 2,
    items: [
      {
        name: 'Gestión',
        route: '/organizational/types/manage',
        icon: 'category',
        order: 1
      }
    ]
  }
];

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  Usuario: [''],
  Empleado: ['Usuarios', 'Productos y servicios'],
  Administrador: ['Usuarios', 'Productos y servicios', 'Gestión']
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

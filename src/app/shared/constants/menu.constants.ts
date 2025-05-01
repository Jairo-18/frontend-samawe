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
            name: 'Crear usuario',
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
            route: '/products/create-products'
          },
          {
            name: 'Ver productos',
            icon: 'shopping_car',
            route: '/products/see-products'
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
  Empledo: ['profile', 'Mis Proyectos', 'Mis Tareas', 'Reportes', 'Calendario']
};

export const ROUTE_MAP: Record<string, string> = {
  'Mis Proyectos': '/organizational/summary',
  'Mis Tareas': '/general/tasks',
  Reportes: '/general/reports',
  Calendario: '/general/calendar',
  profile: '/profile'
};

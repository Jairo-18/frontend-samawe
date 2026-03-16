import { NavItem } from '../interfaces/navBar.interface';

export const NAVBAR_LOGGED_CONST: Record<string, NavItem[]> = {
  ADMINISTRADOR: [
    {
      title: 'Recetas',
      route: '/recipes/general',
      icon: 'menu_book'
    },
    {
      title: 'Restaurante',
      route: '/recipes/restaurant-order',
      icon: 'restaurant'
    },
    {
      title: 'Reportes / Ganancias',
      route: '/sales/earnings-sumary',
      icon: 'attach_money'
    },
    {
      title: 'Configuraciones',
      route: '/settings',
      icon: 'settings'
    }
  ],
  RECEPCIONISTA: [
    {
      title: 'Recetas',
      route: '/recipes/general',
      icon: 'menu_book'
    },
    {
      title: 'Restaurante',
      route: '/recipes/restaurant-order',
      icon: 'restaurant'
    },
    {
      title: 'Reportes / Ganancias',
      route: '/sales/earnings-sumary',
      icon: 'attach_money'
    },
    {
      title: 'Configuraciones',
      route: '/settings',
      icon: 'settings'
    }
  ],
  CHEF: [
    {
      title: 'Configuraciones',
      route: '/settings',
      icon: 'settings'
    }
  ],
  MESERO: [
    {
      title: 'Configuraciones',
      route: '/settings',
      icon: 'settings'
    }
  ],
  CLIENTE: [
    {
      title: 'Configuraciones',
      route: '/settings',
      icon: 'settings'
    }
  ]
};

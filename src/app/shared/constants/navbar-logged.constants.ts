import { NavItem } from '../interfaces/navBar.interface';

export const NAVBAR_LOGGED_CONST: Record<string, NavItem[]> = {
  ADMINISTRADOR: [
    {
      title: 'auth.profile',
      route: '/user/profile',
      icon: 'person'
    },
    {
      title: 'auth.recipes',
      route: '/recipes/general',
      icon: 'menu_book'
    },
    {
      title: 'auth.menu',
      route: '/menus/general',
      icon: 'restaurant_menu'
    },
    {
      title: 'auth.restaurant',
      route: '/recipes/restaurant-order',
      icon: 'restaurant'
    },
    {
      title: 'auth.reports',
      route: '/sales/earnings-sumary',
      icon: 'attach_money'
    },
    {
      title: 'auth.settings',
      route: '/settings',
      icon: 'settings'
    }
  ],
  RECEPCIONISTA: [
    {
      title: 'auth.profile',
      route: '/user/profile',
      icon: 'person'
    },
    {
      title: 'auth.recipes',
      route: '/recipes/general',
      icon: 'menu_book'
    },
    {
      title: 'auth.menu',
      route: '/menus/general',
      icon: 'restaurant_menu'
    },
    {
      title: 'auth.restaurant',
      route: '/recipes/restaurant-order',
      icon: 'restaurant'
    },
    {
      title: 'auth.reports',
      route: '/sales/earnings-sumary',
      icon: 'attach_money'
    },
    {
      title: 'auth.settings',
      route: '/settings',
      icon: 'settings'
    }
  ],
  CHEF: [
    {
      title: 'auth.profile',
      route: '/user/profile',
      icon: 'person'
    },
    {
      title: 'auth.settings',
      route: '/settings',
      icon: 'settings'
    }
  ],
  MESERO: [
    {
      title: 'auth.profile',
      route: '/user/profile',
      icon: 'person'
    },
    {
      title: 'auth.settings',
      route: '/settings',
      icon: 'settings'
    }
  ],
  CLIENTE: [
    {
      title: 'auth.profile',
      route: '/user/profile',
      icon: 'person'
    },
    {
      title: 'auth.settings',
      route: '/settings',
      icon: 'settings'
    }
  ]
};

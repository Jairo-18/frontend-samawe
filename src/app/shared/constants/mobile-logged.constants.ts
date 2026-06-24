import { NavItem } from '../interfaces/navBar.interface';

export const MOBILE_LOGGED_CONST: Record<string, NavItem[]> = {
  ADMIN: [
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
      title: 'sidebar.release_notes',
      route: '/release-notes',
      icon: 'new_releases'
    },
    {
      title: 'auth.settings',
      route: '/settings',
      icon: 'settings'
    }
  ],
  SUPERADMIN: [
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
      title: 'sidebar.release_notes',
      route: '/release-notes',
      icon: 'new_releases'
    },
    {
      title: 'auth.settings',
      route: '/settings',
      icon: 'settings'
    }
  ],
  EMP: [
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
      title: 'sidebar.release_notes',
      route: '/release-notes',
      icon: 'new_releases'
    },
    {
      title: 'auth.settings',
      route: '/settings',
      icon: 'settings'
    }
  ],
  CHE: [
    {
      title: 'sidebar.release_notes',
      route: '/release-notes',
      icon: 'new_releases'
    },
    {
      title: 'auth.settings',
      route: '/settings',
      icon: 'settings'
    }
  ],
  MES: [
    {
      title: 'sidebar.release_notes',
      route: '/release-notes',
      icon: 'new_releases'
    },
    {
      title: 'auth.settings',
      route: '/settings',
      icon: 'settings'
    }
  ]
};

import { NavItem } from '../interfaces/navBar.interface';

const COMMON_LOGGED_ITEMS: NavItem[] = [
  {
    title: 'auth.profile',
    route: 'user/profile',
    icon: 'person'
  },
  {
    title: 'auth.settings',
    route: 'settings',
    icon: 'settings'
  }
];

export const NAVBAR_LOGGED_CONST: Record<string, NavItem[]> = {
  ADMIN: COMMON_LOGGED_ITEMS,
  SUPERADMIN: COMMON_LOGGED_ITEMS,
  ADMINISTRADOR: COMMON_LOGGED_ITEMS,
  'SUPER ADMINISTRADOR': COMMON_LOGGED_ITEMS,
  EMP: COMMON_LOGGED_ITEMS,
  RECEPCIONISTA: COMMON_LOGGED_ITEMS,
  CHE: COMMON_LOGGED_ITEMS,
  CHEF: COMMON_LOGGED_ITEMS,
  MES: COMMON_LOGGED_ITEMS,
  MESERO: COMMON_LOGGED_ITEMS,
  USER: COMMON_LOGGED_ITEMS,
  CLIENTE: COMMON_LOGGED_ITEMS,
  PRO: COMMON_LOGGED_ITEMS,
  PROVEEDOR: COMMON_LOGGED_ITEMS
};

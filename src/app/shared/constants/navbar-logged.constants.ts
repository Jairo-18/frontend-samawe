import { NavItem } from '../interfaces/navBar.interface';

const PROFILE_ITEM: NavItem = {
  title: 'auth.profile',
  route: 'user/profile',
  icon: 'person'
};

/** Personal: perfil y configuración (que hace de atajo a la gestión). */
const COMMON_LOGGED_ITEMS: NavItem[] = [
  PROFILE_ITEM,
  {
    title: 'auth.settings',
    route: 'settings',
    icon: 'settings'
  }
];

/**
 * Clientes y proveedores: solo perfil. "Configuración" solo listaba Perfil y
 * Cerrar sesión, que ya están en este menú y en el propio perfil.
 */
const CLIENT_LOGGED_ITEMS: NavItem[] = [PROFILE_ITEM];

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
  USER: CLIENT_LOGGED_ITEMS,
  CLIENTE: CLIENT_LOGGED_ITEMS,
  PRO: CLIENT_LOGGED_ITEMS,
  PROVEEDOR: CLIENT_LOGGED_ITEMS
};

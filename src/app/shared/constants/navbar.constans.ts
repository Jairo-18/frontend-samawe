import { NavItem } from '../interfaces/navBar.interface';

export const NAVBAR_CONST: NavItem[] = [
  {
    title: 'INICIO',
    route: '/home',
    icon: 'home'
  },
  {
    title: 'ALOJAMIENTO',
    route: '/accommodation',
    icon: 'hotel'
  },
  {
    title: 'GASTRONOMÍA',
    route: '/gastronomy',
    icon: 'restaurant'
  },
  {
    title: 'SOBRE NOSOTROS',
    route: '/about-us',
    icon: 'groups'
  },
  {
    title: 'CÓMO LLEGAR',
    route: '/how-to-arrive',
    icon: 'map'
  },
  {
    title: 'BLOG',
    route: '/blog',
    icon: 'article'
  },
  {
    title: 'RESERVAR',
    route: '/reservations',
    icon: 'event_available'
  },
  {
    title: 'INICIAR SESIÓN',
    route: '/auth/login',
    icon: 'login'
  }
];

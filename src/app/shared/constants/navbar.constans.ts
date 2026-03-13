import { NavItem } from '../interfaces/navBar.interface';

export const NAVBAR_CONST: NavItem[] = [
  {
    title: 'Inicio',
    route: '/',
    icon: 'home'
  },
  {
    title: 'Alojamiento',
    route: '/accommodation',
    icon: 'hotel'
  },
  {
    title: 'Gastronomía',
    route: '/gastronomy',
    icon: 'restaurant'
  },
  {
    title: 'Sobre Nosotros',
    route: '/about-us',
    icon: 'groups'
  },
  {
    title: 'Cómo llegar',
    route: '/how-to-arrive',
    icon: 'map'
  },
  {
    title: 'Blog',
    route: '/blog',
    icon: 'article'
  },
  {
    title: 'Reservar',
    route: '/reservations',
    icon: 'event_available'
  },
  {
    title: 'Iniciar Sesión',
    route: '/auth/login',
    icon: 'login'
  }
];

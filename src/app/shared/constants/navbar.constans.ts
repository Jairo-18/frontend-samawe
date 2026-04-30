import { NavItem } from '../interfaces/navBar.interface';

export const NAVBAR_CONST: NavItem[] = [
  {
    title: 'nav.home',
    route: '/home',
    icon: 'home'
  },
  {
    title: 'nav.accommodation',
    route: '/accommodation',
    icon: 'hotel'
  },
  {
    title: 'nav.gastronomy',
    route: '/gastronomy',
    icon: 'restaurant'
  },
  {
    title: 'nav.about_us',
    route: '/about-us',
    icon: 'groups'
  },
  {
    title: 'nav.how_to_arrive',
    route: '/how-to-arrive',
    icon: 'map'
  },
  {
    title: 'nav.blog',
    route: '/blog',
    icon: 'article'
  },
  {
    title: 'nav.reserve',
    route: '/reservations',
    icon: 'event_available'
  },
  {
    title: 'nav.login',
    route: '/auth/login',
    icon: 'login'
  }
];

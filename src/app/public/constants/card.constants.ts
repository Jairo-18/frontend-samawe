import { DashboardCard } from '../interface/card.interface';

const ADMIN_CODES = ['ADMIN', 'SUPERADMIN'];
const RECEPTIONIST_CODES = ['ADMIN', 'SUPERADMIN', 'EMP'];
const KITCHEN_CODES = ['ADMIN', 'SUPERADMIN', 'EMP', 'MES', 'CHE'];

export const DASHBOARD_CARDS: DashboardCard[] = [
  {
    icon: 'person',
    title: 'home.cards.clients.title',
    description: 'home.cards.clients.description',
    route: '/organizational/users/list',
    iconNext: 'navigate_next',
    allowedRoles: RECEPTIONIST_CODES
  },
  {
    icon: 'store',
    title: 'home.cards.products.title',
    description: 'home.cards.products.description',
    route: '/service-and-product/general',
    queryParams: { editProduct: true },
    iconNext: 'navigate_next',
    allowedRoles: RECEPTIONIST_CODES
  },
  {
    icon: 'hotel',
    title: 'home.cards.accommodations.title',
    description: 'home.cards.accommodations.description',
    route: '/service-and-product/general',
    queryParams: { editAccommodation: true },
    iconNext: 'navigate_next',
    allowedRoles: RECEPTIONIST_CODES
  },
  {
    icon: 'tour',
    title: 'home.cards.services.title',
    description: 'home.cards.services.description',
    route: '/service-and-product/general',
    queryParams: { editExcursion: true },
    iconNext: 'navigate_next',
    allowedRoles: RECEPTIONIST_CODES
  },
  {
    icon: 'restaurant_menu',
    title: 'home.cards.menu.title',
    description: 'home.cards.menu.description',
    route: '/menus/general',
    iconNext: 'navigate_next',
    allowedRoles: KITCHEN_CODES
  },
  {
    icon: 'restaurant',
    title: 'home.cards.recipes.title',
    description: 'home.cards.recipes.description',
    route: '/recipes/general',
    iconNext: 'navigate_next',
    allowedRoles: KITCHEN_CODES
  },
  {
    icon: 'restaurant_menu',
    title: 'home.cards.restaurant.title',
    description: 'home.cards.restaurant.description',
    route: '/recipes/restaurant-order',
    iconNext: 'navigate_next',
    allowedRoles: KITCHEN_CODES
  },
  {
    icon: 'note',
    title: 'home.cards.invoicing.title',
    description: 'home.cards.invoicing.description',
    route: '/invoice/invoices/list',
    iconNext: 'navigate_next',
    allowedRoles: RECEPTIONIST_CODES
  },
  {
    icon: 'attach_money',
    title: 'home.cards.reports.title',
    description: 'home.cards.reports.description',
    route: '/sales/earnings-sumary',
    iconNext: 'navigate_next',
    allowedRoles: RECEPTIONIST_CODES
  },
  {
    icon: 'settings',
    title: 'home.cards.management.title',
    description: 'home.cards.management.description',
    route: '/organizational/types/manage',
    iconNext: 'navigate_next',
    allowedRoles: ADMIN_CODES
  },
  {
    icon: 'apps',
    title: 'home.cards.application.title',
    description: 'home.cards.application.description',
    route: '/organizational/application',
    iconNext: 'navigate_next',
    allowedRoles: ADMIN_CODES
  }
];

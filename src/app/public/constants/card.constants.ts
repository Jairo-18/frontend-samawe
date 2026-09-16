import {
  DashboardActionGroup,
  DashboardCard
} from '../interface/card.interface';

const ADMIN_CODES = ['ADMIN', 'SUPERADMIN'];
const RECEPTIONIST_CODES = ['ADMIN', 'SUPERADMIN', 'EMP'];
const KITCHEN_CODES = ['ADMIN', 'SUPERADMIN', 'EMP', 'MES', 'CHE'];

/**
 * ─── Acciones de creación ──────────────────────────────────────────────────
 *
 * Cada una abre su formulario con el tipo o el rol ya elegido, usando query
 * params que la vista de destino atiende:
 *
 *  - `create=true`      → `see-invoices` abre el diálogo de crear; el TIPO lo
 *                         pone la propia vista (la ruta lleva su `category`).
 *  - `role=<code>`      → `create-or-edit-users` preselecciona el rol. Va por
 *                         CODE y no por id: los `roleTypeId` son UUID y
 *                         cambian entre bases.
 *  - `editProduct=true` → `service-and-product` abre el formulario en blanco.
 *                         (El nombre del parámetro viene de antes; `true`
 *                         significa "crear nuevo", un id significa "editar".)
 *
 * **El documento soporte no está aquí a propósito**: no se crea desde cero,
 * nace de una factura de compra que se emite a la DIAN.
 */
export const DASHBOARD_ACTION_GROUPS: DashboardActionGroup[] = [
  {
    title: 'home.groups.invoicing',
    actions: [
      {
        icon: 'receipt_long',
        title: 'home.actions.new_electronic',
        route: '/invoice/invoices/electronic',
        queryParams: { create: 'true' },
        allowedRoles: RECEPTIONIST_CODES
      },
      {
        icon: 'point_of_sale',
        title: 'home.actions.new_sale',
        route: '/invoice/invoices/sales',
        queryParams: { create: 'true' },
        allowedRoles: RECEPTIONIST_CODES
      },
      {
        icon: 'shopping_cart',
        title: 'home.actions.new_purchase',
        route: '/invoice/invoices/purchases',
        queryParams: { create: 'true' },
        allowedRoles: RECEPTIONIST_CODES
      },
      {
        icon: 'request_quote',
        title: 'home.actions.new_quote',
        route: '/invoice/invoices/quotes',
        queryParams: { create: 'true' },
        allowedRoles: RECEPTIONIST_CODES
      }
    ]
  },
  {
    title: 'home.groups.people',
    actions: [
      {
        icon: 'person_add',
        title: 'home.actions.new_client',
        route: '/organizational/users/create',
        queryParams: { role: 'USER' },
        allowedRoles: RECEPTIONIST_CODES
      },
      {
        icon: 'local_shipping',
        title: 'home.actions.new_supplier',
        route: '/organizational/users/create',
        queryParams: { role: 'PRO' },
        allowedRoles: RECEPTIONIST_CODES
      },
      {
        icon: 'support_agent',
        title: 'home.actions.new_receptionist',
        route: '/organizational/users/create',
        queryParams: { role: 'EMP' },
        allowedRoles: ADMIN_CODES
      },
      {
        icon: 'room_service',
        title: 'home.actions.new_waiter',
        route: '/organizational/users/create',
        queryParams: { role: 'MES' },
        allowedRoles: ADMIN_CODES
      },
      {
        icon: 'soup_kitchen',
        title: 'home.actions.new_chef',
        route: '/organizational/users/create',
        queryParams: { role: 'CHE' },
        allowedRoles: ADMIN_CODES
      }
    ]
  },
  {
    title: 'home.groups.catalog',
    actions: [
      {
        icon: 'inventory_2',
        title: 'home.actions.new_product',
        route: '/service-and-product/general',
        queryParams: { editProduct: 'true' },
        allowedRoles: RECEPTIONIST_CODES
      },
      {
        icon: 'cabin',
        title: 'home.actions.new_accommodation',
        route: '/service-and-product/general',
        queryParams: { editAccommodation: 'true' },
        allowedRoles: RECEPTIONIST_CODES
      },
      {
        icon: 'hiking',
        title: 'home.actions.new_excursion',
        route: '/service-and-product/general',
        queryParams: { editExcursion: 'true' },
        allowedRoles: RECEPTIONIST_CODES
      },
      {
        icon: 'menu_book',
        title: 'home.actions.new_recipe',
        route: '/recipes/general',
        allowedRoles: KITCHEN_CODES
      }
    ]
  }
];

/**
 * ─── Destinos ──────────────────────────────────────────────────────────────
 *
 * Vistas a las que se va a consultar o gestionar, no a crear. Antes estas
 * tarjetas mezclaban ambas cosas: "Productos" llevaba `editProduct: true`, o
 * sea que abría un formulario de creación aunque se leyera como navegación.
 * Ese enlace vive ahora en las acciones de arriba y esta lista solo navega.
 */
export const DASHBOARD_CARDS: DashboardCard[] = [
  {
    icon: 'group',
    title: 'home.cards.clients.title',
    description: 'home.cards.clients.description',
    route: '/organizational/users/list',
    iconNext: 'navigate_next',
    allowedRoles: RECEPTIONIST_CODES
  },
  {
    icon: 'inventory',
    title: 'home.cards.catalog.title',
    description: 'home.cards.catalog.description',
    route: '/service-and-product/general',
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
    icon: 'room_service',
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
    route: '/invoice/invoices/sales',
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
    icon: 'pin',
    title: 'home.cards.numbering.title',
    description: 'home.cards.numbering.description',
    route: '/organizational/numbering',
    iconNext: 'navigate_next',
    allowedRoles: ADMIN_CODES
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

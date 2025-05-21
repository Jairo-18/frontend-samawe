import { SearchField } from '../../shared/interfaces/search.interface';

export const searchFieldsProducts: SearchField[] = [
  {
    name: 'categoryType',
    label: 'Categoría',
    type: 'select',
    options: [],
    placeholder: 'Buscar por categoría'
  },
  {
    name: 'code',
    label: 'Código',
    type: 'text',
    placeholder: 'Buscar por código'
  },
  {
    name: 'name',
    label: 'Nombre de producto',
    type: 'text',
    placeholder: 'Buscar por nombre de producto'
  },
  {
    name: 'amount',
    label: 'Unidades',
    type: 'text',
    placeholder: 'Buscar por unidades'
  },
  {
    name: 'priceBuy',
    label: 'Precio de compra',
    type: 'text',
    placeholder: 'Buscar por precio de compra'
  },
  {
    name: 'priceSale',
    label: 'Precio de venta',
    type: 'text',
    placeholder: 'Buscar por precio de venta'
  }
];

export const searchFieldsAccommodations: SearchField[] = [
  {
    name: 'categoryType',
    label: 'Categoría',
    type: 'select',
    options: [],
    placeholder: 'Buscar por categoría'
  },
  {
    name: 'bedType',
    label: 'Camas',
    type: 'select',
    options: [],
    placeholder: 'Buscar por camas'
  },
  {
    name: 'stateType',
    label: 'Estado',
    type: 'select',
    options: [],
    placeholder: 'Buscar por estado'
  },
  {
    name: 'jacuzzi',
    label: 'Jacuzzi',
    type: 'select',
    options: [
      { value: true, label: 'Sí' },
      { value: false, label: 'No' }
    ],
    placeholder: 'Buscar por jacuzzi'
  },

  {
    name: 'code',
    label: 'Código',
    type: 'text',
    placeholder: 'Buscar por código'
  },
  {
    name: 'name',
    label: 'Nombre de producto',
    type: 'text',
    placeholder: 'Buscar por nombre de producto'
  },
  {
    name: 'amountPerson',
    label: 'Personas',
    type: 'text',
    placeholder: 'Buscar por personas'
  },
  {
    name: 'amountRoom',
    label: 'Habitaciones',
    type: 'text',
    placeholder: 'Buscar por habitaciones'
  },
  {
    name: 'amountBathroom',
    label: 'Baños',
    type: 'text',
    placeholder: 'Buscar por baños'
  },
  {
    name: 'priceBuy',
    label: 'Precio de compra',
    type: 'text',
    placeholder: 'Buscar por precio de compra'
  },
  {
    name: 'priceSale',
    label: 'Precio de venta',
    type: 'text',
    placeholder: 'Buscar por precio de venta'
  }
];

export const searchFieldsExcursions: SearchField[] = [
  {
    name: 'categoryType',
    label: 'Categoría',
    type: 'select',
    options: [],
    placeholder: 'Buscar por categoría'
  },

  {
    name: 'stateType',
    label: 'Estado',
    type: 'select',
    options: [],
    placeholder: 'Buscar por estado'
  },
  {
    name: 'code',
    label: 'Código',
    type: 'text',
    placeholder: 'Buscar por código'
  },
  {
    name: 'name',
    label: 'Nombre de producto',
    type: 'text',
    placeholder: 'Buscar por nombre de producto'
  },
  {
    name: 'amountPerson',
    label: 'Personas',
    type: 'text',
    placeholder: 'Buscar por personas'
  },

  {
    name: 'priceBuy',
    label: 'Precio de compra',
    type: 'text',
    placeholder: 'Buscar por precio de compra'
  },
  {
    name: 'priceSale',
    label: 'Precio de venta',
    type: 'text',
    placeholder: 'Buscar por precio de venta'
  }
];

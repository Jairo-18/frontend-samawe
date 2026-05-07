import { SearchField } from '../../shared/interfaces/search.interface';
export const searchFieldsProducts: SearchField[] = [
  {
    name: 'search',
    label: 'service_product.search.products_text',
    type: 'text',
    placeholder: ' '
  },
  {
    name: 'categoryType',
    label: 'service_product.search.category',
    type: 'select',
    options: [],
    placeholder: 'service_product.search.category_placeholder'
  },
  {
    name: 'isActive',
    label: 'service_product.search.status',
    type: 'select',
    options: [
      { value: true, label: 'service_product.search.status_active' },
      { value: false, label: 'service_product.search.status_inactive' }
    ],
    placeholder: 'service_product.search.status_placeholder'
  }
];
export const searchFieldsAccommodations: SearchField[] = [
  {
    name: 'search',
    label: 'service_product.search.accommodations_text',
    type: 'text',
    placeholder: ' '
  },
  {
    name: 'bedType',
    label: 'service_product.search.bed',
    type: 'select',
    options: [],
    placeholder: 'service_product.search.bed_placeholder'
  },
  {
    name: 'stateType',
    label: 'service_product.search.status',
    type: 'select',
    options: [],
    placeholder: 'service_product.search.state_placeholder'
  },
  {
    name: 'jacuzzi',
    label: 'service_product.search.jacuzzi',
    type: 'select',
    options: [
      { value: true, label: 'service_product.search.jacuzzi_yes' },
      { value: false, label: 'service_product.search.jacuzzi_no' }
    ],
    placeholder: 'service_product.search.jacuzzi_placeholder'
  }
];
export const searchFieldsExcursions: SearchField[] = [
  {
    name: 'search',
    label: 'service_product.search.excursions_text',
    type: 'text',
    placeholder: ' '
  },
  {
    name: 'categoryType',
    label: 'service_product.search.category',
    type: 'select',
    options: [],
    placeholder: 'service_product.search.category_placeholder'
  },
  {
    name: 'stateType',
    label: 'service_product.search.status',
    type: 'select',
    options: [],
    placeholder: 'service_product.search.state_placeholder'
  }
];

export interface MenuInterface {
  module: string;
  moduleKey?: string;
  icon: string;
  order: number;
  items: ItemInterface[];
}
export interface ItemInterface {
  name: string;
  titleKey?: string;
  route?: string;
  icon: string;
  order: number;
  subItems?: SubItemInterface[];
  isOpen?: boolean;
}
export interface SubItemInterface {
  name: string;
  titleKey?: string;
  icon: string;
  route: string;
}
export interface MenuItemSelectedInterface {
  moduleName: string;
  itemRoute: string;
}


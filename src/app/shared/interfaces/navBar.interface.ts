export interface NavItem {
  route?: string;
  icon?: string;
  title?: string;
  children?: NavItem[];
  exact?: boolean;
}


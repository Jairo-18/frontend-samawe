import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import {
  ItemInterface,
  MenuInterface
} from '../../../shared/interfaces/menu.interface';
import {
  MENU_CONST,
  ROLE_PERMISSIONS
} from '../../../shared/constants/menu.constants';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [
    NgClass,
    NgIf,
    MatButtonModule,
    MatIconModule,
    FontAwesomeModule,
    RouterLink,
    MatMenuModule,
    NgFor,
    MatTooltipModule,
    CommonModule
  ],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
  animations: [
    trigger('submenuState', [
      state('closed', style({ maxHeight: '0px', opacity: 0 })),
      state('open', style({ maxHeight: '500px', opacity: 1 })),
      transition('closed <=> open', [animate('0.3s ease-in-out')])
    ])
  ]
})
export class SideBarComponent implements OnInit, OnChanges {
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;
  @Input() userRole!: string;
  @Input() closeSideBar: boolean = false;
  @Output() collapsed: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() logout = new EventEmitter<void>();

  isCollapsed: boolean = true;
  currentRoute: string = '';
  menuWithItems: MenuInterface[] = [];
  itemSelected: string | null = null;
  moduleSelected: string | null = null;
  currentYear: number = new Date().getFullYear();
  openSubMenu: Record<string, boolean> = {};

  private readonly _router: Router = inject(Router);

  ngOnInit(): void {
    this.currentRoute = this._router.url;

    this._router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentRoute = this._router.url;
      });

    this.filterMenuByRole();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['closeSideBar'] && this.closeSideBar) {
      this.closeSideBarMethod();
    }
  }

  private filterMenuByRole(): void {
    const allowedItems = ROLE_PERMISSIONS[this.userRole] || [];

    this.menuWithItems = MENU_CONST.map((module) => ({
      ...module,
      items: module.items
        .map((item) => ({
          ...item,
          subItems: item.subItems?.filter((sub) =>
            allowedItems.includes(sub.name)
          )
        }))
        .filter(
          (item) =>
            allowedItems.includes(item.name) ||
            (item.subItems && item.subItems.length > 0)
        )
    })).filter((module) => module.items.length > 0);
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    if (this.isCollapsed) this.closeAllSubMenus();
    this.collapsed.emit(this.isCollapsed);
  }

  closeSideBarMethod() {
    this.isCollapsed = !this.isCollapsed;
    if (this.isCollapsed) this.closeAllSubMenus();
  }

  closeAllSubMenus() {
    this.openSubMenu = {};
  }

  toggleSubMenu(item: ItemInterface) {
    if (!this.isCollapsed) {
      this.openSubMenu[item.name] = !this.openSubMenu[item.name];
    }
  }

  getActiveElement(routeElement: string): boolean {
    return this.currentRoute.includes(routeElement);
  }

  closeMenu() {
    if (this.menuTrigger) {
      this.menuTrigger.closeMenu();
    }
  }
}

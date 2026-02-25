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
import { Router, RouterLink } from '@angular/router';
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
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { UserComplete } from '../../../organizational/interfaces/create.interface';
import { UsersService } from '../../../organizational/services/users.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
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
    CommonModule,
    LoaderComponent
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
  @Input() userRole?: UserInterface;
  @Input() closeSideBar: boolean = false;
  @Output() collapsed: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() logout = new EventEmitter<void>();
  private readonly _router: Router = inject(Router);
  private readonly _usersService: UsersService = inject(UsersService);
  isCollapsed: boolean = true;
  currentRoute: string = '';
  menuWithItems: MenuInterface[] = [];
  itemSelected: string | null = null;
  moduleSelected: string | null = null;
  currentYear: number = new Date().getFullYear();
  openSubMenu: Record<string, boolean> = {};
  userComplete?: UserComplete;
  isLoading: boolean = false;
  ngOnInit(): void {
    this.currentRoute = this._router.url;
    if (this.userRole?.userId) {
      this.isLoading = true;
      this._usersService.getUserEditPanel(this.userRole.userId).subscribe({
        next: (res) => {
          this.userComplete = res.data;
          this.filterMenuByRole();
          this.isLoading = false;
        },
        error: () => {
          this.menuWithItems = [];
          this.isLoading = false;
        }
      });
    } else {
      this.menuWithItems = [];
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['closeSideBar'] && this.closeSideBar) {
      this.closeSideBarMethod();
    }
  }
  private filterMenuByRole(): void {
    const roleName = this.userComplete?.roleType?.name;
    if (!roleName) {
      this.menuWithItems = [];
      return;
    }
    const allowedItems = ROLE_PERMISSIONS[roleName];
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
  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    if (this.isCollapsed) this.closeAllSubMenus();
    this.collapsed.emit(this.isCollapsed);
  }
  closeSideBarMethod(): void {
    this.isCollapsed = !this.isCollapsed;
    if (this.isCollapsed) this.closeAllSubMenus();
  }
  closeAllSubMenus(): void {
    this.openSubMenu = {};
  }
  toggleSubMenu(item: ItemInterface): void {
    if (!this.isCollapsed) {
      this.openSubMenu[item.name] = !this.openSubMenu[item.name];
    }
  }
  closeMenu(): void {
    if (this.menuTrigger) {
      this.menuTrigger.closeMenu();
    }
  }
  removeFocus(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    if (target) {
      target.blur();
    }
  }
  onItemClick(event: MouseEvent, item: ItemInterface): void {
    this.removeFocus(event);
    if (!this.isCollapsed) {
      this.toggleSubMenu(item);
    }
  }
}


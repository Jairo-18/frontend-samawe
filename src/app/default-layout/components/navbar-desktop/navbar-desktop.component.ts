import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { NavItem } from '../../../shared/interfaces/navBar.interface';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { ButtonLandingComponent } from '../../../shared/components/button-landing/button-landing.component';
import { CapitalizePipe } from '../../../shared/pipes/capitalize.pipe';
import { LangSwitcherComponent } from '../../../shared/components/lang-switcher/lang-switcher.component';

@Component({
  selector: 'app-navbar-desktop',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    CommonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    ButtonLandingComponent,
    CapitalizePipe,
    LangSwitcherComponent
  ],
  templateUrl: './navbar-desktop.component.html',
  styleUrls: ['./navbar-desktop.component.scss']
})
export class NavbarDesktopComponent {
  @Input() navBarItems: NavItem[] = [];
  @Input() loginItem?: NavItem;
  @Input() isLoggedUser: boolean = false;
  @Input() userInfo?: UserInterface;
  @Input() loggedMenuItems: NavItem[] = [];
  @Input() isScrolled: boolean = false;
  @Input() isScrollingDown: boolean = false;
  @Input() isPastHero: boolean = false;
  @Input() isHomePage: boolean = false;
  @Input() organizationalName: string = '';
  @Input() logoUrl: string = '';
  @Output() openMenu = new EventEmitter<void>();
  @Output() logoutEvent = new EventEmitter<void>();

  readonly exactOptions = { exact: false };
  readonly exactOptionsStrict = { exact: true };
}

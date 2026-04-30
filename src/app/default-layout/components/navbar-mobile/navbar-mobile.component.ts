import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { NavItem } from '../../../shared/interfaces/navBar.interface';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { ButtonLandingComponent } from '../../../shared/components/button-landing/button-landing.component';
import { CapitalizePipe } from '../../../shared/pipes/capitalize.pipe';
import { LangSwitcherComponent } from '../../../shared/components/lang-switcher/lang-switcher.component';

@Component({
  selector: 'app-navbar-mobile',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule,
    ButtonLandingComponent,
    CapitalizePipe,
    LangSwitcherComponent
  ],
  templateUrl: './navbar-mobile.component.html',
  styleUrls: ['./navbar-mobile.component.scss']
})
export class NavbarMobileComponent {
  @Input() navBarItems: NavItem[] = [];
  @Input() loginItem?: NavItem;
  @Input() isLoggedUser: boolean = false;
  @Input() userInfo?: UserInterface;
  @Input() loggedMenuItems: NavItem[] = [];
  @Input() organizationalName: string = '';
  @Input() logoUrl: string = '';
  @Input() isBrowser: boolean = false;
  @Output() closeMenu = new EventEmitter<void>();
  @Output() logoutEvent = new EventEmitter<void>();

  readonly exactOptions = { exact: false };
  readonly exactOptionsStrict = { exact: true };

  getInitials(userInfo: UserInterface): string {
    return (
      (userInfo.firstName?.[0] ?? '') + (userInfo.lastName?.[0] ?? '')
    ).toUpperCase();
  }
}

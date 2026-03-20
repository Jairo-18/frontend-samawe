import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';
import { SeeMenusComponent } from '../../components/see-menus/see-menus.component';
import { CreateOrEditMenuComponent } from '../../components/create-or-edit-menu/create-or-edit-menu.component';
import { MenuResponse } from '../../interfaces/menu.interface';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { LocalStorageService } from '../../../shared/services/localStorage.service';

@Component({
  selector: 'app-menu-general',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    SeeMenusComponent,
    CreateOrEditMenuComponent,
    BasePageComponent
  ],
  templateUrl: './menu-general.component.html',
  styleUrl: './menu-general.component.scss'
})
export class MenuGeneralComponent implements OnInit {
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;
  @ViewChild(SeeMenusComponent) seeMenusComponent!: SeeMenusComponent;
  @ViewChild(CreateOrEditMenuComponent)
  createOrEditComponent!: CreateOrEditMenuComponent;

  private readonly _localStorage = inject(LocalStorageService);

  currentMenu?: MenuResponse;
  isMesero: boolean = false;

  ngOnInit(): void {
    const userData = this._localStorage.getUserData();
    const role = userData?.roleType?.name?.toUpperCase()?.trim() || '';
    this.isMesero = role === 'MESERO';
  }

  onTabChange(idx: number): void {
    if (idx !== 1) {
      this.currentMenu = undefined;
      this.createOrEditComponent?.resetForm();
    }
  }

  onEditMenu(menu: MenuResponse): void {
    this.currentMenu = menu;
    this.tabGroup.selectedIndex = 1;
    this._goToTop();
  }

  onMenuSaved(): void {
    this.currentMenu = undefined;
    this.tabGroup.selectedIndex = 0;
    this.seeMenusComponent?.loadMenus();
  }

  onMenuCanceled(): void {
    this.currentMenu = undefined;
    this.tabGroup.selectedIndex = 0;
    this.seeMenusComponent?.loadMenus();
  }

  private _goToTop(): void {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

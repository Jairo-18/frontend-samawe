import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../../../organizational/services/application.service';
import { Organizational } from '../../../shared/interfaces/organizational.interface';
import { SectionHeaderComponent } from '../../components/section-header/section-header.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ReservationSectionComponent } from '../home/components/reservation-section/reservation-section.component';
import { CardMenuComponent } from '../../components/card-menu/card-menu.component';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';
import { SeoService } from '../../../shared/services/seo.service';
import { MenuService } from '../../../menus/services/menu.service';
import { MenuPublicListItem } from '../../../menus/interfaces/menu.interface';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-gastronomy',
  standalone: true,
  imports: [
    CommonModule,
    SectionHeaderComponent,
    LoaderComponent,
    ReservationSectionComponent,
    CardMenuComponent,
    TranslatedPipe,
    TranslateModule
  ],
  templateUrl: './gastronomy.component.html',
  styleUrl: './gastronomy.component.scss'
})
export class GastronomyComponent implements OnInit {
  private readonly _applicationService: ApplicationService = inject(ApplicationService);
  private readonly _seoService: SeoService = inject(SeoService);
  private readonly _menuService: MenuService = inject(MenuService);

  org: Organizational | null = null;

  menus: MenuPublicListItem[] = [];
  menusLoading: boolean = false;

  ngOnInit(): void {
    this._applicationService.currentOrg$.subscribe((org) => {
      if (org) {
        this.org = org;
        this._seoService.updatePage(org.gastronomyTitle, org.gastronomyDescription);
      }
    });
    this.loadMenus();
  }

  /** Sin paginación a propósito: la carta se ve entera de un vistazo, no a página. */
  loadMenus(): void {
    this.menusLoading = true;
    this._menuService.getPublicList({ page: 1, perPage: 100 }).subscribe({
      next: (res) => {
        this.menus = res.data;
        this.menusLoading = false;
      },
      error: () => {
        this.menusLoading = false;
      }
    });
  }

  getMedia(code: string): string {
    return (
      this.org?.medias?.find((m) => m.mediaType?.code === code)?.url ??
      'assets/images/notFound.avif'
    );
  }
}

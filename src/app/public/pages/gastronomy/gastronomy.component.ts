import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../../../organizational/services/application.service';
import { Organizational } from '../../../shared/interfaces/organizational.interface';
import { SectionHeaderComponent } from '../../components/section-header/section-header.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ReservationSectionComponent } from '../home/components/reservation-section/reservation-section.component';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';
import { SeoService } from '../../../shared/services/seo.service';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-gastronomy',
  standalone: true,
  imports: [
    CommonModule,
    SectionHeaderComponent,
    LoaderComponent,
    ReservationSectionComponent,
    TranslatedPipe,
    TranslateModule
  ],
  templateUrl: './gastronomy.component.html',
  styleUrl: './gastronomy.component.scss'
})
export class GastronomyComponent implements OnInit {
  private readonly _applicationService: ApplicationService = inject(ApplicationService);
  private readonly _seoService: SeoService = inject(SeoService);

  org: Organizational | null = null;

  ngOnInit(): void {
    this._applicationService.currentOrg$.subscribe((org) => {
      if (org) {
        this.org = org;
        this._seoService.updatePage(org.gastronomyTitle, org.gastronomyDescription);
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

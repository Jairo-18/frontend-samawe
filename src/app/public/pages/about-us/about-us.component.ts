import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../../../organizational/services/application.service';
import {
  CorporateValue,
  Organizational
} from '../../../shared/interfaces/organizational.interface';
import { SectionHeaderComponent } from '../../components/section-header/section-header.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ReservationSectionComponent } from '../home/components/reservation-section/reservation-section.component';
import { filter, switchMap, take } from 'rxjs';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';
import { SeoService } from '../../../shared/services/seo.service';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [
    CommonModule,
    SectionHeaderComponent,
    LoaderComponent,
    ReservationSectionComponent,
    TranslatedPipe,
    TranslateModule
  ],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.scss'
})
export class AboutUsComponent implements OnInit {
  private readonly _applicationService: ApplicationService = inject(ApplicationService);
  private readonly _seoService: SeoService = inject(SeoService);

  org: Organizational | null = null;
  corporateValues: CorporateValue[] = [];

  ngOnInit(): void {
    this._applicationService.currentOrg$.subscribe((org) => {
      if (org) {
        this.org = org;
        this._seoService.updatePage(org.aboutUsTitle, org.aboutUsDescription);
      }
    });

    this._applicationService.currentOrg$
      .pipe(
        filter((org) => !!org),
        take(1),
        switchMap((org) =>
          this._applicationService.getCorporateValues(org!.organizationalId)
        )
      )
      .subscribe((res) => {
        this.corporateValues = res.data ?? [];
      });
  }

  getMedia(code: string): string {
    return (
      this.org?.medias?.find((m) => m.mediaType?.code === code)?.url ??
      'assets/images/notFound.avif'
    );
  }
}

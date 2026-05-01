import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../../../organizational/services/application.service';
import { Organizational } from '../../../shared/interfaces/organizational.interface';
import { SeoService } from '../../../shared/services/seo.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ReservationSectionComponent } from '../home/components/reservation-section/reservation-section.component';
import { HowToArriveSectionComponent } from '../home/components/how-to-arrive-section/how-to-arrive-section.component';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-how-to-arrive',
  standalone: true,
  imports: [
    CommonModule,
    LoaderComponent,
    ReservationSectionComponent,
    HowToArriveSectionComponent,
    TranslateModule
  ],
  templateUrl: './how-to-arrive.component.html',
  styleUrl: './how-to-arrive.component.scss'
})
export class HowToArriveComponent implements OnInit {
  private readonly _applicationService: ApplicationService = inject(ApplicationService);
  private readonly _seoService: SeoService = inject(SeoService);

  org: Organizational | null = null;

  ngOnInit(): void {
    this._applicationService.currentOrg$.subscribe((org) => {
      if (org) {
        this.org = org;
        this._seoService.updatePage(org.name, org.howToArriveDescription);
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

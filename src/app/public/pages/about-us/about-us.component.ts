import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../../../organizational/services/application.service';
import { Organizational } from '../../../shared/interfaces/organizational.interface';
import { SectionHeaderComponent } from '../../components/section-header/section-header.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ReservationSectionComponent } from '../home/components/reservation-section/reservation-section.component';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [
    CommonModule,
    SectionHeaderComponent,
    LoaderComponent,
    ReservationSectionComponent
  ],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.scss'
})
export class AboutUsComponent implements OnInit {
  private readonly _applicationService: ApplicationService =
    inject(ApplicationService);

  org: Organizational | null = null;

  ngOnInit(): void {
    this._applicationService.currentOrg$.subscribe((org) => {
      if (org) this.org = org;
    });
  }

  getMedia(code: string): string {
    return (
      this.org?.medias?.find((m) => m.mediaType?.code === code)?.url ??
      'assets/images/notFound.avif'
    );
  }
}

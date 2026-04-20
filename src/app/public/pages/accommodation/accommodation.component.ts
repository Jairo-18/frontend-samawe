import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AccommodationsService } from '../../../service-and-product/services/accommodations.service';
import { PublicAccommodationListItem } from '../../../service-and-product/interface/accommodation.interface';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { CardAccommodationComponent } from '../../components/card-accommodation/card-accommodation.component';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ApplicationService } from '../../../organizational/services/application.service';
import { Organizational } from '../../../shared/interfaces/organizational.interface';

@Component({
  selector: 'app-accommodation',
  standalone: true,
  imports: [
    CommonModule,
    CardAccommodationComponent,
    MatPaginatorModule,
    LoaderComponent
  ],
  templateUrl: './accommodation.component.html',
  styleUrl: './accommodation.component.scss'
})
export class AccommodationComponent implements OnInit {
  private readonly _accommodationsService: AccommodationsService = inject(
    AccommodationsService
  );
  private readonly _applicationService: ApplicationService =
    inject(ApplicationService);
  private readonly _platformId = inject(PLATFORM_ID);

  org: Organizational | null = null;

  accommodations: PublicAccommodationListItem[] = [];
  loading: boolean = false;
  pagination: PaginationInterface = {
    page: 1,
    perPage: 20,
    total: 0,
    pageCount: 0,
    hasPreviousPage: false,
    hasNextPage: false
  };

  ngOnInit(): void {
    this._applicationService.currentOrg$.subscribe((org) => {
      if (org) this.org = org;
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this._accommodationsService
      .getPublicAccommodationList({
        page: this.pagination.page,
        perPage: this.pagination.perPage
      })
      .subscribe({
        next: (res) => {
          this.accommodations = res.data;
          this.pagination = res.pagination;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  getMedia(code: string): string {
    return (
      this.org?.medias?.find((m) => m.mediaType?.code === code)?.url ??
      'assets/images/notFound.avif'
    );
  }

  onPageChange(event: PageEvent): void {
    this.pagination.page = event.pageIndex + 1;
    this.pagination.perPage = event.pageSize;
    this.load();
    if (isPlatformBrowser(this._platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

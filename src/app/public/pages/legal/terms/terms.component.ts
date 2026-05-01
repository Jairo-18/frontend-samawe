import { Component, inject, OnInit } from '@angular/core';
import { BasePageComponent } from '../../../../shared/components/base-page/base-page.component';
import { RouterModule } from '@angular/router';
import { BoldTextPipe } from '../../../../shared/pipes/bold-text.pipe';
import { TranslatedPipe } from '../../../../shared/pipes/translated.pipe';
import { CommonModule } from '@angular/common';
import { LegalSection } from '../../../../shared/interfaces/organizational.interface';
import { ApplicationService } from '../../../../organizational/services/application.service';
import { switchMap, filter, take } from 'rxjs';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [
    BasePageComponent,
    RouterModule,
    BoldTextPipe,
    TranslatedPipe,
    CommonModule,
    TranslateModule
  ],
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.scss'
})
export class TermsComponent implements OnInit {
  private readonly _applicationService: ApplicationService =
    inject(ApplicationService);

  section: LegalSection | undefined;
  isLoading: boolean = true;

  ngOnInit(): void {
    this._applicationService.currentOrg$
      .pipe(
        filter((org) => !!org),
        take(1),
        switchMap((org) =>
          this._applicationService.getLegalSections(org!.organizationalId)
        )
      )
      .subscribe((res) => {
        this.section = res.data?.find((s) => s.type === 'terms');
        this.isLoading = false;
      });
  }
}

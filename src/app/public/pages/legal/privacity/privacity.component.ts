import { Component, inject, OnInit } from '@angular/core';
import { BasePageComponent } from '../../../../shared/components/base-page/base-page.component';
import { BoldTextPipe } from '../../../../shared/pipes/bold-text.pipe';
import { TranslatedPipe } from '../../../../shared/pipes/translated.pipe';
import { CommonModule } from '@angular/common';
import { LegalSection } from '../../../../shared/interfaces/organizational.interface';
import { ApplicationService } from '../../../../organizational/services/application.service';
import { switchMap, filter, take } from 'rxjs';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-privacity',
  standalone: true,
  imports: [
    BasePageComponent,
    BoldTextPipe,
    TranslatedPipe,
    CommonModule,
    TranslateModule
  ],
  templateUrl: './privacity.component.html',
  styleUrl: './privacity.component.scss'
})
export class PrivacityComponent implements OnInit {
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
        this.section = res.data?.find((s) => s.type === 'privacy');
        this.isLoading = false;
      });
  }
}

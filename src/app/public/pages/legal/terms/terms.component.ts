import { Component, computed, inject } from '@angular/core';
import { BasePageComponent } from '../../../../shared/components/base-page/base-page.component';
import { RouterModule } from '@angular/router';
import { RelatedDataService } from '../../../../shared/services/relatedData.service';
import { BoldTextPipe } from '../../../../shared/pipes/bold-text.pipe';
import { CommonModule } from '@angular/common';
import { LegalSection } from '../../../../shared/interfaces/organizational.interface';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [BasePageComponent, RouterModule, BoldTextPipe, CommonModule],
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.scss'
})
export class TermsComponent {
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);

  readonly section = computed<LegalSection | undefined>(() => {
    const org =
      this._relatedDataService.relatedData()?.data?.organizational?.[0];
    return org?.legalSections?.find((s) => s.type === 'terms');
  });
}

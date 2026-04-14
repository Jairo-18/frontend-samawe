import { Component, computed, inject } from '@angular/core';
import { BasePageComponent } from '../../../../shared/components/base-page/base-page.component';
import { RelatedDataService } from '../../../../shared/services/relatedData.service';
import { BoldTextPipe } from '../../../../shared/pipes/bold-text.pipe';
import { CommonModule } from '@angular/common';
import { LegalSection } from '../../../../shared/interfaces/organizational.interface';

@Component({
  selector: 'app-privacity',
  standalone: true,
  imports: [BasePageComponent, BoldTextPipe, CommonModule],
  templateUrl: './privacity.component.html',
  styleUrl: './privacity.component.scss'
})
export class PrivacityComponent {
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);

  readonly section = computed<LegalSection | undefined>(() => {
    const org =
      this._relatedDataService.relatedData()?.data?.organizational?.[0];
    return org?.legalSections?.find((s) => s.type === 'privacy');
  });
}

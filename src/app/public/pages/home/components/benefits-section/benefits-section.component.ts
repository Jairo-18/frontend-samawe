import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BenefitSection, Organizational } from '../../../../../shared/interfaces/organizational.interface';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-benefits-section',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './benefits-section.component.html',
  styleUrls: ['./benefits-section.component.scss']
})
export class BenefitsSectionComponent {
  @Input() org: Organizational | null = null;
  @Input() benefitSections: BenefitSection[] = [];
}

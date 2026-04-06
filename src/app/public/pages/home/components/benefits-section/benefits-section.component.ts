import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Organizational } from '../../../../../shared/interfaces/organizational.interface';

@Component({
  selector: 'app-benefits-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './benefits-section.component.html',
  styleUrls: ['./benefits-section.component.scss']
})
export class BenefitsSectionComponent {
  @Input() org: Organizational | null = null;
}

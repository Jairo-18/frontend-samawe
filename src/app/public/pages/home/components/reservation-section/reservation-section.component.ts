import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Organizational } from '../../../../../shared/interfaces/organizational.interface';
import { ButtonLandingComponent } from '../../../../../shared/components/button-landing/button-landing.component';
import { SectionHeaderComponent } from '../../../../../public/components/section-header/section-header.component';
import { TranslatedPipe } from '../../../../../shared/pipes/translated.pipe';

@Component({
  selector: 'app-reservation-section',
  standalone: true,
  imports: [ButtonLandingComponent, SectionHeaderComponent, TranslatedPipe],
  templateUrl: './reservation-section.component.html',
  styleUrls: ['./reservation-section.component.scss']
})
export class ReservationSectionComponent {
  @Input() org: Organizational | null = null;
  private readonly _router: Router = inject(Router);

  navigate(): void {
    this._router.navigate(['/accommodation']);
  }
}

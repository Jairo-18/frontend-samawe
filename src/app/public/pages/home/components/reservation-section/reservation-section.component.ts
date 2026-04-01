import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Organizational } from '../../../../../shared/interfaces/organizational.interface';
import { ButtonLandingComponent } from '../../../../../shared/components/button-landing/button-landing.component';

@Component({
  selector: 'app-reservation-section',
  standalone: true,
  imports: [ButtonLandingComponent],
  templateUrl: './reservation-section.component.html',
  styleUrls: ['./reservation-section.component.scss']
})
export class ReservationSectionComponent {
  @Input() org: Organizational | null = null;
  private readonly _router = inject(Router);

  navigate(): void {
    this._router.navigate(['/accommodation']);
  }
}

import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Organizational } from '../../../../../shared/interfaces/organizational.interface';
import { ButtonLandingComponent } from '../../../../../shared/components/button-landing/button-landing.component';

@Component({
  selector: 'app-about-us-section',
  standalone: true,
  imports: [ButtonLandingComponent],
  templateUrl: './about-us-section.component.html',
  styleUrls: ['./about-us-section.component.scss']
})
export class AboutUsSectionComponent {
  @Input() org: Organizational | null = null;
  private readonly _router = inject(Router);

  get imageUrl(): string {
    return this.org?.corporateValues?.[0]?.imageUrl ?? 'assets/images/notFound.avif';
  }

  navigate(): void {
    this._router.navigate(['/about-us']);
  }
}

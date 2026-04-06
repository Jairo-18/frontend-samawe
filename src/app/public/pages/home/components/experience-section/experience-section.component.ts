import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Organizational } from '../../../../../shared/interfaces/organizational.interface';
import { ButtonLandingComponent } from '../../../../../shared/components/button-landing/button-landing.component';

@Component({
  selector: 'app-experience-section',
  standalone: true,
  imports: [ButtonLandingComponent],
  templateUrl: './experience-section.component.html',
  styleUrls: ['./experience-section.component.scss']
})
export class ExperienceSectionComponent {
  @Input() org: Organizational | null = null;
  private readonly _router = inject(Router);

  get imageUrl(): string {
    const excluded = ['LOGO', 'LOGIN_BG', 'REGISTER_BG'];
    return (
      this.org?.medias?.find((m) => !excluded.includes(m.mediaType?.code))
        ?.url ?? 'assets/images/notFound.avif'
    );
  }

  navigate(): void {
    this._router.navigate(['/accommodation']);
  }
}

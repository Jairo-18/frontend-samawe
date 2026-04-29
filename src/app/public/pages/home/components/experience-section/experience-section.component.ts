import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Organizational } from '../../../../../shared/interfaces/organizational.interface';
import { ButtonLandingComponent } from '../../../../../shared/components/button-landing/button-landing.component';
import { SectionHeaderComponent } from '../../../../../public/components/section-header/section-header.component';
import { TranslatedPipe } from '../../../../../shared/pipes/translated.pipe';

@Component({
  selector: 'app-experience-section',
  standalone: true,
  imports: [ButtonLandingComponent, SectionHeaderComponent, TranslatedPipe],
  templateUrl: './experience-section.component.html',
  styleUrls: ['./experience-section.component.scss']
})
export class ExperienceSectionComponent {
  @Input() org: Organizational | null = null;
  private readonly _router: Router = inject(Router);

  get imageUrl(): string {
    return (
      this.org?.medias?.find((m) => m.mediaType?.code === 'ABOUT_US_IMAGE')
        ?.url ?? 'assets/images/notFound.avif'
    );
  }

  navigate(): void {
    this._router.navigate(['/accommodation']);
  }
}

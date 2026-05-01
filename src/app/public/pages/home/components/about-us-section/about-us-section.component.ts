import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Organizational } from '../../../../../shared/interfaces/organizational.interface';
import { ButtonLandingComponent } from '../../../../../shared/components/button-landing/button-landing.component';
import { SectionHeaderComponent } from '../../../../../public/components/section-header/section-header.component';
import { TranslatedPipe } from '../../../../../shared/pipes/translated.pipe';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-about-us-section',
  standalone: true,
  imports: [
    ButtonLandingComponent,
    SectionHeaderComponent,
    TranslatedPipe,
    TranslateModule
  ],
  templateUrl: './about-us-section.component.html',
  styleUrls: ['./about-us-section.component.scss']
})
export class AboutUsSectionComponent {
  @Input() org: Organizational | null = null;
  private readonly _router: Router = inject(Router);

  get imageUrl(): string {
    return (
      this.org?.medias?.find((m) => m.mediaType?.code === 'HISTORY_IMAGE')
        ?.url ?? 'assets/images/notFound.avif'
    );
  }

  navigate(): void {
    this._router.navigate(['/about-us']);
  }
}

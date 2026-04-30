import { Component, Input, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Organizational } from '../../../../../shared/interfaces/organizational.interface';
import { ButtonLandingComponent } from '../../../../../shared/components/button-landing/button-landing.component';
import { LangService } from '../../../../../shared/services/lang.service';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [ButtonLandingComponent, CommonModule],
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.scss']
})
export class HeroSectionComponent {
  @Input() org: Organizational | null = null;
  @Input() isLoggedUser: boolean = false;
  private readonly _router: Router = inject(Router);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _langService: LangService = inject(LangService);
  isBrowser = isPlatformBrowser(this._platformId);

  getMedia(code: string): string {
    return (
      this.org?.medias?.find((m) => m.mediaType?.code === code)?.url ??
      'assets/images/notFound.avif'
    );
  }

  openWhatsapp(): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const phone = (this.org?.phone ?? '').replace(/\D/g, '');
    if (phone) {
      window.open(`https://wa.me/${phone}`, '_blank');
    }
  }

  goToLogin(): void {
    this._router.navigateByUrl(this._langService.route('auth/login'));
  }
}

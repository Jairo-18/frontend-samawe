import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { Organizational } from '../../../../../shared/interfaces/organizational.interface';
import { ButtonLandingComponent } from '../../../../../shared/components/button-landing/button-landing.component';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [NgOptimizedImage, ButtonLandingComponent, CommonModule],
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.scss']
})
export class HeroSectionComponent {
  @Input() org: Organizational | null = null;
  @Input() isLoggedUser: boolean = false;
  private readonly _router: Router = inject(Router);

  openWhatsapp(): void {
    const phone = this.org?.phone ?? '';
    window.open(`https://wa.me/${phone}`, '_blank');
  }

  goToLogin(): void {
    this._router.navigate(['/auth/login']);
  }
}

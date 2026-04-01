import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faWhatsapp, faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { ApplicationService } from '../../../organizational/services/application.service';
import { Organizational } from '../../../shared/interfaces/organizational.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit, OnDestroy {
  private readonly _applicationService = inject(ApplicationService);
  private _subscription = new Subscription();

  currentYear = new Date().getFullYear();
  org: Organizational | null = null;
  logoUrl: string = '';

  faWhatsapp = faWhatsapp;
  faFacebook = faFacebook;
  faInstagram = faInstagram;

  ngOnInit(): void {
    this._subscription.add(
      this._applicationService.currentOrg$.subscribe((org) => {
        if (org) {
          this.org = org;
          const logo = org.medias?.find((m) => m.mediaType.code === 'LOGO');
          this.logoUrl = logo?.url ?? '';
        }
      })
    );
  }

  get whatsappHref(): string {
    const phone = this.org?.phone?.replace(/\D/g, '') ?? '';
    return phone ? `https://wa.me/57${phone}` : 'https://wa.me/573152651952';
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
}

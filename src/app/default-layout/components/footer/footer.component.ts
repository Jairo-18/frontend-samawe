import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../../../organizational/services/application.service';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit, OnDestroy {
  private readonly _applicationService = inject(ApplicationService);
  private _subscription = new Subscription();

  currentYear: number = new Date().getFullYear();
  organizationalName: string = '';
  logoUrl: string = '';

  ngOnInit(): void {
    this._subscription.add(
      this._applicationService.currentOrg$.subscribe((org) => {
        if (org) {
          this.organizationalName = org.name;
          if (org.medias) {
            const logo = org.medias.find((m) => m.mediaType.code === 'LOGO');
            if (logo) {
              this.logoUrl = logo.url;
            }
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
}

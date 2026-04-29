import { Component, inject } from '@angular/core';
import { LangService } from '../../services/lang.service';
import { ButtonLandingComponent } from '../button-landing/button-landing.component';

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [ButtonLandingComponent],
  templateUrl: './lang-switcher.component.html'
})
export class LangSwitcherComponent {
  readonly lang = inject(LangService);

  btnClass(): string {
    return 'border-current opacity-80 hover:opacity-100';
  }
}

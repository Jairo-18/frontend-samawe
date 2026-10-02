import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

import { Review } from '../../../shared/interfaces/review.interface';
import { LangService } from '../../../shared/services/lang.service';

/** Opiniones que el cliente ha dejado en el blog, con las respuestas del hotel. */
@Component({
  selector: 'app-my-reviews-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, TranslateModule],
  templateUrl: './my-reviews-list.component.html',
  styleUrl: './my-reviews-list.component.scss'
})
export class MyReviewsListComponent {
  @Input() reviews: Review[] = [];

  private readonly _lang = inject(LangService);

  blogRoute(): string {
    return this._lang.route('blog');
  }

  /** Cinco posiciones: llena, media o vacía según el puntaje. */
  stars(score: number): ('star' | 'star_half' | 'star_border')[] {
    return [1, 2, 3, 4, 5].map((n) =>
      score >= n ? 'star' : score >= n - 0.5 ? 'star_half' : 'star_border'
    );
  }
}

import {
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { ReviewService } from '../../services/review.service';
import { Review } from '../../../shared/interfaces/review.interface';
import { AuthService } from '../../../auth/services/auth.service';
import { LocalStorageService } from '../../../shared/services/localStorage.service';
import { ApplicationService } from '../../../organizational/services/application.service';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { Organizational } from '../../../shared/interfaces/organizational.interface';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { SectionHeaderComponent } from '../../components/section-header/section-header.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ReviewCardComponent } from '../../components/review-card/review-card.component';
import {
  GoogleBusinessService,
  GoogleReview
} from '../../../organizational/services/google-business.service';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    CdkTextareaAutosize,
    SectionHeaderComponent,
    LoaderComponent,
    ReviewCardComponent
  ],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss'
})
export class BlogComponent implements OnInit, OnDestroy {
  private readonly _reviewService: ReviewService = inject(ReviewService);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _localStorage: LocalStorageService = inject(LocalStorageService);
  private readonly _appService: ApplicationService = inject(ApplicationService);
  private readonly _googleBusinessService: GoogleBusinessService = inject(GoogleBusinessService);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _destroy$ = new Subject<void>();
  private readonly _searchSubject = new Subject<string>();

  reviews: Review[] = [];
  googleReviews: GoogleReview[] = [];
  loadingGoogle: boolean = false;
  org: Organizational | null = null;
  currentUser: UserInterface | null = null;
  isLoggedIn: boolean = false;
  loading: boolean = false;
  loadingMore: boolean = false;

  pagination: PaginationInterface = {
    page: 1,
    perPage: 5,
    total: 0,
    pageCount: 0,
    hasPreviousPage: false,
    hasNextPage: false
  };

  newTitle: string = '';
  newComment: string = '';
  newScore: number = 5;
  submitting: boolean = false;

  searchQuery: string = '';
  filterScore: 'all' | '1' | '2' | '3' | '4' | '5' = 'all';
  sortOrder: 'newest' | 'oldest' = 'newest';

  readonly starPositions = [1, 2, 3, 4, 5];

  ngOnInit(): void {
    this.isLoggedIn = this._authService.isAuthenticated();
    this.currentUser = this.isLoggedIn ? this._localStorage.getUserData() : null;

    this._authService._isLoggedSubject.subscribe((logged) => {
      this.isLoggedIn = logged;
      this.currentUser = logged ? this._localStorage.getUserData() : null;
    });

    this._searchSubject.pipe(debounceTime(400), takeUntil(this._destroy$)).subscribe(() => {
      this._reloadReviews();
    });

    this._appService.currentOrg$.subscribe((org) => {
      if (org) {
        this.org = org;
        this.loadReviews();
      }
    });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  onSearchChange(): void {
    this._searchSubject.next(this.searchQuery);
  }

  onFilterChange(): void {
    this._reloadReviews();
  }

  onSortChange(): void {
    this._reloadReviews();
  }

  private _reloadReviews(): void {
    if (!this.org) return;
    this.reviews = [];
    this.pagination.page = 1;
    this.loading = true;
    this._fetchPage(1, () => { this.loading = false; });
  }

  loadReviews(): void {
    this.pagination.page = 1;
    this.reviews = [];
    this.loading = true;
    this._fetchPage(1, () => {
      this.loading = false;
    });
    this.loadGoogleReviews();
  }

  private _fetchPage(page: number, onDone?: () => void): void {
    this._reviewService
      .getPaginated(
        this.org!.organizationalId,
        page,
        this.pagination.perPage,
        this.searchQuery,
        this.filterScore,
        this.sortOrder
      )
      .subscribe({
        next: (res) => {
          this.reviews = page === 1 ? res.data : [...this.reviews, ...res.data];
          this.pagination = res.pagination;
          onDone?.();
          this.loadingMore = false;
          if (isPlatformBrowser(this._platformId) && res.pagination.hasNextPage) {
            setTimeout(() => this.onScroll(), 150);
          }
        },
        error: () => {
          onDone?.();
          this.loadingMore = false;
        }
      });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (!isPlatformBrowser(this._platformId)) return;
    if (this.loadingMore || !this.pagination.hasNextPage) return;
    const scrolled = window.scrollY + window.innerHeight;
    const total = document.documentElement.scrollHeight;
    if (scrolled >= total - window.innerHeight) {
      this.loadingMore = true;
      this._fetchPage(this.pagination.page + 1);
    }
  }

  loadGoogleReviews(): void {
    if (!this.org?.organizationalId) return;
    this.loadingGoogle = true;
    this._googleBusinessService
      .getGoogleReviews(this.org.organizationalId)
      .subscribe({
        next: (res) => {
          this.googleReviews = res.data;
          this.loadingGoogle = false;
        },
        error: () => {
          this.loadingGoogle = false;
        }
      });
  }

  starRatingToNumber(rating: GoogleReview['starRating']): number {
    return this._googleBusinessService.starRatingToNumber(rating);
  }

  submitReview(): void {
    if (!this.newTitle.trim() || !this.newComment.trim()) return;
    this.submitting = true;
    this._reviewService
      .create({
        title: this.newTitle.trim(),
        comment: this.newComment.trim(),
        score: Math.round(Number(this.newScore) * 2) / 2,
        organizationalId: this.org!.organizationalId
      })
      .subscribe({
        next: (res) => {
          this.newTitle = '';
          this.newComment = '';
          this.newScore = 5;
          this.submitting = false;
          this.reviews = [{ ...res.data, replies: res.data.replies ?? [], user: res.data.user ?? this.currentUser }, ...this.reviews];
        },
        error: () => {
          this.submitting = false;
        }
      });
  }

  onSaveReview(event: { reviewId: number; title: string; comment: string; score: number }): void {
    this._reviewService
      .update(event.reviewId, { title: event.title, comment: event.comment, score: event.score })
      .subscribe({
        next: (res) => {
          const idx = this.reviews.findIndex((r) => r.reviewId === event.reviewId);
          if (idx !== -1) this.reviews[idx] = { ...this.reviews[idx], ...res.data };
        }
      });
  }

  onDeleteReview(reviewId: number): void {
    if (!isPlatformBrowser(this._platformId)) return;
    if (!confirm('¿Eliminar esta reseña?')) return;
    this._reviewService.remove(reviewId).subscribe({
      next: () => {
        this.reviews = this.reviews.filter((r) => r.reviewId !== reviewId);
      }
    });
  }

  onSubmitReply(event: { reviewId: number; comment: string }): void {
    this._reviewService
      .createReply(event.reviewId, { comment: event.comment })
      .subscribe({
        next: (res) => {
          const review = this.reviews.find((r) => r.reviewId === event.reviewId);
          if (review) review.replies = [...review.replies, res.data];
        }
      });
  }

  onSaveReply(event: { reviewId: number; replyId: number; comment: string }): void {
    this._reviewService
      .updateReply(event.reviewId, event.replyId, { comment: event.comment })
      .subscribe({
        next: (res) => {
          const review = this.reviews.find((r) => r.reviewId === event.reviewId);
          if (review) {
            const idx = review.replies.findIndex((r) => r.reviewReplyId === event.replyId);
            if (idx !== -1) review.replies[idx] = { ...review.replies[idx], ...res.data };
          }
        }
      });
  }

  onDeleteReply(event: { reviewId: number; replyId: number }): void {
    if (!isPlatformBrowser(this._platformId)) return;
    if (!confirm('¿Eliminar esta respuesta?')) return;
    this._reviewService.removeReply(event.reviewId, event.replyId).subscribe({
      next: () => {
        const review = this.reviews.find((r) => r.reviewId === event.reviewId);
        if (review) review.replies = review.replies.filter((r) => r.reviewReplyId !== event.replyId);
      }
    });
  }

  getStarIcon(position: number, score: number): string {
    if (score >= position) return 'star';
    if (score >= position - 0.5) return 'star_half';
    return 'star_border';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

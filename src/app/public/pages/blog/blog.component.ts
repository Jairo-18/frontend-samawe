import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../services/review.service';
import {
  Review,
  ReviewReply
} from '../../../shared/interfaces/review.interface';
import { AuthService } from '../../../auth/services/auth.service';
import { LocalStorageService } from '../../../shared/services/localStorage.service';
import { ApplicationService } from '../../../organizational/services/application.service';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { Organizational } from '../../../shared/interfaces/organizational.interface';
import { SectionHeaderComponent } from '../../components/section-header/section-header.component';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, FormsModule, SectionHeaderComponent],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss'
})
export class BlogComponent implements OnInit {
  private readonly _reviewService: ReviewService = inject(ReviewService);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _localStorage: LocalStorageService = inject(LocalStorageService);
  private readonly _appService: ApplicationService = inject(ApplicationService);
  private readonly _platformId = inject(PLATFORM_ID);

  reviews: Review[] = [];
  org: Organizational | null = null;
  currentUser: UserInterface | null = null;
  isLoggedIn: boolean = false;
  loading: boolean = false;

  newTitle: string = '';
  newComment: string = '';
  newScore: number = 5;
  submitting: boolean = false;

  editingReviewId: number | null = null;
  editTitle: string = '';
  editComment: string = '';
  editScore: number = 5;

  replyingToId: number | null = null;
  replyComment: string = '';
  replySubmitting: boolean = false;
  editingReplyKey: string | null = null;
  editReplyComment: string = '';

  expandedReplies: Set<number> = new Set();

  searchQuery: string = '';
  filterScore: 'all' | 'good' | 'bad' = 'all';
  sortOrder: 'newest' | 'oldest' = 'newest';

  readonly starPositions = [1, 2, 3, 4, 5];

  get filteredReviews(): Review[] {
    let result = [...this.reviews];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (r) => r.title.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q)
      );
    }

    if (this.filterScore === 'good') result = result.filter((r) => r.score >= 4);
    else if (this.filterScore === 'bad') result = result.filter((r) => r.score <= 2);

    result.sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return this.sortOrder === 'newest' ? diff : -diff;
    });

    return result;
  }

  ngOnInit(): void {
    this.isLoggedIn = this._authService.isAuthenticated();
    this.currentUser = this._localStorage.getUserData();

    this._appService.currentOrg$.subscribe((org) => {
      if (org) {
        this.org = org;
        this.loadReviews();
      }
    });
  }

  loadReviews(): void {
    this.loading = true;
    this._reviewService.getAll(this.org?.organizationalId).subscribe({
      next: (res) => {
        this.reviews = res.data;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  submitReview(): void {
    if (!this.newTitle.trim() || !this.newComment.trim()) return;
    this.submitting = true;
    this._reviewService
      .create({
        title: this.newTitle.trim(),
        comment: this.newComment.trim(),
        score: Number(this.newScore),
        organizationalId: this.org!.organizationalId
      })
      .subscribe({
        next: () => {
          this.newTitle = '';
          this.newComment = '';
          this.newScore = 5;
          this.submitting = false;
          this.loadReviews();
        },
        error: () => { this.submitting = false; }
      });
  }

  startEditReview(review: Review): void {
    this.editingReviewId = review.reviewId;
    this.editTitle = review.title;
    this.editComment = review.comment;
    this.editScore = review.score;
  }

  saveEditReview(reviewId: number): void {
    this._reviewService
      .update(reviewId, { title: this.editTitle, comment: this.editComment, score: Number(this.editScore) })
      .subscribe({
        next: () => {
          this.editingReviewId = null;
          this.loadReviews();
        }
      });
  }

  deleteReview(reviewId: number): void {
    if (!isPlatformBrowser(this._platformId)) return;
    if (!confirm('¿Eliminar esta reseña?')) return;
    this._reviewService.remove(reviewId).subscribe({
      next: () => { this.reviews = this.reviews.filter((r) => r.reviewId !== reviewId); }
    });
  }

  toggleReplies(reviewId: number): void {
    if (this.expandedReplies.has(reviewId)) this.expandedReplies.delete(reviewId);
    else this.expandedReplies.add(reviewId);
  }

  isRepliesExpanded(reviewId: number): boolean {
    return this.expandedReplies.has(reviewId);
  }

  startReply(reviewId: number): void {
    this.replyingToId = reviewId;
    this.replyComment = '';
    this.expandedReplies.add(reviewId);
  }

  submitReply(reviewId: number): void {
    if (!this.replyComment.trim()) return;
    this.replySubmitting = true;
    this._reviewService
      .createReply(reviewId, { comment: this.replyComment.trim() })
      .subscribe({
        next: () => {
          this.replyingToId = null;
          this.replyComment = '';
          this.replySubmitting = false;
          this.loadReviews();
        },
        error: () => { this.replySubmitting = false; }
      });
  }

  startEditReply(reviewId: number, reply: ReviewReply): void {
    this.editingReplyKey = `${reviewId}-${reply.reviewReplyId}`;
    this.editReplyComment = reply.comment;
  }

  saveEditReply(reviewId: number, replyId: number): void {
    this._reviewService
      .updateReply(reviewId, replyId, { comment: this.editReplyComment })
      .subscribe({
        next: () => {
          this.editingReplyKey = null;
          this.loadReviews();
        }
      });
  }

  deleteReply(reviewId: number, replyId: number): void {
    if (!isPlatformBrowser(this._platformId)) return;
    if (!confirm('¿Eliminar esta respuesta?')) return;
    this._reviewService.removeReply(reviewId, replyId).subscribe({
      next: () => {
        const review = this.reviews.find((r) => r.reviewId === reviewId);
        if (review) review.replies = review.replies.filter((r) => r.reviewReplyId !== replyId);
      }
    });
  }

  isOwner(userId: string): boolean {
    return this.currentUser?.userId === userId;
  }

  wasEdited(review: Review): boolean {
    return new Date(review.updatedAt).getTime() - new Date(review.createdAt).getTime() > 2000;
  }

  getStarIcon(position: number, score: number): string {
    if (score >= position) return 'star';
    if (score >= position - 0.5) return 'star_half';
    return 'star_border';
  }

  getInitials(user: { firstName: string; lastName: string }): string {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

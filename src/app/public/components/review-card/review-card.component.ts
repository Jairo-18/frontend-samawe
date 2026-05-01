import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Review } from '../../../shared/interfaces/review.interface';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { ReviewReplyItemComponent } from '../review-reply-item/review-reply-item.component';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-review-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    CdkTextareaAutosize,
    ReviewReplyItemComponent,
    TranslateModule
  ],
  templateUrl: './review-card.component.html'
})
export class ReviewCardComponent {
  @Input() review!: Review;
  @Input() isLoggedIn: boolean = false;
  @Input() currentUser: UserInterface | null = null;

  @Output() saveReview = new EventEmitter<{
    reviewId: number;
    title: string;
    comment: string;
    score: number;
  }>();
  @Output() deleteReview = new EventEmitter<number>();
  @Output() submitReply = new EventEmitter<{
    reviewId: number;
    comment: string;
  }>();
  @Output() saveReply = new EventEmitter<{
    reviewId: number;
    replyId: number;
    comment: string;
  }>();
  @Output() deleteReply = new EventEmitter<{
    reviewId: number;
    replyId: number;
  }>();

  editing: boolean = false;
  editTitle: string = '';
  editComment: string = '';
  editScore: number = 5;

  repliesExpanded: boolean = false;
  replyingTo: boolean = false;
  replyComment: string = '';
  replySubmitting: boolean = false;

  readonly starPositions = [1, 2, 3, 4, 5];

  get isOwner(): boolean {
    return this.currentUser?.userId === this.review.user.userId;
  }

  get wasEdited(): boolean {
    return (
      new Date(this.review.updatedAt).getTime() -
        new Date(this.review.createdAt).getTime() >
      2000
    );
  }

  startEdit(): void {
    this.editing = true;
    this.editTitle = this.review.title;
    this.editComment = this.review.comment;
    this.editScore = this.review.score;
  }

  cancelEdit(): void {
    this.editing = false;
  }

  save(): void {
    this.saveReview.emit({
      reviewId: this.review.reviewId,
      title: this.editTitle,
      comment: this.editComment,
      score: this._roundScore(Number(this.editScore))
    });
    this.editing = false;
  }

  delete(): void {
    this.deleteReview.emit(this.review.reviewId);
  }

  toggleReplies(): void {
    this.repliesExpanded = !this.repliesExpanded;
  }

  startReply(): void {
    this.replyingTo = true;
    this.replyComment = '';
    this.repliesExpanded = true;
  }

  cancelReply(): void {
    this.replyingTo = false;
    this.replyComment = '';
  }

  sendReply(): void {
    if (!this.replyComment.trim()) return;
    this.replySubmitting = true;
    this.submitReply.emit({
      reviewId: this.review.reviewId,
      comment: this.replyComment.trim()
    });
    this.replyComment = '';
    this.replyingTo = false;
    this.replySubmitting = false;
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

  getInitials(): string {
    return `${this.currentUser?.firstName?.[0] ?? ''}${this.currentUser?.lastName?.[0] ?? ''}`.toUpperCase();
  }

  private _roundScore(score: number): number {
    return Math.round(score * 2) / 2;
  }
}

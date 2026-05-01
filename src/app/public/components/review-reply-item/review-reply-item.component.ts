import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { ReviewReply } from '../../../shared/interfaces/review.interface';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-review-reply-item',
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
    TranslateModule
  ],
  templateUrl: './review-reply-item.component.html'
})
export class ReviewReplyItemComponent {
  @Input() reply!: ReviewReply;
  @Input() reviewId!: number;
  @Input() currentUserId: string | undefined;

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
  editComment: string = '';

  get isOwner(): boolean {
    return this.currentUserId === this.reply.user.userId;
  }

  get wasEdited(): boolean {
    return (
      !!this.reply.updatedAt && this.reply.updatedAt !== this.reply.createdAt
    );
  }

  startEdit(): void {
    this.editing = true;
    this.editComment = this.reply.comment;
  }

  cancelEdit(): void {
    this.editing = false;
    this.editComment = '';
  }

  save(): void {
    if (!this.editComment.trim()) return;
    this.saveReply.emit({
      reviewId: this.reviewId,
      replyId: this.reply.reviewReplyId,
      comment: this.editComment.trim()
    });
    this.editing = false;
  }

  delete(): void {
    this.deleteReply.emit({
      reviewId: this.reviewId,
      replyId: this.reply.reviewReplyId
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

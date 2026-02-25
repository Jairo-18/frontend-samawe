import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RecipeWithDetails } from '../../interfaces/recipe.interface';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './recipe-card.component.html',
  styleUrl: './recipe-card.component.scss'
})
export class RecipeCardComponent {
  @Input() recipe!: RecipeWithDetails;
  @Input() canEdit: boolean = false;
  @Output() edit = new EventEmitter<RecipeWithDetails>();
  @Output() delete = new EventEmitter<RecipeWithDetails>();

  currentImageIndex = 0;

  nextImage(maxImages: number): void {
    this.currentImageIndex = (this.currentImageIndex + 1) % maxImages;
  }

  prevImage(maxImages: number): void {
    this.currentImageIndex =
      (this.currentImageIndex - 1 + maxImages) % maxImages;
  }

  getPortionColor(amount: number): string {
    if (amount < 3) return 'danger';
    if (amount < 8) return 'warning';
    return 'success';
  }

  getCostClass(cost: number): string {
    if (cost < 5000) return 'low-cost';
    if (cost < 20000) return 'mid-cost';
    return 'high-cost';
  }
}


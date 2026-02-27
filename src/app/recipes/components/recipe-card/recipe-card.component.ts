import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  OnInit
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import {
  RecipeWithDetails,
  RecipeIngredient
} from '../../interfaces/recipe.interface';
import { LocalStorageService } from '../../../shared/services/localStorage.service';
import { UnitFormatPipe } from '../../../shared/pipes/unit-format.pipe';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    UnitFormatPipe,
    FormatCopPipe,
    DecimalPipe
  ],
  templateUrl: './recipe-card.component.html',
  styleUrl: './recipe-card.component.scss'
})
export class RecipeCardComponent implements OnInit {
  @Input() recipe!: RecipeWithDetails;
  @Input() canEdit: boolean = false;
  @Output() edit = new EventEmitter<RecipeWithDetails>();
  @Output() delete = new EventEmitter<RecipeWithDetails>();

  isMesero: boolean = false;
  showAllIngredients: boolean = false;
  private readonly _localStorage = inject(LocalStorageService);

  currentImageIndex = 0;
  previewImageUrl: string | null = null;

  ngOnInit(): void {
    const userData = this._localStorage.getUserData();
    this.isMesero = userData?.roleType?.name?.toUpperCase() === 'MESERO';
  }

  nextImage(maxImages: number): void {
    this.currentImageIndex = (this.currentImageIndex + 1) % maxImages;
  }

  prevImage(maxImages: number): void {
    this.currentImageIndex =
      (this.currentImageIndex - 1 + maxImages) % maxImages;
  }

  getPortionColor(portions: number): string {
    if (portions < 1) return 'critical';
    if (portions < 8) return 'danger';
    if (portions < 12) return 'warning';
    return 'success';
  }

  getIngPortions(ing: RecipeIngredient): number {
    const qty = Number(ing.quantity) || 1;
    const amount = Number(ing.ingredientAmount) || 0;
    return Math.floor(amount / qty);
  }

  get hasCriticalIngredients(): boolean {
    return this.recipe.ingredients.some(
      (ing) => this.getPortionColor(this.getIngPortions(ing)) === 'critical'
    );
  }

  get criticalIngredientsNames(): string {
    return this.recipe.ingredients
      .filter(
        (ing) => this.getPortionColor(this.getIngPortions(ing)) === 'critical'
      )
      .map((ing) => ing.ingredientProductName)
      .join(', ');
  }

  getCostClass(cost: number): string {
    if (cost < 5000) return 'low-cost';
    if (cost < 20000) return 'mid-cost';
    return 'high-cost';
  }

  openPreview(imageUrl: string): void {
    this.previewImageUrl = imageUrl;
  }

  closePreview(): void {
    this.previewImageUrl = null;
  }
}

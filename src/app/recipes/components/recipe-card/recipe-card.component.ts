import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
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
    MatTableModule,
    MatMenuModule,
    UnitFormatPipe,
    FormatCopPipe
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
  displayedColumns: string[] = ['ingredient', 'quantity', 'unit', 'cost'];
  private readonly _localStorage = inject(LocalStorageService);

  currentImageIndex = 0;
  previewImageUrl: string | null = null;

  ngOnInit(): void {
    const userData = this._localStorage.getUserData();
    const role = userData?.roleType?.name?.toUpperCase();
    this.isMesero = role === 'MESERO';
    if (this.isMesero) {
      this.displayedColumns = ['ingredient', 'quantity', 'unit'];
    }
  }

  nextImage(maxImages: number): void {
    this.currentImageIndex = (this.currentImageIndex + 1) % maxImages;
  }

  prevImage(maxImages: number): void {
    this.currentImageIndex =
      (this.currentImageIndex - 1 + maxImages) % maxImages;
  }

  getPortionColor(portions: number): string {
    if (portions < 8) return 'danger';
    if (portions < 12) return 'warning';
    return 'success';
  }

  getIngPortions(ing: RecipeIngredient): number {
    const qty = Number(ing.quantity) || 1;
    const amount = Number(ing.ingredientAmount) || 0;
    return Math.floor(amount / qty);
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

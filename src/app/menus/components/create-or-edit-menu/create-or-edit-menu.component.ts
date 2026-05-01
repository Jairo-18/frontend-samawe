import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MenuService } from '../../services/menu.service';
import { MenuResponse } from '../../interfaces/menu.interface';
import { RecipeService } from '../../../recipes/services/recipe.service';
import { RecipeWithDetails } from '../../../recipes/interfaces/recipe.interface';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header.component';
import { TextFieldModule } from '@angular/cdk/text-field';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-create-or-edit-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    SectionHeaderComponent,
    TextFieldModule,
    TranslateModule
  ],
  templateUrl: './create-or-edit-menu.component.html',
  styleUrl: './create-or-edit-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateOrEditMenuComponent implements OnInit, OnChanges {
  @Input() currentMenu?: MenuResponse;
  @Output() menuSaved = new EventEmitter<void>();
  @Output() menuCanceled = new EventEmitter<void>();

  private readonly _menuService: MenuService = inject(MenuService);
  private readonly _recipeService: RecipeService = inject(RecipeService);
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  form!: FormGroup;
  isEditMode: boolean = false;
  saving: boolean = false;
  loadingRecipes: boolean = false;

  availableRecipes: RecipeWithDetails[] = [];
  selectedRecipeIds: Set<number> = new Set();
  recipeSearchTerm: string = '';

  Array = Array;

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadAvailableRecipes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentMenu'] && this.currentMenu) {
      this.isEditMode = true;
      this.form.patchValue({
        name: this.currentMenu.name,
        description: this.currentMenu.description || ''
      });

      this.selectedRecipeIds = new Set<number>();
      if (this.currentMenu.recipes) {
        for (const recipe of this.currentMenu.recipes) {
          if (recipe.product?.productId) {
            this.selectedRecipeIds.add(recipe.product.productId);
          }
        }
      }

      this._cdr.detectChanges();
    }
  }

  private initForm(): void {
    this.form = this._fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['']
    });
  }

  get descriptionLength(): number {
    return this.form.get('description')?.value?.length || 0;
  }

  loadAvailableRecipes(): void {
    this.loadingRecipes = true;
    this._cdr.markForCheck();

    this._recipeService.getPaginated({ page: 1, perPage: 200 }).subscribe({
      next: (res) => {
        this.availableRecipes = res.data || [];
        this.loadingRecipes = false;
        this._cdr.markForCheck();
      },
      error: () => {
        this.availableRecipes = [];
        this.loadingRecipes = false;
        this._cdr.markForCheck();
      }
    });
  }

  get filteredRecipes(): RecipeWithDetails[] {
    if (!this.recipeSearchTerm.trim()) {
      return this.availableRecipes;
    }
    const term = this.recipeSearchTerm.toLowerCase().trim();
    return this.availableRecipes.filter((r) =>
      r.productName.toLowerCase().includes(term)
    );
  }

  isRecipeSelected(recipe: RecipeWithDetails): boolean {
    return this.selectedRecipeIds.has(recipe.productId);
  }

  toggleRecipe(recipe: RecipeWithDetails): void {
    if (this.selectedRecipeIds.has(recipe.productId)) {
      this.selectedRecipeIds.delete(recipe.productId);
    } else {
      this.selectedRecipeIds.add(recipe.productId);
    }
    this._cdr.markForCheck();
  }

  removeRecipe(productId: number): void {
    this.selectedRecipeIds.delete(productId);
    this._cdr.markForCheck();
  }

  getRecipeName(productId: number): string {
    const recipe = this.availableRecipes.find((r) => r.productId === productId);
    return recipe?.productName || `Platillo #${productId}`;
  }

  save(): void {
    if (this.form.invalid || this.selectedRecipeIds.size === 0) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const { name, description } = this.form.value;
    const productIds = Array.from(this.selectedRecipeIds);

    const dto = {
      name,
      description: description || undefined,
      productIds
    };

    const obs =
      this.isEditMode && this.currentMenu
        ? this._menuService.update(this.currentMenu.menuId, dto)
        : this._menuService.create(dto);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.menuSaved.emit();
        this.resetForm();
        this._cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        console.error('Error al guardar menú:', err.error?.message ?? err);
        this._cdr.detectChanges();
      }
    });
  }

  resetForm(): void {
    this.isEditMode = false;
    this.selectedRecipeIds = new Set();
    this.recipeSearchTerm = '';
    this.form.reset({ name: '', description: '' }, { emitEvent: false });
    this._cdr.detectChanges();
  }

  cancel(): void {
    this.resetForm();
    this.menuCanceled.emit();
  }
}

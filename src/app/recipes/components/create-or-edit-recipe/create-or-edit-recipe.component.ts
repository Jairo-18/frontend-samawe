/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MatTable } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatOptionModule } from '@angular/material/core';
import { debounceTime, distinctUntilChanged, EMPTY, switchMap } from 'rxjs';
import { RecipeService } from '../../services/recipe.service';
import { RecipeWithDetails } from '../../interfaces/recipe.interface';
import { ProductsService } from '../../../service-and-product/services/products.service';
import { ProductComplete } from '../../../service-and-product/interface/product.interface';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header.component';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';
import { MatIconModule } from '@angular/material/icon';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';

@Component({
  selector: 'app-create-or-edit-recipe',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatTableModule,
    SectionHeaderComponent,
    ImageUploaderComponent,
    FormatCopPipe
  ],
  templateUrl: './create-or-edit-recipe.component.html',
  styleUrl: './create-or-edit-recipe.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateOrEditRecipeComponent implements OnChanges {
  @Input() currentRecipe?: RecipeWithDetails;
  @Output() recipeSaved = new EventEmitter<void>();
  @Output() recipeCanceled = new EventEmitter<void>();
  @ViewChild(MatTable) table?: MatTable<AbstractControl>;
  @ViewChild('imageUploader') imageUploader!: ImageUploaderComponent;

  private readonly _recipeService: RecipeService = inject(RecipeService);
  private readonly _productsService: ProductsService = inject(ProductsService);
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  form!: FormGroup;
  isEditMode: boolean = false;
  saving: boolean = false;
  selectedProductId: number | null = null;
  displayedColumns: string[] = ['name', 'quantity', 'cost', 'actions'];
  filteredDishes: ProductComplete[] = [];
  filteredIngredients: ProductComplete[][] = [];
  ingredientPriceMap: Record<number, number> = {};
  existingRecipeProductIds: Set<number> = new Set();

  get dishSearchControl(): FormControl {
    return this.form.get('dishSearch') as FormControl;
  }

  constructor() {
    this.initForm();
    this._setupDishAutocomplete();
  }

  @Input() set allRecipes(recipes: RecipeWithDetails[]) {
    this.existingRecipeProductIds = new Set(recipes.map((r) => r.productId));
  }

  get ingredientsArray(): FormArray {
    return this.form.get('ingredients') as FormArray;
  }

  get totalCost(): number {
    let total = 0;
    for (const ctrl of this.ingredientsArray.controls) {
      const qty = Number(ctrl.get('quantity')?.value) || 0;
      const ingId = Number(ctrl.get('ingredientProductId')?.value);
      total += qty * (this.ingredientPriceMap[ingId] ?? 0);
    }
    return total;
  }

  private initForm(): void {
    this.form = this._fb.group({
      dishSearch: [''],
      productId: [null as number | null, Validators.required],
      ingredients: this._fb.array([])
    });
  }

  private _setupDishAutocomplete(): void {
    this.dishSearchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((val: any) => {
          const name = typeof val === 'string' ? val : val?.name || '';
          if (!name || name.trim().length < 2) {
            return EMPTY;
          }
          return this._productsService.getProductWithPagination({
            name: name.trim(),
            isActive: true,
            perPage: 10
          });
        })
      )
      .subscribe((res) => {
        this.filteredDishes = res?.data || [];
        this._cdr.markForCheck();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentRecipe'] && this.currentRecipe) {
      this.isEditMode = true;
      this.selectedProductId = this.currentRecipe.productId;
      this.form.patchValue({ productId: this.currentRecipe.productId });
      this.dishSearchControl.setValue(this.currentRecipe.productName, {
        emitEvent: false
      });
      this.form.get('productId')?.disable();

      this.ingredientsArray.clear();
      this.filteredIngredients = [];
      for (const ing of this.currentRecipe.ingredients) {
        this.ingredientPriceMap[ing.ingredientProductId] = ing.cost;
        this._addIngredientRow({
          ingredientProductId: ing.ingredientProductId,
          quantity: ing.quantity,
          ingredientProductName: ing.ingredientProductName
        });
      }
      this._cdr.detectChanges();
    }
  }

  onDishFocus(): void {
    if (!this.filteredDishes.length) {
      this._productsService
        .getProductWithPagination({
          isActive: true,
          perPage: 10
        })
        .subscribe((res) => {
          this.filteredDishes = res?.data || [];
          this._cdr.markForCheck();
          const currentValue = this.dishSearchControl.value;
          this.dishSearchControl.setValue(currentValue);
        });
    } else {
      const currentValue = this.dishSearchControl.value;
      this.dishSearchControl.setValue(currentValue);
    }
  }

  onDishSelected(dish: ProductComplete): void {
    if (!dish.productId) return;

    this.form.patchValue({ productId: dish.productId });
    this.selectedProductId = dish.productId;
    this.dishSearchControl.setValue(dish.name, { emitEvent: false });

    this.isEditMode = false;
    this.ingredientsArray.clear();
    this.filteredIngredients = [];
    this.addIngredient();
    this._cdr.detectChanges();
  }

  displayFn(product: ProductComplete | string | null): string {
    if (!product) return '';
    return typeof product === 'string' ? product : product.name;
  }

  getIngSearchControl(index: number): FormControl {
    return this.ingredientsArray.at(index).get('ingSearch') as FormControl;
  }

  private _getSelectedIngredientIds(excludeIndex?: number): Set<number> {
    const ids = new Set<number>();
    for (let i = 0; i < this.ingredientsArray.length; i++) {
      if (i === excludeIndex) continue;
      const id = Number(
        this.ingredientsArray.at(i).get('ingredientProductId')?.value
      );
      if (id) ids.add(id);
    }
    return ids;
  }

  onIngFocus(index: number): void {
    const control = this.getIngSearchControl(index);
    if (!this.filteredIngredients[index]?.length) {
      this._productsService
        .getProductWithPagination({
          isActive: true,
          perPage: 10,
          categoryTypeCode: 'ING'
        })
        .subscribe((res) => {
          const selected = this._getSelectedIngredientIds(index);
          this.filteredIngredients[index] = res.data.filter(
            (p) => !selected.has(p.productId!)
          );
          this._cdr.detectChanges();
          if (!control.value) control.setValue('');
        });
    } else {
      const selected = this._getSelectedIngredientIds(index);
      this.filteredIngredients[index] = this.filteredIngredients[index].filter(
        (p) => !selected.has(p.productId!)
      );
      if (!control.value) control.setValue('');
    }
  }

  onIngSelected(product: ProductComplete, index: number): void {
    if (!product.productId) return;
    this.ingredientsArray.at(index).patchValue({
      ingredientProductId: product.productId,
      ingSearch: product.name
    });
    this.ingredientPriceMap[product.productId] = Number(product.priceBuy) || 0;
    this._cdr.markForCheck();
  }

  private _setupIngAutocomplete(index: number): void {
    const ctrl = this.getIngSearchControl(index);
    if (!ctrl) return;
    ctrl.valueChanges
      .pipe(
        debounceTime(400),
        switchMap((val: any) => {
          const name = typeof val === 'string' ? val : val?.name || '';
          if (!name || name.trim().length < 2) {
            return EMPTY;
          }
          return this._productsService.getProductWithPagination({
            name: name.trim(),
            isActive: true,
            perPage: 20,
            categoryTypeCode: 'ING'
          });
        })
      )
      .subscribe((res) => {
        const selected = this._getSelectedIngredientIds(index);
        this.filteredIngredients[index] = res.data.filter(
          (p) => !selected.has(p.productId!)
        );
        this._cdr.markForCheck();
      });
  }

  private _buildIngredientGroup(
    ing?: Partial<{
      ingredientProductId: number;
      quantity: number;
      ingredientProductName: string;
    }>
  ): FormGroup {
    return this._fb.group({
      ingredientProductId: [
        ing?.ingredientProductId ?? (null as number | null),
        Validators.required
      ],
      ingSearch: [ing?.ingredientProductName ?? ''],
      quantity: [
        ing?.quantity ?? (null as number | null),
        [Validators.required, Validators.min(0.001)]
      ]
    });
  }

  private _addIngredientRow(
    ing?: Parameters<typeof this._buildIngredientGroup>[0]
  ): void {
    const idx = this.ingredientsArray.length;
    const group = this._buildIngredientGroup(ing);
    if (this.isEditMode && ing?.ingredientProductId) {
      group.get('ingSearch')?.disable();
    }
    this.ingredientsArray.push(group);
    this.filteredIngredients.push([]);
    this._setupIngAutocomplete(idx);
    this.table?.renderRows();
  }

  addIngredient(): void {
    this._addIngredientRow();
  }

  removeIngredient(index: number): void {
    this.ingredientsArray.removeAt(index);
    this.filteredIngredients.splice(index, 1);
    this.table?.renderRows();
  }

  getIngredientUnit(index: number): string {
    const ingId = Number(
      this.ingredientsArray.at(index).get('ingredientProductId')?.value
    );
    const found = this.filteredIngredients
      .flat()
      .find((p) => p.productId === ingId);
    return found?.unitOfMeasure?.code ?? '';
  }

  getIngredientCost(index: number): number {
    const ctrl = this.ingredientsArray.at(index);
    const qty = Number(ctrl.get('quantity')?.value) || 0;
    const ingId = Number(ctrl.get('ingredientProductId')?.value);
    return qty * (this.ingredientPriceMap[ingId] ?? 0);
  }

  save(): void {
    if (this.form.invalid || this.ingredientsArray.length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    const productId =
      this.selectedProductId ?? Number(this.form.getRawValue().productId);

    const ingredients = (
      this.ingredientsArray.value as {
        ingredientProductId: number;
        quantity: number;
      }[]
    ).map((v) => ({
      ingredientProductId: v.ingredientProductId,
      quantity: Number(v.quantity),
      notes: ''
    }));

    this.saving = true;
    const obs = this.isEditMode
      ? this._recipeService.updateByProduct(productId, { ingredients })
      : this._recipeService.create({ productId, ingredients });

    obs.subscribe({
      next: async () => {
        if (this.imageUploader) {
          await this.imageUploader.applyChanges(productId);
        }
        this.saving = false;
        this.recipeSaved.emit();
        this.resetForm();
        this._cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        console.error('Error al guardar receta:', err.error?.message ?? err);
        this._cdr.detectChanges();
      }
    });
  }

  resetForm(): void {
    this.isEditMode = false;
    this.selectedProductId = null;
    this.ingredientsArray.clear({ emitEvent: false });
    this.filteredIngredients = [];
    this.form.reset(undefined, { emitEvent: false });
    this.dishSearchControl.setValue('', { emitEvent: false });
    this.filteredDishes = [];
    this.ingredientPriceMap = {};
    this.form.get('productId')?.enable({ emitEvent: false });
    this._cdr.detectChanges();
  }
}

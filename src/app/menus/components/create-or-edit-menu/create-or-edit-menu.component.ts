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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MenuService } from '../../services/menu.service';
import { MenuResponse } from '../../interfaces/menu.interface';
import { RecipeService } from '../../../recipes/services/recipe.service';
import { RecipeWithDetails } from '../../../recipes/interfaces/recipe.interface';
import { ProductsService } from '../../../service-and-product/services/products.service';
import { ProductComplete } from '../../../service-and-product/interface/product.interface';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header.component';
import { TextFieldModule } from '@angular/cdk/text-field';
import { TranslateModule } from '@ngx-translate/core';
import { NormalizeTitleDirective } from '../../../shared/directives/normalize-title.directive';
import { CapitalizePipe } from '../../../shared/pipes/capitalize.pipe';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

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
    MatCheckboxModule,
    MatTabsModule,
    SectionHeaderComponent,
    TextFieldModule,
    TranslateModule,
    NormalizeTitleDirective,
    CapitalizePipe,
    LoaderComponent
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
  private readonly _productsService: ProductsService = inject(ProductsService);
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  form!: FormGroup;
  isEditMode: boolean = false;
  saving: boolean = false;
  loadingRecipes: boolean = false;
  loadingProducts: boolean = false;

  availableRecipes: RecipeWithDetails[] = [];
  availableProducts: ProductComplete[] = [];
  /** Todo lo elegido para el menú: platillos con receta y productos normales, juntos. */
  selectedProductIds: Set<number> = new Set();
  recipeSearchTerm: string = '';
  productSearchTerm: string = '';

  Array = Array;

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadAvailableRecipes();
    this.loadAvailableProducts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentMenu'] && this.currentMenu) {
      this.isEditMode = true;
      this.form.patchValue({
        name: this.currentMenu.name?.['es'] ?? '',
        description: this.currentMenu.description?.['es'] ?? ''
      });

      this.selectedProductIds = new Set<number>();
      if (this.currentMenu.recipes) {
        for (const recipe of this.currentMenu.recipes) {
          if (recipe.product?.productId) {
            this.selectedProductIds.add(recipe.product.productId);
          }
        }
      }
      if (this.currentMenu.products) {
        for (const product of this.currentMenu.products) {
          this.selectedProductIds.add(product.productId);
        }
      }

      // Cargar un menú existente no cuenta como cambio: el botón de guardar
      // arranca deshabilitado hasta que se toque algo de verdad.
      this._recipesChanged = false;
      this.form.markAsPristine();

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

  /** Todos los productos activos, de cualquier categoría (para agregar al menú sin receta). */
  loadAvailableProducts(): void {
    this.loadingProducts = true;
    this._cdr.markForCheck();

    this._productsService.getAllProducts().subscribe({
      next: (res) => {
        this.availableProducts = res.data || [];
        this.loadingProducts = false;
        this._cdr.markForCheck();
      },
      error: () => {
        this.availableProducts = [];
        this.loadingProducts = false;
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

  /**
   * Productos "normales" para la pestaña de Productos: cualquier categoría,
   * excepto los que ya tienen receta (esos se eligen en la pestaña Platillos,
   * para no mostrar el mismo producto en las dos listas).
   */
  get filteredProducts(): ProductComplete[] {
    const recipeProductIds = new Set(
      this.availableRecipes.map((r) => r.productId)
    );
    const withoutRecipe = this.availableProducts.filter(
      (p) => !recipeProductIds.has(p.productId)
    );

    if (!this.productSearchTerm.trim()) {
      return withoutRecipe;
    }
    const term = this.productSearchTerm.toLowerCase().trim();
    return withoutRecipe.filter((p) =>
      this.productName(p).toLowerCase().includes(term)
    );
  }

  productName(product: ProductComplete): string {
    return product.name?.['es'] ?? Object.values(product.name ?? {})[0] ?? '';
  }

  /**
   * Si hay algo que guardar. Un menú no se ensucia solo con el `FormGroup`:
   * elegir o quitar platillos toca un `Set`, no un control, así que ese cambio
   * se marca a mano.
   */
  get canSave(): boolean {
    return (
      !this.saving &&
      this.selectedProductIds.size > 0 &&
      (this.form.dirty || this._recipesChanged)
    );
  }

  /** Independiente de `canSave`: avisa aunque todavía no haya nada elegido. */
  get hasUnsavedChanges(): boolean {
    return !this.saving && (this.form.dirty || this._recipesChanged);
  }

  private _recipesChanged = false;

  isRecipeSelected(recipe: RecipeWithDetails): boolean {
    return this.selectedProductIds.has(recipe.productId);
  }

  toggleRecipe(recipe: RecipeWithDetails): void {
    this._toggle(recipe.productId);
  }

  isProductSelected(product: ProductComplete): boolean {
    return this.selectedProductIds.has(product.productId);
  }

  toggleProduct(product: ProductComplete): void {
    this._toggle(product.productId);
  }

  private _toggle(productId: number): void {
    if (this.selectedProductIds.has(productId)) {
      this.selectedProductIds.delete(productId);
    } else {
      this.selectedProductIds.add(productId);
    }
    this._recipesChanged = true;
    this._cdr.markForCheck();
  }

  removeRecipe(productId: number): void {
    this.selectedProductIds.delete(productId);
    this._recipesChanged = true;
    this._cdr.markForCheck();
  }

  /** Busca el nombre entre platillos y productos normales, lo que aplique. */
  getRecipeName(productId: number): string {
    const recipe = this.availableRecipes.find((r) => r.productId === productId);
    if (recipe) return recipe.productName;

    const product = this.availableProducts.find((p) => p.productId === productId);
    if (product) return this.productName(product);

    return `Producto #${productId}`;
  }

  save(): void {
    if (this.form.invalid || this.selectedProductIds.size === 0) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const { name, description } = this.form.value;
    const productIds = Array.from(this.selectedProductIds);

    const dto = {
      name: { es: name as string },
      description: description ? { es: description as string } : undefined,
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
    this.selectedProductIds = new Set();
    this.recipeSearchTerm = '';
    this.productSearchTerm = '';
    this.form.reset({ name: '', description: '' }, { emitEvent: false });
    this._cdr.detectChanges();
  }

  cancel(): void {
    this.resetForm();
    this.menuCanceled.emit();
  }
}

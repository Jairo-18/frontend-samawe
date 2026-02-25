
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';
import { FormGroup } from '@angular/forms';
import { RecipeService } from '../../services/recipe.service';
import { RecipeWithDetails } from '../../interfaces/recipe.interface';
import { ProductComplete } from '../../../service-and-product/interface/product.interface';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { YesNoDialogComponent } from '../../../shared/components/yes-no-dialog/yes-no-dialog.component';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header.component';
import { SearchFieldsComponent } from '../../../shared/components/search-fields/search-fields.component';
import { AuthService } from '../../../auth/services/auth.service';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { SearchField } from '../../../shared/interfaces/search.interface';
import { RecipeCardComponent } from '../recipe-card/recipe-card.component';

@Component({
  selector: 'app-see-recipes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTooltipModule,
    MatPaginatorModule,
    LoaderComponent,
    SectionHeaderComponent,
    SearchFieldsComponent,
    MatIconModule,
    RecipeCardComponent
  ],
  templateUrl: './see-recipes.component.html',
  styleUrl: './see-recipes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SeeRecipesComponent implements OnInit {
  @Input() restaurantProducts: ProductComplete[] = [];
  @Output() editRecipe = new EventEmitter<RecipeWithDetails>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(SearchFieldsComponent) searchComponent!: SearchFieldsComponent;

  private readonly _recipeService = inject(RecipeService);
  private readonly _dialog = inject(MatDialog);
  private readonly _authService = inject(AuthService);
  private readonly _cdr = inject(ChangeDetectorRef);

  recipes: RecipeWithDetails[] = [];
  loading = false;
  showClearButton = false;
  form!: FormGroup;
  userLogged: UserInterface;

  params: any = {};
  paginationParams: PaginationInterface = {
    page: 1,
    perPage: 10,
    total: 0,
    pageCount: 0,
    hasPreviousPage: false,
    hasNextPage: false
  };

  searchFieldsRecipes: SearchField[] = [
    {
      name: 'search',
      label: 'Nombre del platillo',
      type: 'text',
      placeholder: ' '
    }
  ];

  constructor() {
    this.userLogged = this._authService.getUserLoggedIn();
  }

  ngOnInit(): void {
    this.loadRecipes();
  }

  loadRecipes(): void {
    this.loading = true;
    this._cdr.markForCheck();

    const query = {
      page: this.paginationParams.page,
      perPage: this.paginationParams.perPage,
      ...this.params
    };

    this._recipeService.getPaginated(query).subscribe({
      next: (res) => {
        this.recipes = res.data || [];
        this.paginationParams = res.pagination;
        this.loading = false;
        this._cdr.markForCheck();
      },
      error: () => {
        this.recipes = [];
        this.loading = false;
        this._cdr.markForCheck();
      }
    });
  }
  onSearchSubmit(form: any): void {
    this.showClearButton = !!form.length;
    this.params = form?.value || form;
    this.paginationParams.page = 1;
    this.loadRecipes();
  }

  onSearchChange(form: any): void {
    this.showClearButton = !!form.length;
    this.params = form?.value;
    this.paginationParams.page = 1;
    this.loadRecipes();
  }

  onChangePagination(event: PageEvent): void {
    this.paginationParams.page = event.pageIndex + 1;
    this.paginationParams.perPage = event.pageSize;
    this.loadRecipes();
  }

  openDeleteDialog(recipe: RecipeWithDetails): void {
    const ref = this._dialog.open(YesNoDialogComponent, {
      data: {
        title: `¿Eliminar receta de ${recipe.productName}?`,
        message: 'Esta acción eliminará todos los ingredientes de la receta.'
      }
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this._recipeService.deleteByProduct(recipe.productId).subscribe({
          next: () => this.loadRecipes(),
          error: (e) => console.error('Error al eliminar receta', e)
        });
      }
    });
  }

  canEdit(): boolean {
    const role = this.userLogged?.roleType?.name?.toUpperCase();
    return ['ADMINISTRADOR', 'RECEPCIONISTA'].includes(role || '');
  }
}


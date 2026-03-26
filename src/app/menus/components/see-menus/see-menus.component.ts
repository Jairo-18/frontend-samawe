/* eslint-disable @typescript-eslint/no-explicit-any */

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
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';
import { MenuService } from '../../services/menu.service';
import { MenuResponse, MenuRecipeItem } from '../../interfaces/menu.interface';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { YesNoDialogComponent } from '../../../shared/components/yes-no-dialog/yes-no-dialog.component';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header.component';
import { SearchFieldsComponent } from '../../../shared/components/search-fields/search-fields.component';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { SearchField } from '../../../shared/interfaces/search.interface';

@Component({
  selector: 'app-see-menus',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    LoaderComponent,
    SectionHeaderComponent,
    SearchFieldsComponent
  ],
  templateUrl: './see-menus.component.html',
  styleUrl: './see-menus.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SeeMenusComponent implements OnInit {
  @Input() isMesero: boolean = false;
  @Output() editMenu = new EventEmitter<MenuResponse>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(SearchFieldsComponent) searchComponent!: SearchFieldsComponent;

  private readonly _menuService: MenuService = inject(MenuService);
  private readonly _dialog: MatDialog = inject(MatDialog);
  private readonly _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  menus: MenuResponse[] = [];
  loading: boolean = false;
  showClearButton: boolean = false;
  allMenusExpanded: boolean = false;
  expandedDescriptions: Set<number> = new Set<number>();



  params: any = {};
  paginationParams: PaginationInterface = {
    page: 1,
    perPage: 10,
    total: 0,
    pageCount: 0,
    hasPreviousPage: false,
    hasNextPage: false
  };

  searchFields: SearchField[] = [
    {
      name: 'search',
      label: 'Nombre del menú',
      type: 'text',
      placeholder: ' '
    }
  ];

  ngOnInit(): void {
    this.loadMenus();
  }

  loadMenus(): void {
    this.loading = true;
    this._cdr.markForCheck();

    const query = {
      page: this.paginationParams.page,
      perPage: this.paginationParams.perPage,
      ...this.params
    };

    this._menuService.getPaginated(query).subscribe({
      next: (res) => {
        this.menus = res.data || [];
        this.paginationParams = res.pagination;
        this.loading = false;
        this._cdr.markForCheck();
      },
      error: () => {
        this.menus = [];
        this.loading = false;
        this._cdr.markForCheck();
      }
    });
  }

  /**
   * Group the flat recipe rows into distinct products with their ingredients
   */
  getGroupedRecipes(recipes: MenuRecipeItem[]): {
    productId: number;
    productName: string;
    imageUrl?: string;
    ingredients: {
      name: string;
      quantity: number;
      unit: string;
    }[];
  }[] {
    const map = new Map<
      number,
      {
        productId: number;
        productName: string;
        imageUrl?: string;
        ingredients: { name: string; quantity: number; unit: string }[];
      }
    >();

    for (const recipe of recipes) {
      const pid = recipe.product?.productId;
      if (!pid) continue;

      if (!map.has(pid)) {
        map.set(pid, {
          productId: pid,
          productName: recipe.product.name,
          imageUrl: recipe.product.images?.[0]?.imageUrl,
          ingredients: []
        });
      }

      map.get(pid)!.ingredients.push({
        name: recipe.ingredient?.name || 'N/A',
        quantity: Number(recipe.quantity),
        unit: recipe.ingredient?.unitOfMeasure?.code || 'und'
      });
    }

    return Array.from(map.values());
  }

  toggleExpanded(): void {
    this.allMenusExpanded = !this.allMenusExpanded;
  }

  toggleDescription(event: Event, menuId: number): void {
    event.stopPropagation();
    if (this.expandedDescriptions.has(menuId)) {
      this.expandedDescriptions.delete(menuId);
    } else {
      this.expandedDescriptions.add(menuId);
    }
  }

  onSearchSubmit(form: any): void {
    this.showClearButton = !!form.length;
    this.params = form?.value || form;
    this.paginationParams.page = 1;
    this.loadMenus();
  }

  onSearchChange(form: any): void {
    this.showClearButton = !!form.length;
    this.params = form?.value;
    this.paginationParams.page = 1;
    this.loadMenus();
  }

  onChangePagination(event: PageEvent): void {
    this.paginationParams.page = event.pageIndex + 1;
    this.paginationParams.perPage = event.pageSize;
    this.loadMenus();
  }

  openDeleteDialog(menu: MenuResponse): void {
    const ref = this._dialog.open(YesNoDialogComponent, {
      data: {
        title: `¿Eliminar menú "${menu.name}"?`,
        message:
          'Esta acción eliminará el menú completo. Las recetas individuales no serán afectadas.'
      }
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this._menuService.delete(menu.menuId).subscribe({
          next: () => this.loadMenus(),
          error: (e) => console.error('Error al eliminar menú', e)
        });
      }
    });
  }

  openRemoveProductDialog(
    menu: MenuResponse,
    productId: number,
    productName: string
  ): void {
    const ref = this._dialog.open(YesNoDialogComponent, {
      data: {
        title: `¿Quitar "${productName}" del menú?`,
        message:
          'El platillo se removerá de este menú, pero no será eliminado del sistema.'
      }
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this._menuService.removeProduct(menu.menuId, productId).subscribe({
          next: () => this.loadMenus(),
          error: (e) => console.error('Error al remover platillo del menú', e)
        });
      }
    });
  }
}

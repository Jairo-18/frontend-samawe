import { Component, inject, OnInit } from '@angular/core';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { TYPE_ENTITY_LABELS_ES } from '../../../shared/constants/type.contstants';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { CardTypesComponent } from '../../components/card-types/card-types.component';
import { TypeItem } from '../../../shared/interfaces/relatedDataGeneral';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { PageEvent } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { YesNoDialogComponent } from '../../../shared/components/yes-no-dialog/yes-no-dialog.component';
import { CreateOrEditTypesComponent } from '../create-or-edit-types/create-or-edit-types.component';

@Component({
  selector: 'app-see-types',
  standalone: true,
  imports: [
    BasePageComponent,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    CardTypesComponent,
    LoaderComponent,
    CommonModule
  ],
  templateUrl: './see-types.component.html',
  styleUrls: ['./see-types.component.scss']
})
export class SeeTypesComponent implements OnInit {
  private readonly _relatedDataService = inject(RelatedDataService);
  private readonly _matDialog: MatDialog = inject(MatDialog);

  results?: TypeItem[];
  loading: boolean = false;
  showClearButton: boolean = false;
  isMobile: boolean = false;
  selectedType: string = 'additionalType';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any = {};
  paginationParams: PaginationInterface = {
    page: 1,
    perPage: 5,
    total: 0,
    pageCount: 0,
    hasPreviousPage: false,
    hasNextPage: false
  };
  buttons: Record<string, string> = TYPE_ENTITY_LABELS_ES;
  buttonsControll: FormControl = new FormControl('additionalType');

  ngOnInit(): void {
    this.loadGroupData(this.selectedType);
    this.buttonsControll.valueChanges.subscribe((value) => {
      this.selectedType = value;
      this.loadGroupData(value);
    });
  }

  public onButtonSelect(type: string) {
    this.selectedType = type;
    this.loadGroupData(type);
  }

  hasContent(data: TypeItem[]): boolean {
    return data.length > 0;
  }

  get buttonLabel() {
    return Object.entries(this.buttons) || [];
  }

  openDialog() {
    const isMobile = window.innerWidth <= 768; // Ajusta el breakpoint según tu necesidad

    const dialogRef = this._matDialog.open(CreateOrEditTypesComponent, {
      width: isMobile ? '90vw' : 'auto', // 90% del viewport width en móvil, 100% en escritorio
      height: 'auto',
      maxWidth: '100vw', // Para evitar que supere el ancho de la pantalla
      data: {
        selectedType: this.selectedType,
        editMode: false
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadGroupData(this.selectedType);
      }
    });
  }

  onEditType(event: { type: string; id: number | string }) {
    this._relatedDataService
      .getTypeForEdit(event.type, event.id.toString())
      .subscribe({
        next: (res) => {
          const data = res.data.type;
          const isMobile = window.innerWidth <= 768;
          const dialogRef = this._matDialog.open(CreateOrEditTypesComponent, {
            width: isMobile ? '90vw' : 'auto', // 90% del viewport width en móvil, 100% en escritorio
            height: 'auto',
            maxWidth: '100vw', // Para evitar que supere el ancho de la pantalla
            data: {
              editMode: true,
              selectedType: event.type,
              id: event.id.toString(), // Aquí uso el id del evento directamente
              code: data.code,
              name: data.name
            }
          });

          dialogRef.afterClosed().subscribe((result) => {
            if (result) {
              this.loadGroupData(this.selectedType);
            }
          });
        },
        error: (err) => {
          console.error('Error al cargar tipo para edición', err);
        }
      });
  }

  onChangePagination(event: PageEvent): void {
    this.paginationParams.page = event.pageIndex + 1;
    this.paginationParams.perPage = event.pageSize;
    this.loadGroupData(this.selectedType);
  }

  loadGroupData(type: string): void {
    const query = {
      page: this.paginationParams.page,
      perPage: this.paginationParams.perPage,
      ...this.params
    };

    this.loading = true;
    this._relatedDataService.getEntitiesWithPagination(type, query).subscribe({
      next: (res) => {
        this.results = res.data || [];
        this.paginationParams = res.pagination;
        this.loading = false;
      },
      error: (err) => {
        console.error(`Error cargando grupo ${type}`, err);
        this.loading = false;
      }
    });
  }

  onDeleteType(event: { type: string; id: number | string }) {
    const dialogRef = this._matDialog.open(YesNoDialogComponent, {
      data: {
        title: '¿Deseas eliminar este registro?',
        message: 'Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        const type = event.type.trim();
        const id = event.id.toString();

        this._relatedDataService.deleteType(type, id).subscribe({
          next: () => this.loadGroupData(this.selectedType),
          error: (err) => console.error('Error al eliminar', err)
        });
      }
    });
  }
}

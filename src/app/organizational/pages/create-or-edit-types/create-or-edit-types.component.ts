import { Component, inject, OnInit } from '@angular/core';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CreateTypeDialogComponent } from '../../components/create-type-dialog/create-type-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { TYPE_ENTITY_LABELS_ES } from '../../../shared/constants/type.contstants';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { CardTypesComponent } from '../../components/card-types/card-types.component';
import { TypeItem } from '../../../shared/interfaces/relatedDataGeneral';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { PageEvent } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-or-edit-types',
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
  templateUrl: './create-or-edit-types.component.html',
  styleUrls: ['./create-or-edit-types.component.scss']
})
export class CreateOrEditTypesComponent implements OnInit {
  results?: TypeItem[];
  loading: boolean = false;
  showClearButton: boolean = false;
  isMobile: boolean = false;
  selectedType: string = 'additionalType';

  userLogged?: UserInterface;
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

  private readonly _relatedDataService = inject(RelatedDataService);
  private readonly _matDialog: MatDialog = inject(MatDialog);

  buttons: Record<string, string> = TYPE_ENTITY_LABELS_ES;
  buttonsControll: FormControl = new FormControl('additionalType');

  ngOnInit(): void {
    this.loadGroupData('additionalType');
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
    const dialogRef = this._matDialog.open(CreateTypeDialogComponent, {
      width: 'auto'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this._relatedDataService
          .createType(result.selectedType, {
            code: result.code,
            name: result.name
          })
          .subscribe({
            error: (err) =>
              alert('Error: ' + (err.error?.message || err.message))
          });
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
        this.paginationParams = res?.pagination;
        this.loading = false;
      },
      error: (err) => {
        console.error(`Error cargando grupo ${type}`, err);
        this.loading = false;
      }
    });
  }
}

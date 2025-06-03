import { InvoiceService } from './../../services/invoice.service';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { CreateInvoiceDialogComponent } from '../../components/create-invoice-dialog/create-invoice-dialog.component';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { RelatedDataService } from '../../../shared/services/relatedData.service';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';
import { AuthService } from '../../../auth/services/auth.service';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { SearchField } from '../../../shared/interfaces/search.interface';
import { UserComplete } from '../../../organizational/interfaces/create.interface';
import { YesNoDialogComponent } from '../../../shared/components/yes-no-dialog/yes-no-dialog.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { SearchFieldsComponent } from '../../../shared/components/search-fields/search-fields.component';
import { FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-see-invoices',
  standalone: true,
  imports: [
    MatButtonModule,
    BasePageComponent,
    MatPaginatorModule,
    MatTabsModule,
    MatIconModule,
    CommonModule,
    SearchFieldsComponent,
    RouterLink,
    LoaderComponent,
    MatTableModule
  ],
  templateUrl: './see-invoices.component.html',
  styleUrl: './see-invoices.component.scss'
})
export class SeeInvoicesComponent implements OnInit {
  private readonly _matDialog: MatDialog = inject(MatDialog);
  private readonly _invoiceService: InvoiceService = inject(InvoiceService);
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _authService: AuthService = inject(AuthService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(SearchFieldsComponent) searchComponent!: SearchFieldsComponent;

  displayedColumns: string[] = [
    'invoiceType',
    'code',
    'clientName',
    'clientIdentification',
    'employeeName',
    'total',
    'payType',
    'paidType',
    'taxeType',
    'actions'
  ];

  form!: FormGroup;
  dataSource = new MatTableDataSource<any>([]);
  isMobile: boolean = false;
  loading: boolean = false;
  showClearButton: boolean = false;
  userLogged: UserInterface;
  params: any = {};
  selectedTabIndex: number = 0;
  paginationParams: PaginationInterface = {
    page: 1,
    perPage: 5,
    total: 0,
    pageCount: 0,
    hasPreviousPage: false,
    hasNextPage: false
  };

  searchFields: SearchField[] = [
    {
      name: 'invoiceTypeId',
      label: 'Tipo de factura',
      type: 'select',
      options: [],
      placeholder: 'Buscar por tipo de factura'
    },
    {
      name: 'code',
      label: 'Código',
      type: 'text',
      placeholder: 'Buscar por código'
    },
    {
      name: 'identificationTypeId',
      label: 'Tipo identificación',
      type: 'select',
      options: [],
      placeholder: 'Buscar por tipo de identificación'
    },
    {
      name: 'clientName',
      label: 'Nombre de cliente',
      type: 'text',
      placeholder: 'Buscar por nombre de cliente'
    },
    {
      name: 'employeeName',
      label: 'Nombre de empleado',
      type: 'text',
      placeholder: 'Buscar por nombre de empleado'
    },
    {
      name: 'total',
      label: 'Total',
      type: 'text',
      placeholder: 'Buscar por total'
    },
    {
      name: 'paidTypeId',
      label: 'Tipo estado pago',
      type: 'select',
      options: [],
      placeholder: 'Buscar por tipo estado pago'
    },
    {
      name: 'payTypeId',
      label: 'Tipo pago',
      type: 'select',
      options: [],
      placeholder: 'Buscar por tipo pago'
    },
    {
      name: 'taxeTypeId',
      label: 'Tipo impuesto',
      type: 'select',
      options: [],
      placeholder: 'Buscar por tipo de impuesto'
    }
  ];

  constructor() {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) this.paginationParams.perPage = 5;
    this.userLogged = this._authService.getUserLoggedIn();
  }

  ngOnInit(): void {
    this.loadInvoices();
    this.loadRelatedData();
  }

  loadRelatedData(): void {
    this._relatedDataService.createInvoiceRelatedData().subscribe({
      next: (res) => {
        const optionMap = {
          invoiceTypeId: res.data.invoiceType,
          identificationTypeId: res.data.identificationType,
          paidTypeId: res.data.paidType,
          payTypeId: res.data.payType,
          taxeTypeId: res.data.taxeType
        };

        this.searchFields = this.searchFields.map((field) => {
          const key = field.name as keyof typeof optionMap;

          const options = optionMap[key];
          return options
            ? {
                ...field,
                name: key,
                options: options.map((t: any) => ({
                  value: t[key], // Aquí también puedes hacer un cast o usar el id concreto (ej: t.invoiceTypeId)
                  label: t.name ?? 'Sin nombre'
                }))
              }
            : field;
        });
      },
      error: (err) => {
        console.error('Error loading related data', err);
      }
    });
  }

  openDialog(): void {
    const isMobile = window.innerWidth <= 768;

    this._relatedDataService.createInvoiceRelatedData().subscribe({
      next: (relatedData) => {
        const dialogRef = this._matDialog.open(CreateInvoiceDialogComponent, {
          width: isMobile ? '90vw' : 'auto',
          height: 'auto',
          maxWidth: '100vw',
          data: {
            editMode: false,
            relatedData: relatedData.data
          }
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.loadInvoices();
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar datos relacionados', err);
      }
    });
  }

  onSearchSubmit(values: any): void {
    this.params = values;
    this.paginationParams.page = 1;
    this.loadInvoices();
  }

  onChangePagination(event: PageEvent): void {
    this.paginationParams.page = event.pageIndex + 1;
    this.paginationParams.perPage = event.pageSize;
    this.loadInvoices();
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  onSearchChange(form: any): void {
    this.showClearButton = !!form.length;
    this.params = form?.value;
    this.loadInvoices();
  }

  loadInvoices(filter: string = ''): void {
    this.loading = true;
    const query = {
      page: this.paginationParams.page,
      perPage: this.paginationParams.perPage,
      search: filter,
      ...this.params
    };

    this._invoiceService.getInvoiceWithPagination(query).subscribe({
      next: (res) => {
        // Transformar los datos para que coincidan con la tabla
        const transformedData = res.data.map((invoice: any) => ({
          ...invoice,
          clientName: invoice.user
            ? `${invoice.user.firstName} ${invoice.user.lastName}`
            : '---',
          clientIdentification: invoice.user?.identificationNumber || '---',
          clientIdentificationType:
            invoice.user?.identificationType?.name || '---',
          employeeName: invoice.employee
            ? `${invoice.employee.firstName} ${invoice.employee.lastName}`
            : '---',
          taxeType: invoice.invoiceDetails?.[0]?.taxeType || null
        }));

        this.dataSource.data = transformedData;
        this.paginationParams = res?.pagination;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error en la solicitud:', error);
        this.loading = false;
      }
    });
  }

  private deleteInvoice(invoiceId: number): void {
    this.loading = true;
    this._invoiceService.deleteInvoice(invoiceId).subscribe({
      next: () => {
        this.loadInvoices();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error en la solicitud:', error);
        this.loading = false;
      }
    });
  }

  openDeleteInvoiceDialog(id: number): void {
    const dialogRef = this._matDialog.open(YesNoDialogComponent, {
      data: {
        title: '¿Deseas eliminar esta factura?',
        message: 'Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        this.deleteInvoice(id);
      }
    });
  }

  validateIfCanEditUserOrDelete(user: UserComplete): boolean {
    return (
      this.userLogged?.roleType?.name === 'Administrador' &&
      user.roleType?.name === 'Usuario'
    );
  }
}

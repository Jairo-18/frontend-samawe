import {
  AfterViewInit,
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { InvoiceDetail } from '../../interface/invoice.interface';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { YesNoDialogComponent } from '../../../shared/components/yes-no-dialog/yes-no-dialog.component';
import { MatIcon } from '@angular/material/icon';
import { InvoiceDetaillService } from '../../services/invoiceDetaill.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-invoice-detaill',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIcon,
    MatButtonModule
  ],
  templateUrl: './invoice-detaill.component.html',
  styleUrl: './invoice-detaill.component.scss'
})
export class InvoiceDetaillComponent implements OnChanges, AfterViewInit {
  @Input() invoiceDetails: InvoiceDetail[] = [];

  private readonly _matDialog: MatDialog = inject(MatDialog);
  private readonly _invoiceDetaillService: InvoiceDetaillService = inject(
    InvoiceDetaillService
  );

  loading: boolean = false;
  isMobile: boolean = false;
  displayedColumns: string[] = [
    'code',
    'name',
    'startDate',
    'endDate',
    'amount',
    'priceWithoutTax',
    'priceWithTax',
    'subtotal',
    'actions'
  ];
  dataSource = new MatTableDataSource<InvoiceDetail>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private paginatorInitialized = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['invoiceDetails'] && this.invoiceDetails) {
      this.dataSource.data = this.invoiceDetails;

      if (this.paginatorInitialized) {
        this.dataSource.paginator = this.paginator;
      }
    }
  }

  ngAfterViewInit(): void {
    this.paginatorInitialized = true;
    this.dataSource.paginator = this.paginator;
  }

  /**
   * @param _deleteUser - Ellimina un usuario.
   */
  private deleteItem(invoiceDetailId: number): void {
    this.loading = true;
    this._invoiceDetaillService.deleteItemInvoice(invoiceDetailId).subscribe({
      next: () => {
        this.loading = false;
      },
      error: (error) => {
        console.error('Error en la solicitud:', error);
        this.loading = false;
      }
    });
  }

  /**
   * @param openDeleteUserDialog - Abre un modal para eliminar un usuario.
   */
  openDeleteItemDialog(id: number): void {
    const dialogRef = this._matDialog.open(YesNoDialogComponent, {
      data: {
        title: '¿Deseas eliminar este item?',
        message: 'Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        this.deleteItem(id);
      }
    });
  }
}

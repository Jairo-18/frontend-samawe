import {
  Component,
  ElementRef,
  inject,
  Input,
  ViewChild,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { Invoice } from '../../interface/invoice.interface';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';
import { ApplicationService } from '../../../organizational/services/application.service';
import { Subscription } from 'rxjs';
import { Organizational } from '../../../shared/interfaces/organizational.interface';
@Component({
  selector: 'app-invoice-pdf',
  standalone: true,
  imports: [CommonModule, MatTableModule, FormatCopPipe],
  templateUrl: './invoice-pdf.component.html',
  styleUrl: './invoice-pdf.component.scss'
})
export class InvoicePdfComponent implements OnInit {
  @Input() invoiceData!: Invoice;
  @ViewChild('pdfWrapper') pdfWrapper!: ElementRef;

  private readonly _applicationService: ApplicationService =
    inject(ApplicationService);
  private _subscription: Subscription = new Subscription();

  printDate = new Date();
  organizationalData?: Organizational;
  displayedColumns: string[] = [
    'nro',
    'item',
    'und',
    'precio',
    'impuesto',
    'subtotal'
  ];

  ngOnInit(): void {
    this.loadBranding();
  }

  private loadBranding(): void {
    this._subscription.add(
      this._applicationService.currentOrg$.subscribe((organizational) => {
        if (organizational) {
          this.organizationalData = organizational;
        }
      })
    );
  }

  get dataSource() {
    return this.invoiceData?.invoiceDetails || [];
  }
  get nativeElement(): HTMLElement {
    return this.pdfWrapper?.nativeElement;
  }
}

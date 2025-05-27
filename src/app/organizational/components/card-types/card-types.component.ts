import { TypeItem } from './../../../shared/interfaces/relatedDataGeneral';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';

@Component({
  selector: 'app-card-types',
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './card-types.component.html',
  styleUrls: ['./card-types.component.scss']
})
export class CardTypesComponent {
  @Input() infoTypes?: TypeItem[];
  @Input() paginationParams!: PaginationInterface;
  @Output() page = new EventEmitter<PageEvent>();
}

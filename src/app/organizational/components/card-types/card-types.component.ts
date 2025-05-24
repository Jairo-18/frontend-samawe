import { Component, OnInit } from '@angular/core';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { CommonModule } from '@angular/common';
import {
  AllTypes,
  TypeItem
} from '../../../shared/interfaces/relatedDataGeneral';

const typeTranslations: { [K in keyof AllTypes]: string } = {
  additionalType: 'Tipo adicional',
  bedType: 'Tipo de cama',
  categoryType: 'Tipo de categoría',
  identificationType: 'Tipo de identificación',
  paidType: 'Tipo de pago realizado',
  payType: 'Tipo de pago',
  phoneCode: 'Código telefónico',
  roleType: 'Tipo de rol',
  stateType: 'Tipo de estado',
  taxeType: 'Tipo de impuesto'
};
@Component({
  selector: 'app-card-types',
  imports: [CommonModule],
  templateUrl: './card-types.component.html',
  styleUrl: './card-types.component.scss'
})
export class CardTypesComponent implements OnInit {
  groupedTypes: { typeName: string; items: TypeItem[] }[] = [];

  constructor(private relatedDataService: RelatedDataService) {}

  ngOnInit() {
    this.relatedDataService.getAllTypes().subscribe({
      next: (response) => {
        const data = response.data as AllTypes;

        this.groupedTypes = (Object.keys(data) as (keyof AllTypes)[])
          .filter((key) => Array.isArray(data[key]) && data[key].length > 0)
          .map((key) => ({
            typeName: typeTranslations[key],
            items: data[key]
          }));

        console.log('Tipos agrupados:', this.groupedTypes);
      },
      error: (err) => {
        console.error('Error al obtener tipos:', err);
      }
    });
  }
}

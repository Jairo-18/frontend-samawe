import { Component, Input } from '@angular/core';
import {
  BedType,
  CategoryType,
  StateType
} from '../../../shared/interfaces/relatedDataServiceAndProduct.interface';

@Component({
  selector: 'app-see-accommodations',
  standalone: true,
  imports: [],
  templateUrl: './see-accommodations.component.html',
  styleUrl: './see-accommodations.component.scss'
})
export class SeeAccommodationsComponent {
  @Input() searchFields: any[] = [];
  @Input() categoryTypes: CategoryType[] = [];
  @Input() stateTypes: StateType[] = [];
  @Input() bedTypes: BedType[] = [];
}

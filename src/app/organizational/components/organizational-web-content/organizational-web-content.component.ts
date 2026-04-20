import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CorporateValue,
  BenefitSection,
  BenefitItem
} from '../../../shared/interfaces/organizational.interface';
import { HOTEL_ICONS } from '../../constants/icons.constants';

@Component({
  selector: 'app-organizational-web-content',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './organizational-web-content.component.html',
  styleUrls: ['./organizational-web-content.component.scss']
})
export class OrganizationalWebContentComponent implements OnInit {
  @Input() form!: FormGroup;
  @Input() corporateValues: CorporateValue[] = [];
  @Input() corporateValueForm!: FormGroup;
  @Input() editingValue: CorporateValue | null = null;
  @Input() corporateValueImageLoading: Record<string, boolean> = {};
  @Input() benefitSections: BenefitSection[] = [];
  @Input() benefitSectionForm!: FormGroup;
  @Input() editingSection: BenefitSection | null = null;

  @Output() save = new EventEmitter<void>();
  @Output() saveValue = new EventEmitter<void>();
  @Output() deleteValue = new EventEmitter<string>();
  @Output() editValue = new EventEmitter<CorporateValue>();
  @Output() cancelEdit = new EventEmitter<void>();
  @Output() uploadValueImage = new EventEmitter<{
    valueId: string;
    file: File;
  }>();
  @Output() deleteValueImage = new EventEmitter<string>();

  @Output() saveSectionEvt = new EventEmitter<void>();
  @Output() deleteSectionEvt = new EventEmitter<string>();
  @Output() editSectionEvt = new EventEmitter<BenefitSection>();
  @Output() cancelSectionEditEvt = new EventEmitter<void>();
  @Output() addItemEvt = new EventEmitter<{
    sectionId: string;
    name: string;
    icon: string;
  }>();
  @Output() updateItemEvt = new EventEmitter<{
    itemId: string;
    name: string;
    icon: string;
  }>();
  @Output() deleteItemEvt = new EventEmitter<string>();

  itemForm!: FormGroup;
  activeSectionId: string | null = null;
  editingItemId: string | null = null;
  showIconPicker: boolean = false;
  iconSearch: string = '';
  filteredIcons: { icon: string; label: string }[] = HOTEL_ICONS;

  private readonly _platformId = inject(PLATFORM_ID);

  constructor(private readonly _fb: FormBuilder) {}

  ngOnInit(): void {
    this.itemForm = this._fb.group({
      name: ['', Validators.required],
      icon: ['', Validators.required]
    });
  }

  triggerImageInput(valueId: string): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const input = document.getElementById(
      `cv-img-${valueId}`
    ) as HTMLInputElement;
    input?.click();
  }

  onImageSelected(event: Event, valueId: string): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.uploadValueImage.emit({ valueId, file });
  }

  toggleItemForm(sectionId: string): void {
    if (this.activeSectionId === sectionId && !this.editingItemId) {
      this.cancelItemForm();
    } else {
      this.activeSectionId = sectionId;
      this.editingItemId = null;
      this.itemForm.reset();
      this.showIconPicker = false;
    }
  }

  startEditItem(item: BenefitItem, sectionId: string): void {
    this.activeSectionId = sectionId;
    this.editingItemId = item.benefitItemId;
    this.itemForm.patchValue({ name: item.name, icon: item.icon });
    this.showIconPicker = false;
    this.iconSearch = '';
    this.filteredIcons = HOTEL_ICONS;
  }

  cancelItemForm(): void {
    this.activeSectionId = null;
    this.editingItemId = null;
    this.itemForm.reset();
    this.showIconPicker = false;
    this.iconSearch = '';
    this.filteredIcons = HOTEL_ICONS;
  }

  submitItem(sectionId: string): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }
    const { name, icon } = this.itemForm.getRawValue();
    if (this.editingItemId) {
      this.updateItemEvt.emit({ itemId: this.editingItemId, name, icon });
    } else {
      this.addItemEvt.emit({ sectionId, name, icon });
    }
    this.cancelItemForm();
  }

  toggleIconPicker(): void {
    this.showIconPicker = !this.showIconPicker;
  }

  filterIcons(): void {
    const q = this.iconSearch.toLowerCase().trim();
    this.filteredIcons = q
      ? HOTEL_ICONS.filter((i) => i.label.toLowerCase().includes(q))
      : HOTEL_ICONS;
  }

  selectIcon(icon: string): void {
    this.itemForm.patchValue({ icon });
    this.showIconPicker = false;
  }
}

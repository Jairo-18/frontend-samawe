import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray
} from '@angular/cdk/drag-drop';
import {
  LegalItem,
  LegalItemChild,
  LegalSection,
  LegalType
} from '../../../shared/interfaces/organizational.interface';
import { BoldTextPipe } from '../../../shared/pipes/bold-text.pipe';

@Component({
  selector: 'app-organizational-legal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    DragDropModule,
    BoldTextPipe
  ],
  templateUrl: './organizational-legal.component.html',
  styleUrls: ['./organizational-legal.component.scss']
})
export class OrganizationalLegalComponent implements OnInit, OnChanges {
  @Input() legalSections: LegalSection[] = [];
  @ViewChild('childTextarea')
  childTextareaRef!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('descriptionTextarea')
  descriptionTextareaRef!: ElementRef<HTMLTextAreaElement>;

  @Output() createSectionEvt = new EventEmitter<LegalType>();
  @Output() deleteSectionEvt = new EventEmitter<string>();

  @Output() addItemEvt = new EventEmitter<{
    sectionId: string;
    title?: string;
    description?: string;
    order: number;
  }>();
  @Output() updateItemEvt = new EventEmitter<{
    itemId: string;
    title?: string;
    description?: string;
  }>();
  @Output() deleteItemEvt = new EventEmitter<string>();
  @Output() reorderItemsEvt = new EventEmitter<{
    sectionId: string;
    items: { id: string; order: number }[];
  }>();

  @Output() addChildEvt = new EventEmitter<{
    itemId: string;
    content: string;
    order: number;
  }>();
  @Output() updateChildEvt = new EventEmitter<{
    childId: string;
    content: string;
  }>();
  @Output() deleteChildEvt = new EventEmitter<string>();
  @Output() reorderChildrenEvt = new EventEmitter<{
    itemId: string;
    items: { id: string; order: number }[];
  }>();

  readonly legalTypes: { value: LegalType; label: string }[] = [
    { value: 'terms', label: 'Términos y Condiciones' },
    { value: 'privacy', label: 'Política de Privacidad' }
  ];

  localSections: LegalSection[] = [];
  private pendingReorders = 0;

  itemForm!: FormGroup;
  childForm!: FormGroup;

  activeItemFormSectionId: string | null = null;
  editingItemId: string | null = null;

  activeChildFormItemId: string | null = null;
  editingChildId: string | null = null;

  constructor(private readonly _fb: FormBuilder) {}

  ngOnInit(): void {
    this.itemForm = this._fb.group({
      title: [''],
      description: ['']
    });
    this.childForm = this._fb.group({
      content: ['', Validators.required]
    });
    this.syncLocalSections();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['legalSections']) {
      if (this.pendingReorders > 0) {
        this.pendingReorders--;
        return;
      }
      this.syncLocalSections();
    }
  }

  private syncLocalSections(): void {
    this.localSections = this.legalSections.map((s) => ({
      ...s,
      items: [...s.items]
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          ...item,
          children: [...item.children].sort((a, b) => a.order - b.order)
        }))
    }));
  }

  hasSection(type: LegalType): boolean {
    return this.localSections.some((s) => s.type === type);
  }

  getSectionByType(type: LegalType): LegalSection | undefined {
    return this.localSections.find((s) => s.type === type);
  }

  dropItem(event: CdkDragDrop<LegalItem[]>, section: LegalSection): void {
    if (event.previousIndex === event.currentIndex) return;
    moveItemInArray(section.items, event.previousIndex, event.currentIndex);
    this.pendingReorders++;
    this.reorderItemsEvt.emit({
      sectionId: section.legalSectionId,
      items: section.items.map((item, i) => ({
        id: item.legalItemId,
        order: i
      }))
    });
  }

  dropChild(event: CdkDragDrop<LegalItemChild[]>, item: LegalItem): void {
    if (event.previousIndex === event.currentIndex) return;
    moveItemInArray(item.children, event.previousIndex, event.currentIndex);
    this.pendingReorders++;
    this.reorderChildrenEvt.emit({
      itemId: item.legalItemId,
      items: item.children.map((child, i) => ({
        id: child.legalItemChildId,
        order: i
      }))
    });
  }

  applyBoldDescription(): void {
    const textarea = this.descriptionTextareaRef?.nativeElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current: string = this.itemForm.get('description')?.value ?? '';
    if (start === end) return;
    const selected = current.substring(start, end);
    const newValue =
      current.substring(0, start) + `**${selected}**` + current.substring(end);
    this.itemForm.patchValue({ description: newValue });
    setTimeout(() => {
      textarea.selectionStart = start;
      textarea.selectionEnd = end + 4;
      textarea.focus();
    });
  }

  applyBold(): void {
    const textarea = this.childTextareaRef?.nativeElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current: string = this.childForm.get('content')?.value ?? '';
    if (start === end) return;
    const selected = current.substring(start, end);
    const newValue =
      current.substring(0, start) + `**${selected}**` + current.substring(end);
    this.childForm.patchValue({ content: newValue });
    setTimeout(() => {
      textarea.selectionStart = start;
      textarea.selectionEnd = end + 4;
      textarea.focus();
    });
  }

  openItemForm(sectionId: string): void {
    this.activeItemFormSectionId = sectionId;
    this.editingItemId = null;
    this.itemForm.reset();
    this.closeChildForm();
  }

  startEditItem(item: LegalItem, sectionId: string): void {
    this.activeItemFormSectionId = sectionId;
    this.editingItemId = item.legalItemId;
    this.itemForm.patchValue({
      title: item.title ?? '',
      description: item.description ?? ''
    });
    this.closeChildForm();
    setTimeout(() => {
      const el = this.descriptionTextareaRef?.nativeElement;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    });
  }

  cancelItemForm(): void {
    this.activeItemFormSectionId = null;
    this.editingItemId = null;
    this.itemForm.reset();
  }

  submitItem(section: LegalSection): void {
    const { title, description } = this.itemForm.getRawValue();
    const payload = {
      title: title || undefined,
      description: description || undefined
    };
    if (this.editingItemId) {
      this.updateItemEvt.emit({ itemId: this.editingItemId, ...payload });
    } else {
      const nextOrder = section.items.length;
      this.addItemEvt.emit({
        sectionId: section.legalSectionId,
        ...payload,
        order: nextOrder
      });
    }
    this.cancelItemForm();
  }

  openChildForm(itemId: string): void {
    this.activeChildFormItemId = itemId;
    this.editingChildId = null;
    this.childForm.reset();
    this.cancelItemForm();
  }

  startEditChild(child: LegalItemChild, itemId: string): void {
    this.activeChildFormItemId = itemId;
    this.editingChildId = child.legalItemChildId;
    this.childForm.patchValue({ content: child.content });
    this.cancelItemForm();
    setTimeout(() => {
      const el = this.childTextareaRef?.nativeElement;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    });
  }

  closeChildForm(): void {
    this.activeChildFormItemId = null;
    this.editingChildId = null;
    this.childForm.reset();
  }

  submitChild(item: LegalItem): void {
    if (this.childForm.invalid) {
      this.childForm.markAllAsTouched();
      return;
    }
    const { content } = this.childForm.getRawValue();
    if (this.editingChildId) {
      this.updateChildEvt.emit({ childId: this.editingChildId, content });
    } else {
      const nextOrder = item.children.length;
      this.addChildEvt.emit({
        itemId: item.legalItemId,
        content,
        order: nextOrder
      });
    }
    this.closeChildForm();
  }
}

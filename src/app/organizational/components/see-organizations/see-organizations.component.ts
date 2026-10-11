import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header.component';
import { SearchFieldsComponent } from '../../../shared/components/search-fields/search-fields.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { YesNoDialogComponent } from '../../../shared/components/yes-no-dialog/yes-no-dialog.component';
import { SearchField } from '../../../shared/interfaces/search.interface';
import { PlatformOrganization } from '../../../shared/interfaces/organizational.interface';
import { OrganizationsService } from '../../services/organizations.service';
import { DEFAULT_ITEM } from '../../../shared/constants/avatar.constants';
import { AuthService } from '../../../auth/services/auth.service';

export const searchFieldsOrganizations: SearchField[] = [
  {
    name: 'search',
    label: 'organizational.organizations.search.text',
    type: 'text',
    placeholder: ' '
  },
  {
    name: 'status',
    label: 'organizational.organizations.search.status',
    type: 'select',
    options: [
      { value: true, label: 'organizational.organizations.values.active' },
      { value: false, label: 'organizational.organizations.values.inactive' }
    ],
    placeholder: 'organizational.organizations.search.status_placeholder'
  }
];

/** Sin tildes ni mayúsculas, para buscar "samawe" y encontrar "Samawé". */
const fold = (v: unknown) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

@Component({
  selector: 'app-see-organizations',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIcon,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    TranslateModule,
    SectionHeaderComponent,
    SearchFieldsComponent,
    LoaderComponent
  ],
  templateUrl: './see-organizations.component.html'
})
export class SeeOrganizationsComponent implements OnInit, AfterViewInit {
  /**
   * Organizaciones que esta sesión está usando (la propia y la abierta con
   * "Entrar"): no se pueden eliminar desde aquí.
   */
  @Input() inUseIds: string[] = [];
  /** La organización en la que opera el panel ahora mismo. */
  @Input() activeId: string | null = null;
  @Output() organizationSelected = new EventEmitter<PlatformOrganization>();
  @Output() organizationDeleted = new EventEmitter<string>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(SearchFieldsComponent) searchComponent!: SearchFieldsComponent;

  private readonly _organizationsService: OrganizationsService =
    inject(OrganizationsService);
  private readonly _matDialog: MatDialog = inject(MatDialog);
  private readonly _translate: TranslateService = inject(TranslateService);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _platformId = inject(PLATFORM_ID);
  /** Mientras se cambia de organización (la página se recarga al terminar). */
  enteringId: string | null = null;

  readonly defaultItem = DEFAULT_ITEM;
  readonly searchFields = searchFieldsOrganizations;
  displayedColumns: string[] = [
    'logo',
    'name',
    'identification',
    'contact',
    'location',
    'domains',
    'usage',
    'status',
    'actions'
  ];
  dataSource = new MatTableDataSource<PlatformOrganization>([]);
  private _all: PlatformOrganization[] = [];
  private _filters: { search?: string; status?: boolean } = {};
  loading = false;
  showClearButton = false;

  ngOnInit(): void {
    this.loadOrganizations();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  loadOrganizations(): void {
    this.loading = true;
    this._organizationsService.getAll().subscribe({
      next: (res) => {
        this._all = (res.data || []).sort((a, b) =>
          (a.name ?? '').localeCompare(b.name ?? '')
        );
        this._applyFilters();
        this.loading = false;
        // El paginador vive dentro de un @if: se reengancha al reaparecer.
        setTimeout(() => (this.dataSource.paginator = this.paginator));
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSearchChange(event: { value: { search?: string; status?: boolean }; length: number }): void {
    this.showClearButton = !!event.length;
    this._filters = event.value ?? {};
    this._applyFilters();
  }

  onSearchSubmit(values: { search?: string; status?: boolean }): void {
    this._filters = values ?? {};
    this._applyFilters();
  }

  private _applyFilters(): void {
    const term = fold(this._filters.search).trim();
    const status = this._filters.status;
    this.dataSource.data = this._all.filter((o) => {
      if (status === true || status === false) {
        if (!!o.status !== status) return false;
      }
      if (!term) return true;
      return [
        o.name,
        o.legalName,
        o.slug,
        o.identificationNumber,
        o.email,
        o.phone,
        o.city,
        ...(o.domains ?? []).map((d) => d.hostname)
      ].some((v) => fold(v).includes(term));
    });
    this.paginator?.firstPage();
  }

  logoOf(org: PlatformOrganization): string {
    return (
      org.medias?.find((m) => m.mediaType?.code === 'LOGO' && m.isActive)?.url ||
      this.defaultItem
    );
  }

  locationOf(org: PlatformOrganization): string {
    return [org.city, org.department].filter((v) => !!v).join(', ') || '-';
  }

  /** Total de registros que impiden borrarla (el backend lo vuelve a comprobar). */
  usageCount(org: PlatformOrganization): number {
    const s = org.stats;
    return s
      ? s.users + s.invoices + s.products + s.accommodations + s.excursions
      : 0;
  }

  isCurrentTenant(org: PlatformOrganization): boolean {
    return this.inUseIds.includes(org.organizationalId);
  }

  isActive(org: PlatformOrganization): boolean {
    return org.organizationalId === this.activeId;
  }

  /**
   * "Entrar": todo el panel pasa a operar en esta organización (ver
   * `AuthService.switchOrganization`). Recarga completa para no arrastrar
   * nada cacheado de la anterior.
   */
  enterOrganization(org: PlatformOrganization): void {
    if (this.enteringId || this.isActive(org)) return;
    this.enteringId = org.organizationalId;
    this._authService.switchOrganization(org.organizationalId).subscribe({
      next: () => {
        if (isPlatformBrowser(this._platformId)) window.location.assign('/home');
      },
      error: () => {
        this.enteringId = null;
      }
    });
  }

  canDelete(org: PlatformOrganization): boolean {
    return !this.isCurrentTenant(org) && this.usageCount(org) === 0;
  }

  deleteTooltip(org: PlatformOrganization): string {
    if (this.isCurrentTenant(org)) {
      return this._translate.instant('organizational.organizations.delete.blocked_current');
    }
    if (this.usageCount(org) > 0) {
      return this._translate.instant('organizational.organizations.delete.blocked_data');
    }
    return this._translate.instant('organizational.organizations.delete.action');
  }

  openOrganization(org: PlatformOrganization): void {
    this.organizationSelected.emit(org);
  }

  openDeleteDialog(org: PlatformOrganization): void {
    if (!this.canDelete(org)) return;
    const dialogRef = this._matDialog.open(YesNoDialogComponent, {
      data: {
        title: this._translate.instant('organizational.organizations.delete.title', {
          name: org.name
        }),
        message: this._translate.instant('organizational.organizations.delete.message')
      }
    });
    dialogRef.afterClosed().subscribe((confirm) => {
      if (!confirm) return;
      this.loading = true;
      this._organizationsService.delete(org.organizationalId).subscribe({
        next: () => {
          this.organizationDeleted.emit(org.organizationalId);
          this.loadOrganizations();
        },
        error: () => {
          this.loading = false;
        }
      });
    });
  }
}

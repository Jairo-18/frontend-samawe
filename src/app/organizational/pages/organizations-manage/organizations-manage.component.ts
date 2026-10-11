import {
  Component,
  inject,
  OnInit,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { CreateOrEditOrganizationComponent } from '../../components/create-or-edit-organization/create-or-edit-organization.component';
import { SeeOrganizationsComponent } from '../../components/see-organizations/see-organizations.component';
import { PlatformOrganization } from '../../../shared/interfaces/organizational.interface';
import {
  IdentificationType,
  PhoneCode
} from '../../../shared/interfaces/relatedDataGeneral';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { AuthService } from '../../../auth/services/auth.service';

/**
 * Organizaciones (hoteles) de la plataforma: solo SUPER ADMINISTRADOR.
 * Mismo esquema que Productos: formulario arriba (crear / editar) y listado
 * abajo; al elegir una fila se edita arriba.
 */
@Component({
  selector: 'app-organizations-manage',
  standalone: true,
  imports: [
    BasePageComponent,
    CreateOrEditOrganizationComponent,
    SeeOrganizationsComponent
  ],
  template: `
    <app-base-page>
      <app-create-or-edit-organization
        [currentOrganization]="currentOrganization"
        [identificationTypes]="identificationTypes"
        [phoneCodes]="phoneCodes"
        [inUseIds]="inUseIds"
        (organizationSaved)="currentOrganization = undefined; list.loadOrganizations()"
        (organizationCanceled)="currentOrganization = undefined"
      ></app-create-or-edit-organization>
      <app-see-organizations
        #list
        [inUseIds]="inUseIds"
        [activeId]="activeId"
        (organizationSelected)="currentOrganization = $event; goToTop()"
        (organizationDeleted)="onDeleted($event)"
      ></app-see-organizations>
    </app-base-page>
  `
})
export class OrganizationsManageComponent implements OnInit {
  @ViewChild(SeeOrganizationsComponent) list!: SeeOrganizationsComponent;
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _platformId = inject(PLATFORM_ID);

  currentOrganization?: PlatformOrganization;
  identificationTypes: IdentificationType[] = [];
  phoneCodes: PhoneCode[] = [];
  /** La organización en la que opera el panel (la abierta con "Entrar"). */
  activeId: string | null = this._authService.getOrganizationalId();
  /** La propia y la abierta: ninguna se desactiva ni se elimina desde aquí. */
  inUseIds: string[] = [
    this.activeId,
    this._authService.getHomeOrganizationalId()
  ].filter((id): id is string => !!id);

  ngOnInit(): void {
    this._relatedDataService.getRelatedData().subscribe({
      next: (res) => {
        this.identificationTypes = res.data?.identificationType || [];
        this.phoneCodes = res.data?.phoneCode || [];
      },
      error: (err) => console.error('Error al cargar catálogos:', err)
    });
  }

  onDeleted(id: string): void {
    if (this.currentOrganization?.organizationalId === id) {
      this.currentOrganization = undefined;
    }
  }

  goToTop(): void {
    if (!isPlatformBrowser(this._platformId)) return;
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

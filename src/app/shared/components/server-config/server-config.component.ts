import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ApiConfigService } from '../../services/api-config.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-server-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <div class="config-container">
      <mat-card class="config-card">
        <mat-card-header>
          <mat-card-title>Configuración del Servidor</mat-card-title>
          <mat-card-subtitle
            >Conecta esta tablet al servidor de recepción</mat-card-subtitle
          >
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="configForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Dirección IP del Servidor</mat-label>
              <input
                matInput
                formControlName="serverIp"
                placeholder="192.168.1.100"
                type="text"
              />
              <mat-icon matPrefix>dns</mat-icon>
              <mat-hint>Ingresa la IP del computador de recepción</mat-hint>
              @if (
                configForm.get('serverIp')?.hasError('required') &&
                configForm.get('serverIp')?.touched
              ) {
                <mat-error>La dirección IP es requerida</mat-error>
              }
              @if (
                configForm.get('serverIp')?.hasError('pattern') &&
                configForm.get('serverIp')?.touched
              ) {
                <mat-error>Formato de IP inválido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Puerto</mat-label>
              <input
                matInput
                formControlName="port"
                placeholder="3001"
                type="number"
              />
              <mat-icon matPrefix>settings_ethernet</mat-icon>
              <mat-hint>Puerto del servidor (por defecto: 3001)</mat-hint>
            </mat-form-field>

            <div class="current-config" *ngIf="currentConfig">
              <p><strong>Configuración actual:</strong></p>
              <p>{{ currentConfig }}</p>
            </div>

            <div class="connection-status" *ngIf="connectionStatus">
              <mat-icon
                [class.success]="connectionSuccess"
                [class.error]="!connectionSuccess"
              >
                {{ connectionSuccess ? 'check_circle' : 'error' }}
              </mat-icon>
              <span>{{ connectionStatus }}</span>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <button
            mat-raised-button
            color="primary"
            (click)="testConnection()"
            [disabled]="configForm.invalid || testing"
          >
            <mat-icon>wifi_find</mat-icon>
            {{ testing ? 'Probando...' : 'Probar Conexión' }}
          </button>

          <button
            mat-raised-button
            color="accent"
            (click)="onSubmit()"
            [disabled]="configForm.invalid || !connectionSuccess"
          >
            <mat-icon>save</mat-icon>
            Guardar y Continuar
          </button>

          <button mat-button (click)="resetConfig()" type="button">
            <mat-icon>refresh</mat-icon>
            Restablecer
          </button>
        </mat-card-actions>
      </mat-card>

      <div class="help-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>¿Cómo obtener la IP del servidor?</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <ol>
              <li>En el computador de recepción, abre el sistema Samawé</li>
              <li>Ve al menú de configuración</li>
              <li>Busca la opción "Información del Servidor"</li>
              <li>Copia la dirección IP mostrada</li>
              <li>Pégala en el campo de arriba</li>
            </ol>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .config-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .config-card {
        width: 100%;
        max-width: 500px;
        margin-bottom: 20px;
      }

      .full-width {
        width: 100%;
        margin-bottom: 15px;
      }

      mat-card-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        padding: 16px;
      }

      mat-card-actions button {
        flex: 1;
        min-width: 140px;
      }

      .current-config {
        background: #f5f5f5;
        padding: 10px;
        border-radius: 4px;
        margin: 10px 0;
        font-family: monospace;
      }

      .connection-status {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px;
        border-radius: 4px;
        margin: 10px 0;
        background: #f5f5f5;
      }

      .connection-status mat-icon.success {
        color: #4caf50;
      }

      .connection-status mat-icon.error {
        color: #f44336;
      }

      .help-section {
        width: 100%;
        max-width: 500px;
      }

      .help-section mat-card {
        background: rgba(255, 255, 255, 0.95);
      }

      .help-section ol {
        padding-left: 20px;
      }

      .help-section li {
        margin-bottom: 8px;
      }
    `
  ]
})
export class ServerConfigComponent implements OnInit {
  configForm: FormGroup;
  currentConfig: string = '';
  connectionStatus: string = '';
  connectionSuccess: boolean = false;
  testing: boolean = false;

  constructor(
    private fb: FormBuilder,
    private apiConfigService: ApiConfigService,
    private http: HttpClient,
    private router: Router
  ) {
    this.configForm = this.fb.group({
      serverIp: [
        '',
        [Validators.required, Validators.pattern(/^(\d{1,3}\.){3}\d{1,3}$/)]
      ],
      port: [
        3001,
        [Validators.required, Validators.min(1), Validators.max(65535)]
      ]
    });
  }

  ngOnInit(): void {
    const config = this.apiConfigService.getConfig();
    this.currentConfig = config.apiUrl;

    // Si hay una configuración guardada, extraer IP y puerto
    if (!this.apiConfigService.isUsingLocalhost()) {
      try {
        const url = new URL(config.apiUrl);
        this.configForm.patchValue({
          serverIp: url.hostname,
          port: parseInt(url.port) || 3001
        });
      } catch (e) {
        console.error('Error al parsear URL guardada:', e);
      }
    }
  }

  private getProtocol(): string {
    return window.location.protocol === 'https:' ? 'https' : 'http';
  }

  async testConnection(): Promise<void> {
    if (this.configForm.invalid) return;

    this.testing = true;
    this.connectionStatus = 'Probando conexión...';
    this.connectionSuccess = false;

    const { serverIp, port } = this.configForm.value;
    const protocol = this.getProtocol();
    const testUrl = `${protocol}://${serverIp}:${port}/health`;

    try {
      const response = await this.http
        .get<any>(testUrl, { observe: 'response' })
        .toPromise();

      if (response?.status === 200) {
        this.connectionSuccess = true;
        this.connectionStatus = '✓ Conexión exitosa al servidor';

        // Obtener información del servidor
        try {
          const serverInfo = await this.http
            .get<any>(`${protocol}://${serverIp}:${port}/server-info`)
            .toPromise();
          this.connectionStatus = `✓ Conectado a servidor: ${serverInfo.primaryAddress}:${serverInfo.port}`;
        } catch (e) {
          // No es crítico si falla
        }
      } else {
        this.connectionSuccess = false;
        this.connectionStatus = '✗ No se pudo conectar al servidor';
      }
    } catch (error: any) {
      this.connectionSuccess = false;
      if (error.status === 0) {
        this.connectionStatus =
          '✗ Error de red: Verifica la IP y que ambos dispositivos estén en la misma red';
      } else {
        this.connectionStatus = `✗ Error: ${error.message || 'No se pudo conectar'}`;
      }
    } finally {
      this.testing = false;
    }
  }

  onSubmit(): void {
    if (this.configForm.invalid) return;

    const { serverIp, port } = this.configForm.value;
    const protocol = this.getProtocol();
    const apiUrl = `${protocol}://${serverIp}:${port}/`;

    this.apiConfigService.setApiUrl(apiUrl);
    this.currentConfig = apiUrl;

    // Recargar la página para aplicar la nueva configuración
    window.location.href = '/';
  }

  resetConfig(): void {
    this.apiConfigService.resetConfig();
    this.currentConfig = this.apiConfigService.getConfig().apiUrl;
    this.configForm.reset({ serverIp: '', port: 3001 });
    this.connectionStatus = '';
    this.connectionSuccess = false;
  }
}

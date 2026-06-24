/* eslint-disable @typescript-eslint/no-explicit-any */
// Las estructuras del documento pdfMake no tienen tipos usables aquí, por eso
// se permite 'any' en este archivo (igual que en el generador del backend).
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { InvoiceService } from '../../invoices/services/invoice.service';
import { Invoice } from '../../invoices/interface/invoice.interface';
import { InvoiceDetail } from '../../invoices/interface/invoiceDetaill.interface';
import {
  InvoiceIssuer,
  InvoiceIssuerDialogComponent
} from '../../invoices/components/invoice-issuer-dialog/invoice-issuer-dialog.component';
import { ApplicationService } from '../../organizational/services/application.service';
import { Organizational } from '../interfaces/organizational.interface';
import { NotificationsService } from './notifications.service';
import { formatCop } from '../utilities/currency.utilities.service';
import { loadPdfMake } from '../utilities/pdf-maker.utils';

const DEFAULT_COLOR = '#486e2b';

function getColor(org?: Organizational | null): string {
  return org?.primaryColor || DEFAULT_COLOR;
}

async function imageUrlToBase64(url: string): Promise<string | null> {
  try {
    return await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          canvas.getContext('2d')!.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  } catch {
    return null;
  }
}

function numberToWords(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return 'CERO PESOS';
  const b1 = [
    '',
    'UN',
    'DOS',
    'TRES',
    'CUATRO',
    'CINCO',
    'SEIS',
    'SIETE',
    'OCHO',
    'NUEVE',
    'DIEZ',
    'ONCE',
    'DOCE',
    'TRECE',
    'CATORCE',
    'QUINCE',
    'DIECISÉIS',
    'DIECISIETE',
    'DIECIOCHO',
    'DIECINUEVE',
    'VEINTE',
    'VEINTIÚN',
    'VEINTIDÓS',
    'VEINTITRÉS',
    'VEINTICUATRO',
    'VEINTICINCO',
    'VEINTISÉIS',
    'VEINTISIETE',
    'VEINTIOCHO',
    'VEINTINUEVE'
  ];
  const b2 = [
    '',
    '',
    'VEINTE',
    'TREINTA',
    'CUARENTA',
    'CINCUENTA',
    'SESENTA',
    'SETENTA',
    'OCHENTA',
    'NOVENTA'
  ];
  const b3 = [
    '',
    'CIENTO',
    'DOSCIENTOS',
    'TRESCIENTOS',
    'CUATROCIENTOS',
    'QUINIENTOS',
    'SEISCIENTOS',
    'SETECIENTOS',
    'OCHOCIENTOS',
    'NOVECIENTOS'
  ];

  function chunk(c: number): string {
    if (c === 0) return '';
    if (c === 100) return 'CIEN';
    const h = Math.floor(c / 100);
    const rem = c % 100;
    let s = h ? b3[h] + (rem ? ' ' : '') : '';
    if (rem > 0 && rem < 30) s += b1[rem];
    else if (rem >= 30) {
      const t = Math.floor(rem / 10);
      const u = rem % 10;
      s += b2[t] + (u ? ' Y ' + b1[u] : '');
    }
    return s.trim();
  }

  const mil = Math.floor(n / 1000000);
  const miles = Math.floor((n % 1000000) / 1000);
  const resto = n % 1000;
  let res = '';
  if (mil > 0)
    res += (mil === 1 ? 'UN MILLÓN' : chunk(mil) + ' MILLONES') + ' ';
  if (miles > 0) res += (miles === 1 ? 'MIL' : chunk(miles) + ' MIL') + ' ';
  if (resto > 0) res += chunk(resto);
  return res.trim() + ' PESOS';
}

function itemCargo(d: InvoiceDetail): number {
  return Number(d.priceWithTax || 0) * Number(d.amount || 0);
}

function itemRef(d: InvoiceDetail): string {
  return (
    d.product?.code ||
    (d.accommodation as any)?.code ||
    d.excursion?.code ||
    '-'
  );
}

// El name de producto/alojamiento/excursión es un TranslatedField ({ es, en }),
// no un string. pdfMake no renderiza objetos, así que extraemos el texto.
function tField(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  const obj = v as Record<string, string>;
  return obj['es'] || obj['en'] || Object.values(obj)[0] || '';
}

function itemConcept(d: InvoiceDetail): string {
  return (
    tField(d.product?.name) ||
    tField((d.accommodation as any)?.name) ||
    tField(d.excursion?.name) ||
    'N/A'
  );
}

/** Datos del propietario (persona natural) usados como emisor en la variante. */
interface OwnerInfo {
  name: string;
  idTypeCode: string;
  idNumber: string;
}

async function buildInvoiceDoc(
  invoice: Invoice,
  org: Organizational | null | undefined,
  defaultFont = 'Roboto',
  opts: { ownerMode?: boolean; owner?: OwnerInfo } = {}
): Promise<object> {
  const color = getColor(org);

  // Modo propietario: factura a nombre del dueño (persona natural). Se cambia
  // el emisor y se ocultan IVA/IPO (columnas y filas de total); el "valor unit."
  // pasa a ser el precio CON impuesto incluido para que Unidad × Valor = Total
  // y el total general quede idéntico.
  const ownerMode = !!opts.ownerMode && !!opts.owner;
  const issuerName = ownerMode
    ? opts.owner!.name
    : org?.legalName || org?.name || '';
  const issuerIdLine = ownerMode
    ? `${opts.owner!.idTypeCode || 'CC'} ${opts.owner!.idNumber}`
    : `${org?.identificationType?.code || 'NIT'} ${org?.identificationNumber || ''}`;

  const logoMedia = org?.medias?.find((m) => m.mediaType?.code === 'LOGO');
  const logoBase64 = logoMedia?.url
    ? await imageUrlToBase64(logoMedia.url)
    : null;

  // QR de la factura electrónica. factusQrCode es la URL oficial de validación
  // DIAN (catalogo-vpfe...searchqr?documentkey=<CUFE>), que es justamente el
  // contenido que debe codificar el QR. NO la descargamos como imagen (CORS la
  // bloquea, 302 a la DIAN); generamos el QR localmente con el soporte nativo de
  // pdfMake ({ qr }), que es escaneable y lleva a la validación DIAN.
  const qrContent =
    invoice.factusQrCode || invoice.factusPublicUrl || '';

  const printDate = new Date().toLocaleString('es-CO');
  const hs = {
    bold: true,
    color: '#fff',
    fontSize: 7,
    fillColor: color,
    alignment: 'center' as const
  };


  // Cada línea: unidad (cantidad), valor unitario (sin impuestos), IVA, IPO
  // (Impuesto al Consumo) y total de la línea (con impuestos).
  const itemRows = (invoice.invoiceDetails || [])
    .filter((d) => !(d as any).deletedAt)
    .map((d, i) => {
    const unidad = Number(d.amount || 0);
    const iva = Number(d.totalVat || 0);
    const ipo = Number(d.totalIco8 || 0) + Number(d.totalIco5 || 0);
    const totalLinea = itemCargo(d);
    // En modo propietario el valor unitario incluye el impuesto (precio final),
    // así Unidad × Valor = Total y no se muestran IVA/IPO.
    const valorUnitario = ownerMode
      ? Number(d.priceWithTax || 0)
      : Number(d.priceWithoutTax || 0);
    const baseCells = [
      { text: String(i + 1), fontSize: 6.5, alignment: 'center' as const },
      { text: itemRef(d), fontSize: 6.5, alignment: 'center' as const },
      { text: itemConcept(d), fontSize: 6 },
      {
        text: String(Number(unidad.toFixed(2))),
        fontSize: 6.5,
        alignment: 'center' as const
      },
      {
        text: formatCop(valorUnitario),
        fontSize: 6.5,
        alignment: 'right' as const
      }
    ];
    const totalCell = {
      text: formatCop(totalLinea),
      fontSize: 6.5,
      alignment: 'right' as const
    };
    if (ownerMode) {
      return [...baseCells, totalCell];
    }
    return [
      ...baseCells,
      { text: formatCop(iva), fontSize: 6.5, alignment: 'right' as const },
      { text: formatCop(ipo), fontSize: 6.5, alignment: 'right' as const },
      totalCell
    ];
  });

  const total = Number(invoice.total || 0);

  const clientName =
    `${invoice.user?.firstName || ''} ${invoice.user?.lastName || ''}`.trim();
  const clientId = invoice.user?.identificationNumber || '';
  const clientIdType = (invoice.user as any)?.identificationType?.code || '';
  const clientAddress = (invoice.user as any)?.address || '';
  const clientDept = (invoice.user as any)?.department?.name || '';
  const clientMuni = (invoice.user as any)?.municipality?.name || '';
  const clientEmail = invoice.user?.email || '';
  const employeeName =
    `${invoice.employee?.firstName || ''} ${invoice.employee?.lastName || ''}`.trim();
  const subtotalWithoutTax = Number(invoice.subtotalWithoutTax || 0);
  const totalVat = invoice.totalVat || 0;
  const totalIco8 = invoice.totalIco8 || 0;
  const totalIco5 = invoice.totalIco5 || 0;
  const totalIco = totalIco8 + totalIco5;

  const colCount = ownerMode ? 6 : 8;
  const minRows = 8;
  const emptyRowCount = Math.max(0, minRows - itemRows.length);
  const emptyRows = Array(emptyRowCount)
    .fill(null)
    .map(() => Array(colCount).fill({ text: ' ', fontSize: 7 }));

  // const legalText = `Yo, ${clientName} dejo constancia que recibí los servicios detallados en la presente factura. Esta factura es un título valor y como tal cumple con todos los requisitos del decreto ley 1231 de 2008. Autorizo expresamente para que en el caso de incumplimiento de esta obligación, sea reportado(a) al banco de datos de Fenalco (Procredito) o cualquier otra central de riesgo.\nFECHA DE VENCIMIENTO: ${invoice.endDate ? new Date(invoice.endDate + 'T12:00:00').toLocaleDateString('es-CO') : '-'}. A partir de esta fecha causarán intereses de mora a la tasa vigente, art 12, ley 446de 1998.`;

  const content: any[] = [
    {
      columns: [
        logoBase64
          ? { image: logoBase64, width: 75, height: 75, margin: [0, 0, 8, 0] }
          : { width: 75, text: issuerName, bold: true, fontSize: 10 },
        {
          width: '*',
          stack: [
            {
              text: issuerName.toUpperCase(),
              bold: true,
              fontSize: 12,
              alignment: 'center' as const
            },
            {
              text: issuerIdLine,
              fontSize: 9,
              alignment: 'center' as const
            },
            {
              text: org?.address || '',
              fontSize: 8,
              alignment: 'center' as const
            },
            {
              text: [org?.city, org?.department].filter(Boolean).join(', '),
              fontSize: 8,
              alignment: 'center' as const
            },
            {
              text: org?.email || '',
              fontSize: 8,
              alignment: 'center' as const
            },
            {
              text: org?.phone ? `Tel. ${org.phone}` : '',
              fontSize: 8,
              alignment: 'center' as const
            }
          ]
        },
        {
          // Solo se reserva el QR cuando existe (factura electrónica). En las no
          // electrónicas no hay QR: se deja una celda vacía para no dibujar el
          // placeholder, que con su margen negativo se desbordaba sobre la línea
          // verde inferior.
          width: 100,
          stack: qrContent ? [{ qr: qrContent, fit: 100 }] : [{ text: '' }],
          margin: [8, 0, 0, 0]
        }
      ],
      marginBottom: 5
    },

    {
      canvas: [
        {
          type: 'line' as const,
          x1: 0,
          y1: 0,
          x2: 576,
          y2: 0,
          lineWidth: 1.5,
          lineColor: color
        }
      ],
      marginBottom: 4
    },

    {
      columns: [
        {
          width: 135,
          table: {
            widths: ['*'],
            body: [
              [
                {
                  // El nombre del tipo de factura ya viene completo desde el
                  // backend (p. ej. "Factura de Venta Electrónica" para FVE), así
                  // que se renderiza tal cual (bilingüe) sin volver a anexar
                  // "ELECTRÓNICA"/"(ELECTRONIC)".
                  text: `${(invoice.invoiceType?.name?.['es'] || 'FACTURA DE VENTA').toUpperCase()}\n${(invoice.invoiceType?.name?.['en'] || 'SALES INVOICE').toUpperCase()}`,
                  bold: true,
                  fontSize: 9,
                  alignment: 'center' as const,
                  color,
                  margin: [4, 3, 4, 2]
                }
              ],
              [
                {
                  text: `No. ${invoice.invoiceType?.code || ''} ${invoice.code}`,
                  bold: true,
                  fontSize: 11,
                  alignment: 'center' as const,
                  margin: [4, 1, 4, 1]
                }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#cccccc',
            vLineColor: () => '#cccccc'
          }
        },
        {
          width: '*',
          stack: [
            // El bloque "RESPONSABLE DEL IVA / Microempresa" no aplica al
            // propietario (persona natural), así que se omite en esa variante.
            ...(ownerMode
              ? []
              : [
                  {
                    text: 'RESPONSABLE DEL IVA / VAT Liable',
                    bold: true,
                    fontSize: 11,
                    alignment: 'center' as const
                  },
                  {
                    text: 'Microempresa / Micro-enterprise',
                    fontSize: 8,
                    italics: true,
                    alignment: 'center' as const,
                    color: '#555555'
                  }
                ]),
            {
              text: `Generado por / Issued by: ${issuerName}`,
              fontSize: 8,
              alignment: 'center' as const,
              marginTop: 2
            },
            {
              text: `Fecha de impresión / Print date: ${printDate}`,
              fontSize: 8,
              alignment: 'center' as const
            }
          ],
          margin: [8, 2, 0, 0]
        }
      ],
      columnGap: 8,
      marginBottom: 5
    },

    {
      table: {
        widths: ['*', '*', 55],
        body: [
          [
            {
              text: 'FACTURA GENERADA POR / Issued by',
              bold: true,
              fontSize: 7,
              fillColor: color,
              color: '#fff',
              margin: [3, 2, 3, 2]
            },
            {
              text: 'FACTURADO A (pagador) / Bill to (Payor)',
              bold: true,
              fontSize: 7,
              fillColor: color,
              color: '#fff',
              margin: [3, 2, 3, 2]
            },
            {
              text: 'Página 1 de 1',
              bold: true,
              fontSize: 7,
              fillColor: color,
              color: '#fff',
              alignment: 'center' as const,
              margin: [2, 2, 2, 2]
            }
          ],
          [
            {
              stack: [{ text: employeeName || '-', bold: true, fontSize: 9 }],
              margin: [3, 3, 3, 3]
            },
            {
              stack: [
                {
                  text: [
                    { text: 'Nombre / Name: ', bold: true },
                    clientName || '-'
                  ],
                  fontSize: 8
                },
                clientIdType || clientId
                  ? {
                      text: [
                        { text: 'Documento / ID: ', bold: true },
                        `${clientIdType ? clientIdType + ' ' : ''}${clientId}`.trim()
                      ],
                      fontSize: 8
                    }
                  : {},
                clientDept
                  ? {
                      text: [
                        { text: 'Departamento / Department: ', bold: true },
                        clientDept
                      ],
                      fontSize: 8
                    }
                  : {},
                clientMuni
                  ? {
                      text: [
                        { text: 'Municipio / Municipality: ', bold: true },
                        clientMuni
                      ],
                      fontSize: 8
                    }
                  : {},
                clientAddress
                  ? {
                      text: [
                        { text: 'Dirección / Address: ', bold: true },
                        clientAddress
                      ],
                      fontSize: 8
                    }
                  : {},
                clientEmail
                  ? {
                      text: [
                        { text: 'Correo / Email: ', bold: true },
                        { text: clientEmail, color: '#1155cc' }
                      ],
                      fontSize: 8
                    }
                  : {}
              ],
              margin: [3, 3, 3, 3]
            },
            { text: '', margin: [2, 2, 2, 2] }
          ]
        ]
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#cccccc',
        vLineColor: () => '#cccccc'
      },
      marginBottom: 4
    },

  ];

  const tableWidths = ownerMode
    ? [16, 50, '*', 36, 90, 90]
    : [14, 44, '*', 32, 58, 52, 50, 60];
  const headerCells = ownerMode
    ? [
        { text: '#\nItem', ...hs, margin: [1, 2, 1, 2] },
        { text: 'REFERENCIA\nReference', ...hs, margin: [1, 2, 1, 2] },
        { text: 'CONCEPTO\nConcept', ...hs, margin: [1, 2, 1, 2] },
        { text: 'UNIDAD\nQty', ...hs, margin: [1, 2, 1, 2] },
        { text: 'VALOR UNIT.\nUnit price', ...hs, margin: [1, 2, 1, 2] },
        { text: 'TOTAL', ...hs, margin: [1, 2, 1, 2] }
      ]
    : [
        { text: '#\nItem', ...hs, margin: [1, 2, 1, 2] },
        { text: 'REFERENCIA\nReference', ...hs, margin: [1, 2, 1, 2] },
        { text: 'CONCEPTO\nConcept', ...hs, margin: [1, 2, 1, 2] },
        { text: 'UNIDAD\nQty', ...hs, margin: [1, 2, 1, 2] },
        { text: 'VALOR UNIT.\nUnit price', ...hs, margin: [1, 2, 1, 2] },
        { text: 'IVA', ...hs, margin: [1, 2, 1, 2] },
        { text: 'IPO\nINC', ...hs, margin: [1, 2, 1, 2] },
        { text: 'TOTAL', ...hs, margin: [1, 2, 1, 2] }
      ];

  content.push({
    table: {
      headerRows: 1,
      widths: tableWidths,
      body: [
        headerCells,
        ...itemRows.map((row) =>
          row.map((cell: any) => ({ ...cell, margin: [2, 2, 2, 2] }))
        ),
        ...emptyRows.map((row) =>
          row.map((cell: any) => ({ ...cell, margin: [2, 3, 2, 3] }))
        )
      ]
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#cccccc',
      vLineColor: () => '#cccccc'
    },
    marginBottom: 4
  });

  // Totales en una columna a la derecha (flex-col) para mejor lectura.
  const totalRow = (
    label: string,
    value: number,
    opts: { bold?: boolean; color?: string } = {}
  ) => [
    {
      text: label,
      bold: !!opts.bold,
      fontSize: 7,
      color: opts.color,
      fillColor: '#f2f4ef',
      alignment: 'right' as const,
      margin: [4, 2, 6, 2]
    },
    {
      text: formatCop(value),
      bold: !!opts.bold,
      fontSize: 7,
      color: opts.color,
      alignment: 'right' as const,
      margin: [4, 2, 4, 2]
    }
  ];

  content.push({
    columns: [
      { width: '*', text: '' },
      {
        width: 230,
        table: {
          widths: ['*', 100],
          // En modo propietario solo va el TOTAL (sin subtotal/IVA/IPO).
          body: ownerMode
            ? [totalRow('VALOR TOTAL / Total', total, { bold: true, color })]
            : [
                totalRow('SUBTOTAL / Subtotal', subtotalWithoutTax),
                totalRow('IVA', totalVat),
                ...(totalIco > 0
                  ? [totalRow('IPO (INC) / Consumption tax', totalIco)]
                  : []),
                totalRow('VALOR TOTAL / Total', total, { bold: true, color })
              ]
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#cccccc',
          vLineColor: () => '#cccccc'
        }
      }
    ],
    marginBottom: 2
  });

  // La nota "los precios incluyen impuestos" no aplica al propietario.
  if (!ownerMode) {
    content.push({
      text: '* Todos los precios incluyen impuestos. / All prices include taxes.',
      fontSize: 6.5,
      italics: true,
      color: '#555555',
      alignment: 'right' as const,
      marginBottom: 4
    });
  }

  content.push({
    table: {
      widths: ['*', 90],
      body: [
        [
          {
            text: `SON / Amount in words: ${numberToWords(total)}`,
            bold: true,
            fontSize: 7.5,
            margin: [3, 3, 3, 3],
            colSpan: 2
          },
          {}
        ]
      ]
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#cccccc',
      vLineColor: () => '#cccccc'
    },
    marginBottom: 4
  });

  content.push({
    stack: [
      {
        text: `FORMA DE PAGO / Payment terms: ${invoice.paidType?.name?.['es'] || ''}, MEDIO DE PAGO / Payment method: ${invoice.payType?.name?.['es'] || ''}`,
        bold: true,
        fontSize: 8
      },
      ...(Number(invoice.cash) > 0
        ? [{ text: `Efectivo / Cash: ${formatCop(Number(invoice.cash))}`, fontSize: 8 }]
        : []),
      ...(Number(invoice.transfer) > 0
        ? [{ text: `Transferencia / Transfer: ${formatCop(Number(invoice.transfer))}`, fontSize: 8 }]
        : [])
    ],
    marginBottom: 6
  });

  content.push({
    canvas: [
      {
        type: 'line' as const,
        x1: 0,
        y1: 0,
        x2: 576,
        y2: 0,
        lineWidth: 0.5,
        lineColor: '#cccccc'
      }
    ],
    marginBottom: 4
  });

  // content.push({
  //   text: legalText,
  //   fontSize: 7,
  //   alignment: 'justify' as const,
  //   marginBottom: 4
  // });

  if (invoice.invoiceElectronic && invoice.factusCufe) {
    content.push({
      stack: [
        {
          text: 'Representación impresa de la Factura Electrónica de Venta / Printed representation of the Electronic Sales Invoice',
          fontSize: 7,
          bold: true
        },
        {
          text: `CUFE: ${invoice.factusCufe}`,
          fontSize: 6.5,
          color: '#555555',
          marginTop: 2
        },
        {
          text: `Validación DIAN / DIAN validation: ${printDate}`,
          fontSize: 6.5,
          color: '#555555'
        },
        ...(invoice.factusPublicUrl
          ? [
              {
                text: `Consulta tu factura / Check your invoice: ${invoice.factusPublicUrl}`,
                fontSize: 6.5,
                color: '#1155cc',
                link: invoice.factusPublicUrl
              }
            ]
          : [])
      ],
      marginBottom: 4
    });
  }

  content.push({
    text: `"Gracias por su compañía / Thank you for your stay - Documento generado por / Document generated by ${issuerName}"`,
    alignment: 'center' as const,
    italics: true,
    fontSize: 8,
    color: '#555555'
  });

  return {
    pageSize: 'LETTER' as const,
    pageMargins: [18, 18, 18, 18],
    defaultStyle: { font: defaultFont, fontSize: 9 },
    content
  };
}

@Injectable({ providedIn: 'root' })
export class InvoicePrintService {
  private readonly _invoiceService: InvoiceService = inject(InvoiceService);
  private readonly _applicationService: ApplicationService =
    inject(ApplicationService);
  private readonly _matDialog: MatDialog = inject(MatDialog);
  private readonly _notifications: NotificationsService =
    inject(NotificationsService);
  private readonly _platformId = inject(PLATFORM_ID);
  private _org: Organizational | null = null;

  constructor() {
    this._applicationService.currentOrg$.subscribe((org) => {
      this._org = org;
    });
  }

  /**
   * Imprime preguntando el emisor cuando aplica (factura de venta normal):
   * abre el diálogo samawe/propietario. Para los demás tipos imprime directo.
   */
  async promptAndPrint(invoice: Invoice): Promise<void> {
    const issuer = await this.resolveIssuerChoice(invoice);
    if (!issuer) return;
    await this.printInvoice(invoice, issuer);
  }

  async promptAndDownload(invoice: Invoice): Promise<void> {
    const issuer = await this.resolveIssuerChoice(invoice);
    if (!issuer) return;
    await this.downloadInvoice(invoice, issuer);
  }

  async printInvoice(
    invoice: Invoice,
    issuer: InvoiceIssuer = 'org'
  ): Promise<void> {
    if (!isPlatformBrowser(this._platformId)) return;
    const owner = await this.resolveOwnerFor(issuer);
    if (issuer === 'owner' && !owner) return;
    const { pdfMake, defaultFont } = await loadPdfMake();
    const doc = await buildInvoiceDoc(invoice, this._org, defaultFont, {
      ownerMode: issuer === 'owner',
      owner: owner ?? undefined
    });
    pdfMake.createPdf(doc).print();
  }

  async downloadInvoice(
    invoice: Invoice,
    issuer: InvoiceIssuer = 'org'
  ): Promise<void> {
    if (!isPlatformBrowser(this._platformId)) return;
    const owner = await this.resolveOwnerFor(issuer);
    if (issuer === 'owner' && !owner) return;
    const { pdfMake, defaultFont } = await loadPdfMake();
    const doc = await buildInvoiceDoc(invoice, this._org, defaultFont, {
      ownerMode: issuer === 'owner',
      owner: owner ?? undefined
    });
    const fecha = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
    pdfMake.createPdf(doc).download(`Factura_${invoice.code}_${fecha}.pdf`);
  }

  async downloadInvoiceById(invoiceId: number): Promise<void> {
    if (!isPlatformBrowser(this._platformId)) return;
    const res = await firstValueFrom(
      this._invoiceService.getInvoiceToEdit(invoiceId)
    );
    if (res?.data) await this.promptAndDownload(res.data);
  }

  /**
   * Decide el emisor: solo las facturas de venta normales (FV, no electrónicas)
   * preguntan; el resto siempre va con la organización.
   */
  private async resolveIssuerChoice(
    invoice: Invoice
  ): Promise<InvoiceIssuer | null> {
    if (!isPlatformBrowser(this._platformId)) return 'org';
    const isNormalSale =
      invoice.invoiceType?.code === 'FV' &&
      !invoice.invoiceElectronic &&
      !invoice.factusNumber;
    if (!isNormalSale) return 'org';
    const owner = await this.resolveOwner();
    const ref = this._matDialog.open(InvoiceIssuerDialogComponent, {
      width: '520px',
      maxWidth: '92vw',
      data: { hasOwner: !!owner }
    });
    const choice = await firstValueFrom(ref.afterClosed());
    return (choice as InvoiceIssuer) ?? null;
  }

  /** Resuelve los datos del propietario solo si el emisor es 'owner'. */
  private async resolveOwnerFor(
    issuer: InvoiceIssuer
  ): Promise<OwnerInfo | null> {
    if (issuer !== 'owner') return null;
    const owner = await this.resolveOwner();
    if (!owner) {
      this._notifications.showNotification(
        'error',
        'invoice.issuer_dialog.no_owner',
        'invoice.issuer_dialog.title'
      );
      return null;
    }
    return owner;
  }

  /** Trae el representante legal (propietario) vinculado a la organización. */
  private async resolveOwner(): Promise<OwnerInfo | null> {
    const orgId = this._org?.organizationalId;
    if (!orgId) return null;
    try {
      const res = await firstValueFrom(
        this._applicationService.getOrganization(orgId)
      );
      const rep = res?.data?.legalRepresentative;
      if (!rep) return null;
      const name = `${rep.firstName || ''} ${rep.lastName || ''}`.trim();
      if (!name) return null;
      return {
        name,
        idTypeCode: rep.identificationType?.code || 'CC',
        idNumber: rep.identificationNumber || ''
      };
    } catch {
      return null;
    }
  }
}

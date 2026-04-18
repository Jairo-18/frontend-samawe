import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { InvoiceService } from '../../invoices/services/invoice.service';
import { Invoice } from '../../invoices/interface/invoice.interface';
import { InvoiceDetail } from '../../invoices/interface/invoiceDetaill.interface';
import { ApplicationService } from '../../organizational/services/application.service';
import { Organizational } from '../interfaces/organizational.interface';
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

function formatHotelDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    const months = [
      'ENE',
      'FEB',
      'MAR',
      'ABR',
      'MAY',
      'JUN',
      'JUL',
      'AGO',
      'SEP',
      'OCT',
      'NOV',
      'DIC'
    ];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month}. ${year} ${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
  } catch {
    return '-';
  }
}

function calcNights(start?: string | null, end?: string | null): number {
  if (!start || !end) return 0;
  const d1 = new Date(start);
  const d2 = new Date(end);
  return Math.max(
    0,
    Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
  );
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

function itemTaxAmount(d: InvoiceDetail): number {
  return (d.totalVat || 0) + (d.totalIco8 || 0) + (d.totalIco5 || 0);
}

function itemRef(d: InvoiceDetail): string {
  return (
    d.product?.code ||
    (d.accommodation as any)?.code ||
    d.excursion?.code ||
    '-'
  );
}

function itemConcept(d: InvoiceDetail): string {
  return (
    d.product?.name ||
    (d.accommodation as any)?.name ||
    d.excursion?.name ||
    'N/A'
  );
}

async function buildInvoiceDoc(
  invoice: Invoice,
  org: Organizational | null | undefined,
  defaultFont = 'Roboto'
): Promise<object> {
  const color = getColor(org);

  const logoMedia = org?.medias?.find((m) => m.mediaType?.code === 'LOGO');
  const logoBase64 = logoMedia?.url
    ? await imageUrlToBase64(logoMedia.url)
    : null;

  const printDate = new Date().toLocaleString('es-CO');
  const printDateFormatted = formatHotelDate(new Date().toISOString());
  const hs = {
    bold: true,
    color: '#fff',
    fontSize: 7,
    fillColor: color,
    alignment: 'center' as const
  };

  const accommodationDetail = (invoice.invoiceDetails || []).find(
    (d) => d.accommodation
  );
  const hasAccommodation = !!accommodationDetail;

  let balance = 0;
  const itemRows = (invoice.invoiceDetails || []).map((d, i) => {
    const cargo = itemCargo(d);
    const tax = itemTaxAmount(d);
    const taxPct = d.taxeType?.percentage ?? 0;
    const dateStr = d.startDate ? formatHotelDate(d.startDate) : '';
    balance += cargo;
    return [
      { text: String(i + 1), fontSize: 7, alignment: 'center' as const },
      { text: dateStr, fontSize: 7, alignment: 'center' as const },
      { text: itemRef(d), fontSize: 7, alignment: 'center' as const },
      { text: itemConcept(d), fontSize: 7 },
      { text: `${taxPct},0`, fontSize: 7, alignment: 'center' as const },
      { text: formatCop(tax), fontSize: 7, alignment: 'right' as const },
      { text: formatCop(cargo), fontSize: 7, alignment: 'right' as const },
      { text: formatCop(balance), fontSize: 7, alignment: 'right' as const }
    ];
  });

  const total = Number(invoice.total || 0);
  if (total > 0) {
    itemRows.push([
      { text: '', fontSize: 7, alignment: 'center' as const },
      {
        text: printDate.split(',')[0],
        fontSize: 7,
        alignment: 'center' as const
      },
      {
        text: invoice.payType?.code || '',
        fontSize: 7,
        alignment: 'center' as const
      },
      {
        text: `Estado pago: ${invoice.paidType?.name || ''} - Medio pago: ${invoice.payType?.name || ''}`,
        fontSize: 7
      },
      { text: '', fontSize: 7, alignment: 'center' as const },
      { text: '', fontSize: 7, alignment: 'right' as const },
      {
        text: `(${formatCop(total)})`,
        fontSize: 7,
        alignment: 'right' as const
      },
      { text: formatCop(0), fontSize: 7, alignment: 'right' as const }
    ] as any);
  }

  const clientName =
    `${invoice.user?.firstName || ''} ${invoice.user?.lastName || ''}`.trim();
  const clientId = invoice.user?.identificationNumber || '';
  const clientIdType = (invoice.user as any)?.identificationType?.code || '';
  const employeeName =
    `${invoice.employee?.firstName || ''} ${invoice.employee?.lastName || ''}`.trim();
  const subtotalWithoutTax = Number(invoice.subtotalWithoutTax || 0);
  const totalVat = invoice.totalVat || 0;
  const totalIco8 = invoice.totalIco8 || 0;
  const totalIco5 = invoice.totalIco5 || 0;
  const totalIco = totalIco8 + totalIco5;
  const paidName = invoice.paidType?.name || '';
  const isPaid = paidName.toUpperCase().includes('PAGADO');

  const checkIn = accommodationDetail?.startDate || invoice.startDate;
  const checkOut = accommodationDetail?.endDate || invoice.endDate;
  const nights = calcNights(checkIn, checkOut);
  const roomName = (accommodationDetail?.accommodation as any)?.name || '-';
  const numPersons = accommodationDetail?.amount || '-';
  const tarifa = accommodationDetail
    ? formatCop(Number(accommodationDetail.priceWithoutTax || 0))
    : '-';

  const minRows = 8;
  const emptyRowCount = Math.max(0, minRows - itemRows.length);
  const emptyRows = Array(emptyRowCount)
    .fill(null)
    .map(() => Array(8).fill({ text: ' ', fontSize: 7 }));

  // const legalText = `Yo, ${clientName} dejo constancia que recibí los servicios detallados en la presente factura. Esta factura es un título valor y como tal cumple con todos los requisitos del decreto ley 1231 de 2008. Autorizo expresamente para que en el caso de incumplimiento de esta obligación, sea reportado(a) al banco de datos de Fenalco (Procredito) o cualquier otra central de riesgo.\nFECHA DE VENCIMIENTO: ${invoice.endDate ? new Date(invoice.endDate + 'T12:00:00').toLocaleDateString('es-CO') : '-'}. A partir de esta fecha causarán intereses de mora a la tasa vigente, art 12, ley 446de 1998.`;

  const content: any[] = [
    {
      columns: [
        logoBase64
          ? { image: logoBase64, width: 75, height: 75, margin: [0, 0, 8, 0] }
          : { width: 75, text: org?.legalName || '', bold: true, fontSize: 10 },
        {
          width: '*',
          stack: [
            {
              text: (org?.legalName || org?.name || '').toUpperCase(),
              bold: true,
              fontSize: 12,
              alignment: 'center' as const
            },
            {
              text: `${org?.identificationType?.code || 'NIT'} ${org?.identificationNumber || ''}`,
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
          width: 75,
          stack: [
            {
              canvas: [
                {
                  type: 'rect' as const,
                  x: 0,
                  y: 0,
                  w: 70,
                  h: 70,
                  lineWidth: 1,
                  lineColor: '#cccccc',
                  dash: { length: 3 }
                }
              ]
            },
            {
              text: 'QR',
              fontSize: 7,
              color: '#aaaaaa',
              alignment: 'center' as const,
              margin: [0, -43, 0, 0]
            }
          ],
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
                  text: invoice.invoiceElectronic
                    ? `${(invoice.invoiceType?.name || 'FACTURA DE VENTA').toUpperCase()}\nELECTRÓNICA`
                    : (
                        invoice.invoiceType?.name || 'FACTURA DE VENTA'
                      ).toUpperCase(),
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
            {
              text: 'RESPONSABLE DEL IVA',
              bold: true,
              fontSize: 11,
              alignment: 'center' as const
            },
            {
              text: `Generado por: ${org?.legalName}`,
              fontSize: 8,
              alignment: 'center' as const,
              marginTop: 2
            },
            {
              text: `Fecha de impresión: ${printDate}`,
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
              text: 'SERVICIO PRESTADO A / Services Rendered to',
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
              stack: [
                { text: clientName, bold: true, fontSize: 9 },
                clientIdType
                  ? { text: `${clientIdType}: ${clientId}`, fontSize: 8 }
                  : {},
                !clientIdType && clientId
                  ? { text: `ID: ${clientId}`, fontSize: 8 }
                  : {}
              ],
              margin: [3, 3, 3, 3]
            },
            {
              stack: [
                { text: clientName, bold: true, fontSize: 9 },
                clientIdType
                  ? { text: `${clientIdType}: ${clientId}`, fontSize: 8 }
                  : {},
                !clientIdType && clientId
                  ? { text: `ID: ${clientId}`, fontSize: 8 }
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

    {
      table: {
        widths: ['*', '*', '*'],
        body: [
          [
            {
              text: 'FECHA Y HORA DE EXPEDICION\nDate & Time of Preparation',
              bold: true,
              fontSize: 6.5,
              alignment: 'center' as const,
              fillColor: '#eeeeee',
              margin: [2, 2, 2, 2]
            },
            {
              text: 'FECHA DE VENCIMIENTO\nExpiration date',
              bold: true,
              fontSize: 6.5,
              alignment: 'center' as const,
              fillColor: '#eeeeee',
              margin: [2, 2, 2, 2]
            },
            {
              text: 'No. TARJETA REGISTRO HOTELERO\nHotel Registry Card No.',
              bold: true,
              fontSize: 6.5,
              alignment: 'center' as const,
              fillColor: '#eeeeee',
              margin: [2, 2, 2, 2]
            }
          ],
          [
            {
              text: printDateFormatted,
              fontSize: 8,
              alignment: 'center' as const,
              margin: [2, 3, 2, 3]
            },
            {
              text: invoice.endDate
                ? formatHotelDate(invoice.endDate + 'T12:00:00')
                : printDateFormatted,
              fontSize: 8,
              alignment: 'center' as const,
              margin: [2, 3, 2, 3]
            },
            {
              text: invoice.tableNumber || '-',
              fontSize: 8,
              alignment: 'center' as const,
              margin: [2, 3, 2, 3]
            }
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
    }
  ];

  if (hasAccommodation) {
    content.push({
      table: {
        widths: [70, 45, '*', '*', 30, 60],
        body: [
          [
            {
              text: 'No. PERSONAS\nNumber of Guests',
              bold: true,
              fontSize: 6.5,
              alignment: 'center' as const,
              fillColor: '#eeeeee',
              margin: [2, 2, 2, 2]
            },
            {
              text: 'TARIFA\nRate',
              bold: true,
              fontSize: 6.5,
              alignment: 'center' as const,
              fillColor: '#eeeeee',
              margin: [2, 2, 2, 2]
            },
            {
              text: 'FECHA Y HORA DE ENTRADA\nDate & Time of Arrival',
              bold: true,
              fontSize: 6.5,
              alignment: 'center' as const,
              fillColor: '#eeeeee',
              margin: [2, 2, 2, 2]
            },
            {
              text: 'FECHA Y HORA DE SALIDA\nDate & Time of Departure',
              bold: true,
              fontSize: 6.5,
              alignment: 'center' as const,
              fillColor: '#eeeeee',
              margin: [2, 2, 2, 2]
            },
            {
              text: 'NOCHES\nNights',
              bold: true,
              fontSize: 6.5,
              alignment: 'center' as const,
              fillColor: '#eeeeee',
              margin: [2, 2, 2, 2]
            },
            {
              text: 'HABITACION / Room\nSALON / Meeting Room',
              bold: true,
              fontSize: 6.5,
              alignment: 'center' as const,
              fillColor: '#eeeeee',
              margin: [2, 2, 2, 2]
            }
          ],
          [
            {
              text: `Adultos/Adults\n${numPersons}`,
              fontSize: 7.5,
              alignment: 'center' as const,
              margin: [2, 3, 2, 3]
            },
            {
              text: tarifa,
              fontSize: 7.5,
              alignment: 'center' as const,
              margin: [2, 3, 2, 3]
            },
            {
              text: formatHotelDate(checkIn),
              fontSize: 7.5,
              alignment: 'center' as const,
              margin: [2, 3, 2, 3]
            },
            {
              text: formatHotelDate(checkOut),
              fontSize: 7.5,
              alignment: 'center' as const,
              margin: [2, 3, 2, 3]
            },
            {
              text: String(nights),
              fontSize: 7.5,
              alignment: 'center' as const,
              margin: [2, 3, 2, 3]
            },
            {
              text: roomName,
              bold: true,
              fontSize: 11,
              alignment: 'center' as const,
              margin: [2, 3, 2, 3]
            }
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
  }

  content.push({
    table: {
      headerRows: 1,
      widths: [14, 42, 38, '*', 20, 52, 52, 52],
      body: [
        [
          { text: '#\nItem', ...hs, margin: [1, 2, 1, 2] },
          { text: 'FECHA\nDate', ...hs, margin: [1, 2, 1, 2] },
          { text: 'REFERENCIA\nReference', ...hs, margin: [1, 2, 1, 2] },
          { text: 'CONCEPTOS\nConcepts', ...hs, margin: [1, 2, 1, 2] },
          { text: '% Imp', ...hs, margin: [1, 2, 1, 2] },
          { text: 'Impuestos', ...hs, margin: [1, 2, 1, 2] },
          { text: 'CARGOS\nCharges', ...hs, margin: [1, 2, 1, 2] },
          { text: 'SALDO\nBalance', ...hs, margin: [1, 2, 1, 2] }
        ],
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

  content.push({
    table: {
      widths: [55, 45, 45, 45, 45, 55, '*'],
      body: [
        [
          {
            text: 'SUBTOTAL / Subtotal',
            bold: true,
            fontSize: 6.5,
            fillColor: '#eeeeee',
            alignment: 'center' as const,
            margin: [2, 2, 2, 1]
          },
          {
            text: 'TOTAL IVA / Taxes',
            bold: true,
            fontSize: 6.5,
            fillColor: '#eeeeee',
            alignment: 'center' as const,
            margin: [2, 2, 2, 1]
          },
          {
            text: 'TOTAL ICO / Taxes',
            bold: true,
            fontSize: 6.5,
            fillColor: '#eeeeee',
            alignment: 'center' as const,
            margin: [2, 2, 2, 1]
          },
          {
            text: 'Exentos / Untaxed',
            bold: true,
            fontSize: 6.5,
            fillColor: '#eeeeee',
            alignment: 'center' as const,
            margin: [2, 2, 2, 1]
          },
          {
            text: 'Propina/Tip',
            bold: true,
            fontSize: 6.5,
            fillColor: '#eeeeee',
            alignment: 'center' as const,
            margin: [2, 2, 2, 1]
          },
          {
            text: 'Retenciones/\nWithholding',
            bold: true,
            fontSize: 6.5,
            fillColor: '#eeeeee',
            alignment: 'center' as const,
            margin: [2, 2, 2, 1]
          },
          {
            text: 'VALOR TOTAL / Total',
            bold: true,
            fontSize: 6.5,
            fillColor: '#eeeeee',
            alignment: 'center' as const,
            margin: [2, 2, 2, 1]
          }
        ],
        [
          {
            text: formatCop(subtotalWithoutTax),
            fontSize: 8,
            alignment: 'right' as const,
            margin: [2, 2, 4, 2]
          },
          {
            text: formatCop(totalVat),
            fontSize: 8,
            alignment: 'right' as const,
            margin: [2, 2, 4, 2]
          },
          {
            text: formatCop(totalIco),
            fontSize: 8,
            alignment: 'right' as const,
            margin: [2, 2, 4, 2]
          },
          {
            text: formatCop(0),
            fontSize: 8,
            alignment: 'right' as const,
            margin: [2, 2, 4, 2]
          },
          {
            text: formatCop(0),
            fontSize: 8,
            alignment: 'right' as const,
            margin: [2, 2, 4, 2]
          },
          {
            text: formatCop(0),
            fontSize: 8,
            alignment: 'right' as const,
            margin: [2, 2, 4, 2]
          },
          {
            text: formatCop(total),
            fontSize: 8,
            alignment: 'right' as const,
            bold: true,
            color,
            margin: [2, 2, 4, 2]
          }
        ]
      ]
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#cccccc',
      vLineColor: () => '#cccccc'
    },
    marginBottom: 2
  });

  content.push({
    text: '* Todos los precios incluyen impuestos.',
    fontSize: 6.5,
    italics: true,
    color: '#555555',
    alignment: 'right' as const,
    marginBottom: 4
  });

  content.push({
    table: {
      widths: ['*', 90],
      body: [
        [
          {
            text: `SON: ${numberToWords(total)}`,
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
        text: `FORMA DE PAGO: ${invoice.paidType?.name || ''}, MEDIO DE PAGO: ${invoice.payType?.name || ''}`,
        bold: true,
        fontSize: 8
      },
      ...(Number(invoice.cash) > 0
        ? [{ text: `Efectivo: ${formatCop(Number(invoice.cash))}`, fontSize: 8 }]
        : []),
      ...(Number(invoice.transfer) > 0
        ? [{ text: `Transferencia: ${formatCop(Number(invoice.transfer))}`, fontSize: 8 }]
        : [])
    ],
    columnGap: 20,
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

  // if (invoice.invoiceElectronic) {
  //   content.push({
  //     stack: [
  //       {
  //         text: 'Representación impresa de la factura electrónica, Firma Electrónica y Cufe:',
  //         fontSize: 7,
  //         bold: true
  //       },
  //       {
  //         text: `CUFE - Factura Nro. ${invoice.invoiceType?.code || ''} ${invoice.code}`,
  //         fontSize: 6.5,
  //         color: '#555555',
  //         marginTop: 2
  //       },
  //       {
  //         text: `Fecha Validación Dian - ${printDate}`,
  //         fontSize: 6.5,
  //         color: '#555555'
  //       },
  //       { text: 'FIRMA -', fontSize: 6.5, color: '#555555' }
  //     ],
  //     marginBottom: 4
  //   });
  // }

  content.push({
    text: `"Gracias por su compañía - Documento generado por ${org?.legalName || ''}"`,
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
  private readonly _platformId = inject(PLATFORM_ID);
  private _org: Organizational | null = null;

  constructor() {
    this._applicationService.currentOrg$.subscribe((org) => {
      this._org = org;
    });
  }

  async printInvoice(invoice: Invoice, _element: HTMLElement): Promise<void> {
    if (!isPlatformBrowser(this._platformId)) return;
    const { pdfMake, defaultFont } = await loadPdfMake();
    const doc = await buildInvoiceDoc(invoice, this._org, defaultFont);
    pdfMake.createPdf(doc).print();
  }

  async downloadInvoice(
    invoice: Invoice,
    _element: HTMLElement
  ): Promise<void> {
    if (!isPlatformBrowser(this._platformId)) return;
    const { pdfMake, defaultFont } = await loadPdfMake();
    const doc = await buildInvoiceDoc(invoice, this._org, defaultFont);
    const fecha = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
    pdfMake.createPdf(doc).download(`Factura_${invoice.code}_${fecha}.pdf`);
  }

  async downloadInvoiceById(invoiceId: number): Promise<void> {
    if (!isPlatformBrowser(this._platformId)) return;
    const res = await firstValueFrom(
      this._invoiceService.getInvoiceToEdit(invoiceId)
    );
    if (res?.data) await this.downloadInvoice(res.data, null as any);
  }
}

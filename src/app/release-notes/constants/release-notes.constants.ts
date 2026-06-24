/**
 * Contenido (bilingüe) de la vista "Notas de versión". Es texto orientado al
 * usuario final del panel: qué se agregó y cómo se usa. Se mantiene como
 * constante (no i18n json) por el volumen y para tenerlo todo en un solo lugar.
 * Al publicar una nueva tanda de cambios, agregar una nueva ReleaseSection
 * arriba del array (las más recientes primero).
 */

export interface ReleaseNote {
  /** Icono de Material para la tarjeta. */
  icon: string;
  /** Título corto de la funcionalidad. */
  title: string;
  /** Qué es / qué hace, en una o dos frases. */
  description: string;
  /** Pasos de "cómo se usa" (opcional). */
  howTo?: string[];
  /** Nota o advertencia destacada (opcional). */
  note?: string;
}

export interface ReleaseSection {
  /** Etiqueta de versión (p. ej. "Junio 2026"). */
  version: string;
  /** Fecha legible. */
  date: string;
  notes: ReleaseNote[];
}

type Lang = 'es' | 'en';

const ES: ReleaseSection[] = [
  {
    version: 'Junio 2026',
    date: 'Junio 2026',
    notes: [
      {
        icon: 'receipt_long',
        title: 'Facturación electrónica (DIAN · Factus)',
        description:
          'Ya puedes emitir facturas electrónicas válidas ante la DIAN directamente desde una factura de venta. Por ahora solo de contado.',
        howTo: [
          'Abre o crea una factura de venta con su cliente e ítems.',
          'Pulsa “Enviar a la DIAN” / emitir. La factura queda con número oficial, CUFE y QR.',
          'El cliente recibe automáticamente un correo con el PDF y el enlace a la factura oficial.'
        ],
        note: 'El cliente debe tener un tipo y número de documento válidos. Para documentos colombianos (CC/NIT/TI/RC) se pide departamento y municipio.'
      },
      {
        icon: 'description',
        title: 'Facturación separada por tipo',
        description:
          'El menú “Facturación” ahora se divide en cuatro vistas, cada una lista solo su tipo de documento.',
        howTo: [
          'Facturación electrónica: facturas ya emitidas a la DIAN.',
          'Facturas de venta: ventas normales (no electrónicas).',
          'Facturas de compra: compras a proveedores.',
          'Cotizaciones: documentos previos a la venta.'
        ]
      },
      {
        icon: 'undo',
        title: 'Notas crédito electrónicas',
        description:
          'Corrige o anula una factura electrónica ya emitida sin alterar la original. Puede ser parcial (devolver algunos ítems) o total (anular toda la factura).',
        howTo: [
          'Entra a “Facturación electrónica”.',
          'En la factura, abre el menú ⋮ y elige “Nota crédito”.',
          'Marca “Anular total” o selecciona los ítems y cantidades a devolver, agrega una observación y confirma.',
          'El cliente recibe la nota crédito oficial por correo y el inventario se devuelve automáticamente.'
        ],
        note: 'La factura original nunca se borra ni se modifica: la nota crédito la contrarresta. El total que ves en la lista es el neto (factura menos notas crédito).'
      },
      {
        icon: 'badge',
        title: 'Factura del propietario',
        description:
          'Permite imprimir o descargar una factura de venta a nombre del propietario (persona natural), sin desglosar impuestos.',
        howTo: [
          'Primero vincula al propietario en Aplicación (ver más abajo).',
          'En una factura de venta normal, pulsa Imprimir o Descargar.',
          'Elige “Factura del propietario” en el diálogo que aparece.'
        ],
        note: 'Solo aplica a facturas de venta no electrónicas. El total es idéntico; solo cambia el emisor y se ocultan los impuestos.'
      },
      {
        icon: 'manage_accounts',
        title: 'Propietario / representante legal en Aplicación',
        description:
          'Ahora puedes vincular a un usuario existente como propietario del negocio, independiente de los datos de la empresa.',
        howTo: [
          'Ve a Aplicación.',
          'En la sección “Propietario / Representante legal”, busca y selecciona al usuario.',
          'Guarda. Ese propietario se usará en la “Factura del propietario”.'
        ]
      },
      {
        icon: 'location_on',
        title: 'Departamento y municipio en clientes',
        description:
          'Los clientes pueden tener ubicación DANE (departamento y municipio), necesaria para la facturación electrónica colombiana.',
        howTo: [
          'Al crear o editar un usuario, selecciona departamento y luego municipio.',
          'Para documentos extranjeros (CE/PAS) estos campos se ocultan y no son obligatorios.'
        ]
      },
      {
        icon: 'attach_money',
        title: 'Reportes y ganancias con neto',
        description:
          'Las ventas electrónicas ahora cuentan en reportes y ganancias, y se les resta automáticamente el valor de las notas crédito.',
        note: 'Si emites una nota crédito, los reportes reflejan el valor neto de la venta.'
      },
      {
        icon: 'notifications_active',
        title: 'Notificaciones de restaurante',
        description:
          'Las notificaciones de órdenes y cocina ahora llegan en vivo a todos los roles correspondientes, incluido el superadministrador.'
      },
      {
        icon: 'text_fields',
        title: 'Textos más legibles',
        description:
          'Nombres, listas y filtros se muestran con mayúsculas correctas (Title Case), respetando siglas como IVA y nombres propios como “Bogotá, D.C.”.'
      },
      {
        icon: 'picture_as_pdf',
        title: 'Representación PDF mejorada',
        description:
          'El PDF de la factura (al descargar y en el correo) muestra los mismos datos, con el QR de la DIAN en las electrónicas y la sección “Facturado a” bien rotulada.'
      }
    ]
  }
];

const EN: ReleaseSection[] = [
  {
    version: 'June 2026',
    date: 'June 2026',
    notes: [
      {
        icon: 'receipt_long',
        title: 'Electronic invoicing (DIAN · Factus)',
        description:
          'You can now issue DIAN-valid electronic invoices straight from a sales invoice. Cash payments only for now.',
        howTo: [
          'Open or create a sales invoice with its customer and items.',
          'Press “Send to DIAN” / issue. The invoice gets an official number, CUFE and QR code.',
          'The customer automatically receives an email with the PDF and a link to the official invoice.'
        ],
        note: 'The customer needs a valid document type and number. For Colombian documents (CC/NIT/TI/RC) department and municipality are required.'
      },
      {
        icon: 'description',
        title: 'Invoicing split by type',
        description:
          'The “Invoicing” menu is now split into four views, each listing only its document type.',
        howTo: [
          'Electronic invoicing: invoices already issued to DIAN.',
          'Sales invoices: regular (non-electronic) sales.',
          'Purchase invoices: supplier purchases.',
          'Quotes: pre-sale documents.'
        ]
      },
      {
        icon: 'undo',
        title: 'Electronic credit notes',
        description:
          'Correct or void an already-issued electronic invoice without changing the original. Can be partial (return some items) or total (void the whole invoice).',
        howTo: [
          'Go to “Electronic invoicing”.',
          'On the invoice, open the ⋮ menu and choose “Credit note”.',
          'Check “Void total” or select the items and quantities to return, add a note and confirm.',
          'The customer receives the official credit note by email and inventory is restored automatically.'
        ],
        note: 'The original invoice is never deleted or changed: the credit note offsets it. The total in the list is the net amount (invoice minus credit notes).'
      },
      {
        icon: 'badge',
        title: 'Owner invoice',
        description:
          'Lets you print or download a sales invoice in the owner’s name (natural person), without breaking down taxes.',
        howTo: [
          'First link the owner in Application (see below).',
          'On a regular sales invoice, press Print or Download.',
          'Choose “Owner invoice” in the dialog that appears.'
        ],
        note: 'Only applies to non-electronic sales invoices. The total is identical; only the issuer changes and taxes are hidden.'
      },
      {
        icon: 'manage_accounts',
        title: 'Owner / legal representative in Application',
        description:
          'You can now link an existing user as the business owner, separate from the company data.',
        howTo: [
          'Go to Application.',
          'In the “Owner / Legal representative” section, search and select the user.',
          'Save. That owner is used for the “Owner invoice”.'
        ]
      },
      {
        icon: 'location_on',
        title: 'Department and municipality for customers',
        description:
          'Customers can have a DANE location (department and municipality), required for Colombian electronic invoicing.',
        howTo: [
          'When creating or editing a user, select department and then municipality.',
          'For foreign documents (CE/PAS) these fields are hidden and not required.'
        ]
      },
      {
        icon: 'attach_money',
        title: 'Reports and earnings with net values',
        description:
          'Electronic sales now count in reports and earnings, and credit notes are automatically subtracted.',
        note: 'If you issue a credit note, reports reflect the net value of the sale.'
      },
      {
        icon: 'notifications_active',
        title: 'Restaurant notifications',
        description:
          'Order and kitchen notifications now arrive live to all the relevant roles, including the super administrator.'
      },
      {
        icon: 'text_fields',
        title: 'More readable text',
        description:
          'Names, lists and filters now show proper capitalization (Title Case), keeping acronyms like IVA and proper names like “Bogotá, D.C.”.'
      },
      {
        icon: 'picture_as_pdf',
        title: 'Improved PDF representation',
        description:
          'The invoice PDF (on download and in email) shows the same data, with the DIAN QR on electronic invoices and a properly labeled “Billed to” section.'
      }
    ]
  }
];

export const RELEASE_NOTES: Record<Lang, ReleaseSection[]> = { es: ES, en: EN };

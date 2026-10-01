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
    version: 'Octubre 2026',
    date: 'Octubre 2026',
    notes: [
      {
        icon: 'account_balance_wallet',
        title: 'Facturas a crédito con plazo y abonos',
        description:
          'Una venta a crédito ahora lleva un plazo de 30, 60 o 90 días (una cuota cada 30 días) y se le van registrando abonos hasta saldarla. Verás cuánto se ha abonado, cuánto falta y qué cuotas están vencidas.',
        howTo: [
          'Crea la venta con tipo de pago “Crédito”. En el estado de pago queda “Pendiente”.',
          'Abre la factura: aparece el panel “Crédito y abonos”. Elige el plazo.',
          'Para cada pago del cliente pulsa “Registrar abono” (monto, medio de pago y fecha), o “Abonar todo” para pagar el saldo completo.',
          'Cuando el saldo llega a cero, el estado de pago pasa solo a “Pagado”. Si borras un abono, vuelve a “Pendiente”.'
        ],
        note: 'Cambiar el plazo no borra los abonos, pero el plazo vuelve a contar desde hoy: una cuota que estaba vencida deja de figurar así. Por eso la aplicación te pide confirmar. Un abono nunca puede superar el saldo.'
      },
      {
        icon: 'request_quote',
        title: 'Cuentas por cobrar y cartera',
        description:
          'Una vista con todo lo que los clientes nos deben a crédito, con las vencidas primero. En las listas de facturas, cada venta a crédito muestra lo abonado y el saldo.',
        howTo: [
          'En el menú, “Facturación” → “Cuentas por cobrar”. Pulsa una fila para abrir la factura y registrar abonos.',
          'En “Reportes / Ganancias” hay dos tarjetas nuevas: la cartera a crédito (vendido, cobrado y lo que nos deben) y las facturas por cobrar, que llevan a cada factura con un clic.'
        ],
        note: 'Las ventas a crédito antiguas no tienen plazo y aparecen como “Sin plazo”. Para registrarles abonos o emitirlas hay que elegirles uno.'
      },
      {
        icon: 'event',
        title: 'El plazo se pide al enviar a la DIAN',
        description:
          'La DIAN exige la fecha de vencimiento en una venta a crédito. Si al enviarla la factura no tiene plazo (o el plazo ya venció), la aplicación te pide elegirlo ahí mismo y te muestra la fecha resultante.',
        note: 'El plazo cuenta desde hoy. A la DIAN solo viaja la fecha de vencimiento final: las cuotas y los abonos son de control interno.'
      },
      {
        icon: 'receipt_long',
        title: 'Ver las notas y la factura de Factus',
        description:
          'Desde el menú ⋮ de una factura electrónica puedes ver todas sus notas crédito, débito y de ajuste, con su detalle, y abrir la versión oficial en Factus.',
        howTo: [
          'Abre el menú ⋮ de la factura y elige “Ver notas” o “Ver factura en Factus”.',
          'En “Ver notas” pulsa el ojo para ver el detalle de una nota, o el ícono de enlace para abrirla en Factus.'
        ],
        note: 'En facturación electrónica y en documentos soporte la lista va ordenada por número de Factus, el orden oficial ante la DIAN. La etiqueta verde “Enviada a la DIAN” indica que ya está emitida.'
      },
      {
        icon: 'undo',
        title: 'Anular una nota débito',
        description:
          'Factus no permite anular una nota débito ya validada por la DIAN. Lo que se hace —y lo que acepta la DIAN— es emitir una nota crédito sobre la factura que cubra también el valor de la nota débito.',
        howTo: [
          'Abre “Nota crédito” de la factura. Si tiene notas débito pendientes, aparece la casilla “Anular también las notas débito pendientes”.',
          'Márcala: la nota crédito incluirá los conceptos de la nota débito. Si la factura ya estaba anulada, la nota solo neutraliza la nota débito.'
        ],
        note: 'Una nota débito neutralizada se marca como tal. Es una función nueva: conviene probarla primero con un caso pequeño.'
      },
      {
        icon: 'rule',
        title: 'Reglas nuevas del documento soporte',
        description:
          'Como lo exige la DIAN, el documento soporte solo se emite a personas naturales que no sean responsables de IVA, y la compra no lleva impuestos.',
        note: 'Si el proveedor es una empresa o responsable de IVA, la aplicación lo avisa: lo que corresponde es pedirle su factura. En compras a quien no es responsable de IVA, el impuesto queda fijo en “Sin impuesto”. Una factura en $0 tampoco se puede emitir ni corregir con notas.'
      },
      {
        icon: 'picture_as_pdf',
        title: 'Correcciones',
        description:
          'Los PDF de las facturas vuelven a generarse y a adjuntarse al correo, y el Excel de facturas seleccionadas funciona de nuevo.'
      }
    ]
  },
  {
    version: 'Septiembre 2026',
    date: 'Septiembre 2026',
    notes: [
      {
        icon: 'fact_check',
        title: 'Los cinco documentos de la DIAN',
        description:
          'Además de la factura y la nota crédito, ahora puedes emitir nota débito, documento soporte y nota de ajuste. Cada documento tiene su propia numeración oficial.',
        note: 'Qué corrige cada uno: la nota crédito y la nota débito corrigen una factura; la nota de ajuste corrige un documento soporte. No se mezclan.'
      },
      {
        icon: 'trending_up',
        title: 'Nota débito',
        description:
          'Cobra un valor adicional sobre una factura ya emitida: intereses de mora, gastos de cobranza o un ajuste de precio. Suma valor; para devolver o anular sigue siendo la nota crédito.',
        howTo: [
          'En “Facturación electrónica”, abre el menú ⋮ de la factura y elige “Emitir nota débito”.',
          'Elige el concepto y agrega los cobros. Al escribir la descripción se te sugieren productos, hospedajes y excursiones ya cargados; también puedes escribir un concepto libre.',
          'Revisa el total y confirma. El cliente recibe la nota por correo.'
        ],
        note: 'El valor unitario se escribe CON el impuesto incluido, igual que en el resto de la aplicación: si escribes 1.000 con IVA 19%, el cliente paga 1.000 y el impuesto va por dentro. Debajo verás el desglose.'
      },
      {
        icon: 'receipt',
        title: 'Documento soporte',
        description:
          'Es el documento que la DIAN exige cuando le compras a un proveedor que NO está obligado a facturar. Se emite desde una factura de compra.',
        howTo: [
          'Ve a “Facturas de compra” y abre el menú ⋮ de la compra.',
          'Elige “Emitir documento soporte” y confirma.',
          'La compra pasa a ser un documento soporte y la encuentras en su propia vista.'
        ],
        note: 'El proveedor debe tener NIT: la DIAN no acepta cédula en este documento. Si tu proveedor emite factura electrónica, lo que corresponde es recibir su factura, no emitirle un documento soporte.'
      },
      {
        icon: 'tune',
        title: 'Nota de ajuste',
        description:
          'Es la única forma de corregir o anular un documento soporte ya emitido. Funciona como la nota crédito, pero para documentos soporte.',
        howTo: [
          'Ve a “Documentos soporte” y abre el menú ⋮ del documento.',
          'Elige “Emitir nota de ajuste”, marca si es total o selecciona los ítems, y confirma.'
        ]
      },
      {
        icon: 'grid_view',
        title: 'Inicio reorganizado, con atajos para crear',
        description:
          'El Inicio te saluda por tu nombre y separa lo que se crea de lo que se consulta. Arriba, “Crear”: factura electrónica, de venta, compra y cotización; cliente, proveedor, recepcionista, mesero y chef; producto, hospedaje, pasadía y receta. Abajo, “Ir a”, con las vistas de siempre.',
        howTo: [
          'Pulsa cualquier ficha de “Crear”: te lleva a su vista y abre el formulario.',
          'El tipo de factura o el rol del usuario ya vienen elegidos, no hay que seleccionarlos.'
        ],
        note: 'El documento soporte no tiene atajo porque no se crea desde cero: nace de una factura de compra que emites a la DIAN. Cada quien ve solo las fichas de lo que puede crear.'
      },
      {
        icon: 'touch_app',
        title: 'Abrir un registro pulsando su fila',
        description:
          'En los listados de facturas, productos, hospedajes, pasadías y usuarios ya no hace falta apuntar al botón del lápiz: pulsa en cualquier parte de la fila y se abre.',
        note: 'Los botones de editar y eliminar siguen ahí y funcionan igual. En facturas la fila lleva al detalle, que es lo que se puede ver también en las ya emitidas.'
      },
      {
        icon: 'bolt',
        title: 'Convertir una venta en factura electrónica',
        description:
          'Si hiciste una factura de venta normal y después el cliente te pide la electrónica, ya no hay que rehacerla.',
        howTo: [
          'Ve a “Facturas de venta” y abre el menú ⋮ de la factura.',
          'Elige “Facturar electrónicamente” y confirma.'
        ],
        note: 'Al validarse ante la DIAN, la factura pasa a ser electrónica y la encontrarás en “Facturación electrónica”, no en “Facturas de venta”.'
      },
      {
        icon: 'help_outline',
        title: 'Confirmación antes de emitir',
        description:
          'Emitir a la DIAN y emitir un documento soporte ahora piden confirmación, y el aviso explica qué implica antes de que pulses.',
        note: 'Una vez la DIAN valida un documento no se puede editar ni eliminar: solo corregirlo con su nota correspondiente. Por eso conviene revisar antes de confirmar.'
      },
      {
        icon: 'link',
        title: 'Notas asociadas visibles en la factura',
        description:
          'Al ver el detalle de una factura electrónica o un documento soporte ahora aparecen sus notas: cuáles se emitieron, por cuánto y el valor neto que queda.',
        note: 'En la nota débito se ve el desglose de cada cobro. Como esos conceptos no están entre los ítems de la factura, antes no había forma de saber de dónde salía el valor extra.'
      },
      {
        icon: 'water_drop',
        title: 'Marca de “ANULADA” en el PDF',
        description:
          'Si una factura quedó anulada por sus notas crédito (o un documento soporte por sus notas de ajuste), el PDF sale con una marca de agua y el detalle de las notas al pie.',
        note: 'Antes el PDF de una factura anulada era idéntico al de una viva. Impreso o reenviado, nadie podía notar la diferencia.'
      },
      {
        icon: 'forward_to_inbox',
        title: 'Reenviar la factura por correo',
        description:
          'Puedes volver a enviarle al cliente una factura ya emitida, con su PDF y el QR de la DIAN.',
        howTo: [
          'En “Facturación electrónica”, abre el menú ⋮ de la factura.',
          'Elige “Reenviar por correo” y confirma.'
        ],
        note: 'El PDF se genera al momento, así que incluye las notas emitidas después y la marca de “ANULADA” si corresponde.'
      },
      {
        icon: 'delete_forever',
        title: 'Avisos claros al eliminar',
        description:
          'Eliminar una factura no solo la quita de la lista: deshace sus movimientos de inventario. Ahora el aviso dice exactamente qué va a pasar según el tipo.',
        howTo: [
          'Venta: los productos vuelven al stock, los platos devuelven sus ingredientes y los hospedajes quedan Disponibles.',
          'Compra: se descuenta del stock lo que esa compra había ingresado.',
          'Cotización: no toca el inventario.'
        ],
        note: 'Ojo con las compras: si ya vendiste parte de esa mercancía, eliminar la compra puede dejar productos en negativo.'
      },
      {
        icon: 'pin',
        title: 'Numeración DIAN',
        description:
          'Una vista propia para consultar los rangos de numeración autorizados, su consecutivo actual y su fecha de vencimiento.',
        note: 'Los rangos de factura y de documento soporte vencen; los de notas, no. Conviene revisar esta vista antes de que se agote o caduque una resolución.'
      },
      {
        icon: 'account_circle',
        title: 'Foto de perfil',
        description:
          'Los usuarios ya pueden tener foto, que se ve en el perfil, en la barra superior y en el listado de usuarios.',
        howTo: [
          'Entra a tu perfil y pulsa Editar.',
          'Toca la foto para elegir una nueva y recórtala.',
          'Guarda: la foto se sube junto con el resto de los datos.'
        ]
      },
      {
        icon: 'event_available',
        title: 'Reservas y disponibilidad de hospedajes',
        description:
          'El panel de recepción ya no deja seleccionar una cabaña ocupada en las fechas elegidas, y la página pública de cada hospedaje muestra un calendario con los días libres.',
        note: 'Se cuentan noches, no días: una estancia del 10 al 12 ocupa las noches del 10 y el 11, así que el 12 queda libre para la siguiente entrada.'
      }
    ]
  },
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
    version: 'October 2026',
    date: 'October 2026',
    notes: [
      {
        icon: 'account_balance_wallet',
        title: 'Credit invoices with terms and payments',
        description:
          'A credit sale now carries a 30, 60 or 90-day term (one installment every 30 days) and you record payments until it is settled. You will see how much has been paid, what is left and which installments are overdue.',
        howTo: [
          'Create the sale with payment type “Credit”. Its payment status stays “Pending”.',
          'Open the invoice: the “Credit and payments” panel appears. Choose the term.',
          'For each customer payment press “Record payment” (amount, method and date), or “Pay all” to pay the full balance.',
          'When the balance reaches zero the payment status changes to “Paid” by itself. If you delete a payment it goes back to “Pending”.'
        ],
        note: 'Changing the term does not delete payments, but the term restarts from today: an installment that was overdue stops showing as overdue. That is why the app asks you to confirm. A payment can never exceed the balance.'
      },
      {
        icon: 'request_quote',
        title: 'Receivables and credit portfolio',
        description:
          'A view with everything customers owe us on credit, overdue first. In the invoice lists, every credit sale shows what has been paid and the balance.',
        howTo: [
          'In the menu, “Invoicing” → “Receivables”. Press a row to open the invoice and record payments.',
          'In “Reports / Earnings” there are two new cards: the credit portfolio (sold, collected and owed) and the invoices to collect, which take you to each invoice with one click.'
        ],
        note: 'Older credit sales have no term and show as “No term”. Pick one before recording payments or issuing them.'
      },
      {
        icon: 'event',
        title: 'The term is requested when sending to DIAN',
        description:
          'DIAN requires the due date on a credit sale. If the invoice has no term (or the term has expired) when you send it, the app asks you to choose one right there and shows the resulting date.',
        note: 'The term counts from today. Only the final due date goes to DIAN: installments and payments are internal control.'
      },
      {
        icon: 'receipt_long',
        title: 'See the notes and the Factus invoice',
        description:
          'From the ⋮ menu of an electronic invoice you can see all its credit, debit and adjustment notes with their details, and open the official version in Factus.',
        howTo: [
          'Open the invoice ⋮ menu and choose “View notes” or “View invoice in Factus”.',
          'In “View notes” press the eye to see a note’s details, or the link icon to open it in Factus.'
        ],
        note: 'Electronic invoicing and support documents are sorted by Factus number, the official DIAN order. The green “Sent to DIAN” label means it is already issued.'
      },
      {
        icon: 'undo',
        title: 'Cancel a debit note',
        description:
          'Factus does not allow cancelling a debit note already validated by DIAN. What is done —and what DIAN accepts— is issuing a credit note on the invoice that also covers the debit note value.',
        howTo: [
          'Open “Credit note” on the invoice. If it has pending debit notes, the “Also cancel pending debit notes” checkbox appears.',
          'Tick it: the credit note will include the debit note concepts. If the invoice was already cancelled, the note only neutralizes the debit note.'
        ],
        note: 'A neutralized debit note is marked as such. This is a new feature: try it first with a small case.'
      },
      {
        icon: 'rule',
        title: 'New support document rules',
        description:
          'As DIAN requires, a support document can only be issued to natural persons who are not VAT-responsible, and the purchase carries no taxes.',
        note: 'If the supplier is a company or VAT-responsible, the app tells you: the right step is to ask for their invoice. On purchases from someone who is not VAT-responsible the tax is fixed to “No tax”. An invoice at $0 cannot be issued or corrected with notes either.'
      },
      {
        icon: 'picture_as_pdf',
        title: 'Fixes',
        description:
          'Invoice PDFs are generated and attached to the email again, and the Excel export of selected invoices works again.'
      }
    ]
  },
  {
    version: 'September 2026',
    date: 'September 2026',
    notes: [
      {
        icon: 'fact_check',
        title: 'The five DIAN documents',
        description:
          'On top of invoices and credit notes, you can now issue debit notes, support documents and adjustment notes. Each one has its own official numbering.',
        note: 'What corrects what: credit and debit notes correct an invoice; an adjustment note corrects a support document. They are not interchangeable.'
      },
      {
        icon: 'trending_up',
        title: 'Debit note',
        description:
          'Charges an extra amount on an already-issued invoice: late interest, collection costs or a price adjustment. It adds value; to refund or void you still use a credit note.',
        howTo: [
          'In “Electronic invoicing”, open the invoice ⋮ menu and choose “Issue debit note”.',
          'Pick the concept and add the charges. As you type the description, products, accommodations and excursions already in the system are suggested; you can also type a free-text concept.',
          'Review the total and confirm. The customer receives the note by email.'
        ],
        note: 'The unit price is entered WITH tax included, like everywhere else in the app: if you type 1,000 with 19% VAT, the customer pays 1,000 and the tax is inside. The breakdown is shown below.'
      },
      {
        icon: 'receipt',
        title: 'Support document',
        description:
          'The document DIAN requires when you buy from a supplier who is NOT required to invoice. It is issued from a purchase invoice.',
        howTo: [
          'Go to “Purchase invoices” and open the purchase ⋮ menu.',
          'Choose “Issue support document” and confirm.',
          'The purchase becomes a support document and moves to its own view.'
        ],
        note: 'The supplier must have a NIT: DIAN does not accept a personal ID here. If your supplier issues electronic invoices, you should receive their invoice instead.'
      },
      {
        icon: 'tune',
        title: 'Adjustment note',
        description:
          'The only way to correct or void an already-issued support document. It works like a credit note, but for support documents.',
        howTo: [
          'Go to “Support documents” and open the document ⋮ menu.',
          'Choose “Issue adjustment note”, mark whether it is total or pick the items, and confirm.'
        ]
      },
      {
        icon: 'grid_view',
        title: 'Reorganized Home, with shortcuts to create',
        description:
          'Home now greets you by name and separates what you create from what you look up. On top, “Create”: electronic, sales, purchase and quote invoices; customer, supplier, receptionist, waiter and chef; product, accommodation, day pass and recipe. Below, “Go to”, with the usual views.',
        howTo: [
          'Press any “Create” tile: it takes you to its view and opens the form.',
          'The invoice type or the user role comes preselected — no need to pick it.'
        ],
        note: 'Support documents have no shortcut because they are not created from scratch: they come from a purchase invoice you issue to DIAN. Everyone only sees tiles for what they are allowed to create.'
      },
      {
        icon: 'touch_app',
        title: 'Open a record by clicking its row',
        description:
          'In the invoice, product, accommodation, day pass and user lists you no longer need to aim for the pencil button: click anywhere on the row and it opens.',
        note: 'The edit and delete buttons are still there and work the same. On invoices the row opens the detail view, which also works for already-issued documents.'
      },
      {
        icon: 'bolt',
        title: 'Turn a sale into an electronic invoice',
        description:
          'If you made a regular sales invoice and the customer later asks for the electronic one, you no longer have to redo it.',
        howTo: [
          'Go to “Sales invoices” and open the invoice ⋮ menu.',
          'Choose “Send to DIAN” and confirm.'
        ],
        note: 'Once DIAN validates it, the invoice becomes electronic and you will find it under “Electronic invoicing”, not “Sales invoices”.'
      },
      {
        icon: 'help_outline',
        title: 'Confirmation before issuing',
        description:
          'Issuing to DIAN and issuing a support document now ask for confirmation, and the message explains what it means before you press.',
        note: 'Once DIAN validates a document it cannot be edited or deleted: it can only be corrected with its matching note. Worth reviewing before you confirm.'
      },
      {
        icon: 'link',
        title: 'Associated notes visible on the invoice',
        description:
          'The detail view of an electronic invoice or support document now shows its notes: which ones were issued, for how much, and the remaining net value.',
        note: 'Debit notes show each charge in detail. Since those concepts are not among the invoice items, there was previously no way to tell where the extra amount came from.'
      },
      {
        icon: 'water_drop',
        title: '“ANNULLED” watermark on the PDF',
        description:
          'If an invoice was annulled by its credit notes (or a support document by its adjustment notes), the PDF now carries a watermark and lists the notes at the bottom.',
        note: 'Previously the PDF of an annulled invoice looked identical to a live one. Printed or forwarded, nobody could tell the difference.'
      },
      {
        icon: 'forward_to_inbox',
        title: 'Resend the invoice by email',
        description:
          'You can send an already-issued invoice to the customer again, with its PDF and the DIAN QR code.',
        howTo: [
          'In “Electronic invoicing”, open the invoice ⋮ menu.',
          'Choose “Resend by email” and confirm.'
        ],
        note: 'The PDF is generated on the spot, so it includes any notes issued afterwards and the “ANNULLED” watermark when it applies.'
      },
      {
        icon: 'delete_forever',
        title: 'Clear warnings when deleting',
        description:
          'Deleting an invoice does not just remove it from the list: it undoes its inventory movements. The warning now states exactly what will happen for each type.',
        howTo: [
          'Sale: products go back to stock, dishes return their ingredients and accommodations become Available.',
          'Purchase: whatever that purchase added is subtracted from stock.',
          'Quote: inventory is untouched.'
        ],
        note: 'Careful with purchases: if part of that merchandise was already sold, deleting the purchase can leave products with negative stock.'
      },
      {
        icon: 'pin',
        title: 'DIAN numbering',
        description:
          'A dedicated view to check the authorized numbering ranges, their current sequence number and their expiry date.',
        note: 'Invoice and support-document ranges expire; note ranges do not. Worth checking before a range runs out or a resolution expires.'
      },
      {
        icon: 'account_circle',
        title: 'Profile picture',
        description:
          'Users can now have a photo, shown on the profile, the top bar and the user list.',
        howTo: [
          'Go to your profile and press Edit.',
          'Tap the photo to pick a new one and crop it.',
          'Save: the photo is uploaded along with the rest of your details.'
        ]
      },
      {
        icon: 'event_available',
        title: 'Bookings and accommodation availability',
        description:
          'The reception panel no longer lets you pick a cabin that is taken on the chosen dates, and each accommodation’s public page shows a calendar with the free days.',
        note: 'Nights are counted, not days: a stay from the 10th to the 12th takes the nights of the 10th and 11th, so the 12th is free for the next check-in.'
      }
    ]
  },
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

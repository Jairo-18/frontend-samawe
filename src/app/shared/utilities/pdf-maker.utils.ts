/**
 * Prepara pdfmake para generar los documentos.
 *
 * Ya NO descarga fuentes. Antes bajaba cuatro `.ttf` de Alegreya SC (casi
 * 1,5 MB) y, si alguno fallaba, importaba además el `vfs` de Roboto (855 kB).
 * Con una fuente estándar del formato PDF no hace falta ninguna de las dos
 * cosas, así que se borraron `ttfToBase64()` y `loadRobotoFallback()`.
 */

export async function loadPdfMake(): Promise<{
  pdfMake: any;
  defaultFont: string;
}> {
  const maker = await import('pdfmake/build/pdfmake');
  const pdfMake = (maker as any).default ?? maker;
  // `vfs` nunca debe quedar undefined: escribir las fuentes abajo lanzaría
  // TypeError.
  pdfMake.vfs = pdfMake.vfs ?? {};
  pdfMake.fonts = pdfMake.fonts ?? {};

  // Helvetica, una de las 14 fuentes ESTÁNDAR del formato PDF: no se incrusta
  // ningún archivo y todo visor la trae de serie. En Windows —donde se imprimen
  // estas facturas— se dibuja con Arial, que es la que pidió el dueño.
  //
  // Arial no se puede poner tal cual: es de Monotype, no se puede incrustar ni
  // está en Google Fonts. Helvetica es su equivalente métrica.
  //
  // Antes se descargaban cuatro `.ttf` de Alegreya SC (casi 1,5 MB) y, si algo
  // fallaba, 855 KB más de Roboto. Ahora la impresión no descarga nada.
  const helvetica = {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  };
  pdfMake.fonts['Helvetica'] = helvetica;
  // Alias defensivo: pdfmake usa "Roboto" como nombre por defecto cuando un
  // fragmento no declara fuente, y sin esto reventaría al generar.
  pdfMake.fonts['Roboto'] = helvetica;

  return { pdfMake, defaultFont: 'Helvetica' };
}

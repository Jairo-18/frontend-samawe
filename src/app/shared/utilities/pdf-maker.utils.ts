/**
 * Prepara pdfmake para generar los documentos.
 *
 * Ya no descarga la TIPOGRAFÍA (antes bajaba cuatro `.ttf` de Alegreya SC,
 * casi 1,5 MB, y si alguno fallaba, 855 KB más de Roboto de respaldo).
 * Helvetica es una de las 14 fuentes ESTÁNDAR del formato PDF: no se incrusta
 * ningún glifo y todo visor la trae de serie.
 *
 * ⚠️ Pero SÍ hace falta bajar sus MÉTRICAS: pdfmake usa pdfkit por debajo, y
 * pdfkit calcula el ancho de cada carácter leyendo un `.afm` (Adobe Font
 * Metrics, texto plano) desde su "sistema de archivos virtual" — con eso
 * vacío revienta con `File 'data/Helvetica-Bold.afm' not found in virtual
 * file system` en cuanto se genera el primer PDF. Los 4 `.afm` de Helvetica
 * (~290 KB en total, texto) viven en `assets/pdf-fonts/` — son los mismos que
 * trae `@foliojs-fork/pdfkit/js/data/`, copiados ahí porque ese paquete no se
 * publica pensado para sacarle archivos sueltos desde Angular. Se piden por
 * `fetch` como texto (pdfkit los lee con encoding `'utf8'`, así que la cadena
 * va tal cual al `vfs`, sin base64).
 */

async function loadHelveticaMetrics(
  vfs: Record<string, string>
): Promise<void> {
  const files = [
    'Helvetica',
    'Helvetica-Bold',
    'Helvetica-Oblique',
    'Helvetica-BoldOblique'
  ];
  await Promise.all(
    files.map(async (name) => {
      const key = `data/${name}.afm`;
      if (vfs[key]) return;
      const res = await fetch(`assets/pdf-fonts/${name}.afm`);
      vfs[key] = await res.text();
    })
  );
}

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

  await loadHelveticaMetrics(pdfMake.vfs);

  // En Windows —donde se imprimen estas facturas— Helvetica se dibuja con
  // Arial, que es la que pidió el dueño. Arial no se puede poner tal cual: es
  // de Monotype, no se puede incrustar ni está en Google Fonts. Helvetica es
  // su equivalente métrica.
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

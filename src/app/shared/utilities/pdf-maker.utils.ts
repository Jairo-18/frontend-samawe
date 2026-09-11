async function ttfToBase64(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const chunkSize = 8192;
    let bin = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
      bin += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(bin);
  } catch {
    return null;
  }
}

/**
 * Carga el `vfs` de pdfmake con las fuentes Roboto embebidas.
 *
 * Son 855 kB (311 kB transferidos) y **solo hacen falta como respaldo**: la
 * fuente real de los documentos es AlegreyaSC, que se descarga aparte. Antes
 * este módulo se importaba siempre junto a pdfmake, así que todo el mundo
 * pagaba Roboto aunque nunca se usara. Ahora es un import dinámico que solo se
 * dispara si las fuentes propias no cargaron.
 */
async function loadRobotoFallback(pdfMake: any): Promise<void> {
  const fonts = await import('pdfmake/build/vfs_fonts');
  // pdfmake 0.2.x exporta el vfs como el objeto de fuentes directamente
  // (module.exports = vfs). Versiones 0.1.x lo anidaban en .pdfMake.vfs.
  const fontsMod = (fonts as any).default ?? fonts;
  const vfs = fontsMod?.pdfMake?.vfs ?? fontsMod?.vfs ?? fontsMod;
  if (vfs) pdfMake.vfs = { ...pdfMake.vfs, ...vfs };

  pdfMake.fonts = {
    ...pdfMake.fonts,
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf'
    }
  };
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

  // Las cuatro variantes se usan: hay documentos con cursiva y con negrita.
  // Los .ttf se sirven con Cache-Control de un año, así que a partir de la
  // segunda impresión salen del caché del navegador.
  const [regular, bold, italic, boldItalic] = await Promise.all([
    ttfToBase64('/assets/fonts/AlegreyaSC-Regular.ttf'),
    ttfToBase64('/assets/fonts/AlegreyaSC-Bold.ttf'),
    ttfToBase64('/assets/fonts/AlegreyaSC-Italic.ttf'),
    ttfToBase64('/assets/fonts/AlegreyaSC-BoldItalic.ttf')
  ]);

  if (regular) {
    pdfMake.vfs['AlegreyaSC-Regular.ttf'] = regular;
    pdfMake.vfs['AlegreyaSC-Bold.ttf'] = bold ?? regular;
    pdfMake.vfs['AlegreyaSC-Italic.ttf'] = italic ?? regular;
    pdfMake.vfs['AlegreyaSC-BoldItalic.ttf'] = boldItalic ?? bold ?? regular;

    const alegreya = {
      normal: 'AlegreyaSC-Regular.ttf',
      bold: 'AlegreyaSC-Bold.ttf',
      italics: 'AlegreyaSC-Italic.ttf',
      bolditalics: 'AlegreyaSC-BoldItalic.ttf'
    };
    pdfMake.fonts['AlegreyaSC'] = alegreya;
    // Alias defensivo: pdfmake usa "Roboto" como nombre por defecto cuando un
    // fragmento no declara fuente. Sin el vfs de Roboto cargado eso reventaría
    // al generar el PDF, así que se apunta al mismo archivo de AlegreyaSC.
    pdfMake.fonts['Roboto'] = alegreya;

    return { pdfMake, defaultFont: 'AlegreyaSC' };
  }

  // Las fuentes propias no cargaron (assets movidos, red caída): solo en este
  // caso se descarga el vfs de Roboto.
  await loadRobotoFallback(pdfMake);
  return { pdfMake, defaultFont: 'Roboto' };
}

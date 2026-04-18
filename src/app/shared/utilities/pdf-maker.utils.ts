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
  } catch { return null; }
}

export async function loadPdfMake(): Promise<{ pdfMake: any; defaultFont: string }> {
  const [maker, fonts] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts')
  ]);
  const pdfMake = (maker as any).default ?? maker;
  const vfs = ((fonts as any).default ?? fonts)?.pdfMake?.vfs;
  if (vfs) pdfMake.vfs = vfs;

  // Roboto siempre debe estar explícitamente definido
  pdfMake.fonts = {
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf'
    }
  };

  // Registrar Alegreya SC desde assets locales
  const [regular, bold, italic, boldItalic] = await Promise.all([
    ttfToBase64('/assets/fonts/AlegreyaSC-Regular.ttf'),
    ttfToBase64('/assets/fonts/AlegreyaSC-Bold.ttf'),
    ttfToBase64('/assets/fonts/AlegreyaSC-Italic.ttf'),
    ttfToBase64('/assets/fonts/AlegreyaSC-BoldItalic.ttf')
  ]);

  let defaultFont = 'Roboto';
  if (regular) {
    pdfMake.vfs['AlegreyaSC-Regular.ttf'] = regular;
    pdfMake.vfs['AlegreyaSC-Bold.ttf'] = bold ?? regular;
    pdfMake.vfs['AlegreyaSC-Italic.ttf'] = italic ?? regular;
    pdfMake.vfs['AlegreyaSC-BoldItalic.ttf'] = boldItalic ?? bold ?? regular;
    pdfMake.fonts['AlegreyaSC'] = {
      normal: 'AlegreyaSC-Regular.ttf',
      bold: 'AlegreyaSC-Bold.ttf',
      italics: 'AlegreyaSC-Italic.ttf',
      bolditalics: 'AlegreyaSC-BoldItalic.ttf'
    };
    defaultFont = 'AlegreyaSC';
  }

  return { pdfMake, defaultFont };
}

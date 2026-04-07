export interface ColorSwatch {
  name: string;
  variable: string;
  hex: string;
  textColor: string;
}
export interface Palette {
  name: string;
  /** Solo informativo — la fuente real la define index.html */
  fontTitle: string;
  fontBody: string;
  colors: ColorSwatch[];
}

export const PALETTE_1: Palette = {
  name: 'Bosque — Verde natural',
  fontTitle: 'Alegreya SC',
  fontBody: 'Poppins',
  colors: [
    {
      name: 'Primary',
      variable: '--primary',
      hex: '#486E2B',
      textColor: '#fff'
    },
    {
      name: 'Secondary',
      variable: '--secondary',
      hex: '#187B18',
      textColor: '#fff'
    },
    {
      name: 'Tertiary',
      variable: '--tertiary',
      hex: '#11382E',
      textColor: '#fff'
    },
    {
      name: 'Background',
      variable: '--background',
      hex: '#FAFAF9',
      textColor: '#2B2B2B'
    },
    { name: 'Text', variable: '--text', hex: '#2B2B2B', textColor: '#fff' },
    { name: 'Title', variable: '--title', hex: '#11382E', textColor: '#fff' },
    {
      name: 'Background Principal',
      variable: '--bg-principal',
      hex: '#FFFFFF',
      textColor: '#2B2B2B'
    },
    {
      name: 'Background Secondary',
      variable: '--bg-secondary',
      hex: '#F3F7F0',
      textColor: '#2B2B2B'
    },
    {
      name: 'Subtitle',
      variable: '--subtitle',
      hex: '#486E2B',
      textColor: '#fff'
    },
    { name: 'CTA', variable: '--cta', hex: '#d10202', textColor: '#fff' },
    {
      name: 'CTA Hover',
      variable: '--cta-hover',
      hex: '#e38f8f',
      textColor: '#fff'
    }
  ]
};
export const PALETTE_2: Palette = {
  name: 'Musgo y Olivo — Naturaleza Viva',
  fontTitle: 'Playfair Display',
  fontBody: 'Lato',
  colors: [
    {
      name: 'Primary',
      variable: '--primary',
      hex: '#4fae30', // Verde oliva profundo
      textColor: '#fff'
    },
    {
      name: 'Secondary',
      variable: '--secondary',
      hex: '#2f6c1f', // Sage / Verde salvia
      textColor: '#2B2B2B'
    },
    {
      name: 'Tertiary',
      variable: '--tertiary',
      hex: '#29561e', // Verde bosque oscuro
      textColor: '#fff'
    },
    {
      name: 'Background',
      variable: '--background',
      hex: '#FAFAF9', // Crema orgánico (hueso)
      textColor: '#2B2B2B'
    },
    {
      name: 'Text',
      variable: '--text',
      hex: '#29561e',
      textColor: '#fff'
    },
    {
      name: 'Title',
      variable: '--title',
      hex: '#2f6c1f',
      textColor: '#fff'
    },
    {
      name: 'Background Principal',
      variable: '--bg-principal',
      hex: '#FFFFFF',
      textColor: '#2B2B2B'
    },
    {
      name: 'Background Secondary',
      variable: '--bg-secondary',
      hex: '#F1F5EB',
      textColor: '#2B2B2B'
    },
    {
      name: 'Subtitle',
      variable: '--subtitle',
      hex: '#4fae30',
      textColor: '#fff'
    },
    { name: 'CTA', variable: '--cta', hex: '#d10202', textColor: '#fff' },
    {
      name: 'CTA Hover',
      variable: '--cta-hover',
      hex: '#e38f8f',
      textColor: '#fff'
    }
  ]
};

export const PALETTE_3: Palette = {
  name: 'Amazonía — Selva Profunda',
  fontTitle: 'Cormorant Garamond',
  fontBody: 'Nunito',
  colors: [
    {
      name: 'Primary',
      variable: '--primary',
      hex: '#386641', // Verde helecho
      textColor: '#fff'
    },
    {
      name: 'Secondary',
      variable: '--secondary',
      hex: '#6A994E', // Verde hoja
      textColor: '#fff'
    },
    {
      name: 'Tertiary',
      variable: '--tertiary',
      hex: '#132A13', // Verde sombra nocturna
      textColor: '#fff'
    },
    {
      name: 'Background',
      variable: '--background',
      hex: '#FAFAF9', // Blanco mineral frío
      textColor: '#2B2B2B'
    },
    {
      name: 'Text',
      variable: '--text',
      hex: '#081C15',
      textColor: '#fff'
    },
    {
      name: 'Title',
      variable: '--title',
      hex: '#132A13',
      textColor: '#fff'
    },
    {
      name: 'Background Principal',
      variable: '--bg-principal',
      hex: '#FFFFFF',
      textColor: '#2B2B2B'
    },
    {
      name: 'Background Secondary',
      variable: '--bg-secondary',
      hex: '#F2F6F3',
      textColor: '#2B2B2B'
    },
    {
      name: 'Subtitle',
      variable: '--subtitle',
      hex: '#386641',
      textColor: '#fff'
    },
    { name: 'CTA', variable: '--cta', hex: '#d10202', textColor: '#fff' },
    {
      name: 'CTA Hover',
      variable: '--cta-hover',
      hex: '#e38f8f',
      textColor: '#fff'
    }
  ]
};

/** Catálogo DANE de Colombia (departamentos y municipios). */
export interface Department {
  departmentId: number;
  code: string;
  name: string;
}

export interface Municipality {
  municipalityId: number;
  code: string;
  name: string;
  departmentId: number;
}

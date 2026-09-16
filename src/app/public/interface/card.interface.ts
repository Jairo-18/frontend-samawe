/**
 * Accesos del inicio del personal. Hay dos registros, y la diferencia NO es
 * decorativa: dice si el clic **crea algo** o **lleva a algún sitio**.
 *
 *  - `action`: abre directamente un formulario de creación, normalmente con el
 *    tipo o el rol ya elegido (vía query param). Es lo que se usa muchas veces
 *    al día, así que va agrupado y compacto, al alcance de un clic.
 *  - `destination`: navega a una vista para consultar o gestionar. Se usa menos
 *    y se lee como lista, no como botonera.
 */
export interface DashboardCard {
  icon?: string;
  title?: string;
  description?: string;
  route?: string;
  queryParams?: { [key: string]: any };
  iconNext?: string;
  allowedRoles?: string[];
}

/** Un acceso que crea algo. La descripción sobra: el título es el verbo. */
export interface DashboardAction {
  icon: string;
  /** Clave i18n del título — un verbo en infinitivo ("Nueva factura de venta"). */
  title: string;
  route: string;
  queryParams?: { [key: string]: string };
  allowedRoles: string[];
}

/** Grupo de acciones bajo un encabezado ("Facturación", "Personas"…). */
export interface DashboardActionGroup {
  /** Clave i18n del encabezado del grupo. */
  title: string;
  actions: DashboardAction[];
}

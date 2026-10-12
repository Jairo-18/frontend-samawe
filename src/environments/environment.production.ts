export const environment = {
  apiUrl: 'https://api.ecohotelsamawe.com/',
  production: true,
  googleMapsApiKey: 'AIzaSyBUEiyCQTzVdjgR8MVnts1VqtvA7lZvGdk',
  clientApiKey: 'sk_prod_samawe_c8f2a1b9e3d74056',
  // Origen público canónico. NO usar document.location: en SSR apunta
  // al host interno del contenedor y rompe canonical/hreflang.
  siteUrl: 'https://ecohotelsamawe.com'
};

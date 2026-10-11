export const environment = {
  apiUrl: 'https://api.ecohotelsamawe.com/',
  production: true,
  // Otros hoteles de la plataforma. El panel es el mismo; entrando por
  // `/auth/login?hotel=<slug>` habla con la API de ese hotel (el backend decide
  // el hotel por el host). Ver ApiConfigService.
  hotelApis: {
    'motel-crazy-love': {
      name: 'Motel Crazy Love',
      apiUrl: 'https://api-crazylove.ecohotelsamawe.com/'
    }
  } as Record<string, { name: string; apiUrl: string }>,
  googleMapsApiKey: 'AIzaSyBUEiyCQTzVdjgR8MVnts1VqtvA7lZvGdk',
  clientApiKey: 'sk_prod_samawe_c8f2a1b9e3d74056',
  // Origen público canónico. NO usar document.location: en SSR apunta
  // al host interno del contenedor y rompe canonical/hreflang.
  siteUrl: 'https://ecohotelsamawe.com'
};

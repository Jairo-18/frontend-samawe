export const environment = {
  // apiUrl: 'https://apidev.ecohotelsamawe.com/',
  // Mismo host desde el que se abrió el front, en el puerto del back local: así
  // `http://192.168.x.x:4200` desde el celular llama a `http://192.168.x.x:3000`
  // en vez de al `localhost` del propio celular. En SSR no hay `window`.
  apiUrl:
    typeof window !== 'undefined'
      ? `http://${window.location.hostname}:3000/`
      : 'http://localhost:3000/',
  production: false,
  googleMapsApiKey: 'AIzaSyBUEiyCQTzVdjgR8MVnts1VqtvA7lZvGdk',
  clientApiKey: 'sk_dev_samawe_c8f2a1b9e3d74056',
  // Origen público canónico. NO usar document.location: en SSR apunta
  // al host interno del contenedor y rompe canonical/hreflang.
  siteUrl: 'https://ecohotelsamawe.com'
};

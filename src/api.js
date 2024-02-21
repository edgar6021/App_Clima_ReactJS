
export const datosClima = [{
    ubicacion: 'Los Angeles', 
    image: '../public/images-pais/los-angeles.jpg',
    iconTempeture:'../public/icons/sol.png',
    temperatura: '22°C',
    iconHumedad:'../public/icons/humidity.png',
    humedad: '50%',
    iconVientos:'../public/icons/winds.png',
    vientos: '15 km/h',
    iconDescripcion:'../public/icons/description.png',
    descripcion: 'Soleado',
  },
  {
    ubicacion: 'Chicago', 
    image: '../public/images-pais/chicago.jpg',
    iconTempeture:'../public/icons/nublado.png',
    temperatura: '17°C',
    iconHumedad:'../public/icons/humidity.png',
    humedad: '70%',
    iconVientos:'../public/icons/winds.png',
    vientos: '20 km/h',
    iconDescripcion:'../public/icons/description.png',
    descripcion: 'Nublado',
  },
  {
    ubicacion: 'Houston', 
    image: '../public/images-pais/houston.jpg',
    iconTempeture:'../public/icons/rayos.png',
    temperatura: '30°C',
    iconHumedad:'../public/icons/humidity.png',
    humedad: '80%',
    iconVientos:'../public/icons/winds.png',
    vientos: '25 km/h',
    iconDescripcion:'../public/icons/description.png',
    descripcion: 'Tormenta',
  },
]


export const noticiasdatos = [
  {
    titulo: 'Tecnología',
    image: '../public/images-noticias/ceo.jpg',
    fondo:'../public/images-noticias/fondo3.jpg',
    descripcion: 'Elon Musk anuncia avances en Neuralink: Elon Musk, CEO de Neuralink, reveló recientemente importantes avances en la interfaz cerebro-computadora de la compañía durante una presentación. Se mostraron demostraciones de cómo la tecnología puede permitir a los usuarios controlar dispositivos con el pensamiento y cómo está siendo probada en pacientes con lesiones medulares. Musk destacó el potencial de Neuralink para revolucionar la forma en que interactuamos con la tecnología y tratar una variedad de condiciones médicas.',
    editora: 'Tech News Source',
    categoria: 'Technology',
  },
  {
    titulo: 'Empresas',
    image: '../public/images-noticias/apple.jpg',
    fondo:'../public/images-noticias/fondo3.jpg',
    descripcion: 'Apple alcanza una capitalización de mercado de $3 billones: Apple se convierte en la primera empresa en alcanzar una capitalización de mercado de tres billones de dólares, consolidando su posición como una de las compañías más valiosas del mundo. Este hito llega impulsado por el éxito continuo de productos como el iPhone, el crecimiento de servicios como Apple Music y la expansión de su ecosistema de dispositivos. La empresa ha demostrado una capacidad notable para innovar y mantenerse relevante en un mercado altamente competitivo.',
    editora: 'Business News Source',
    categoria: 'Business',
  },
  {
    titulo: 'Deportes',
    image: '../public/images-noticias/cristiano.jpg',
    fondo:'../public/images-noticias/fondo3.jpg',
    descripcion: 'Cristiano Ronaldo regresa al Manchester United: En una sorprendente noticia deportiva, el famoso futbolista Cristiano Ronaldo anunció su regreso al Manchester United luego de 12 años. Tras su paso por clubes como Real Madrid y Juventus, Ronaldo vuelve al equipo inglés donde ganó múltiples títulos y se consolidó como una leyenda del fútbol mundial. Su regreso ha generado una gran expectación entre los aficionados y promete añadir un nuevo capítulo emocionante a su carrera.',
    editora: 'Sports News Source',
    categoria: 'Sports',
  },
   {
    titulo: 'Tecnología',
    image: '../public/images-noticias/ceo.jpg',
    fondo:'../public/images-noticias/fondo3.jpg',
    descripcion: 'Elon Musk anuncia avances en Neuralink: Elon Musk, CEO de Neuralink, reveló recientemente importantes avances en la interfaz cerebro-computadora de la compañía durante una presentación. Se mostraron demostraciones de cómo la tecnología puede permitir a los usuarios controlar dispositivos con el pensamiento y cómo está siendo probada en pacientes con lesiones medulares. Musk destacó el potencial de Neuralink para revolucionar la forma en que interactuamos con la tecnología y tratar una variedad de condiciones médicas.',
    editora: 'Tech News Source',
    categoria: 'Technology',
  },
  {
    titulo: 'Deportes',
    image: '../public/images-noticias/cristiano.jpg',
    fondo:'../public/images-noticias/fondo3.jpg',
    descripcion: 'Cristiano Ronaldo regresa al Manchester United: En una sorprendente noticia deportiva, el famoso futbolista Cristiano Ronaldo anunció su regreso al Manchester United luego de 12 años. Tras su paso por clubes como Real Madrid y Juventus, Ronaldo vuelve al equipo inglés donde ganó múltiples títulos y se consolidó como una leyenda del fútbol mundial. Su regreso ha generado una gran expectación entre los aficionados y promete añadir un nuevo capítulo emocionante a su carrera.',
    editora: 'Sports News Source',
    categoria: 'Sports',
  },
  
];

export const buscarubicacion = async (ubicacion) => {
  return datosClima.find((data) => data.ubicacion === ubicacion);
};

export const buscarnoticias = async () => {
  return noticiasdatos;
};


const API_KEY = "TU_API_KEY_AQUI";
const SIN_CLAVE = (API_KEY === "TU_API_KEY_AQUI" || API_KEY.trim() === "");

let noticias = [];        // noticias que se están mostrando
let paginaActual = 1;
const POR_PAGINA = 4;     // noticias por página

// Temas rápidos con enfoque dominicano
const CATEGORIAS = [
  { nombre: "🇩🇴 Nacionales", q: "República Dominicana", etiqueta: "Nacionales" },
  { nombre: "🏛️ Política",    q: "política dominicana",   etiqueta: "Política" },
  { nombre: "💻 Tecnología",  q: "tecnología",            etiqueta: "Tecnología" },
  { nombre: "⚾ Béisbol",     q: "béisbol dominicano",    etiqueta: "Béisbol" },
  { nombre: "📈 Economía",    q: "economía dominicana",   etiqueta: "Economía" },
  { nombre: "🩺 Salud",       q: "salud",                 etiqueta: "Salud" },
  { nombre: "🎬 Espectáculos", q: "farándula dominicana", etiqueta: "Espectáculos" }
];


// ---------- 2. FECHA Y BOTONES DE TEMAS ----------
document.getElementById('fecha').textContent =
  new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const contCategorias = document.getElementById('categorias');

CATEGORIAS.forEach(cat => {
  const b = document.createElement('button');
  b.className = "chip";
  b.textContent = cat.nombre;
  b.onclick = () => {
    document.getElementById('termino').value = cat.q;
    consultarApi(cat.q, cat.etiqueta);
  };
  contCategorias.appendChild(b);
});

// Botón para ver los ejemplos de demostración
const bEjemplos = document.createElement('button');
bEjemplos.className = "chip chip--ejemplos";
bEjemplos.textContent = "📌 Información general";
bEjemplos.onclick = mostrarEjemplos;
contCategorias.appendChild(bEjemplos);


// ---------- 3. LLAMADA A LA API ----------
// Se ejecuta al enviar el formulario
function buscar(event) {
  event.preventDefault();   // evita recargar la página
  consultarApi(document.getElementById('termino').value, "");
}

function consultarApi(termino, etiqueta) {
  const mensaje = document.getElementById('mensaje');

  // Si no hay API key, mostramos la información de respaldo
  if (SIN_CLAVE) {
    mostrarRespaldo(termino, etiqueta, "Falta la API key de GNews (ponla en script.js).");
    return;
  }

  mensaje.textContent = "Buscando noticias...";
  document.getElementById('resultados').innerHTML = "";
  document.getElementById('paginacion').style.display = "none";

  const url = "https://gnews.io/api/v4/search?q=" + encodeURIComponent(termino) +
              "&lang=es&max=10&apikey=" + API_KEY;

  fetch(url)
    .then(response => {
      // Códigos de estado HTTP (4xx = error del cliente, 5xx = del servidor)
      if (response.status === 400) {
        throw new Error("Solicitud inválida, revisa el término de búsqueda (error 400)");
      } else if (response.status === 401 || response.status === 403) {
        throw new Error("API key inválida o sin permiso (error " + response.status + ")");
      } else if (response.status === 429) {
        throw new Error("Se alcanzó el límite de consultas del día (error 429)");
      } else if (response.status >= 500) {
        throw new Error("Error del servidor (error " + response.status + ")");
      } else if (!response.ok) {
        throw new Error("Error " + response.status);
      }
      return response.json();   // convierte la respuesta JSON en objeto
    })
    .then(data => {
      noticias = (data.articles || []).map(n => ({ ...n, etiqueta: etiqueta }));
      paginaActual = 1;

      if (noticias.length === 0) {
        mostrarRespaldo(termino, etiqueta, "No se encontraron noticias recientes para: " + termino + ".");
        return;
      }
      mensaje.textContent = "Resultados para: " + termino;
      mostrarNoticias();
    })
    .catch(error => {
      mostrarRespaldo(termino, etiqueta, "No se pudieron cargar las noticias. " + error.message + ".");
      console.error('Error:', error);
    });
}


// ---------- 4. MOSTRAR NOTICIAS EN PANTALLA ----------
function mostrarNoticias() {
  const contenedor = document.getElementById('resultados');
  contenedor.innerHTML = "";

  // slice() corta la lista: solo las noticias de la página actual
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const pagina = noticias.slice(inicio, inicio + POR_PAGINA);

  pagina.forEach(noticia => {
    const art = document.createElement('article');
    art.className = "noticia";

    // Etiqueta de categoría (si existe)
    if (noticia.etiqueta) {
      const et = document.createElement('span');
      et.className = "etiqueta";
      et.textContent = noticia.etiqueta;
      art.appendChild(et);
    }

    // Titular con enlace
    const h3 = document.createElement('h3');
    const enlace = document.createElement('a');
    enlace.href = noticia.url;
    enlace.target = "_blank";
    enlace.rel = "noopener";
    enlace.textContent = noticia.title;
    h3.appendChild(enlace);

    // Descripción
    const desc = document.createElement('p');
    desc.textContent = noticia.description || "Sin descripción disponible.";

    // Recuadro "Sabías que" (solo en la información general)
    let dato = null;
    if (noticia.dato) {
      dato = document.createElement('div');
      dato.className = "dato";
      dato.textContent = "💡 " + noticia.dato;
    }

    // Fuente y fecha
    const meta = document.createElement('div');
    meta.className = "meta";
    const fuente = document.createElement('strong');
    fuente.textContent = noticia.source.name;
    meta.append("Fuente: ", fuente);
    if (noticia.publishedAt) {
      meta.append(" · " + new Date(noticia.publishedAt).toLocaleDateString('es-DO', { dateStyle: 'medium' }));
    }

    art.append(h3, desc);
    if (dato) art.appendChild(dato);
    art.appendChild(meta);
    contenedor.appendChild(art);
  });

  // Controles de paginación
  const total = Math.ceil(noticias.length / POR_PAGINA);
  document.getElementById('paginacion').style.display = total > 1 ? "flex" : "none";
  document.getElementById('infoPagina').textContent = "Página " + paginaActual + " de " + total;
  document.getElementById('btnAnterior').disabled = (paginaActual === 1);
  document.getElementById('btnSiguiente').disabled = (paginaActual === total);
}


// ---------- 5. PAGINACIÓN ----------
// -1 = página anterior, 1 = página siguiente
function cambiarPagina(cambio) {
  paginaActual = paginaActual + cambio;
  mostrarNoticias();
  window.scrollTo({ top: 0, behavior: "smooth" });
}


// ---------- 6. MODO CLARO / OSCURO ----------
function cambiarTema() {
  document.body.classList.toggle('oscuro');
  const oscuro = document.body.classList.contains('oscuro');
  document.getElementById('btnTema').textContent = oscuro ? "☀️" : "🌙";
}


// ---------- 7. INFORMACIÓN GENERAL (respaldo) ----------
// Contenido informativo general y estable sobre cada tema. No son noticias
// del día: sirven para que siempre haya información útil que mostrar.
const EJEMPLOS = [
  { etiqueta: "Nacionales", title: "República Dominicana: un país de 31 provincias y un Distrito Nacional",
    description: "La República Dominicana comparte la isla de La Española con Haití. Su capital es Santo Domingo, la ciudad más antigua de América con presencia europea permanente, y su territorio se organiza en 31 provincias y el Distrito Nacional. El país combina playas, montañas, ciudades históricas y una gran diversidad cultural.",
    dato: "Sabías que: el Pico Duarte, con unos 3,098 metros, es la montaña más alta del Caribe.",
    url: "https://listindiario.com", source: { name: "Listín Diario" } },
  { etiqueta: "Nacionales", title: "La Zona Colonial: el corazón histórico de Santo Domingo",
    description: "Este sector reúne la primera catedral, la primera fortaleza y las primeras calles de América. Hoy es uno de los principales atractivos turísticos y culturales del país, con museos, plazas, restaurantes y vida nocturna.",
    dato: "Sabías que: fue declarada Patrimonio de la Humanidad por la UNESCO en 1990.",
    url: "https://hoy.com.do", source: { name: "Hoy" } },

  { etiqueta: "Política", title: "Cómo funciona el sistema político dominicano",
    description: "La República Dominicana es una democracia con régimen presidencial. El presidente se elige por voto popular para períodos de cuatro años, y el Congreso Nacional se divide en dos cámaras: el Senado y la Cámara de Diputados. El Poder Judicial completa la separación de poderes que establece la Constitución.",
    dato: "Sabías que: las elecciones generales se celebran cada cuatro años.",
    url: "https://eldia.com.do", source: { name: "El Día" } },
  { etiqueta: "Política", title: "La Junta Central Electoral: quién organiza las elecciones",
    description: "La JCE organiza y supervisa los procesos electorales, además de administrar el registro civil y la cédula de identidad. Es la institución que habilita a los ciudadanos a votar y que da a conocer los resultados oficiales de cada elección.",
    dato: "Sabías que: en su portal puedes consultar tu lugar de votación antes de cada proceso electoral.",
    url: "https://jce.gob.do", source: { name: "Junta Central Electoral" } },

  { etiqueta: "Tecnología", title: "Telecomunicaciones en el país: quién regula y qué servicios existen",
    description: "El INDOTEL es el organismo regulador del sector. Supervisa los servicios de telefonía, internet y televisión por cable, y promueve la ampliación de la conectividad. La fibra óptica y las redes móviles han crecido en los últimos años en las principales ciudades.",
    dato: "Sabías que: el INDOTEL fue creado por la Ley General de Telecomunicaciones 153-98.",
    url: "https://indotel.gob.do", source: { name: "INDOTEL" } },
  { etiqueta: "Tecnología", title: "Gobierno digital: trámites del Estado desde tu celular o computadora",
    description: "Cada vez más instituciones permiten solicitar documentos, pagar impuestos y consultar servicios por internet, sin hacer filas. Esta modernización también impulsa el uso de APIs entre bancos, empresas y entidades públicas.",
    dato: "Sabías que: una API es el puente que permite que dos sistemas intercambien datos automáticamente.",
    url: "https://www.elcaribe.com.do", source: { name: "El Caribe" } },

  { etiqueta: "Béisbol", title: "LIDOM: la pelota invernal dominicana",
    description: "La Liga de Béisbol Dominicano reúne seis equipos: Tigres del Licey, Leones del Escogido, Águilas Cibaeñas, Estrellas Orientales, Toros del Este y Gigantes del Cibao. Su temporada se juega en los meses de otoño e invierno, y el campeón representa al país en la Serie del Caribe.",
    dato: "Sabías que: la rivalidad entre Licey y Escogido es conocida como el «clásico» del béisbol dominicano.",
    url: "https://lidom.com", source: { name: "LIDOM" } },
  { etiqueta: "Béisbol", title: "Dominicanos en las Grandes Ligas",
    description: "La República Dominicana es uno de los países que más jugadores aporta a las Grandes Ligas. Muchos peloteros se forman en academias locales y en la propia liga dominicana antes de dar el salto a Estados Unidos.",
    dato: "Sabías que: San Pedro de Macorís es conocida como la «cuna de los shortstops».",
    url: "https://www.diariolibre.com", source: { name: "Diario Libre" } },

  { etiqueta: "Economía", title: "Los motores de la economía dominicana",
    description: "El turismo, las zonas francas, las remesas, la minería y los servicios son algunos de los sectores que más aportan a la economía del país. La moneda oficial es el peso dominicano y el Banco Central es la institución encargada de la política monetaria.",
    dato: "Sabías que: Punta Cana y Puerto Plata están entre los destinos turísticos más visitados del Caribe.",
    url: "https://www.bancentral.gov.do", source: { name: "Banco Central" } },

  { etiqueta: "Salud", title: "Cómo se organiza la salud en el país",
    description: "El Ministerio de Salud Pública dirige las políticas sanitarias, las campañas de vacunación y la prevención de enfermedades como el dengue. El Seguro Nacional de Salud (SENASA) y las ARS permiten a los afiliados acceder a servicios médicos.",
    dato: "Sabías que: eliminar el agua estancada en casa es la medida más sencilla para prevenir el dengue.",
    url: "https://www.msp.gob.do", source: { name: "Ministerio de Salud Pública" } },

  { etiqueta: "Espectáculos", title: "Merengue y bachata: música dominicana reconocida por la UNESCO",
    description: "El merengue y la bachata son los ritmos más representativos del país y se escuchan en todo el mundo. Ambos nacieron en comunidades dominicanas y hoy llenan festivales, discotecas y plataformas digitales, junto al dembow y la música urbana.",
    dato: "Sabías que: el merengue fue declarado Patrimonio Cultural Inmaterial de la Humanidad en 2016 y la bachata en 2019.",
    url: "https://www.diariolibre.com", source: { name: "Diario Libre" } }
];

function mostrarEjemplos() {
  noticias = EJEMPLOS;
  paginaActual = 1;
  document.getElementById('mensaje').textContent =
    "Información general sobre República Dominicana (no son noticias del día). Cada enlace lleva a la fuente oficial.";
  mostrarNoticias();
}


// Muestra ejemplos de la categoría (o relacionados con el término) cuando la API no responde
function mostrarRespaldo(termino, etiqueta, motivo) {
  const t = termino.toLowerCase();
  let lista = EJEMPLOS.filter(e =>
    (etiqueta && e.etiqueta === etiqueta) ||
    e.title.toLowerCase().includes(t) ||
    e.description.toLowerCase().includes(t)
  );
  if (lista.length === 0) lista = EJEMPLOS;   // si nada coincide, mostramos todos

  noticias = lista;
  paginaActual = 1;
  document.getElementById('mensaje').textContent =
    motivo + " Mostrando información general.";
  mostrarNoticias();
}

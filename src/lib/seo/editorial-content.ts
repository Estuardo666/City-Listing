export type EditorialArticle = {
  slug: string
  title: string
  excerpt: string
  content: string[]
  image: string
  tags: string[]
  featured?: boolean
}

export const SEO_EDITORIAL_ARTICLES: EditorialArticle[] = [
  {
    slug: 'eventos-en-loja-guia-para-encontrar-planes',
    title: 'Eventos en Loja: guía para encontrar conciertos, cultura y planes',
    excerpt:
      'Cómo buscar eventos en Loja, comparar horarios y elegir planes culturales, conciertos, ferias y actividades para cada fecha.',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&q=80',
    tags: ['eventos en Loja', 'agenda de Loja', 'qué hacer en Loja'],
    featured: true,
    content: [
      'Buscar eventos en Loja es más fácil cuando la información está ordenada por fecha, categoría y lugar. Una buena agenda debe permitir comparar conciertos, actividades culturales, ferias, deportes y planes familiares sin depender de publicaciones aisladas en redes sociales.',
      'Empieza por revisar la agenda de Vive Loja y filtra por la fecha que te interesa. La ficha de cada evento debe ayudarte a confirmar el nombre, el horario, la ubicación, el precio y cualquier enlace de reserva antes de salir.',
      'También conviene contrastar los eventos culturales con la fuente oficial correspondiente. El Municipio de Loja publica actividades con fecha, hora y sede en su página de Eventos Culturales, incluyendo programación de teatro, danza, folklore y exposiciones.',
      'Para elegir un plan, revisa cinco datos: cuándo ocurre, cuánto cuesta, cómo llegar, si requiere reserva y si el horario puede cambiar. Si el evento es gratuito, confirma si existe aforo limitado o inscripción previa.',
      'Una agenda local útil no solo enumera actividades: conecta cada evento con su lugar, con eventos parecidos y con otros planes cercanos. Así puedes armar una salida completa y descubrir nuevos espacios de Loja.',
      'Fuentes consultadas: https://www.loja.gob.ec/eventos-culturales y https://viveloja.com/eventos',
    ],
  },
  {
    slug: 'conciertos-en-loja-como-encontrar-musica-en-vivo',
    title: 'Conciertos en Loja: cómo encontrar música en vivo y elegir tu plan',
    excerpt:
      'Consejos para encontrar conciertos en Loja, revisar sedes, horarios, precios y enlaces de entradas antes de asistir.',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80',
    tags: ['conciertos en Loja', 'música en Loja', 'eventos musicales'],
    content: [
      'Cuando buscas conciertos en Loja, la fecha y el lugar son tan importantes como el artista. La programación puede aparecer en teatros, centros culturales, bares, universidades, ferias y espacios abiertos, por lo que conviene revisar una agenda que reúna distintas categorías.',
      'Antes de comprar o reservar, confirma el nombre del evento, la hora de inicio, la sede, el precio y el canal oficial de venta. No asumas que una publicación antigua sigue vigente: los organizadores pueden cambiar el horario, el aforo o la modalidad de ingreso.',
      'Para descubrir música en vivo en Loja, usa búsquedas amplias como “conciertos Loja”, “música en Loja”, “eventos musicales” y “festival Loja”. Después, reduce la lista por fecha y verifica cada ficha individual.',
      'Si buscas una salida económica, revisa la sección de entrada libre y las agendas institucionales. El Municipio de Loja publica actividades culturales con información de fecha y sede; Vive Loja permite consultar eventos publicados por organizadores y locales.',
      'Guarda los conciertos que te interesen y revisa la agenda el mismo día. Esta práctica reduce el riesgo de llegar a una actividad cancelada o con cambios de última hora.',
      'Fuentes consultadas: https://www.loja.gob.ec/eventos-culturales, https://viveloja.com/conciertos-en-loja y https://viveloja.com/eventos',
    ],
  },
  {
    slug: 'que-hacer-este-fin-de-semana-en-loja',
    title: 'Qué hacer este fin de semana en Loja: ideas para salir y disfrutar',
    excerpt:
      'Ideas para planificar un fin de semana en Loja con cultura, parques, gastronomía, naturaleza y eventos locales.',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80',
    tags: ['qué hacer en Loja', 'fin de semana en Loja', 'estilo de vida'],
    featured: true,
    content: [
      'Planificar qué hacer este fin de semana en Loja empieza por decidir el ritmo de la salida. Puedes combinar una actividad cultural, un paseo al aire libre y una comida local, dejando espacio para cambios de horario o clima.',
      'Para una salida familiar, el mapa turístico municipal describe al Parque Recreacional Jipiro como un espacio con áreas de juego, deporte, cultura, gastronomía y senderos. Verifica horarios y servicios antes de ir porque pueden actualizarse.',
      'Si prefieres naturaleza, el Ministerio del Ambiente señala accesos y senderos del Parque Nacional Podocarpus desde Loja. Una visita responsable requiere revisar condiciones, horario de ingreso, autorización para camping y recomendaciones de conservación.',
      'En el centro de la ciudad puedes sumar una exposición, una función, una feria o una actividad musical. La agenda cultural del Municipio y la agenda de Vive Loja son buenos puntos de partida para comprobar qué está programado para una fecha concreta.',
      'Una ruta sencilla para el fin de semana es: revisar la agenda, guardar dos opciones, confirmar sede y precio, y elegir un local cercano para comer o tomar café. Así el plan no depende de una sola actividad.',
      'Fuentes consultadas: https://www.loja.gob.ec/files/image/dependencias/Turismo/mapa_turistico_loja.pdf y https://www.ambiente.gob.ec/wp-content/uploads/downloads/2024/11/Areas-Protegidas-Sierra-3.pdf',
    ],
  },
  {
    slug: 'artes-vivas-y-fiavl-loja-guia',
    title: 'Artes Vivas y FIAVL en Loja: cómo consultar la programación',
    excerpt:
      'Guía práctica para seguir el FIAVL, encontrar teatro, danza y artes vivas en Loja, y verificar la información oficial.',
    image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&q=80',
    tags: ['Artes Vivas Loja', 'FIAVL', 'cultura en Loja'],
    content: [
      'Las Artes Vivas en Loja reúnen expresiones escénicas y artísticas como teatro, danza, performance, música y propuestas interdisciplinarias. Para encontrar actividades, combina la agenda local con los canales oficiales de cada organización.',
      'El Municipio de Loja informa que la edición 2026 del Festival Internacional de Artes Vivas se encuentra en proceso de planificación y que la programación oficial debe consultarse en los canales del festival. Por eso, fechas, sedes, artistas y entradas deben confirmarse antes de compartirlos.',
      'La mejor búsqueda para el FIAVL incluye el año: “FIAVL 2026”, “programación FIAVL 2026” o “Festival Internacional de Artes Vivas Loja 2026”. Una vez que encuentres un anuncio, revisa si proviene del Municipio, del sitio oficial del festival o de un organizador identificado.',
      'Vive Loja puede complementar la información con fichas de eventos, mapas y enlaces de referencia. La página de Artes Vivas muestra actividades publicadas en la ciudad y dirige a los canales oficiales cuando se necesita confirmar la programación.',
      'Si vas a una función, guarda la dirección, llega con anticipación y verifica si existe reserva, costo o aforo. En festivales, un mismo día puede tener actividades en distintas sedes.',
      'Fuentes consultadas: https://www.loja.gob.ec/category/departamentos/fiavl y https://linktr.ee/FestivalArtesVivasLoja',
    ],
  },
  {
    slug: 'plan-de-un-dia-en-loja-cultura-cafe-y-paseo',
    title: 'Plan de un día en Loja: cultura, café y paseo sin prisas',
    excerpt:
      'Una idea flexible para disfrutar Loja en un día combinando cultura, espacios verdes, gastronomía y una agenda local actualizada.',
    image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1200&q=80',
    tags: ['estilo de vida en Loja', 'turismo en Loja', 'planes en Loja'],
    content: [
      'Un día en Loja se disfruta mejor con un itinerario flexible. Elige una actividad cultural como punto central, deja tiempo para caminar y consulta la agenda antes de cerrar la ruta.',
      'Por la mañana puedes empezar con un paseo por un parque o una visita a un espacio cultural. El mapa turístico municipal incluye al Parque Recreacional Jipiro, la Central Eólica Villonaco y otros lugares de interés, pero conviene verificar horarios, accesos y servicios actuales.',
      'A la hora de comer, busca un local de gastronomía lojana y pregunta por preparaciones tradicionales. El Municipio identifica platos como repe, arveja con guineo y cecina entre las referencias de la gastronomía del cantón.',
      'Por la tarde puedes elegir una exposición, una actividad de teatro, una feria o una cafetería. Si hay un concierto o una función esa noche, reserva el tiempo de traslado y confirma la dirección exacta.',
      'La idea no es completar una lista de lugares, sino disfrutar la ciudad con pausas. Guarda la agenda de Vive Loja para descubrir eventos cercanos y actualizar el plan si aparece una actividad nueva.',
      'Fuentes consultadas: https://www.loja.gob.ec/files/image/dependencias/Turismo/mapa_turistico_loja.pdf y https://www.loja.gob.ec/files/image/LOTAIP/podt2014.pdf',
    ],
  },
  {
    slug: 'comida-tipica-lojana-que-probar',
    title: 'Comida típica lojana: qué probar y cómo descubrir lugares locales',
    excerpt:
      'Una guía para conocer sabores tradicionales de Loja y encontrar restaurantes y mercados locales en la agenda de Vive Loja.',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80',
    tags: ['comida típica lojana', 'gastronomía de Loja', 'restaurantes en Loja'],
    content: [
      'La gastronomía de Loja se puede explorar empezando por sus preparaciones tradicionales y continuando con restaurantes, mercados y cafeterías de la ciudad. La experiencia cambia según el local, el horario y la temporada, así que es buena idea revisar información actualizada.',
      'Entre las preparaciones que recoge el Municipio de Loja aparecen el repe, la arveja con guineo, la cecina y el ají de pepa. También se mencionan productos y platos como cuy, tamales, humitas, horchata y dulces tradicionales en documentos y actividades gastronómicas municipales.',
      'Para elegir dónde comer, revisa la categoría de gastronomía, compara dirección y horario, y busca reseñas verificadas cuando estén disponibles. Si el local no publica carta o precios, confirma esos datos directamente antes de trasladarte.',
      'Los mercados pueden ser una buena forma de conocer la vida cotidiana y probar preparaciones en un ambiente local. Lleva efectivo si el establecimiento lo requiere y respeta las indicaciones de cada negocio.',
      'Vive Loja permite descubrir restaurantes y cafeterías por ubicación y categoría. La selección de mejores locales se actualizará con las reseñas reales de la comunidad, mostrando siempre el número de valoraciones y la fecha de actualización.',
      'Fuentes consultadas: https://www.loja.gob.ec/files/image/LOTAIP/podt2014.pdf y https://www.loja.gob.ec/noticia/2022-10/recetas-tipicas-lojanas-se-presentaron-en-feria-gastronomica-del-ccl',
    ],
  },
  {
    slug: 'lugares-turisticos-en-loja-ecuador',
    title: 'Lugares turísticos en Loja, Ecuador: guía para organizar tu visita',
    excerpt:
      'Una guía para explorar lugares turísticos de Loja con cultura, naturaleza y recorridos urbanos, usando fuentes oficiales para confirmar cada visita.',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80',
    tags: ['lugares turísticos en Loja', 'turismo en Loja', 'Loja Ecuador'],
    featured: true,
    content: [
      'Si buscas lugares turísticos en Loja, Ecuador, conviene separar la visita en tres grupos: patrimonio y cultura en la ciudad, parques y espacios verdes, y recorridos de naturaleza en el cantón. Así puedes construir un plan realista sin tratar todos los atractivos como si estuvieran a pocos minutos entre sí.',
      'El portal oficial de Turismo de Loja organiza la oferta en turismo cultural, religioso y urbano, y también presenta recorridos por parroquias como Chuquiribamba, Chantaco, Vilcabamba, San Pedro de Vilcabamba y Jimbilla. Esa clasificación es un buen punto de partida para decidir si buscas una caminata urbana, una visita patrimonial o una escapada de naturaleza.',
      'Para una primera visita urbana, el mapa turístico municipal incluye el Centro Histórico, el Parque Recreacional Jipiro, el Jardín Botánico Reinaldo Espinosa y la Central Eólica Villonaco, entre otros sitios. Antes de salir, confirma horarios, accesos y si el lugar requiere reserva, porque el mapa es una referencia turística y no reemplaza la información operativa del día.',
      'El Parque Nacional Podocarpus y otros atractivos naturales requieren más planificación que un paseo por el centro. Revisa la ruta de acceso, el horario de entrada, el clima y las reglas de conservación en la fuente ambiental oficial antes de trasladarte.',
      'Una agenda local como Vive Loja puede complementar el recorrido con eventos, restaurantes y cafeterías cercanas. Guarda una alternativa para cada tramo del día y comprueba la información el mismo día de la visita.',
      'Fuentes consultadas: https://turismo.loja.gob.ec/home-1, https://www.loja.gob.ec/files/image/dependencias/Turismo/mapa_turistico_loja.pdf y https://www.loja.gob.ec/files/documentos/2026-03/0086-2026_ordenanza_alineacion_pdot_compressed-signed.pdf',
    ],
  },
  {
    slug: 'parque-nacional-podocarpus-desde-loja',
    title: 'Parque Nacional Podocarpus desde Loja: cómo planificar la visita',
    excerpt:
      'Información práctica para preparar una visita al Parque Nacional Podocarpus desde Loja, con rutas, horarios de ingreso y recomendaciones de conservación.',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80',
    tags: ['Parque Nacional Podocarpus', 'naturaleza en Loja', 'turismo de naturaleza'],
    content: [
      'El Parque Nacional Podocarpus es una opción de turismo de naturaleza cerca de Loja, pero no debe planificarse como un paseo urbano improvisado. La visita depende de la zona de ingreso, el estado de la vía, el clima y el tipo de sendero que quieras recorrer.',
      'La ficha del Ministerio del Ambiente consultada indica que, para las partes altas, se llega primero a Loja y que uno de los accesos descritos es la vía Loja–Zamora hacia Bombuscaro. El mismo documento detalla senderos como Oso de Anteojos, Bosque Nublado, Los Miradores y Lagunas del Compadre.',
      'En esa fuente oficial, los sitios de visita tienen ingreso a las 08h00 y salida a las 15h00. Como los horarios y condiciones pueden actualizarse, confirma la información vigente antes de viajar y calcula el retorno con margen suficiente.',
      'El camping y el uso de cabañas requieren autorización previa según la ficha consultada. Lleva únicamente lo necesario, respeta los senderos, no extraigas flora o fauna y sigue las indicaciones del personal del área protegida.',
      'Para completar el día, consulta eventos y locales de Loja antes o después de la visita, pero no mezcles en el mismo horario una caminata larga y una actividad con entrada fija sin considerar los traslados.',
      'Fuentes consultadas: https://www.ambiente.gob.ec/wp-content/uploads/downloads/2024/11/Areas-Protegidas-Sierra-3.pdf y https://www.loja.gob.ec/files/documentos/2026-03/0086-2026_ordenanza_alineacion_pdot_compressed-signed.pdf',
    ],
  },
  {
    slug: 'que-hacer-en-loja-con-ninos',
    title: 'Qué hacer en Loja con niños: ideas para un día en familia',
    excerpt:
      'Ideas para organizar un plan familiar en Loja con parques, actividades culturales y una agenda que puedas verificar antes de salir.',
    image: 'https://images.unsplash.com/photo-1504150558240-0b4fd8946624?w=1200&q=80',
    tags: ['qué hacer en Loja con niños', 'planes familiares en Loja', 'estilo de vida en Loja'],
    featured: true,
    content: [
      'Para decidir qué hacer en Loja con niños, empieza por la edad, el tiempo disponible y la facilidad de acceso. Un plan familiar funciona mejor cuando combina un espacio abierto, una pausa para comer y una actividad corta que pueda cambiarse si el clima o el cansancio lo exige.',
      'El Parque Recreacional Jipiro es una referencia municipal para actividades familiares. Las publicaciones del Municipio describen allí áreas recreativas, laguna, botes, canchas, piscina y senderos, aunque los servicios disponibles y sus horarios deben confirmarse directamente antes de la visita.',
      'También puedes revisar el calendario cultural del Municipio para encontrar exposiciones, funciones o actividades puntuales. No atribuyas una actividad al parque o a una institución sin comprobar la fecha y la sede en la publicación oficial correspondiente.',
      'Una ruta sencilla es visitar un parque por la mañana, elegir un restaurante cercano y dejar la tarde para una actividad cultural o una cafetería. Lleva agua, protector solar y una opción bajo techo para que el plan no dependa de una sola actividad.',
      'Vive Loja ayuda a comparar eventos y locales por ubicación. Guarda dos alternativas y verifica horarios, precios, aforo y servicios el mismo día, especialmente durante feriados o temporadas de vacaciones.',
      'Fuentes consultadas: https://www.loja.gob.ec/noticia/2026-08/adecentan-parque-recreacional-jipiro-con-el-apoyo-de-varias-instituciones?page=2, https://www.loja.gob.ec/node/18409 y https://loja.gob.ec/category/departamentos/cultura',
    ],
  },
  {
    slug: 'centro-historico-de-loja-que-visitar',
    title: 'Centro Histórico de Loja: qué visitar y cómo armar un recorrido',
    excerpt:
      'Un recorrido flexible por el Centro Histórico de Loja con plazas, iglesias, museos y actividades culturales para consultar antes de caminar.',
    image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&q=80',
    tags: ['Centro Histórico de Loja', 'turismo cultural en Loja', 'qué visitar en Loja'],
    content: [
      'El Centro Histórico de Loja es una buena base para un recorrido cultural a pie porque concentra plazas, iglesias, edificios patrimoniales, museos y actividades de la ciudad. La mejor ruta depende del tiempo que tengas y de los espacios que estén abiertos ese día.',
      'La documentación turística municipal identifica el Centro Histórico, la Iglesia de San Sebastián, la Iglesia de San Francisco y distintos museos como parte del patrimonio cultural de Loja. Toma esa lista como orientación y revisa cada institución antes de fijar una hora de visita.',
      'El portal municipal de Cultura publica actividades y espacios como el Museo Puerta de la Ciudad y la Casona Cultural. Una exposición, función o presentación puede cambiar la ruta, por lo que conviene consultar la agenda oficial y la agenda de Vive Loja antes de salir.',
      'Para recorrer el centro con calma, elige dos o tres paradas principales, deja tiempo para comer o tomar café y evita prometer que todos los museos estarán abiertos al mismo tiempo. La accesibilidad, el clima y los eventos de la fecha pueden modificar el recorrido.',
      'Si tomas fotografías, respeta las indicaciones de cada edificio y no presentes como permanente una actividad temporal. Una guía local útil separa la información histórica de los datos operativos que deben actualizarse.',
      'Fuentes consultadas: https://www.loja.gob.ec/files/image/dependencias/Turismo/mapa_turistico_loja.pdf, https://www.loja.gob.ec/files/documentos/2026-03/0086-2026_ordenanza_alineacion_pdot_compressed-signed.pdf y https://loja.gob.ec/category/departamentos/cultura',
    ],
  },
  {
    slug: 'turismo-religioso-loja-virgen-del-cisne',
    title: 'Turismo religioso en Loja: cómo planificar una visita relacionada con la Virgen del Cisne',
    excerpt:
      'Guía respetuosa para organizar turismo religioso en Loja y consultar información oficial sobre la Romería de la Virgen del Cisne.',
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=80',
    tags: ['turismo religioso en Loja', 'Virgen del Cisne', 'tradiciones de Loja'],
    content: [
      'El turismo religioso en Loja está relacionado con la devoción a la Virgen del Cisne y con actividades que reúnen a residentes y visitantes. Para participar de forma responsable, consulta primero la programación, los recorridos y las recomendaciones oficiales de la fecha.',
      'El portal oficial de Turismo de Loja presenta la Romería de la Virgen del Cisne dentro de su sección de turismo religioso. La presencia de una referencia en el portal no sustituye el calendario operativo: rutas, cierres, horarios y servicios pueden cambiar según la edición.',
      'Si planeas viajar, confirma transporte, hospedaje, puntos de atención y condiciones de seguridad. Durante una romería, calcula más tiempo para desplazarte y respeta las zonas reservadas para la ceremonia o el tránsito de participantes.',
      'La agenda de Vive Loja puede complementar la planificación con eventos culturales, restaurantes y alojamientos, pero cada dato práctico debe verificarse con el organizador o la institución responsable antes de publicarse o compartirse.',
      'Una guía útil evita inventar cifras de asistentes, fechas o promesas religiosas. Se concentra en orientar la búsqueda y enlazar la fuente oficial para que cada persona tome decisiones informadas.',
      'Fuentes consultadas: https://turismo.loja.gob.ec/ y https://loja.gob.ec/noticia/2026-08/se-habilita-plaza-de-el-cisne',
    ],
  },
  {
    slug: 'lojanismos-palabras-y-expresiones-de-loja',
    title: 'Lojanismos: palabras y expresiones que forman parte de la identidad de Loja',
    excerpt:
      'Un recorrido por palabras y expresiones lojanas documentadas por el Municipio, ideal para conocer el lenguaje cotidiano y la cultura local.',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80',
    tags: ['lojanismos', 'cultura lojana', 'identidad de Loja'],
    content: [
      'Los lojanismos son palabras y expresiones que ayudan a reconocer la identidad lingüística de Loja. No son solo curiosidades: también aparecen en conversaciones, recetas, relatos y formas de nombrar lugares o costumbres.',
      'El Municipio de Loja mantiene un repertorio de lojanismos con términos como repe, quesillo, cecina, quingo y otras voces locales. Para aprender su significado, conviene consultar la definición documentada y observar el contexto en el que se usa.',
      'Por ejemplo, el repertorio municipal describe el repe como una crema de guineo verde y queso, y registra quesillo como requesón. Estas palabras también conectan con la gastronomía lojana que puedes explorar en restaurantes y mercados de la ciudad.',
      'Una forma de convertir esta información en un plan es buscar una preparación tradicional, visitar un local de gastronomía y conversar con respeto sobre el origen del término. No atribuyas una palabra a toda la región si la fuente solo la documenta para Loja.',
      'Vive Loja puede reunir artículos, eventos culturales y locales donde la comunidad mantenga vivas estas expresiones. La mejor guía combina la fuente documental con voces locales y evita corregir variantes que forman parte del uso cotidiano.',
      'Fuente consultada: https://www.loja.gob.ec/node/147',
    ],
  },
]

export const EDITORIAL_ARTICLE_PATHS = SEO_EDITORIAL_ARTICLES.map((article) => article.slug)

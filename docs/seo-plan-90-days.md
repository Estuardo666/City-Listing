# Plan SEO de 90 días de Vive Loja

Documento operativo para aumentar la visibilidad orgánica de Vive Loja en búsquedas locales de eventos, cultura, turismo, gastronomía y negocios de Loja, Ecuador.

El detalle de resultados observados y competidores está en el [análisis SEO de competidores](seo-competitor-analysis.md).

## Resultado buscado

Vive Loja debe ser una respuesta útil para tres intenciones de búsqueda:

1. **Descubrir un plan:** “eventos en Loja”, “eventos Loja”, “conciertos en Loja”, “eventos hoy en Loja” y “qué hacer este fin de semana en Loja”.
2. **Seguir una escena cultural:** “Artes Vivas Loja”, “FIAVL”, teatro, danza, exposiciones y agenda cultural.
3. **Elegir un negocio local:** restaurantes, cafeterías, hoteles, gimnasios y otros locales, usando información publicada y reseñas reales.

La regla editorial es simple: cada dato temporal, precio, horario, sede, calificación o afirmación sobre un negocio debe provenir de una fuente comprobable o de contenido aprobado por la comunidad. Si un dato no está disponible, la página lo declara como desconocido.

## Lectura del mercado y oportunidad

La búsqueda local combina fuentes institucionales y publicaciones dispersas. El Municipio de Loja mantiene una agenda cultural y una sección dedicada al FIAVL; sus canales son la referencia primaria para confirmar fechas y cambios. La información turística municipal aporta contenido evergreen sobre lugares y recorridos, mientras que los anuncios de organizadores suelen estar repartidos entre redes sociales y páginas de eventos.

La oportunidad de Vive Loja es unir esas intenciones en páginas rastreables y actualizadas: una agenda por fecha, landings por tema, fichas individuales con ubicación y enlaces de referencia, y artículos que expliquen cómo elegir un plan sin presentar como confirmado lo que todavía no lo está.

Fuentes de referencia consultadas:

- [Eventos culturales del Municipio de Loja](https://www.loja.gob.ec/eventos-culturales)
- [Departamento del FIAVL del Municipio de Loja](https://www.loja.gob.ec/category/departamentos/fiavl)
- [Canales oficiales del Festival Internacional de Artes Vivas](https://linktr.ee/FestivalArtesVivasLoja)
- [Mapa turístico municipal de Loja](https://www.loja.gob.ec/files/image/dependencias/Turismo/mapa_turistico_loja.pdf)
- [Información oficial de áreas protegidas y Podocarpus](https://www.ambiente.gob.ec/wp-content/uploads/downloads/2024/11/Areas-Protegidas-Sierra-3.pdf)
- [Referencia municipal de gastronomía lojana](https://www.loja.gob.ec/noticia/2022-10/recetas-tipicas-lojanas-se-presentaron-en-feria-gastronomica-del-ccl)

## Arquitectura de palabras clave

| Cluster | Consultas objetivo | Página principal | Apoyo editorial |
|---|---|---|---|
| Agenda general | eventos en Loja, eventos Loja, agenda de Loja | `/eventos` | `eventos-en-loja-guia-para-encontrar-planes` |
| Música | conciertos en Loja, música en vivo Loja, eventos musicales | `/conciertos-en-loja` | `conciertos-en-loja-como-encontrar-musica-en-vivo` |
| Cultura | eventos culturales Loja, agenda cultural Loja | `/eventos-culturales-loja` | `artes-vivas-y-fiavl-loja-guia` |
| Artes escénicas | Artes Vivas Loja, FIAVL, teatro y danza Loja | `/artes-vivas-loja`, `/fiavl` | `artes-vivas-y-fiavl-loja-guia` |
| Frescura | eventos hoy en Loja, qué hacer este fin de semana en Loja | `/eventos-hoy-en-loja`, `/eventos-este-fin-de-semana-en-loja` | `que-hacer-este-fin-de-semana-en-loja` |
| Estilo de vida | qué hacer en Loja, turismo en Loja, comida típica lojana | `/blog` | `plan-de-un-dia-en-loja-cultura-cafe-y-paseo`, `comida-tipica-lojana-que-probar` |
| Negocios | mejores restaurantes/cafeterías/hoteles/gimnasios/clínicas de Loja | landings `/blog/mejores-*` | Google Maps reciente o reseñas reales de Vive Loja |

No se deben crear páginas para cada variación de palabra clave si no aportan una agenda, una selección o una explicación distinta. Las variantes se trabajan en el texto, títulos, enlaces internos y datos de la ficha.

## Línea base de Search Console

Lectura realizada el 13 de septiembre de 2026 sobre la propiedad `https://viveloja.com/`, con rango de los últimos tres meses (11 de junio–10 de septiembre de 2026):

- 46 clics.
- 5,11 mil impresiones.
- CTR medio de 0,9 %.
- Posición media de 7,9.
- 171 consultas y 20 páginas con datos en el informe.

Consultas visibles con mayor oportunidad para este plan: `eventos loja` (4 clics, 53 impresiones), junto con consultas locales de negocios como `doit fitness club`, `alitas loja` y `mercado mayorista loja`. Las consultas de clínicas y negocios muestran que las fichas locales ya reciben demanda, pero no deben confundirse con el cluster editorial de eventos.

Páginas principales observadas: `/eventos` (10 clics, 657 impresiones), `/locales/clinica-nataly` (10 clics, 807 impresiones), `/locales/doit-fitness-club` (7 clics, 259 impresiones) y `/blog/ruta-ecologica-senderos-loja` (5 clics, 89 impresiones).

Decisión de medición: comparar las nuevas landings contra esta línea base por separado. El objetivo inicial es aumentar impresiones y clics del cluster de eventos sin atribuir el tráfico de salud o negocios a los artículos culturales.

## Línea base de funciones de IA

En la lectura del 14 de septiembre de 2026, Search Console muestra para los últimos 28 días 30 impresiones en funciones de IA generativa y cinco páginas con apariciones. Las URLs visibles son fichas de negocios y la portada; `/eventos` todavía no aparece. En la búsqueda pública `eventos loja`, la Visión general creada por IA cita fuentes institucionales, una página cultural de Facebook y Agenda Cultural Loja, pero no a Vive Loja.

Para aumentar la posibilidad de ser citado, cada landing debe responder la intención en texto HTML visible, presentar eventos actuales y verificables, enlazar la fuente primaria cuando exista y mantener coherencia entre H1, title, description, enlaces internos y JSON-LD. Esto mejora la comprensión de la página, pero no garantiza una aparición: Google decide las fuentes de cada respuesta y puede cambiar el conjunto de resultados.

## Estado implementado

### Días 1–14: base técnica

- [x] `metadataBase`, canonicals y Open Graph consistentes con `https://viveloja.com`.
- [x] JSON-LD para Website, BreadcrumbList, Event, CollectionPage e ItemList.
- [x] Event schema sin precios, ofertas u organizadores inventados.
- [x] Sitemap raíz válido que incluye solo rutas públicas aprobadas y activas.
- [x] Rutas heredadas de WordPress devuelven `410 Gone` y `X-Robots-Tag: noindex, nofollow`.
- [x] Se retiró el bloqueo artificial del zoom móvil.

Implementación: `src/app/layout.tsx`, `src/app/sitemap.ts`, `src/lib/seo/json-ld-builders.ts`, `src/components/json-ld.tsx` y `src/proxy.ts`.

### Días 15–30: cobertura de intención

- [x] Seis landings SSR para agenda, conciertos, cultura, Artes Vivas, FIAVL, hoy y fin de semana.
- [x] Doce artículos editoriales aprobados y sembrados con `npm run content:seed:seo`, cubriendo búsquedas de eventos, turismo, naturaleza, cultura, vida familiar, gastronomía y lojanismos.
- [x] Diez páginas de mejores locales por categoría o intención (restaurantes, cafeterías, hoteles, gimnasios, clínicas, bares, hostales, pizzerías, odontología y deportes); nueve son indexables y Deportes queda preparado con `noindex` hasta disponer de valoraciones verificables.
- [x] Enlaces internos entre agenda, landings y artículos.
- [x] Fuentes consultadas visibles como enlaces en los artículos.
- [x] Las páginas de rankings usan Google Maps solo con datos recientes y enlace de atribución; si no, usan reseñas de Vive Loja.
- [x] Las páginas de rankings no publican posiciones falsas cuando no existe una valoración verificable.

Implementación: `src/lib/seo/event-landings.ts`, `src/components/features/events/seo-event-landing.tsx`, `src/lib/seo/editorial-content.ts`, `src/lib/seo/ranked-venue-articles.ts` y `src/components/features/blog/ranked-venue-article.tsx`.

### Ajuste de títulos y snippets — 14 de septiembre de 2026

- [x] `/eventos` ahora usa un title orientado a `eventos en Loja`, agenda, conciertos y qué hacer.
- [x] La descripción incorpora la respuesta útil y los campos que las personas necesitan para decidir: fecha, lugar y precio.
- [x] El H1 y el resumen aparecen antes del mapa para que el contenido principal sea visible desde el primer bloque rastreable.
- [x] `/eventos` se revalida cada 15 minutos; las landings temáticas conservan su revalidación de 15 minutos.
- [x] Se alinearon titles y descriptions de conciertos, eventos culturales, Artes Vivas, FIAVL, hoy y fin de semana.
- [x] Se enriqueció el JSON-LD de las colecciones con la ciudad, idioma, dirección y descripción del evento cuando están disponibles.

## Ejecución de los días 31–90

### Días 31–45: frescura y cobertura de eventos

- Publicar o aprobar eventos con título, fecha de inicio, sede, dirección y categoría antes de promocionarlos.
- Revisar cada semana eventos que ya pasaron, eventos cancelados y horarios modificados.
- Añadir enlace del organizador cuando exista una fuente oficial.
- Mantener activas las páginas “hoy” y “fin de semana” solo con el rango de fechas correspondiente.
- Publicar al menos un resumen editorial semanal cuando existan suficientes actividades confirmadas; no rellenar una semana vacía con texto genérico.

Verificación: comparar `/eventos`, cada ficha y el sitemap. Un evento no aprobado no debe aparecer en ninguna de esas superficies públicas.

### Días 46–60: entidades locales y reseñas

- Invitar a propietarios a reclamar sus fichas y corregir nombre, dirección, horarios, teléfono, sitio web y categorías.
- Solicitar reseñas después de una experiencia real, sin ofrecer incentivos por una puntuación concreta.
- Moderar reseñas duplicadas, ofensivas o no relacionadas con el local.
- Activar los rankings con `googleRating`/`googleReviewCount` y `googleLastSyncAt` vigente; usar `avgRating`/`reviewCount` de Vive Loja como respaldo.
- Añadir páginas de categoría únicamente cuando exista una selección útil y verificable.

KPI: porcentaje de fichas aprobadas con dirección, horario y categoría completos; número de reseñas válidas por categoría; fichas reclamadas.

### Días 61–75: autoridad local y distribución

- Compartir landings específicas con organizadores, teatros, universidades, centros culturales, hoteles y medios locales que realmente participen en la actividad.
- Solicitar enlaces editoriales solo cuando la página de Vive Loja aporte agenda, mapa o información complementaria.
- Crear una página de colaboración para organizadores con instrucciones para enviar información verificable.
- Usar enlaces con texto descriptivo y evitar intercambios masivos, directorios de baja calidad o enlaces pagados sin etiquetar.
- Difundir cada artículo en los canales del negocio o institución que aparezca citado, pidiendo revisión factual antes de publicar.

KPI: dominios locales relevantes que enlazan a Vive Loja, menciones verificables, clics de referencia y eventos nuevos recibidos por organizadores.

### Días 76–90: medición e iteración

- Revisar semanalmente en Search Console las consultas, páginas, impresiones, clics, CTR y posición media por cluster.
- La ruta `/api/cron/search-console` sincroniza cada lunes una ventana móvil de 28 días para que el panel admin conserve una línea de tendencia.
- Separar páginas con impresiones y CTR bajo de páginas que todavía no reciben impresiones: requieren mejoras distintas.
- Ajustar títulos y descripciones solo después de observar datos; conservar la intención de búsqueda y no hacer clickbait.
- Revisar cobertura e indexación de las landings y artículos nuevos.
- En Semrush, registrar mensualmente posición, intención, URL competidora y tipo de resultado para los clusters principales.
- Actualizar artículos cuando cambien fuentes oficiales, temporadas, horarios o programación.

KPI: páginas indexadas válidas, impresiones no pagadas, clics orgánicos, CTR por cluster, posiciones de las landings, sesiones hacia fichas de eventos y clics en direcciones/enlaces externos.

## Cadencia editorial posterior

Usar este ciclo semanal:

1. Lunes: revisar agenda oficial y eventos próximos.
2. Martes: aprobar datos recibidos de organizadores y corregir fichas.
3. Miércoles: actualizar una landing o artículo que tenga impresiones pero bajo CTR.
4. Jueves: publicar un artículo solo si existe una fuente primaria o una selección real que lo sostenga.
5. Viernes: difundir la landing de fin de semana y verificar cambios de última hora.
6. Domingo: revisar eventos pasados y registrar preguntas frecuentes de usuarios.

Ideas de contenido que deben validarse antes de redactarse:

- Agenda cultural mensual de Loja.
- Conciertos y música en vivo confirmados para un mes concreto.
- Actividades gratuitas y con entrada libre, indicando condiciones de acceso.
- Guía actualizada de una edición del FIAVL.
- Planes familiares y espacios verdes con horarios confirmados.
- Comparativas de cafeterías, restaurantes, hoteles, gimnasios, clínicas y locales deportivos basadas en valoraciones verificables.

## Publicación y verificación técnica

Desde el directorio del proyecto:

```powershell
npm run content:seed:seo
npm run lint
npm run build:turbopack
```

La sincronización automática de Search Console requiere `CRON_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN` configurados en el entorno de producción. El cron no envía datos si la integración no está configurada.

Antes de publicar:

- Confirmar que el contenido tiene estado `APPROVED`.
- Abrir la URL canónica y comprobar título, H1, enlaces internos, imagen y JSON-LD.
- Comprobar que no se muestra un precio desconocido como “gratis”.
- Comprobar que el sitemap responde con un `<urlset>` válido y no incluye rutas anidadas de otros sitemaps.
- Probar una ficha de evento sin precio y una página sin resultados.
- Solicitar indexación en Search Console después del deploy, no antes.

Última verificación local de esta implementación: 47 tests aprobados, lint sin errores y build de producción correcto con 230 páginas generadas. El smoke test de servidor confirmó 10 rutas nuevas con HTTP 200, sitemap con 956 URLs y cero referencias al ranking deportivo no indexable.

## Integraciones y límites actuales

- `gcloud` está autenticado, pero el token disponible no tiene el scope necesario para operar Search Console directamente.
- Search Console está abierto en la propiedad `https://viveloja.com/`; el campo `sitemap.xml` queda preparado para envío manual.
- Semrush no tiene un MCP/CLI instalado en este entorno; la revisión se realizó desde la sesión web autenticada.
- No se deben imprimir, guardar en documentación ni subir tokens, cookies o variables de entorno.
- El deploy y el envío del sitemap son pasos externos a este cambio de código y requieren ejecutarse después de aprobar la versión que llegará a producción.

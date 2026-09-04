# Guía: Integración con Google Places API

Esta guía explica cómo configurar y utilizar la integración con Google Places API para importar locales a tu aplicación Vive Loja.

## Cobertura del importador `/admin/imports/google`

### Fotos de Google en el frontend

Las tarjetas de Explorar, locales, rankings y secciones de inicio usan una foto de Google cuando falta la imagen propia (las tarjetas con manejo de errores también lo hacen si falla esa imagen). La ficha del local muestra la foto grande. No requiere volver a importar: utiliza el `googlePlaceId` existente.

`GET /api/venues/[slug]/google-photo?size=small|large` obtiene metadatos recientes y una URL de imagen de Google; solo atiende locales aprobados y activos. El navegador solicita la foto cuando entra en pantalla y la muestra directamente desde Google, sin pasar por el optimizador de Next ni guardar fotos o referencias en la base de datos. El endpoint y sus consultas usan `no-store`. Las tarjetas conservan su fondo si no hay foto o falla Google. La clave `GOOGLE_PLACES_API_KEY` permanece en el servidor.

La atribución **Google Maps** abre la foto con sus autores y un enlace a la fuente original. Las miniaturas solicitan un ancho máximo de 400 px y la ficha 1200 px. Cada carga puede consumir una consulta de detalles y otra de foto. El limitador distribuido existente permite hasta 120 solicitudes por IP y minuto cuando Redis está configurado; no sustituye los límites de cuota de Google Cloud.

Validación sin consumir Google: `node --require ./tests/register-server-only.cjs --import tsx --test tests/google-photo.test.ts`.

El asistente normal y la importación lenta comparten la búsqueda paginada. El catálogo incluye 95 categorías de comercios, servicios, profesionales y lugares, con una búsqueda general de negocios para complementar las categorías específicas.

Cada selección se consulta primero en el área completa y luego en nueve sectores. Las búsquedas están restringidas geográficamente y los resultados fuera del radio circular se descartan. Cada consulta conserva sus parámetros al avanzar con `nextPageToken`; los resultados se unen por el ID de Google.

La primera respuesta es parcial. Usa **Continuar todas las categorías y sectores** para recorrer las consultas pendientes, o **Cargar más resultados** para avanzar una página. La carga continua se puede pausar; conserva los resultados y termina la solicitud en curso. Una página vacía o con duplicados no significa que la búsqueda haya terminado. Los errores detienen la carga y permiten reintentar la misma página.

La cobertura ampliada realiza diez búsquedas por categoría, cada una con las páginas que devuelva Google, por lo que aumenta el consumo de cuota y puede aumentar el costo. Con las 95 categorías son 950 búsquedas antes de contar páginas adicionales. Puedes seleccionar menos categorías o pausar cuando tengas suficientes resultados.

Google Text Search devuelve resultados ordenados y limitados, no un inventario exhaustivo. Incluso completando todos los sectores pueden faltar locales que aparecen en Maps. Para profundizar en una zona densa, vuelve a buscar usando una dirección de ese barrio y un radio menor. Consulta la [documentación oficial de Text Search](https://developers.google.com/maps/documentation/places/web-service/text-search).

Prueba de regresión sin llamadas reales a Google ni escrituras en la base de datos:

```bash
node --require ./tests/register-server-only.cjs --import tsx --test tests/google-import-search.test.ts
```

## 📋 Requisitos previos

1. Tener una cuenta en Google Cloud Platform
2. Un proyecto de Google Cloud creado
3. Tarjeta de crédito configurada (aunque hay un generoso nivel gratuito)

## 🔧 Configuración en Google Cloud Console

### 1. Habilitar las APIs necesarias

Ve a [Google Cloud Console](https://console.cloud.google.com/) y habilita las siguientes APIs:

- **Places API (New)** - La API principal para buscar lugares
- **Geocoding API** - Opcional; el asistente actual resuelve direcciones mediante Text Search de Places API (New)
- **Maps Static API** - Para obtener fotos de los lugares (opcional)

### 2. Crear una API Key

1. En el menú lateral, ve a **APIs & Services > Credentials**
2. Haz clic en **+ CREATE CREDENTIALS**
3. Selecciona **API key**
4. Copia la API Key generada

### 3. Restringir la API Key (importante para seguridad)

Edita tu API Key y añade las siguientes restricciones:

#### Restricciones de aplicación:
Esta clave se usa desde el servidor de Vercel, no desde el navegador. No uses **HTTP referrers / Websites**: Google rechazará las peticiones con `API_KEY_HTTP_REFERRER_BLOCKED`. Utiliza una clave separada para el backend; si dispones de IP de salida fija, restríngela a esas IP. En Vercel sin salida fija, la clave de servidor requiere **None** en restricciones de aplicación y restricciones de API a **Places API (New)**. No cambies ni reutilices una clave pública del frontend para este fin.
- Para desarrollo: `localhost:*`

#### Restricciones de API:
- Selecciona **Restrict key**
- Para la clave del importador selecciona **Places API (New)**.
- Guárdala en Vercel como `GOOGLE_PLACES_API_KEY` para el entorno de producción y vuelve a desplegar.
- Si aparece `SERVICE_DISABLED`, habilita Places API (New) en el mismo proyecto de la clave.

### 4. Configurar cuotas y límites

Ve a **APIs & Services > Places API** y configura:

- **Requests per minute**: 60-100 para empezar
- **Requests per day**: Según tu plan (el nivel gratuito es ~$200/mes)

## 🚀 Configuración en la aplicación

### 1. Variables de entorno

Añade a tu archivo `.env`:

```env
GOOGLE_PLACES_API_KEY=tu-api-key-aqui
```

O copia desde `.env.example` y completa el valor.

### 2. Actualizar la base de datos

Ejecuta el siguiente comando para añadir el campo `googlePlaceId` a la tabla de venues:

```bash
npm run db:push
```

### 3. Reiniciar el servidor

```bash
npm run dev
```

## 📝 Uso de la herramienta de importación

### Acceder a la herramienta

1. Inicia sesión como administrador
2. Ve a `/admin/import`
3. Verás la interfaz de importación de Google Places

### Buscar lugares

1. **Término de búsqueda**: Escribe lo que buscas (ej: "restaurantes italianos", "cafeterías")
2. **Categoría**: Selecciona la categoría donde se guardarán los locales
3. **Opciones avanzadas** (opcional):
   - **Ubicación**: Coordenadas (lat,lng) para buscar en un área específica
   - **Radio**: Distancia en metros desde la ubicación (default: 5000m)
   - **Calificación mínima**: Filtrar por rating mínimo
   - **Máx. resultados**: Cuántos resultados obtener (1-20)

### Importar un lugar

1. Busca lugares usando el formulario
2. Revisa los resultados
3. Los lugares ya importados aparecerán marcados en gris
4. Haz clic en "Importar" junto al lugar que deseas agregar

### Opciones de importación

- **Importar detalles adicionales**: Obtiene información más completa del lugar
- **Importar fotos**: Descarga las fotos del lugar (requiere más cuota)

## 💡 Optimización de costos

Google Places API cobra por:
- **Sesiones de Autocomplete**: $0.00833 por sesión
- **Place Details**: $17 por 1000 llamadas
- **Find Place**: $17 por 1000 llamadas
- **Photos**: $7 por 1000 llamadas

### Recomendaciones:

1. **Usa field masks**: Ya implementado en el código para solicitar solo los campos necesarios
2. **Cachea resultados**: Los lugares importados se guardan en la BD
3. **Limita las fotos**: Importa fotos solo para lugares importantes
4. **Monitorea el uso**: Revisa el dashboard de Google Cloud regularmente

## 🔍 Mapeo de datos

La integración mapea automáticamente los campos de Google Places a tu modelo Venue:

| Campo Google Places | Campo Venue | Notas |
|---------------------|-------------|-------|
| name | name | Nombre del lugar |
| formattedAddress | address, location | Dirección completa |
| phoneNumber | phone | Teléfono |
| websiteUri | website | Sitio web |
| rating | content | Se incluye en el contenido |
| location.lat/lng | lat/lng | Coordenadas |
| placeId | googlePlaceId | ID único para evitar duplicados |

## 🛠️ Endpoints API

La integración expone los siguientes endpoints:

### GET `/api/admin/import/google-places`
Busca lugares en Google Places

Parámetros:
- `query` (required): Término de búsqueda
- `categoryId` (required): ID de categoría
- `location` (optional): Coordenadas "lat,lng"
- `radius` (optional): Radio en metros
- `minRating` (optional): Calificación mínima
- `maxResults` (optional): Máx. resultados (1-20)

### POST `/api/admin/import/google-places`
Importa un lugar específico

Body:
```json
{
  "query": "restaurantes",
  "categoryId": "cat_123",
  "options": {
    "importDetails": true,
    "importPhotos": false
  }
}
```

### PUT `/api/admin/import/google-places`
Importación masiva

Body:
```json
{
  "imports": [
    {
      "placeId": "ChIJ...",
      "categoryId": "cat_123"
    }
  ],
  "options": {
    "importDetails": true,
    "overwriteExisting": false
  }
}
```

## 🚨 Consideraciones importantes

1. **Términos de servicio**: Respeta los términos de Google Places API
2. **Atribución**: Muestra "Powered by Google" cuando uses datos de Google
3. **Privacidad**: No almacenes datos personales de los usuarios
4. **Cuotas**: Monitorea tu uso para no exceder los límites
5. **Calidad**: Revisa los datos importados antes de publicarlos

## 🔧 Solución de problemas

### Error: "Google Places API key not configured"
- Verifica que la variable de entorno `GOOGLE_PLACES_API_KEY` esté configurada
- Reinicia el servidor después de añadir la variable

### Error: "API key invalid"
- Verifica que la API key sea correcta
- Asegúrate de que las restricciones permiten tu dominio/IP

### Error: "Places API not enabled"
- Habilita la Places API en Google Cloud Console
- Puede tomar unos minutos en activarse

### Error: "Exceeded quota"
- Espera a que se renueve la cuota (generalmente cada 24 horas)
- Aumenta los límites en Google Cloud Console si es necesario

## 📚 Referencias

- [Documentación oficial de Google Places API](https://developers.google.com/maps/documentation/places/web-service)
- [Guía de precios](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Políticas de uso](https://developers.google.com/maps/terms)

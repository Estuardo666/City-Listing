# Plan de producción en Google Cloud — City Listing

Fecha: 2026-09-14
Objetivo: usar Cloud Run como producción de `viveloja.com`, conservar Vercel como respaldo temporal y no borrar ni modificar Neon.

## Estado verificado

- Cloud Run `city-listing`, región `northamerica-south1` (México), revisión activa `city-listing-00042-bek`.
- Configuración aplicada: **2 vCPU**, **2 GiB**, `minScale=1`, `maxScale=20`, concurrencia 80 y Startup CPU Boost activo.
- La URL `run.app` responde HTTP 200. La primera petición antes del ajuste tardó aproximadamente 4,4 s; las peticiones calientes estuvieron alrededor de 0,7–0,9 s.
- Vercel mantiene una implementación de producción lista y los dominios `viveloja.com` y `city-listing-lovat.vercel.app`.
- El runtime de Cloud Run contiene las 54 variables no vacías necesarias del entorno de producción de Vercel; se excluyeron variables internas de Vercel y `GOOGLE_APPLICATION_CREDENTIALS`.
- `NEXTAUTH_URL` y `NEXT_PUBLIC_APP_URL` usan `https://viveloja.com`.
- Nominalia administra `viveloja.com`; el registro A del dominio raíz apunta al balanceador global (`34.102.236.83`) y `www` es CNAME al dominio raíz. Los registros MX, SPF, DMARC y autoconfiguración de correo se conservaron.
- Neon conserva el proyecto `Listing` y la rama `main` activa. No se debe eliminar ni mover; el runtime debe usar la URL agrupada y las migraciones la URL directa.
- Hay tres Cloud Scheduler activos para notificaciones, Google Refresh y Search Console, apuntando al servicio Cloud Run.

## Invariantes de seguridad

1. No eliminar Vercel, sus deployments, Neon, la base de datos ni los buckets R2.
2. No poner valores de secretos en Git, documentos, comandos visibles o logs.
3. Crear una cuenta de servicio dedicada para City Listing, otorgarle solo los roles necesarios y usarla en Cloud Run; no depender de la cuenta Compute Engine predeterminada.
4. Usar Secret Manager y la identidad de servicio de Cloud Run; no usar `GOOGLE_APPLICATION_CREDENTIALS` como archivo JSON en producción.
5. Rotar las credenciales que hayan quedado expuestas en salidas de terminal o capturas antes del corte definitivo.

## Fase 1 — Preparar el runtime

1. Inventariar nombres de variables de Vercel por entorno, sin copiar valores a texto plano.
2. Separar variables públicas (`NEXT_PUBLIC_*`) de secretos: base de datos, NextAuth, Google OAuth, Mapbox servidor, R2, Resend, Turnstile, PayPhone, Search Console, cron y búsqueda.
3. Crear versiones en Secret Manager y conceder `roles/secretmanager.secretAccessor` a la cuenta de servicio de Cloud Run.
4. Eliminar o dejar sin configurar Upstash si la aplicación debe funcionar sin esa búsqueda; si se necesita, crear credenciales válidas y probarla explícitamente.
5. Configurar `NEXTAUTH_URL` y `NEXT_PUBLIC_APP_URL` con `https://viveloja.com`.
6. Ejecutar `npx prisma migrate status` y luego `npx prisma migrate deploy` una sola vez, usando `DATABASE_URL_UNPOOLED`, después de verificar una copia/punto de restauración en Neon. Nunca usar `prisma db push` en producción.

## Fase 2 — Despliegue repetible

1. Mantener GitHub (`Estuardo666/City-Listing`) como fuente única.
2. Crear un pipeline de GitHub Actions o Cloud Build que ejecute lint, pruebas, compilación, publique la imagen en Artifact Registry y despliegue una nueva revisión de Cloud Run.
3. Autenticar el pipeline con Workload Identity Federation, sin claves JSON permanentes.
4. Desplegar nuevas revisiones con `--no-traffic`, verificar salud y enviar primero una pequeña fracción de tráfico; promover a 100 % solo si pasa el smoke test.
5. Conservar la revisión anterior para rollback inmediato.

## Fase 3 — Dominio y TLS

El mapeo directo de dominios de Cloud Run no está disponible en `northamerica-south1` y además está en Preview/no recomendado para producción. La opción recomendada es un **Global External Application Load Balancer** delante de Cloud Run.

1. Reservar una IPv4 global.
2. Crear un Serverless NEG que apunte al servicio `city-listing`.
3. Crear backend service, URL map, proxy HTTPS y certificado administrado para `viveloja.com` y `www.viveloja.com`.
4. Configurar redirección HTTP→HTTPS.
5. Esperar que el certificado esté activo antes de cambiar DNS.
6. En Nominalia, cambiar únicamente el A de `viveloja.com` a la IP del balanceador. (Aplicado: `34.102.236.83`.) Mantener `www` como CNAME a `viveloja.com` y conservar intactos MX, SPF, DMARC, autodiscover, authsmtp, resend y demás correo.
7. Verificar propagación, certificado, redirecciones y respuestas desde varias redes.

El balanceador, la IP y el tráfico de salida pueden generar cargos adicionales después del crédito de prueba.

## Fase 4 — Validación funcional

- `/`, `/home`, `/explore`, `/content` y `/api/mobile/v1/health` devuelven 200.
- `/api/auth/providers` usa callbacks en `viveloja.com`.
- Login Google, NextAuth, Turnstile y logout funcionan.
- Lectura/escritura de Neon y migraciones están correctas.
- Subida/lectura de imágenes con R2 funciona.
- Resend envía desde un dominio verificado.
- PayPhone, retorno/cancelación y webhooks se prueban con una transacción controlada.
- Los tres Scheduler llaman a la revisión correcta y el secreto no aparece en la respuesta.
- Mapbox, Google Places, sitemap, robots, canonicals y Search Console siguen correctos.
- Se miden p95 de latencia, errores 5xx, CPU, memoria, instancias y conexiones a Neon.

## Fase 5 — Corte y rollback

1. Mantener Vercel activo y sin cambios durante la validación. (Aplicado: sigue disponible para rollback.)
2. Cambiar DNS en una ventana controlada y observar durante 30–60 minutos. (Aplicado y verificado.)
3. Si todo está correcto, quitar `viveloja.com` de Vercel sin borrar el proyecto ni su deployment de respaldo.
4. Desactivar previews automáticas de Vercel si siguen consumiendo cuota, conservando el proyecto para rollback manual.
5. Si hay un fallo, restaurar el A de Nominalia a `216.198.79.1`; Vercel seguirá disponible como respaldo.

## Operación continua

- Crear alertas de presupuesto y de errores 5xx/latencia.
- Revisar el consumo de Cloud Run, Artifact Registry, Load Balancer, Scheduler y Secret Manager.
- Mantener `min=1` solo si la reducción de latencia justifica el costo; probar `min=0` para comparar.
- No elevar `maxScale` por encima de 20 hasta conocer el límite de conexiones de Neon.

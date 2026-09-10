# Photo Jhon

Sitio y panel de administración para el archivo fotográfico de Jhon, sustituyendo
a `photo-jhon.blogspot.com`.

La idea que lo gobierna todo está en `diseno/README.md`: **la serie es la unidad de
navegación, no la semana**. Las fotos entran por rollo (el lote que se escanea de
una vez) y desde ahí se reparten en series; la fecha se guarda, pero deja de mandar.

## Arrancar

```bash
npm install
npm run db:push     # crea el esquema en la base que diga DATABASE_URL
npm run db:seed     # usuario, series y un rollo de ejemplo con fotos del blog
npm run dev
```

- Sitio: <http://localhost:3000>
- Panel: <http://localhost:3000/admin> — `jhon@photojhon.com`. La contraseña la
  enseña `npm run db:seed` al terminar (o la fijas tú antes con `CLAVE_PANEL`);
  para cambiarla después, `npm run panel:clave`. Aquí no se escribe ninguna: una
  clave en el repositorio es una clave publicada.

`.env` sale de `.env.example`. `AUTH_SECRET` se genera con
`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

## Cómo está montado

| | |
|---|---|
| Next.js 16 (App Router, Turbopack) | `app/` |
| Sitio público | `app/(sitio)/` |
| Panel | `app/admin/(panel)/`, con `app/admin/entrar` fuera del guardián |
| Acciones de servidor | `app/admin/acciones.ts` |
| Prisma 7 + Postgres (Neon) | `prisma/schema.prisma`, adaptador `@prisma/adapter-pg` |
| Caché opcional (Dragonfly / Redis) | `lib/cache.ts`, `compose.yaml` |
| NextAuth v5 (credenciales, sesión JWT) | `lib/auth.ts` |
| Tailwind v4 | tokens en `app/globals.css` |

**El sistema de diseño no se inventa aquí.** Los colores, tipografías y medidas
salen tal cual de `diseno/fuente/part1.html` y `part2.html`, y están volcados en
`@theme` dentro de `app/globals.css`. Las maquetas de las nueve pantallas están en
`diseno/canvas/*.dc.html`.

## La base de datos

Postgres, en Neon, con el adaptador `@prisma/adapter-pg`. Antes fue SQLite; el
traslado lo hace `npm run db:a-postgres`, que copia tabla por tabla en orden de
dependencias, aplaza las referencias circulares y termina contando las filas de
los dos lados. Se puede repetir sin duplicar nada.

**Las fotografías no están en la base**: son ficheros. Cambiar de base no las
mueve ni las acelera. Lo que sí importa es dónde esté la base respecto del
servidor: cada consulta cuesta una ida y vuelta de red, y una página hace
varias. Con Neon en Ohio y Render en Frankfurt son ~100 ms por consulta; con
las dos en la misma región, ~5 ms.

## Las fotos

- Se suben por lote en `/admin/subir`. De cada fichero se guardan dos cosas: la
  copia que sirve la web (JPEG, tope 2400 px) y el escaneo original intacto en
  `originales/`, que no se publica nunca.
- **`anchoMax`** decide cuántos píxeles se piden al servidor: 1200 px por defecto,
  elegible al subir el lote y corregible foto a foto. Eso no es lo mismo que el
  tamaño al que se pinta: en escritorio la copia se estira hasta llenar el gris de
  montaje, aunque suponga ampliar un poco.
- Formatos que entran: JPEG, PNG, TIFF, WebP y AVIF. El RAW de cámara hay que
  revelarlo antes; `sharp` no lo lee.
- Ninguna foto se publica sin texto alternativo. No es una recomendación: la acción
  `publicarFotos` lo comprueba y se niega.

## El aviso de entrada

Quien entra por primera vez ve el aviso del autor sobre el uso de fotografías por
sistemas de I.A. Se guarda en `localStorage` **cuando el visitante pulsa el botón**,
así que es una preferencia suya y no necesita banner de consentimiento. La única
cookie del sitio es la de sesión de `/admin`, estrictamente necesaria y también
exenta. Eso cambiaría al añadir analítica, anuncios o vídeos incrustados.

El texto se edita en `/admin/aviso`. Subir la versión (casilla «volver a
enseñárselo») hace que reaparezca a quien ya lo había cerrado; sin marcarla, una
errata se corrige sin dar la lata a nadie. También vive en `/aviso` con dirección
propia.

## Traslado desde Blogger

Hay dos caminos, y los dos acaban en el mismo sitio (`lib/traslado.ts`), para que
no haya dos reglas distintas para lo mismo:

**Desde el panel.** `/admin/importar` lee el XML de Configuración → Administrar el
blog → Copia de seguridad del contenido, enseña lo que ha encontrado y traslada
las entradas marcadas.

**Desde la línea de órdenes**, sin exportar nada, leyendo el feed público:

```bash
npm run blog:traer -- --ensayo    # sólo dice qué encontraría
npm run blog:traer                # los textos, con su fecha y su redirección
npm run blog:fotos                # las fotos, colocadas donde estaban
```

Ambos scripts admiten la dirección de otro blog como argumento y se pueden repetir:
lo ya trasladado se salta, porque la identidad de una entrada es su dirección
antigua. `blog:fotos` rehace el cuerpo de la entrada a partir del blog en cada
pasada, así que conviene terminar el traslado antes de ponerse a editar.

Las fotos entran **en borrador y sin alt**, a propósito: el archivo no publica una
foto sin texto alternativo. Se ven igual dentro de la entrada, como
estaban en el blog, y se publican desde la mesa de luz cuando tienen su alt.

Falta por hacer: servir las redirecciones (un `proxy.ts` que consulte la tabla
`Redireccion`); hoy quedan escritas, pero nadie las atiende todavía.

## Publicar en Render

La imagen se construye **desde tu máquina**, no desde el repositorio: `dev.db`
está en `.gitignore`. Las fotografías ya no dependen de esto —viven en
Backblaze— pero la base sí.

```bash
npm run blog:traer && npm run blog:fotos   # que el archivo esté al día
docker build -t topgambajrjdeveloper/jhonbosch-photography:latest .
docker push topgambajrjdeveloper/jhonbosch-photography:latest
```

Después, en Render: **New → Web Service → Deploy an existing image**, o aplicando
`render.yaml` como Blueprint, que ya lleva el nombre de la imagen puesto.

## Dónde viven las fotografías

En un cubo **privado** de Backblaze B2, no en el disco del servidor. Dentro del
cubo hay dos sitios y la diferencia importa:

- `web/…` — la copia que sirve la web. Sale por `/foto/…`, una ruta del propio
  sitio (`app/foto/[...clave]/route.ts`) que la trae de B2 y la entrega. Nadie
  ve nunca una dirección de Backblaze, y qué se deja pasar lo decide el sitio.
- `originales/…` — el escaneo sin tocar. **Esa ruta no lo alcanza**: está para
  poder rehacer la copia web sin volver a pasar el negativo por el escáner. En
  la versión anterior vivía en `public/uploads/…/originales/`, es decir, al
  alcance de cualquiera que probase la dirección.

La ficha guarda en `Foto.archivo` la dirección del sitio (`/foto/serie/001.jpg`),
así que `next/image` la optimiza como si fuera local y guarda su versión treinta
días: B2 recibe una petición por foto y tamaño, no una por visita.

Las cinco variables de `.env` son todo o nada. Sin ellas, subir responde 503 y
`/foto` da 404, en vez de dejar el sitio a medias.

Para llevar a Backblaze un `public/uploads` de una instalación anterior:

```bash
npm run fotos:a-backblaze -- --simular   # dice qué haría, sin tocar nada
npm run fotos:a-backblaze                # lo hace y reescribe las fichas
```

No borra nada del disco y se puede repetir: lo ya subido con el mismo tamaño se
salta. `public/uploads/` ya no existe: se comprobó fichero a fichero que las
289 estaban en el cubo con el mismo tamaño y se borró.

## El dominio, en Cloudflare

Comprarlo ahí no es sólo comodidad: pone una caché repartida por el mundo
delante de una instancia de 0,1 CPU, que es la diferencia entre que una hoja de
contactos se pueble al instante o en cinco segundos.

Pero **no basta con apuntar el DNS**. Cloudflare, por omisión, cachea por
extensión de fichero, y lo que pide el navegador es
`/_next/image?url=…&w=1200&q=82` — con interrogante y sin extensión. Sin una
regla, sigue yendo al origen cada vez. Se ve en la respuesta: hoy pone
`cf-cache-status: DYNAMIC`, que quiere decir «no la he guardado».

Los pasos, en orden:

1. **DNS.** En Cloudflare, un registro `CNAME` del dominio al destino que da
   Render (Settings → Custom Domain), con la nube **naranja** (proxied). Gris
   significa «sólo DNS» y entonces Cloudflare no toca nada.

2. **El dominio, también en Render.** Settings → Custom Domains. Render emite su
   propio certificado.

3. **SSL/TLS en Cloudflare: «Full (strict)».** Con «Flexible» el tramo entre
   Cloudflare y Render iría sin cifrar, y además NextAuth vería peticiones
   `http` y las sesiones del panel darían vueltas sin entrar.

4. **La regla de caché**, que es la que hace el trabajo. Rules → Cache Rules:

   ```
   Si:   URI Path empieza por  /_next/image
         o URI Path empieza por  /foto/
   Haz:  Cache eligibility  → Eligible for cache
         Edge TTL           → Respect origin (el origen ya dice un año)
         Browser TTL        → Respect origin
   ```

   `/foto/*` termina en `.jpg` y Cloudflare ya lo cachearía solo, pero dejarlo
   escrito evita depender de un comportamiento por omisión que puede cambiar.

5. **NO cachear el resto.** Las páginas van con `private, no-cache` a propósito:
   el panel y el aviso dependen de la sesión y del visitante. No actives
   «Cache Everything» sin excluir `/admin`.

6. **`SITIO_URL`** al dominio nuevo, en Render, y reiniciar. De ahí cuelgan las
   canónicas, el sitemap y el `robots.txt`. Con el dominio propio conviene
   además pedir la reindexación en Google Search Console.

Un aviso sobre `Vary: Accept`: el optimizador responde WebP o el original según
lo que pida el navegador, y Cloudflare ignora `Vary` salvo `Accept-Encoding`.
En la práctica da igual —WebP lo entiende todo desde 2020— pero conviene
saberlo antes de que alguien lo descubra con un navegador de 2016.

## El manual del panel

`public/manual.html`, servido en **/manual.html**. Es el documento que se le
entrega al fotógrafo: cómo entrar, subir un rollo, repartirlo en series y
publicarlo.

Está deliberadamente **fuera de los buscadores**, por tres vías que se refuerzan:

- `Disallow: /manual.html` en `app/robots.ts`.
- `X-Robots-Tag: noindex, nofollow, noarchive` en `next.config.ts`. Esa regla va
  DESPUÉS de la general a propósito: cuando dos reglas ponen la misma cabecera,
  gana la última.
- `<meta name="robots" content="noindex, nofollow, noarchive">` dentro del
  propio documento, para quien no lea ninguna de las dos anteriores.

Y no entra en el sitemap: ése se construye contra la base, y lo que se sirve
desde `public/` no aparece nunca.

No lleva contraseñas ni datos de acceso: se entrega y se reenvía, así que dice a
quién pedirlos en vez de escribirlos.

## Las visitas

Umami, en su propio servicio, contando sin cookies y sin nada que identifique
a nadie. No se configura por variables de entorno sino desde **/admin/visitas**,
y la razón es práctica: mudar Umami del dominio de Render al propio es cambiar
tres campos en una página, no reconstruir la imagen.

Los tres campos salen del propio Umami:

- **Dirección del script** — la de tu Umami con `/script.js` al final.
- **Identificador del sitio** — *Settings → Websites → Edit*, el «Website ID».
- **Enlace para ver los números** — *Edit → Enable share URL*. Es de sólo
  lectura y es el único que Umami deja incrustar; el panel normal se niega a
  salir dentro de otra página, y hace bien.

Con los dos primeros el sitio cuenta; con el tercero los números se ven dentro
del cuarto oscuro, en un marco, sin salir a ninguna parte. Falta cualquiera de
los dos primeros y no se carga nada: media configuración no mide y confunde.

El script sólo entra en las páginas públicas. El panel no se mide a sí mismo.

`AUTH_SECRET` lo genera Render en el primer despliegue. Para la contraseña del
panel en producción, `npm run panel:clave` escribe al final la orden exacta que hay
que pegar en la consola de Render: allí `bcryptjs` no se puede exigir —Next lo
empaqueta dentro del servidor— así que el cifrado se hace aquí y allí sólo entra
el resultado.

Para ver en local exactamente lo que verá el servidor:

```bash
npm run build
node .next/standalone/server.js   # con DATABASE_URL apuntando a dev.db
```

## Comandos

| | |
|---|---|
| `npm run dev` | servidor de desarrollo |
| `npm run build` | compilación de producción |
| `npm run db:push` | sincroniza el esquema con la base |
| `npm run db:seed` | vuelve a sembrar los datos de ejemplo |
| `npm run db:studio` | Prisma Studio |
| `npm run blog:traer` | trae los textos del blog por su feed público |
| `npm run blog:fotos` | trae las fotos de esas entradas |

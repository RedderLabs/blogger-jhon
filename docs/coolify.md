# Publicar en Coolify

Coolify es un panel que se instala en un servidor tuyo y hace lo que hace
Render, pero en tu máquina y sin plan de pago: coge la imagen, la levanta, le
pone un dominio con su certificado y la reinicia cuando se cae.

Este documento cuenta cómo llega ahí el sitio. Lo importante en una frase: **la
imagen es sólo el programa**. La base vive en Postgres y las fotografías en un
cubo privado de Backblaze; ninguna de las dos está dentro. Por eso un despliegue
no puede perder nada, y por eso hay cosas que hay que hacer *una vez* antes del
primero.

---

## 1. Qué hay que tener antes de empezar

Tres cosas, y ninguna la da Coolify:

- **Una base Postgres** con su cadena de conexión. Neon vale, y también un
  Postgres levantado en el propio Coolify (New Resource → Database →
  PostgreSQL); en ese caso la cadena es la interna,
  `postgres://…@<nombre-del-servicio>:5432/…`.
- **El cubo de Backblaze B2** con sus dos claves. Sin las cinco variables `S3_*`
  el contenedor **se niega a arrancar** — lo comprueba `docker/arranque.sh` a
  propósito, porque descubrirlo cuando la portada sale sin fotos es peor.
- **El esquema, ya aplicado en esa base.** Ver el punto siguiente.

## 2. El esquema, antes del primer despliegue

En `prisma/` **no hay migraciones**: sólo `schema.prisma`. El esquema se aplica
con `prisma db push`, y eso **no lo hace la imagen** — el servidor `standalone`
no lleva dentro ni la CLI de Prisma ni el esquema.

Así que se hace desde aquí, apuntando a la base de producción:

```bash
DATABASE_URL='postgres://…la de produccion…' npx prisma db push
DATABASE_URL='postgres://…la de produccion…' npm run db:seed   # sólo la primera vez
```

`db:seed` crea el usuario del panel. Si la base ya tiene contenido, **no lo
pases**: mira el punto 8 para cambiar sólo la contraseña.

> Cada vez que toques `prisma/schema.prisma` hay que repetir el `db push` contra
> producción. Desplegar una imagen nueva no cambia la base.

---

## 3. Dos caminos: que construya Coolify, o traerle la imagen hecha

### A. Coolify construye desde GitHub — el camino corto

Es el que tiene sentido ahora que la base está en Postgres: el repositorio tiene
todo lo que hace falta para compilar, y el `Dockerfile` no necesita ningún
secreto para hacerlo. Se compila con una `DATABASE_URL` de mentira porque `pg`
no se conecta hasta la primera consulta y todas las páginas son
`force-dynamic`.

En Coolify:

1. **New Resource → Application → Private Repository (with GitHub App)**, y se
   elige `RedderLabs/blogger-jhon`. El repositorio es privado: hace falta la
   GitHub App de Coolify o una *deploy key*.
2. **Build Pack: `Dockerfile`.** Ojo aquí — Coolify propone `nixpacks` por
   defecto, y con eso no se aplica nada de lo que dice el `Dockerfile`.
3. **Port: `3000`.** Es el que expone la imagen.
4. Las variables del punto 5, el volumen del punto 6, el dominio del punto 7.
5. **Deploy.**

**Cuándo NO sirve este camino:** si el servidor de Coolify va justo de memoria.
`npm ci` compila `better-sqlite3` con g++ y `next build` es goloso; por debajo
de unos 2 GB libres la compilación se queda sin memoria y el despliegue muere a
medias. Si pasa eso, camino B.

### B. La imagen se construye aquí y Coolify sólo la levanta

Es lo que ya se hace para Render, y sirve igual:

```bash
docker build -t topgambajrjdeveloper/jhonbosch-photography:latest .
docker push topgambajrjdeveloper/jhonbosch-photography:latest
```

En Coolify: **New Resource → Docker Image**, con
`docker.io/topgambajrjdeveloper/jhonbosch-photography:latest`, y el resto igual
(puerto 3000, variables, volumen, dominio).

**La arquitectura importa.** Aquí se construye en un PC de sobremesa (`amd64`) y
muchos servidores baratos son `arm64`: la imagen arranca y muere al instante con
un `exec format error`. Si el servidor no es `amd64`, hay que construir para él:

```bash
docker buildx build --platform linux/arm64 \
  -t topgambajrjdeveloper/jhonbosch-photography:latest --push .
```

Para saber cuál es, en el servidor: `uname -m` (`x86_64` = amd64,
`aarch64` = arm64).

---

## 4. Si construyes aquí, que el archivo esté al día

Ya no hace falta para la base ni para las fotos —viven fuera—, pero si vienes de
traer material nuevo del blog, esto va antes de construir:

```bash
npm run blog:traer && npm run blog:fotos
npm run fotos:a-backblaze
```

Eso escribe en la base y sube al cubo. La imagen no se entera, y no tiene que
enterarse.

---

## 5. Las variables

Todas van como variables **de ejecución**, no de construcción: en Coolify hay
una casilla «Build Variable?» y aquí se deja **sin marcar**. La imagen no
necesita ningún secreto para compilarse, y marcarlo sólo conseguiría dejar la
cadena de la base escrita dentro de una capa.

**Obligatorias — sin ellas el contenedor no arranca:**

- `DATABASE_URL` — la cadena de Postgres. Es el único secreto que no se puede
  perder.
- `S3_BUCKET` — `photo-jhon`
- `S3_ENDPOINT` — `https://s3.us-east-005.backblazeb2.com`
- `S3_REGION` — `us-east-005`
- `S3_ACCESS_KEY` — la de Backblaze
- `S3_SECRET_KEY` — la de Backblaze

Las cinco de Backblaze o ninguna: `arranque.sh` sale con error nombrando la que
falte.

**Obligatorias para que el panel funcione:**

- `AUTH_SECRET` — con lo que se firman las sesiones. Se genera con
  `openssl rand -base64 32`. **Coolify no la inventa sola** (`render.yaml` sí lo
  hacía, con `generateValue`): si falta, entrar al panel da 500.
- `AUTH_TRUST_HOST` — `true`. Detrás del proxy de Coolify, NextAuth ve la
  petición interna y no la del navegador; sin esto la vuelta de la entrada
  apunta a un sitio que no existe.

**Muy recomendable:**

- `SITIO_URL` — el dominio, **sin barra final**. De aquí cuelgan las canónicas,
  el `sitemap.xml` y lo que se ve al compartir un enlace. Si no se pone, el
  sitio se cae a `http://localhost:3000` y publicaría un sitemap con direcciones
  que no llevan a ninguna parte. Se lee al arrancar, no al compilar: cambiar de
  dominio es cambiar la variable y reiniciar, no rehacer la imagen.

**Opcionales:**

- `REDIS_URL` — la caché. Sin ella la web funciona igual, consultando la base en
  cada visita. Ver el punto 9.
- `DATOS` — dónde se guarda la caché de imágenes. Por defecto `/datos`, que es
  lo que hay que montar. No hace falta tocarla.

`PORT`, `HOSTNAME`, `NODE_ENV` y `NEXT_TELEMETRY_DISABLED` ya vienen puestas
dentro de la imagen. No las repitas.

La analítica (Umami) **no va aquí**: se configura desde `/admin/ajustes` y vive
en la base.

---

## 6. El volumen: `/datos`

**Ponlo. No es opcional en la práctica.**

El optimizador de Next guarda cada fotografía ya recodificada en `.next/cache`,
que vive dentro del contenedor. Sin volumen, cada despliegue tira esa caché y
las fotografías vuelven a generarse **una a una** con `sharp` — unos 10 segundos
por foto medidos en una instancia pequeña. Con volumen, eso se paga una vez.

En Coolify: **Storages → Add → Volume Mount**, destino `/datos`. Con 5 GB va
sobrado.

`arranque.sh` lo detecta solo y lo dice en el registro:

```
[arranque] caché de imágenes en /datos/cache-imagenes (sobrevive al despliegue)
```

Si en su lugar lees `[arranque] sin disco: la caché de imágenes se pierde en
cada despliegue`, es que el volumen no está montado o no se puede escribir en
él.

---

## 7. El dominio

En Coolify, en el campo **Domains** del servicio, la dirección completa con
`https://`. Coolify pide el certificado a Let's Encrypt por su cuenta.

Después, dos cosas que se olvidan:

1. `SITIO_URL` al mismo dominio, y **reiniciar** para que la lea.
2. Si el dominio pasa por Cloudflare, la nube **naranja** (proxied) y el modo
   SSL en **Full (strict)**. En «Flexible», el tramo entre Cloudflare y el
   servidor iría sin cifrar y NextAuth vería peticiones `http` detrás de una
   página `https`: la entrada al panel se queda dando vueltas.

---

## 8. La contraseña del panel, en producción

Se cambia **desde aquí**, apuntando a la base de producción. El script escribe
directamente en ella:

```bash
DATABASE_URL='postgres://…la de produccion…' npm run panel:clave
DATABASE_URL='postgres://…la de produccion…' npm run panel:clave -- "la que tú digas"
```

No hace falta entrar en el contenedor: la base está fuera, y quien pueda
escribir en ella puede cambiar la clave.

> `npm run panel:clave` imprime al final una orden «para la consola de Render»
> que usa `better-sqlite3`. **Está caducada** y en Postgres no funciona: es de
> cuando la base era un fichero. La parte de arriba —la clave y su cifrado—
> sigue valiendo, y el cambio ya lo ha hecho el propio script.

---

## 9. La caché (Dragonfly), si la quieres

No hace falta para que el sitio funcione: `lib/cache.ts` devuelve el resultado
de consultar la base cuando la caché no contesta, a propósito. Una caché que
tumba el sitio al caerse es peor que no tener caché.

Si el servidor va sobrado de memoria, en Coolify: **New Resource → Docker
Image** con `docker.dragonflydb.io/dragonflydb/dragonfly:latest`, en el **mismo
proyecto** que la web para que compartan red, y con esta orden:

```
dragonfly --proactor_threads=1 --maxmemory=256mb --cache_mode=true --dbfilename=
```

Los cuatro argumentos tienen su razón:

- `--proactor_threads=1` — Dragonfly abre un hilo por CPU y **exige 256 MiB por
  hilo**. En una máquina de muchos núcleos pediría varios gigas y se negaría a
  arrancar. Para guardar unas consultas, un hilo sobra.
- `--maxmemory=256mb` — el techo.
- `--cache_mode=true` — al llenarse tira lo más frío en vez de dar error.
- `--dbfilename=` (vacío) — sin instantáneas en disco: esto es una caché, lo que
  se pierda se vuelve a calcular.

Después, en la web: `REDIS_URL` = `redis://<nombre-del-servicio>:6379`, y
reiniciar. **No publiques su puerto**: dentro de la red del proyecto se hablan
por nombre, y un Dragonfly asomado a internet sin contraseña es un regalo.

---

## 10. Cuando algo va mal, mira el arranque

`arranque.sh` habla antes de ceder el paso al servidor, y casi siempre lo dice
todo:

- `[arranque] Falta DATABASE_URL: sin base no hay web.` — la variable no llegó.
  En Coolify, comprueba que no quedó marcada como «Build Variable».
- `[arranque] Falta S3_ACCESS_KEY: …` — falta esa de las cinco de Backblaze.
- `[arranque] sin disco: …` — el volumen del punto 6 no está.
- `[arranque] base: postgres://***@…` — la cadena llegó (la contraseña sale
  tapada a propósito).
- `[arranque] fotos: cubo photo-jhon` — el cubo llegó.

Si pasa de ahí y el sitio da 500 en todas las páginas, casi siempre es el
esquema: la base está vacía o desfasada. Punto 2.

Si el sitio se ve pero el panel da 500 al entrar, es `AUTH_SECRET`.

Si la imagen arranca y muere sin decir nada, mira la arquitectura (punto 3.B).

---

## Prueba local antes de subir nada

Levanta la imagen exactamente como la levantará Coolify, con la base y el cubo
de verdad:

```bash
docker build -t photo-jhon:prueba .
docker run --rm -p 3000:3000 --env-file .env.deploy photo-jhon:prueba
```

`.env.deploy` está en `.gitignore` y ya lleva las nueve variables. Si arranca
aquí y se ve la portada con fotografías, en Coolify va a arrancar.

Para levantar además la caché, `compose.yaml` tiene la web y Dragonfly juntos:

```bash
docker compose up -d --build
docker compose logs -f web
```

Ese `compose.yaml` es para **probar en tu máquina**, no para dárselo a Coolify:
publica el 3000 al anfitrión y el 6380 de Dragonfly, que es justo lo que no
quieres en un servidor. En Coolify, la web y la caché son dos recursos del mismo
proyecto (puntos 3 y 9).

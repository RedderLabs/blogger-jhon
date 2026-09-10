# syntax=docker/dockerfile:1
#
# Photo Jhon — imagen de producción.
#
# Tres etapas: instalar, compilar y servir. A la última sólo llega lo que hace
# falta para atender peticiones, así que la imagen no arrastra ni el compilador
# de C++ ni las dependencias de desarrollo.
#
# Ni la base ni las fotografías viajan aquí: la primera vive en Postgres y las
# segundas en un cubo privado de Backblaze. La imagen es sólo el programa.

# --- 1. Dependencias ---------------------------------------------------------
FROM node:22-alpine AS dependencias

# better-sqlite3 se compila al instalarse; sharp trae binarios para musl.
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci


# --- 2. Compilación ----------------------------------------------------------
FROM node:22-alpine AS compilacion

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=dependencias /app/node_modules ./node_modules
COPY . .

# El cliente de Prisma tampoco viaja en git: se genera aquí.
RUN npx prisma generate

# `next build` no consulta la base —todas las páginas son force-dynamic— pero
# `lib/prisma` se evalúa al importarse y exige la variable. Una de mentira basta:
# `pg` no intenta conectarse hasta la primera consulta.
ENV DATABASE_URL="postgresql://compilacion:compilacion@localhost:5432/compilacion"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


# --- 3. Servidor -------------------------------------------------------------
FROM node:22-alpine AS servidor

RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Dónde monta Render el disco. El arranque guarda ahí la caché de imágenes.
ENV DATOS=/datos
# DATABASE_URL no se pone aquí: es un secreto y lo da quien despliega.

# Lo que deja `output: "standalone"`: un servidor con sólo lo que se usa.
COPY --from=compilacion /app/.next/standalone ./
COPY --from=compilacion /app/.next/static ./.next/static
COPY --from=compilacion /app/public ./public

COPY docker/arranque.sh /arranque.sh
# El bit de ejecución no sobrevive a un checkout en Windows. Sin él, el
# docker-entrypoint de la imagen de node antepone `node` al CMD y acaba
# ejecutando el script de shell como JavaScript.
RUN chmod +x /arranque.sh

# Se ejecuta como root a propósito: el disco que monta Render llega con dueño
# root. Cuando se quite el disco, esto puede pasar a un usuario sin privilegios.

EXPOSE 3000
CMD ["/arranque.sh"]

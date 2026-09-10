#!/bin/sh
# Arranque del contenedor.
#
# Ya no queda nada en disco: la base vive en Postgres (Neon) y las fotografías
# en un cubo privado de Backblaze. El contenedor es de usar y tirar, que es
# como debe ser: un despliegue no puede perder nada porque no guarda nada.
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "[arranque] Falta DATABASE_URL: sin base no hay web." >&2
  exit 1
fi

# Las cinco de Backblaze o ninguna. Avisar aquí, al arrancar, es mejor que
# descubrirlo cuando la primera página salga sin fotos.
for v in S3_BUCKET S3_ENDPOINT S3_REGION S3_ACCESS_KEY S3_SECRET_KEY; do
  eval "valor=\$$v"
  if [ -z "$valor" ]; then
    echo "[arranque] Falta $v: las fotografías viven en Backblaze y sin esto no se sirven." >&2
    exit 1
  fi
done

# El optimizador de Next guarda cada foto ya recodificada en .next/cache. Ese
# directorio vive dentro del contenedor, así que CADA DESPLIEGUE lo tiraba y
# todas las fotografías volvían a generarse una por una en una instancia de
# 0,1 CPU. Si hay disco montado, la caché se muda allí y sobrevive.
DATOS="${DATOS:-/datos}"
if [ -d "$DATOS" ] && [ -w "$DATOS" ]; then
  mkdir -p "$DATOS/cache-imagenes"
  rm -rf /app/.next/cache
  mkdir -p /app/.next
  ln -s "$DATOS/cache-imagenes" /app/.next/cache
  echo "[arranque] caché de imágenes en $DATOS/cache-imagenes (sobrevive al despliegue)"
else
  echo "[arranque] sin disco: la caché de imágenes se pierde en cada despliegue"
fi

echo "[arranque] base: $(echo "$DATABASE_URL" | sed 's#://[^@]*@#://***@#')"
echo "[arranque] fotos: cubo $S3_BUCKET"
exec node server.js

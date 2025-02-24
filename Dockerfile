# Etapa base
FROM node:20-alpine3.18 AS base

ENV DIR /app
WORKDIR $DIR

# Argumento opcional para autenticación en npm (solo si es necesario)
ARG NPM_TOKEN

# Etapa de desarrollo
FROM base AS dev

ENV NODE_ENV=development

# Copia archivos de configuración
COPY package*.json ./

# Si usas NPM_TOKEN, asegúrate de que está configurado
RUN if [ -n "$NPM_TOKEN" ]; then echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ".npmrc"; fi && \
    npm ci && \
    rm -f .npmrc

# Copia archivos de configuración
COPY tsconfig*.json ./
COPY .swcrc ./
COPY nest-cli.json ./
COPY . .

# Exponer el puerto (asegurar un valor por defecto si Railway no lo define)
ARG PORT=3000
EXPOSE $PORT

CMD ["npm", "run", "dev"]

# Etapa de compilación
FROM base AS build

# Agregar dumb-init para evitar problemas de señal en contenedores
RUN apk update && apk add --no-cache dumb-init=1.2.5-r2

COPY package*.json ./

# Instalar dependencias y limpiar credenciales
RUN if [ -n "$NPM_TOKEN" ]; then echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ".npmrc"; fi && \
    npm ci && \
    rm -f .npmrc

COPY tsconfig*.json ./
COPY .swcrc ./
COPY nest-cli.json ./
COPY . .

# Construir la aplicación y eliminar dependencias de desarrollo
RUN npm run build && \
    npm prune --production

# Etapa de producción
FROM base AS production

ENV NODE_ENV=production
ENV USER=node

# Copiar dependencias y archivos compilados
COPY --from=build /usr/bin/dumb-init /usr/bin/dumb-init
COPY --from=build $DIR/package*.json ./
COPY --from=build $DIR/node_modules node_modules
COPY --from=build $DIR/dist dist

# Configurar usuario y exponer puerto
USER $USER
ARG PORT=3000
EXPOSE $PORT

# Iniciar la aplicación en producción
CMD ["dumb-init", "node", "dist/main.js"]

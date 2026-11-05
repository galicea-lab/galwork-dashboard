# syntax=docker/dockerfile:1
# Produkcyjny obraz galwork-dashboard: statyczny eksport Next.js (output:
# 'export') serwowany przez nginx, który też proxuje /v1/ do galwork-hub.
#
# WAŻNE: kontekst builda w docker-compose.yml to katalog nadrzędny
# (/projekty/galwork), bo package.json zależy od lokalnego tarballa w
# siblingu: "@galicea-lab/rjsf-widgets": "file:../galwork-react/...".

FROM node:20-alpine AS build
WORKDIR /build

COPY galwork-react/packages/rjsf-widgets ./galwork-react/packages/rjsf-widgets

WORKDIR /build/galwork-dashboard
COPY galwork-dashboard/package.json galwork-dashboard/package-lock.json ./

# Instalacja zależności z npm, z obsługą sekretów (opcjonalnie) dla prywatnych rejestrów:
#RUN --mount=type=secret,id=npmrc,target=/root/.npmrc,required=false \
#    --mount=type=secret,id=npm_token,env=NPM_TOKEN,required=false \
#    npm ci

COPY galwork-dashboard/ ./
# Puste NEXT_PUBLIC_API_URL = wywołania względne '/v1/wf',
# co jest zalecane w produkcji na jednej domenie.
ARG NEXT_PUBLIC_API_URL=""
ARG NEXT_PUBLIC_KEYCLOAK_URL
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_KEYCLOAK_URL=${NEXT_PUBLIC_KEYCLOAK_URL} \
    NEXT_PUBLIC_KEYCLOAK_CLIENT=${NEXT_PUBLIC_KEYCLOAK_CLIENT}

RUN npm run build


FROM nginx:1.27-alpine AS runtime

COPY galwork-dashboard/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /build/galwork-dashboard/out /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/ > /dev/null || exit 1

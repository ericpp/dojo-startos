##### Build stage

FROM node:24-alpine3.23 AS builder

ENV NODE_ENV=production
ENV APP_DIR=/home/node/app

RUN set -ex && \
    apk --no-cache add gcc g++ make python3 curl cmake zeromq-dev

# Create app directory and copy source
RUN mkdir "$APP_DIR"
COPY ./samourai-dojo/. "$APP_DIR"

# Install node modules
RUN cd "$APP_DIR" && \
    npm install --omit=dev

##### Tor build

FROM alpine:3.23.3 AS torproject

ENV TOR_GIT_URL=https://gitlab.torproject.org/tpo/core/tor.git
ENV TOR_VERSION=tor-0.4.9.6
# TOR_VERSION's commit; the tag is signed by B74417EDDF22AC9F9E90F49142E86A2A11F48D36.
ARG TOR_COMMIT=894a92ac2279747ec375837a170766cf6bba3711

RUN apk --update --no-cache add ca-certificates
RUN apk --no-cache add alpine-sdk automake autoconf
RUN apk --no-cache add openssl-dev libevent-dev zlib-dev

RUN git clone --depth 1 --branch "$TOR_VERSION" "$TOR_GIT_URL" /tor && \
    git -C /tor checkout -q --detach "$TOR_COMMIT" && \
    test "$(git -C /tor rev-parse "refs/tags/$TOR_VERSION^{commit}")" = "$TOR_COMMIT"

WORKDIR /tor

RUN ./autogen.sh

RUN ./configure                                           \
    --disable-system-torrc                                \
    --disable-asciidoc                                    \
    --disable-unittests                                   \
    --prefix=/stage

RUN make -j 4 && make install

RUN cp /stage/etc/tor/torrc.sample /stage/.torrc

##### Soroban build

FROM golang:1.25.6-alpine3.23 AS soroban-build

ENV SOROBAN_VERSION=0.4.2
ENV SOROBAN_URL=https://github.com/Dojo-Open-Source-Project/soroban/archive/refs/tags/v$SOROBAN_VERSION.tar.gz
ARG SOROBAN_SHA256=8608fc823dea157c20c1099a7207e62dbdc4b743d70bf41e16dc51005272d93e

RUN apk --no-cache --update add ca-certificates
RUN apk --no-cache --update add alpine-sdk linux-headers wget

RUN set -ex && \
    mkdir -p /stage && \
    mkdir -p /src && \
    cd ~ && \
    wget -qO soroban.tar.gz "$SOROBAN_URL" && \
    echo "$SOROBAN_SHA256  soroban.tar.gz" | sha256sum -c - && \
    tar -xzvf soroban.tar.gz -C /src --strip-components 1 && \
    rm soroban.tar.gz && \
    cd /src

WORKDIR /src
RUN go mod download
RUN go build -a -tags netgo -o /stage/soroban-server ./cmd/server

##### Final stage

FROM node:24-alpine3.23

ENV NODE_ENV=production
ENV APP_DIR=/home/node/app
ENV SOROBAN_HOME=/home/soroban

RUN set -ex && \
    apk --update --no-cache add ca-certificates bash && \
    apk --no-cache add shadow && \
    apk --no-cache add mariadb mariadb-client pwgen nginx jq curl netcat-openbsd && \
    apk --no-cache add openssl libevent zlib runuser

### Node

RUN npm install -g pm2 && rm -rf /root/.npm/

COPY --chown=node:node --from=builder $APP_DIR $APP_DIR
COPY --chown=node:node ./samourai-dojo/docker/my-dojo/node/keys.index.js "$APP_DIR/keys/index.js"
COPY --chown=node:node ./samourai-dojo/docker/my-dojo/node/pm2.config.cjs "$APP_DIR/pm2.config.cjs"
COPY --chown=node:node --chmod=754 ./samourai-dojo/docker/my-dojo/node/restart.sh "$APP_DIR/restart.sh"
COPY --chown=node:node --chmod=754 ./samourai-dojo/docker/my-dojo/node/wait-for-it.sh "$APP_DIR/wait-for-it.sh"

### Mysql

RUN rm -f /etc/my.cnf.d/*
COPY ./samourai-dojo/docker/my-dojo/mysql/mysql-low_mem.cnf /etc/my.cnf.d/mysql-dojo.cnf
COPY ./samourai-dojo/db-scripts/1_db.sql /docker-entrypoint-initdb.d/1_db.sql
COPY ./samourai-dojo/db-scripts/2_update.sql /docker-entrypoint-initdb.d/2_update.sql

### Tor

ARG SOROBAN_TOR_LINUX_UID=1112
ARG SOROBAN_TOR_LINUX_GID=1115

COPY --from=torproject /stage /usr/local

RUN addgroup -g ${SOROBAN_TOR_LINUX_GID} -S tor && \
    adduser --system --ingroup tor --uid ${SOROBAN_TOR_LINUX_UID} tor

RUN mkdir -p /var/lib/tor
RUN chown tor:tor /var/lib/tor

RUN cp /usr/local/etc/tor/torrc.sample /home/tor/.torrc

### Soroban

ENV SOROBAN_HOME /home/soroban
ARG SOROBAN_LINUX_UID=1111
ARG SOROBAN_LINUX_GID=1114

COPY --from=soroban-build /stage/soroban-server /usr/local/bin

# Create Soroban group and user
RUN addgroup -g ${SOROBAN_LINUX_GID} -S soroban && \
    adduser --system --ingroup soroban --uid ${SOROBAN_LINUX_UID} soroban

# Create data directory
RUN mkdir "$SOROBAN_HOME/data" && \
    chown -h soroban:soroban "$SOROBAN_HOME/data"

RUN cp /home/tor/.torrc /home/soroban/.torrc

### Nginx

COPY ./samourai-dojo/docker/my-dojo/nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./nginx/*.conf /etc/nginx/sites-available/
# frontend-entrypoint.sh enables the config for the selected network.
RUN mkdir /etc/nginx/sites-enabled

### Daemon scripts

# The package's own entrypoint and health scripts are not baked in — they ship
# in assets/ and are mounted at /assets by startos/main.ts, so editing one does
# not mean rebuilding the Tor and Soroban stages above. Only this upstream
# script, which comes from the submodule, is copied in.
COPY --chmod=755 ./samourai-dojo/docker/my-dojo/soroban/restart.sh /usr/local/bin/soroban-restart.sh

# Remove /tmp clean since it errors out nodejs 24
RUN sed -i 's|rm -rf /tmp/\*||' /usr/local/bin/soroban-restart.sh

RUN mkdir -p /run/secrets

FROM php:7.2-fpm-alpine

ARG UID=991
ARG UNAME=www
ARG GID=991
ARG GNAME=www

ENV WORKDIR=/var/www/html
WORKDIR $WORKDIR

ENV DD_TRACE_VERSION=0.15.1
ENV DD_TRACE_APK=https://github.com/DataDog/dd-trace-php/releases/download/${DD_TRACE_VERSION}/datadog-php-tracer_${DD_TRACE_VERSION}_noarch.apk

COPY ./docker/php/php.ini /usr/local/etc/php
COPY composer.json composer.lock ${WORKDIR}/

RUN set -x \
    && apk add --no-cache git php7-zlib zlib-dev \
    && docker-php-ext-install pdo_mysql zip \
    && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && curl -L -o /tmp/datadog-php-tracer.apk ${DD_TRACE_APK} \
    && apk add /tmp/datadog-php-tracer.apk --allow-untrusted \
    && rm /tmp/datadog-php-tracer.apk \
    && composer install --no-autoloader --no-progress --no-dev

COPY . .

RUN set -x \
    && composer install --no-progress --no-dev \
    && php artisan config:clear \
    && addgroup ${GNAME} -g ${GID} \
    && adduser -D -G ${GNAME} -u ${UID} ${UNAME} \
    && chown -R ${UNAME}:${GNAME} ${WORKDIR} \
    && mv /root/.composer /home/${UNAME}/ \
    && chown -R ${UNAME}:${GNAME} /home/${UNAME}

USER ${UNAME}

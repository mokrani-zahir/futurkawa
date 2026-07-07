FROM php:8.3-fpm-alpine AS base

RUN apk add --no-cache \
    libpq-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl

# mbstring et opcache sont déjà inclus dans php:8.3-fpm-alpine
RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    zip \
    bcmath

# pcov fournit la couverture de code pour PHPUnit (utilisé par le pipeline CI)
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && pecl install pcov \
    && docker-php-ext-enable pcov \
    && apk del .build-deps

COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# ── Scaffold Laravel + install additional packages ───────────────────────────
FROM base AS builder

RUN composer create-project laravel/laravel . \
    --no-interaction \
    --prefer-dist \
    --no-scripts

RUN composer require \
    laravel/sanctum:^4.0 \
    predis/predis:^2.0 \
    --no-interaction \
    --no-scripts

RUN composer require --dev \
    phpstan/phpstan:^2.0 \
    larastan/larastan:^3.0 \
    --no-interaction \
    --no-scripts

# ── Final image: overlay our application code ────────────────────────────────
FROM builder AS app

COPY app/                       app/
# Replace scaffolded migrations with our own (avoids duplicate-table errors
# when workers run inside the same image without the bind mount)
RUN rm -rf database/migrations/*
COPY database/migrations/       database/migrations/
COPY database/seeders/          database/seeders/
COPY database/factories/        database/factories/
COPY routes/api.php             routes/api.php
COPY bootstrap/app.php          bootstrap/app.php
COPY resources/views/           resources/views/
COPY tests/                     tests/
COPY phpunit.xml                phpunit.xml
COPY phpstan.neon               phpstan.neon
COPY .env.example               .env.example
COPY .env.testing               .env.testing

RUN composer dump-autoload --optimize --no-interaction

RUN chown -R www-data:www-data \
    /var/www/html/storage \
    /var/www/html/bootstrap/cache

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 9000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["php-fpm"]

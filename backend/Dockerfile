FROM php:8.4-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    ca-certificates \
    git \
    unzip \
    && update-ca-certificates \
    && docker-php-ext-install pdo pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer/composer:2-bin /composer /usr/bin/composer

WORKDIR /var/www/html
#!/bin/sh
set -eu

php artisan optimize
php artisan migrate --force

exec "$@"

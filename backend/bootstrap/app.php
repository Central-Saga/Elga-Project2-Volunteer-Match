<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
    $middleware->alias([
        'role' => \App\Http\Middleware\RoleMiddleware::class,
    ]);
    $middleware->appendToGroup('api', \App\Http\Middleware\NormalizeApiResponse::class);
    })

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->shouldRenderJsonWhen(
        fn (Request $request) =>
            $request->is('api/*') || $request->expectsJson(),
    );

    $exceptions->respond(function (SymfonyResponse $response): SymfonyResponse {
        if (!request()->is('api/*') || $response->getStatusCode() < 400) {
            return $response;
        }

        $status = $response->getStatusCode();

        $original = json_decode(
            $response->getContent() ?: '',
            true
        );

        $original = is_array($original) ? $original : [];

        $message = $status >= 500
            ? 'Internal server error.'
            : ($original['message']
                ?? SymfonyResponse::$statusTexts[$status]
                ?? 'Request failed.');

        $errors = $status >= 500
            ? (object) []
            : ($original['errors'] ?? (object) []);

        $normalized = response()->json([
            'success' => false,
            'message' => $message,
            'data' => null,
            'errors' => $errors,
        ], $status);

        foreach (['Retry-After', 'WWW-Authenticate'] as $header) {
            if ($response->headers->has($header)) {
                $normalized->headers->set(
                    $header,
                    $response->headers->get($header)
                );
            }
        }

     return $normalized;
    });
})
->prefersJsonResponses()
->create();

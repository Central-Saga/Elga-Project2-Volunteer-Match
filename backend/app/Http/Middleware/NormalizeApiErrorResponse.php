<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class NormalizeApiErrorResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $status = $response->getStatusCode();

        if ($status < 400) {
            return $response;
        }

        $original = json_decode($response->getContent() ?: '', true);
        $original = is_array($original) ? $original : [];

        $message = $status >= 500
            ? 'Internal server error.'
            : ($original['message'] ?? Response::$statusTexts[$status] ?? 'Request failed.');

        if (!is_string($message) || trim($message) === '') {
            $message = Response::$statusTexts[$status] ?? 'Request failed.';
        }

        $errors = $status >= 500 ? (object) [] : ($original['errors'] ?? (object) []);
        if (!is_array($errors) && !is_object($errors)) {
            $errors = (object) [];
        }

        $body = [
            'success' => false,
            'message' => $message,
            'data' => null,
            'errors' => $errors,
        ];

        // Mutate the existing response so status, cookies and rate-limit headers survive.
        if ($response instanceof JsonResponse) {
            $response->setData($body);
        } else {
            $response->setContent(json_encode($body, JSON_THROW_ON_ERROR));
            $response->headers->set('Content-Type', 'application/json');
        }

        return $response;
    }
}

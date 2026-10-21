<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiCorsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'cors.allowed_origins' => [
                'http://localhost:3000',
                'http://127.0.0.1:3000',
            ],
        ]);
    }

    public function test_allowed_frontend_origin(): void
    {
        $response = $this->call(
            'OPTIONS',
            '/api/auth/login',
            [],
            [],
            [],
            [
                'HTTP_ORIGIN' => 'http://localhost:3000',
                'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
                'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'Authorization, Content-Type',
            ]
        );

        $response->assertSuccessful();

        $response->assertHeader(
            'Access-Control-Allow-Origin',
            'http://localhost:3000'
        );
    }

    public function test_unknown_origin_is_not_allowed(): void
    {
        $response = $this->call(
            'OPTIONS',
            '/api/auth/login',
            [],
            [],
            [],
            [
                'HTTP_ORIGIN' => 'https://untrusted.example',
                'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
            ]
        );

        $response->assertHeaderMissing(
            'Access-Control-Allow-Origin'
        );
    }
}

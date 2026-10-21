<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ApiErrorSchemaTest extends TestCase
{
    public function test_validation_error_has_standard_schema(): void
    {
        $response = $this->postJson('/api/auth/login', []);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('data', null)
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'errors' => [
                    'email',
                    'password',
                ],
            ]);
    }

    public function test_server_error_hides_internal_details(): void
    {
        config(['app.debug' => false]);

        Route::middleware('api')->get(
            '/api/__issue3/test-server-error',
            function () {
                throw new \RuntimeException(
                    'ISSUE3_PRIVATE_SERVER_DETAILS'
                );
            }
        );

        $response = $this->getJson(
            '/api/__issue3/test-server-error'
        );

        $response->assertStatus(500)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Internal server error.')
            ->assertJsonPath('data', null)
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'errors',
            ])
            ->assertDontSee('ISSUE3_PRIVATE_SERVER_DETAILS')
            ->assertDontSee('"trace"');
    }
}

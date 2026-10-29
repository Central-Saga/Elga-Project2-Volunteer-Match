<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ApiErrorSchemaTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_successful_api_responses_have_standard_schema_on_versioned_and_legacy_paths(): void
    {
        foreach (['/api/v1/campuses', '/api/campuses'] as $path) {
            $this->getJson($path)
                ->assertOk()
                ->assertJsonPath('success', true)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data',
                    'errors',
                ]);
        }
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

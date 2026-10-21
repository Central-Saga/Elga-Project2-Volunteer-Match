<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ApiDirectErrorSchemaTest extends TestCase
{
    public function test_invalid_credentials_from_controller_have_standard_schema(): void
    {
        $this->postJson('/api/auth/login', [
            'email' => 'missing-issue3-user@example.test',
            'password' => 'WrongPassword123!',
        ])->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Invalid credentials.')
            ->assertJsonPath('data', null)
            ->assertJsonStructure(['success', 'message', 'data', 'errors']);
    }

    public function test_direct_business_error_is_normalized(): void
    {
        Route::middleware('api')->get('/api/__issue3/direct-business-error', function () {
            return response()->json(['message' => 'Business rule rejected.'], 422);
        });

        $this->getJson('/api/__issue3/direct-business-error')
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Business rule rejected.')
            ->assertJsonPath('data', null)
            ->assertJsonStructure(['success', 'message', 'data', 'errors']);
    }

    public function test_direct_server_error_hides_details_and_keeps_headers(): void
    {
        Route::middleware('api')->get('/api/__issue3/direct-server-error', function () {
            return response()->json([
                'message' => 'ISSUE3_SECRET_INTERNAL_DETAILS',
            ], 500)->header('X-Issue3-Test', 'preserved');
        });

        $this->getJson('/api/__issue3/direct-server-error')
            ->assertStatus(500)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Internal server error.')
            ->assertJsonPath('data', null)
            ->assertJsonStructure(['success', 'message', 'data', 'errors'])
            ->assertHeader('X-Issue3-Test', 'preserved')
            ->assertDontSee('ISSUE3_SECRET_INTERNAL_DETAILS');
    }
}

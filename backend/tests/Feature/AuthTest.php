<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test Student',
            'email' => 'student@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('user.role', 'student')
            ->assertJsonStructure(['user', 'token']);

        $this->assertDatabaseHas('users', [
            'email' => 'student@example.com',
            'role' => 'student',
        ]);
    }

    public function test_user_can_login(): void
    {
        User::create([
            'name' => 'Test Student',
            'email' => 'login@example.com',
            'password' => 'Password123!',
            'role' => 'student',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'login@example.com',
            'password' => 'Password123!',
        ])->assertOk()
          ->assertJsonStructure(['user', 'token']);
    }

    public function test_login_rejects_invalid_password(): void
    {
        User::create([
            'name' => 'Test Student',
            'email' => 'login@example.com',
            'password' => 'Password123!',
            'role' => 'student',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'login@example.com',
            'password' => 'WrongPassword123!',
        ])->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_access_profile(): void
    {
        $this->getJson('/api/auth/me')
            ->assertStatus(401);
    }
}

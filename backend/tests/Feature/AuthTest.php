<?php

namespace Tests\Feature;

use App\Models\Campus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_register(): void
    {
        $campus = Campus::create(['name' => 'Test Campus', 'code' => 'TEST-REG']);
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test Student',
            'email' => 'student@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'student',
            'campus_id' => $campus->id,
            'nim' => 'TEST-001',
            'study_program' => 'Informatics',
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

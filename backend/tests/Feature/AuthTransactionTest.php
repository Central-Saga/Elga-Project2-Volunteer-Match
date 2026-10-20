<?php

namespace Tests\Feature;

use App\Models\Campus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthTransactionTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_rolls_back_when_token_creation_fails(): void
    {
        $campus = Campus::create(['name' => 'Rollback Campus', 'code' => 'TEST-ROLLBACK']);
        PersonalAccessToken::creating(function () {
            throw new \RuntimeException('Simulated token failure');
        });

        $this->withoutExceptionHandling();

        try {
            $this->postJson('/api/auth/register', [
                'name' => 'Rollback Student',
                'email' => 'rollback@example.test',
                'password' => 'Password123!',
                'password_confirmation' => 'Password123!',
                'role' => 'student',
                'campus_id' => $campus->id,
                'nim' => 'TEST-ROLLBACK-001',
                'study_program' => 'Informatics',
            ]);

            $this->fail('Expected token creation to fail.');
        } catch (\RuntimeException $e) {
            $this->assertSame(
                'Simulated token failure',
                $e->getMessage()
            );
        }

        $this->assertDatabaseMissing('users', [
            'email' => 'rollback@example.test',
        ]);
    }
}

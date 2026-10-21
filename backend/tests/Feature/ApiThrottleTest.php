<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiThrottleTest extends TestCase
{
    public function test_register_is_rate_limited(): void
    {
        $this->withServerVariables([
            'REMOTE_ADDR' => '192.0.2.51',
        ]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/register', [])
                ->assertStatus(422);
        }

        $this->postJson('/api/auth/register', [])
            ->assertStatus(429)
            ->assertJsonPath('success', false)
            ->assertJsonStructure([
                'message',
                'errors',
            ]);
    }

    public function test_login_is_rate_limited(): void
    {
        $this->withServerVariables([
            'REMOTE_ADDR' => '192.0.2.52',
        ]);

        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/auth/login', [])
                ->assertStatus(422);
        }

        $this->postJson('/api/auth/login', [])
            ->assertStatus(429)
            ->assertJsonPath('success', false)
            ->assertJsonStructure([
                'message',
                'errors',
            ]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\NgoProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NgoProjectTest extends TestCase
{
    use RefreshDatabase;

    private function loginAsApprovedNgo(): NgoProfile
    {
        $user = User::create([
            'name' => 'Test NGO',
            'email' => 'ngo@example.com',
            'password' => 'Password123!',
            'role' => 'ngo',
        ]);

        $profile = NgoProfile::create([
            'user_id' => $user->id,
            'organization_name' => 'Test Foundation',
            'verification_status' => 'approved',
        ]);

        Sanctum::actingAs($user);

        return $profile;
    }

    public function test_approved_ngo_can_create_project(): void
    {
        $profile = $this->loginAsApprovedNgo();

        $response = $this->postJson('/api/ngo/projects', [
            'title' => 'Beach Cleanup',
            'description' => 'Coastal cleanup activity.',
            'location' => 'Bali',
            'start_at' => '2026-11-01 08:00:00',
            'end_at' => '2026-11-01 12:00:00',
            'capacity' => 20,
            'risk_level' => 'low',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.title', 'Beach Cleanup');

        $this->assertDatabaseHas('projects', [
            'ngo_profile_id' => $profile->id,
            'title' => 'Beach Cleanup',
            'status' => 'draft',
        ]);
    }

    public function test_ngo_can_list_own_projects(): void
    {
        $profile = $this->loginAsApprovedNgo();

        $profile->projects()->create([
            'title' => 'Tree Planting',
            'description' => 'Environmental activity.',
            'start_at' => '2026-11-02 08:00:00',
            'end_at' => '2026-11-02 12:00:00',
            'capacity' => 15,
            'risk_level' => 'low',
            'status' => 'draft',
        ]);

        $this->getJson('/api/ngo/projects')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Tree Planting');
    }
}

<?php

namespace Tests\Feature;

use App\Models\NgoProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NgoProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    private function loginAsNgo(): NgoProfile
    {
        $user = User::create([
            'name' => 'Test NGO',
            'email' => 'ngo-update@example.com',
            'password' => 'Password123!',
            'role' => 'ngo',
        ]);

        $profile = NgoProfile::create([
            'user_id' => $user->id,
            'organization_name' => 'Old Foundation',
            'verification_status' => 'approved',
        ]);

        Sanctum::actingAs($user);

        return $profile;
    }

    public function test_ngo_can_update_own_profile(): void
    {
        $profile = $this->loginAsNgo();

        $response = $this->putJson('/api/ngo/profile', [
            'organization_name' => 'New Foundation',
            'description' => 'Environmental organization',
            'focus_areas' => ['environment', 'education'],
            'contact_email' => 'contact@example.com',
            'risk_level' => 'low',
        ]);

        $response->assertOk()
            ->assertJsonPath(
                'profile.organization_name',
                'New Foundation'
            )
            ->assertJsonPath(
                'profile.contact_email',
                'contact@example.com'
            );

        $this->assertDatabaseHas('ngo_profiles', [
            'id' => $profile->id,
            'user_id' => $profile->user_id,
            'organization_name' => 'New Foundation',
            'verification_status' => 'approved',
        ]);

        $this->assertSame(
            1,
            NgoProfile::where('user_id', $profile->user_id)->count()
        );
    }

    public function test_invalid_email_does_not_update_profile(): void
    {
        $profile = $this->loginAsNgo();

        $this->putJson('/api/ngo/profile', [
            'organization_name' => 'Changed Foundation',
            'contact_email' => 'invalid-email',
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['contact_email']);

        $this->assertDatabaseHas('ngo_profiles', [
            'id' => $profile->id,
            'organization_name' => 'Old Foundation',
        ]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\NgoProfile;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NgoProjectAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private int $sequence = 0;

    private function asNgo(string $verificationStatus = 'approved'): NgoProfile
    {
        $this->sequence++;

        $user = User::create([
            'name' => 'NGO '.$this->sequence,
            'email' => 'issue2-ngo'.$this->sequence.'@example.com',
            'password' => 'Password123!',
            'role' => 'ngo',
        ]);

        $profile = NgoProfile::create([
            'user_id' => $user->id,
            'organization_name' => 'NGO '.$this->sequence,
            'verification_status' => $verificationStatus,
        ]);

        Sanctum::actingAs($user);

        return $profile;
    }

    private function makeDraft(NgoProfile $ngo): Project
    {
        return $ngo->projects()->create([
            'title' => 'Beach Cleanup',
            'description' => 'Remove beach litter',
            'start_at' => now()->addDays(10),
            'end_at' => now()->addDays(11),
            'capacity' => 20,
            'risk_level' => 'low',
            'status' => 'draft',
        ]);
    }

    public function test_approved_ngo_can_create_project_with_resource_response(): void
    {
        $this->asNgo();

        $this->postJson('/api/ngo/projects', [
            'title' => 'River Cleanup',
            'description' => 'Clean the riverbank',
            'start_at' => now()->addDays(5)->toDateTimeString(),
            'end_at' => now()->addDays(6)->toDateTimeString(),
            'capacity' => 12,
            'risk_level' => 'medium',
            'status' => 'published', // Never trust client-controlled workflow status.
        ])->assertCreated()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.title', 'River Cleanup')
            ->assertJsonStructure(['data' => ['id', 'ngo_profile_id', 'capacity']]);
    }

    public function test_unapproved_ngo_cannot_create_project(): void
    {
        $this->asNgo('submitted');

        $this->postJson('/api/ngo/projects', [])
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_invalid_project_input_returns_422(): void
    {
        $this->asNgo();

        $this->postJson('/api/ngo/projects', ['title' => 'Incomplete'])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors' => ['description', 'start_at', 'end_at']]);
    }

    public function test_owner_can_update_own_draft_without_changing_status(): void
    {
        $project = $this->makeDraft($this->asNgo());

        $this->patchJson('/api/ngo/projects/'.$project->id, [
            'title' => 'Updated title',
            'status' => 'published', // Not accepted by UpdateProjectRequest.
            'ngo_profile_id' => 999,
        ])->assertOk()
            ->assertJsonPath('data.title', 'Updated title')
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.ngo_profile_id', $project->ngo_profile_id);

        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'title' => 'Updated title',
            'status' => 'draft',
        ]);
    }

    public function test_other_ngo_cannot_update_project(): void
    {
        $project = $this->makeDraft($this->asNgo());
        $this->asNgo();

        $this->patchJson('/api/ngo/projects/'.$project->id, ['title' => 'Hijacked'])
            ->assertForbidden()
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'title' => 'Beach Cleanup',
        ]);
    }

    public function test_submitted_project_cannot_be_updated(): void
    {
        $project = $this->makeDraft($this->asNgo());
        $project->update(['status' => 'submitted']);

        $this->patchJson('/api/ngo/projects/'.$project->id, ['title' => 'Changed'])
            ->assertForbidden();
    }

    public function test_update_rejects_invalid_schedule_on_partial_patch(): void
    {
        $project = $this->makeDraft($this->asNgo());

        $this->patchJson('/api/ngo/projects/'.$project->id, [
            'end_at' => now()->addDay()->toDateTimeString(),
        ])->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['end_at']]);
    }

    public function test_other_ngo_cannot_submit_project(): void
    {
        $project = $this->makeDraft($this->asNgo());
        $this->asNgo();

        $this->postJson('/api/ngo/projects/'.$project->id.'/submit')
            ->assertForbidden();
    }

    public function test_owner_can_submit_project_and_resource_response_remains_compatible(): void
    {
        $project = $this->makeDraft($this->asNgo());

        $this->postJson('/api/ngo/projects/'.$project->id.'/submit')
            ->assertOk()
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.id', $project->id);
    }

    public function test_ngo_list_resource_keeps_pagination_metadata(): void
    {
        $this->makeDraft($this->asNgo());

        $this->getJson('/api/ngo/projects?page=1&per_page=1')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.per_page', 1)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Beach Cleanup');
    }
}

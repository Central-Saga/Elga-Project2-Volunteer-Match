<?php

namespace Tests\Feature;

use App\Models\NgoProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiPaginationTest extends TestCase
{
    use RefreshDatabase;

    private function createUser(string $role): User
    {
        return User::create([
            'name' => ucfirst($role).' Pagination',
            'email' => $role.'-pagination@example.com',
            'password' => 'Password123!',
            'role' => $role,
        ]);
    }

    private function createNgoProjects(string $status, int $count): void
    {
        $ngo = $this->createUser('ngo');
        $profile = NgoProfile::create([
            'user_id' => $ngo->id,
            'organization_name' => 'Pagination Foundation',
            'verification_status' => 'approved',
        ]);

        for ($i = 1; $i <= $count; $i++) {
            $profile->projects()->create([
                'title' => 'Pagination Project '.$i,
                'description' => 'Testing pagination',
                'start_at' => now()->addDays($i),
                'end_at' => now()->addDays($i + 1),
                'capacity' => 10,
                'risk_level' => 'low',
                'status' => $status,
            ]);
        }
    }

    public function test_student_projects_keep_match_fields_with_pagination(): void
    {
        $this->createNgoProjects('published', 3);
        Sanctum::actingAs($this->createUser('student'));

        $this->getJson('/api/student/projects')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.current_page', 1);

        $this->getJson('/api/student/projects?page=2&per_page=2')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.total', 3)
            ->assertJsonStructure(['data' => ['*' => ['match_score']]]);
    }

    public function test_ngo_projects_have_standard_metadata(): void
    {
        $this->createNgoProjects('draft', 3);
        Sanctum::actingAs(User::where('role', 'ngo')->firstOrFail());

        $this->getJson('/api/ngo/projects')
            ->assertOk()
            ->assertJsonCount(3, 'data');

        $this->getJson('/api/ngo/projects?page=2&per_page=2')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.total', 3);
    }

    public function test_admin_submitted_projects_are_paginated(): void
    {
        $this->createNgoProjects('submitted', 3);
        Sanctum::actingAs($this->createUser('admin'));

        $this->getJson('/api/admin/projects/submitted')
            ->assertOk()
            ->assertJsonCount(3, 'data');

        $this->getJson('/api/admin/projects/submitted?page=2&per_page=2')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.total', 3);
    }

    public function test_invalid_pagination_returns_normalized_validation_error(): void
    {
        Sanctum::actingAs($this->createUser('student'));

        $this->getJson('/api/student/projects?page=0&per_page=1000')
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonStructure([
                'message', 'data', 'errors' => ['page', 'per_page'],
            ]);
    }
}

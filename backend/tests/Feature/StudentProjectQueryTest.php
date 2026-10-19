<?php

namespace Tests\Feature;

use App\Models\NgoProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudentProjectQueryTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_listing_avoids_n_plus_one_queries(): void
    {
        $this->assertTrue(Model::preventsLazyLoading());

        $student = User::create([
            'name' => 'Student Test',
            'email' => 'student-query@example.com',
            'password' => 'Password123!',
            'role' => 'student',
        ]);

        $ngo = User::create([
            'name' => 'NGO Test',
            'email' => 'ngo-query@example.com',
            'password' => 'Password123!',
            'role' => 'ngo',
        ]);

        $profile = NgoProfile::create([
            'user_id' => $ngo->id,
            'organization_name' => 'Test Foundation',
            'verification_status' => 'approved',
        ]);

        for ($i = 1; $i <= 3; $i++) {
            $profile->projects()->create([
                'title' => 'Project ' . $i,
                'description' => 'Testing eager loading',
                'start_at' => now()->addDays($i),
                'end_at' => now()->addDays($i + 1),
                'capacity' => 20,
                'risk_level' => 'low',
                'status' => 'published',
            ]);
        }

        Sanctum::actingAs($student);

        $ngoQueries = [];

        DB::listen(function (QueryExecuted $query) use (&$ngoQueries) {
            if (str_contains(strtolower($query->sql), 'ngo_profiles')) {
                $ngoQueries[] = $query->sql;
            }
        });

        $response = $this->getJson('/api/student/projects');

        $response->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'ngo_profile' => [
                            'id',
                            'organization_name',
                        ],
                    ],
                ],
            ]);

        $this->assertCount(
            1,
            $ngoQueries,
            'Expected exactly one NGO profile query.'
        );
    }
}

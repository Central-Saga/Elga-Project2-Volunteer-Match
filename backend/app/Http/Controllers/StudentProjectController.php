<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\StudentProfile;
use Carbon\Carbon;
use Illuminate\Http\Request;

class StudentProjectController extends Controller
{
    public function index(Request $request)
    {
        $studentProfile = StudentProfile::where(
            'user_id',
            $request->user()->id
        )->first();

        $projects = Project::with('ngoProfile')
            ->withCount('applications')
            ->where('status', 'published')
            ->where('end_at', '>=', now())
            ->get()
            ->filter(function ($project) {
                // Hard filter: project penuh tidak direkomendasikan.
                return $project->applications_count < $project->capacity;
            })
            ->map(function ($project) use ($studentProfile) {
                $matching = $this->calculateMatch(
                    $studentProfile,
                    $project
                );

                $project->match_score = $matching['score'];
                $project->match_breakdown = $matching['breakdown'];
                $project->match_reasons = $matching['reasons'];

                return $project;
            })
            ->sortByDesc('match_score')
            ->values();

        return response()->json([
            'message' => 'Published projects retrieved successfully.',
            'data' => $projects,
        ]);
    }

    public function show(Request $request, Project $project)
    {
        if ($project->status !== 'published') {
            return response()->json([
                'message' => 'Project is not available.',
            ], 404);
        }

        if ($project->end_at->isPast()) {
            return response()->json([
                'message' => 'Project has already ended.',
            ], 404);
        }

        $project->load('ngoProfile');
        $project->loadCount('applications');

        $studentProfile = StudentProfile::where(
            'user_id',
            $request->user()->id
        )->first();

        $matching = $this->calculateMatch(
            $studentProfile,
            $project
        );

        $project->match_score = $matching['score'];
        $project->match_breakdown = $matching['breakdown'];
        $project->match_reasons = $matching['reasons'];

        return response()->json([
            'message' => 'Project retrieved successfully.',
            'data' => $project,
        ]);
    }

    private function calculateMatch(
        ?StudentProfile $student,
        Project $project
    ): array {
        if (!$student) {
            return [
                'score' => 0,
                'breakdown' => [
                    'skills' => 0,
                    'interests' => 0,
                    'availability' => 0,
                    'location' => 0,
                ],
                'reasons' => [
                    'Complete your student profile to get better recommendations.',
                ],
            ];
        }

        $studentSkills = $this->normalizeList(
            $student->skills ?? []
        );

        $studentInterests = $this->normalizeList(
            $student->interests ?? []
        );

        $requiredSkills = $this->normalizeList(
            $project->required_skills ?? []
        );

        $requiredInterests = $this->normalizeList(
            $project->required_interests ?? []
        );

        /*
        |--------------------------------------------------------------------------
        | Skill Match — 40%
        |--------------------------------------------------------------------------
        */

        $matchedSkills = array_values(
            array_intersect(
                $studentSkills,
                $requiredSkills
            )
        );

        if (count($requiredSkills) === 0) {
            $skillScore = 40;
        } else {
            $skillRatio =
                count($matchedSkills) /
                count($requiredSkills);

            $skillScore = round($skillRatio * 40);
        }

        /*
        |--------------------------------------------------------------------------
        | Interest Match — 30%
        |--------------------------------------------------------------------------
        */

        $matchedInterests = array_values(
            array_intersect(
                $studentInterests,
                $requiredInterests
            )
        );

        if (count($requiredInterests) === 0) {
            $interestScore = 30;
        } else {
            $interestRatio =
                count($matchedInterests) /
                count($requiredInterests);

            $interestScore = round(
                $interestRatio * 30
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Availability Match — 20%
        |--------------------------------------------------------------------------
        */

        $availabilityMatch =
            $this->matchesAvailability(
                $student->availability ?? [],
                $project->start_at,
                $project->end_at
            );

        $availabilityScore =
            $availabilityMatch ? 20 : 0;

        /*
        |--------------------------------------------------------------------------
        | Location Match — 10%
        |--------------------------------------------------------------------------
        */

        $locationMatch = $this->matchesLocation(
            $student->location,
            $project->location
        );

        $locationScore =
            $locationMatch ? 10 : 0;

        /*
        |--------------------------------------------------------------------------
        | Final Score
        |--------------------------------------------------------------------------
        */

        $score =
            $skillScore +
            $interestScore +
            $availabilityScore +
            $locationScore;

        $reasons = [];

        if (!empty($matchedSkills)) {
            $reasons[] =
                'Skill matched: ' .
                implode(', ', $matchedSkills);
        }

        if (!empty($matchedInterests)) {
            $reasons[] =
                'Interest matched: ' .
                implode(', ', $matchedInterests);
        }

        if ($availabilityMatch) {
            $reasons[] =
                'Available during the project schedule.';
        }

        if ($locationMatch) {
            $reasons[] =
                'Project location matches your location.';
        }

        if (empty($reasons)) {
            $reasons[] =
                'This project is available, but your profile has limited matching factors.';
        }

        return [
            'score' => min(100, max(0, $score)),

            'breakdown' => [
                'skills' => $skillScore,
                'interests' => $interestScore,
                'availability' => $availabilityScore,
                'location' => $locationScore,
            ],

            'reasons' => $reasons,
        ];
    }

    private function normalizeList(array $values): array
    {
        return array_values(
            array_unique(
                array_filter(
                    array_map(
                        fn ($value) =>
                            strtolower(
                                trim((string) $value)
                            ),
                        $values
                    )
                )
            )
        );
    }

    private function matchesLocation(
        ?string $studentLocation,
        ?string $projectLocation
    ): bool {
        if (!$studentLocation || !$projectLocation) {
            return false;
        }

        $student = strtolower(
            trim($studentLocation)
        );

        $project = strtolower(
            trim($projectLocation)
        );

        return str_contains($project, $student)
            || str_contains($student, $project);
    }

    private function matchesAvailability(
        array $availability,
        Carbon $startAt,
        Carbon $endAt
    ): bool {
        if (empty($availability)) {
            return false;
        }

        /*
         * Project timestamps disimpan UTC.
         * Untuk MVP kita bandingkan schedule
         * menggunakan waktu Bali.
         */
        $localStart = $startAt
            ->copy()
            ->timezone('Asia/Makassar');

        $localEnd = $endAt
            ->copy()
            ->timezone('Asia/Makassar');

        $day = strtolower(
            $localStart->format('l')
        );

        /*
        |--------------------------------------------------------------------------
        | Format sederhana
        |--------------------------------------------------------------------------
        |
        | Contoh:
        | ["weekend"]
        | ["saturday", "sunday"]
        |
        */

        if (array_is_list($availability)) {
            $values = $this->normalizeList(
                $availability
            );

            if (
                in_array('weekend', $values, true)
                && in_array(
                    $day,
                    ['saturday', 'sunday'],
                    true
                )
            ) {
                return true;
            }

            if (
                in_array('weekday', $values, true)
                && in_array(
                    $day,
                    [
                        'monday',
                        'tuesday',
                        'wednesday',
                        'thursday',
                        'friday',
                    ],
                    true
                )
            ) {
                return true;
            }

            return in_array(
                $day,
                $values,
                true
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Format detail
        |--------------------------------------------------------------------------
        |
        | Contoh:
        |
        | "saturday" => [
        |     "08:00-12:00"
        | ]
        |
        */

        $daySlots =
            $availability[$day] ?? [];

        if (!is_array($daySlots)) {
            return false;
        }

        $projectStart =
            $localStart->format('H:i');

        $projectEnd =
            $localEnd->format('H:i');

        foreach ($daySlots as $slot) {
            if (!is_string($slot)) {
                continue;
            }

            $parts = explode('-', $slot);

            if (count($parts) !== 2) {
                continue;
            }

            $availableStart =
                trim($parts[0]);

            $availableEnd =
                trim($parts[1]);

            if (
                $projectStart >= $availableStart
                && $projectEnd <= $availableEnd
            ) {
                return true;
            }
        }

        return false;
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateStudentProfileRequest;
use App\Http\Resources\StudentProfileResource;
use App\Models\StudentProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $profile = StudentProfile::with('campus')
            ->where('user_id', $request->user()->id)
            ->first();

        return response()->json([
            'profile' => $profile ? (new StudentProfileResource($profile))->resolve($request) : null,
        ]);
    }

    public function update(UpdateStudentProfileRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $profile = StudentProfile::updateOrCreate(
            [
                'user_id' => $request->user()->id,
            ],
            $validated,
        );

        $this->updateProfileCompletion($profile);

        return response()->json([
            'message' => 'Student profile saved successfully.',
            'profile' => (new StudentProfileResource(
                $profile->fresh()->load('campus')
            ))->resolve($request),
        ]);
    }

    private function updateProfileCompletion(
        StudentProfile $profile,
    ): void {
        $fields = [
            'campus_id',
            'nim',
            'study_program',
            'bio',
            'avatar_url',
            'interests',
            'skills',
            'availability',
            'location',
        ];

        $filled = 0;

        foreach ($fields as $field) {
            $value =
                $profile->{$field};

            if (
                $value !== null &&
                $value !== '' &&
                $value !== []
            ) {
                $filled++;
            }
        }

        $completion = (int) round(
            ($filled / count($fields)) * 100,
        );

        $profile->update([
            'profile_completion' =>
                $completion,
        ]);
    }
}
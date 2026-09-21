<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
            'profile' => $profile,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'campus_id' => ['nullable', 'exists:campuses,id'],
            'nim' => ['nullable', 'string', 'max:100'],
            'study_program' => ['nullable', 'string', 'max:255'],
            'interests' => ['nullable', 'array'],
            'interests.*' => ['string', 'max:100'],
            'skills' => ['nullable', 'array'],
            'skills.*' => ['string', 'max:100'],
            'availability' => ['nullable', 'array'],
            'location' => ['nullable', 'string', 'max:255'],
        ]);

        $profile = StudentProfile::updateOrCreate(
            ['user_id' => $request->user()->id],
            $validated
        );

        $this->updateProfileCompletion($profile);

        return response()->json([
            'message' => 'Student profile saved successfully.',
            'profile' => $profile->load('campus'),
        ]);
    }

    private function updateProfileCompletion(StudentProfile $profile): void
    {
        $fields = [
            'campus_id',
            'nim',
            'study_program',
            'interests',
            'skills',
            'availability',
            'location',
        ];

        $filled = 0;

        foreach ($fields as $field) {
            $value = $profile->{$field};

            if ($value !== null && $value !== '' && $value !== []) {
                $filled++;
            }
        }

        $completion = (int) round(($filled / count($fields)) * 100);

        $profile->update([
            'profile_completion' => $completion,
        ]);
    }
}
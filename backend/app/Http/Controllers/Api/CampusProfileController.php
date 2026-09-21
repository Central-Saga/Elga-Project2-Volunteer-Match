<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CampusProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampusProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $profile = CampusProfile::with('campus')
            ->where('user_id', $request->user()->id)
            ->first();

        return response()->json([
            'profile' => $profile,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'campus_id' => ['required', 'exists:campuses,id'],
            'position' => ['nullable', 'string', 'max:255'],
        ]);

        $profile = CampusProfile::updateOrCreate(
            ['user_id' => $request->user()->id],
            $validated
        );

        return response()->json([
            'message' => 'Campus profile saved successfully.',
            'profile' => $profile->load('campus'),
        ]);
    }
}
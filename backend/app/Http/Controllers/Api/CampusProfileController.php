<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateCampusProfileRequest;
use App\Http\Resources\CampusProfileResource;
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
            'profile' => $profile ? (new CampusProfileResource($profile))->resolve($request) : null,
        ]);
    }

    public function update(UpdateCampusProfileRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $profile = CampusProfile::updateOrCreate(
            ['user_id' => $request->user()->id],
            $validated
        );

        return response()->json([
            'message' => 'Campus profile saved successfully.',
            'profile' => (new CampusProfileResource($profile->load('campus')))->resolve($request),
        ]);
    }
}
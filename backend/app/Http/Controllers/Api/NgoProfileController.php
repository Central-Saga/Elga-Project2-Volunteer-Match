<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateNgoProfileRequest;
use App\Http\Resources\NgoProfileResource;
use App\Models\NgoProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NgoProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $profile = NgoProfile::where(
            'user_id',
            $request->user()->id
        )->first();

        return response()->json([
            'profile' => $profile ? (new NgoProfileResource($profile))->resolve($request) : null,
        ]);
    }

    public function update(UpdateNgoProfileRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $profile = NgoProfile::updateOrCreate(
            [
                'user_id' => $request->user()->id,
            ],
            $validated
        );

        return response()->json([
            'message' => 'NGO profile saved successfully.',
            'profile' => (new NgoProfileResource($profile))->resolve($request),
        ]);
    }
}
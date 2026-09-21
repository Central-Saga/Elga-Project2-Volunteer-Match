<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
            'profile' => $profile,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'organization_name' => [
                'required',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'focus_areas' => [
                'nullable',
                'array',
            ],

            'focus_areas.*' => [
                'string',
                'max:100',
            ],

            'contact_email' => [
                'nullable',
                'email',
                'max:255',
            ],

            'contact_phone' => [
                'nullable',
                'string',
                'max:30',
            ],

            'address' => [
                'nullable',
                'string',
            ],

            'risk_level' => [
                'nullable',
                'in:low,medium,high',
            ],
        ]);

        $profile = NgoProfile::updateOrCreate(
            [
                'user_id' => $request->user()->id,
            ],
            $validated
        );

        return response()->json([
            'message' => 'NGO profile saved successfully.',
            'profile' => $profile,
        ]);
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NgoProfile;
use App\Models\VerificationRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NgoVerificationController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $ngo = NgoProfile::where(
            'user_id',
            $request->user()->id
        )->firstOrFail();

        $verification = $ngo->verificationRecords()
            ->latest()
            ->first();

        return response()->json([
            'verification_status' => $ngo->verification_status,
            'verification_tier' => $ngo->verification_tier,
            'verification' => $verification,
        ]);
    }

    public function submit(Request $request): JsonResponse
    {
        $ngo = NgoProfile::where(
            'user_id',
            $request->user()->id
        )->firstOrFail();

        $validated = $request->validate([
            'evidence_reference' => [
                'required',
                'string',
                'max:500',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        $verification = $ngo->verificationRecords()->create([
            'status' => 'submitted',
            'evidence_reference' => $validated['evidence_reference'],
            'notes' => $validated['notes'] ?? null,
            'submitted_at' => now(),
        ]);

        $ngo->update([
            'verification_status' => 'submitted',
        ]);

        return response()->json([
            'message' => 'Verification submitted successfully.',
            'verification' => $verification,
        ], 201);
    }
}
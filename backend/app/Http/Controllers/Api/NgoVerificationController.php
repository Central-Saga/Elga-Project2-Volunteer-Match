<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NgoVerificationController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $ngo = $request->user()->ngoProfile;

        if (!$ngo) {
            return response()->json([
                'message' => 'NGO profile not found.',
            ], 404);
        }

        $verification = $ngo
            ->verificationRecords()
            ->latest('id')
            ->first();

        return response()->json([
            'verification_status' => $ngo->verification_status,
            'verification_tier' => $ngo->verification_tier,
            'verification' => $verification,
        ]);
    }

    public function submit(Request $request): JsonResponse
    {
        $ngo = $request->user()->ngoProfile;

        if (!$ngo) {
            return response()->json([
                'message' => 'NGO profile not found. Please complete your organization profile first.',
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | Prevent duplicate submission
        |--------------------------------------------------------------------------
        |
        | Kalau masih ada verification dengan status submitted,
        | NGO tidak boleh membuat verification baru lagi.
        |
        */

        $pendingVerification = $ngo
            ->verificationRecords()
            ->where('status', 'submitted')
            ->latest('id')
            ->first();

        if ($pendingVerification) {
            return response()->json([
                'message' => 'Verification has already been submitted and is waiting for admin review.',
                'verification' => $pendingVerification,
            ], 409);
        }

        /*
        |--------------------------------------------------------------------------
        | Prevent resubmission after approval
        |--------------------------------------------------------------------------
        */

        if ($ngo->verification_status === 'approved') {
            $approvedVerification = $ngo
                ->verificationRecords()
                ->where('status', 'approved')
                ->latest('id')
                ->first();

            return response()->json([
                'message' => 'This NGO has already been verified.',
                'verification' => $approvedVerification,
            ], 409);
        }

        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([
            'evidence_reference' => [
                'required',
                'string',
                'max:2000',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Create new verification
        |--------------------------------------------------------------------------
        |
        | Resubmit diperbolehkan kalau verification sebelumnya rejected.
        |
        */

        $verification = $ngo
            ->verificationRecords()
            ->create([
                'status' => 'submitted',

                'evidence_reference' =>
                    $validated['evidence_reference'],

                'notes' =>
                    $validated['notes'] ?? null,

                'submitted_at' => now(),

                'reviewed_at' => null,

                'reviewer_id' => null,
            ]);

        /*
        |--------------------------------------------------------------------------
        | Sync NGO verification status
        |--------------------------------------------------------------------------
        */

        $ngo->update([
            'verification_status' => 'submitted',
        ]);

        return response()->json([
            'message' => 'NGO verification submitted successfully.',
            'verification_status' => 'submitted',
            'verification' => $verification,
        ], 201);
    }
}
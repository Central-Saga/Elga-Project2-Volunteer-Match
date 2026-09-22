<?php

namespace App\Http\Controllers;

use App\Models\NgoProfile;
use App\Models\VerificationRecord;
use Illuminate\Http\Request;

class AdminNgoVerificationController extends Controller
{
    public function index()
    {
        $verifications = VerificationRecord::with([
            'ngoProfile',
        ])
            ->where('status', 'submitted')
            ->latest('submitted_at')
            ->get();

        return response()->json([
            'message' => 'Submitted NGO verifications retrieved successfully.',
            'data' => $verifications,
        ]);
    }

    public function approve(
        Request $request,
        VerificationRecord $verification
    ) {
        if ($verification->status !== 'submitted') {
            return response()->json([
                'message' => 'Only submitted verifications can be approved.',
            ], 422);
        }

        $verification->update([
            'status' => 'approved',
            'reviewer_id' => $request->user()->id,
            'reviewed_at' => now(),
            'notes' => $verification->notes,
        ]);

        $ngoProfile = NgoProfile::find($verification->ngo_id);

        if (!$ngoProfile) {
            return response()->json([
                'message' => 'NGO profile not found.',
            ], 404);
        }

        $ngoProfile->update([
            'verification_status' => 'approved',
        ]);

        return response()->json([
            'message' => 'NGO verification approved successfully.',
            'data' => [
                'verification' => $verification->fresh(),
                'ngo_profile' => $ngoProfile->fresh(),
            ],
        ]);
    }

    public function reject(
        Request $request,
        VerificationRecord $verification
    ) {
        if ($verification->status !== 'submitted') {
            return response()->json([
                'message' => 'Only submitted verifications can be rejected.',
            ], 422);
        }

        $validated = $request->validate([
            'notes' => [
                'required',
                'string',
                'min:5',
                'max:2000',
            ],
        ]);

        $verification->update([
            'status' => 'rejected',
            'reviewer_id' => $request->user()->id,
            'reviewed_at' => now(),
            'notes' => $validated['notes'],
        ]);

        $ngoProfile = NgoProfile::find($verification->ngo_id);

        if (!$ngoProfile) {
            return response()->json([
                'message' => 'NGO profile not found.',
            ], 404);
        }

        $ngoProfile->update([
            'verification_status' => 'rejected',
        ]);

        return response()->json([
            'message' => 'NGO verification rejected successfully.',
            'data' => [
                'verification' => $verification->fresh(),
                'ngo_profile' => $ngoProfile->fresh(),
            ],
        ]);
    }
}
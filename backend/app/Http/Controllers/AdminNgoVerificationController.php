<?php

namespace App\Http\Controllers;

use App\Models\NgoProfile;
use App\Models\VerificationRecord;
use App\Http\Requests\RejectNgoVerificationRequest;
use App\Http\Resources\NgoProfileResource;
use App\Http\Resources\VerificationRecordResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class AdminNgoVerificationController extends Controller
{
    public function index(Request $request)
    {
        $verifications = VerificationRecord::with([
            'ngoProfile',
        ])
            ->where('status', 'submitted')
            ->latest('submitted_at')
            ->get();

        return response()->json([
            'message' => 'Submitted NGO verifications retrieved successfully.',
            'data' => VerificationRecordResource::collection($verifications)->resolve($request),
        ]);
    }

    public function approve(
        Request $request,
        VerificationRecord $verification
    ) {
        Gate::authorize('approve', $verification);

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
                'verification' => (new VerificationRecordResource($verification->fresh()))->resolve($request),
                'ngo_profile' => (new NgoProfileResource($ngoProfile->fresh()))->resolve($request),
            ],
        ]);
    }

    public function reject(RejectNgoVerificationRequest $request, VerificationRecord $verification)
    {
        Gate::authorize('reject', $verification);

        if ($verification->status !== 'submitted') {
            return response()->json([
                'message' => 'Only submitted verifications can be rejected.',
            ], 422);
        }

        $validated = $request->validated();

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
                'verification' => (new VerificationRecordResource($verification->fresh()))->resolve($request),
                'ngo_profile' => (new NgoProfileResource($ngoProfile->fresh()))->resolve($request),
            ],
        ]);
    }
}
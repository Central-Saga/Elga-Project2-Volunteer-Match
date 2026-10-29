<?php

namespace App\Http\Controllers;

use App\Models\Credential;
use App\Models\Notification;
use App\Http\Requests\RevokeCredentialRequest;
use App\Http\Resources\CredentialResource;
use Illuminate\Support\Facades\Gate;
use Illuminate\Http\Request;

class AdminCredentialController extends Controller
{
    public function index(Request $request)
    {
        $credentials = Credential::with([
            'application.project',
            'application.studentProfile',
        ])
            ->latest('issued_at')
            ->get();

        return response()->json([
            'message' => 'Credentials retrieved successfully.',
            'data' => CredentialResource::collection($credentials)->resolve($request),
        ]);
    }

    public function revoke(RevokeCredentialRequest $request, Credential $credential)
    {
        Gate::authorize('revoke', $credential);

        if ($credential->status === 'revoked') {
            return response()->json([
                'message' => 'Credential has already been revoked.',
                'data' => $credential,
            ], 409);
        }

        $validated = $request->validated();

        $credential->update([
            'status' => 'revoked',
            'revoked_at' => now(),
            'revocation_reason' => $validated['revocation_reason'],
        ]);

        $credential->load([
    'application.project',
    'application.studentProfile',
]);

        Notification::create([
            'user_id' => $credential->application->studentProfile->user_id,
            'type' => 'credential_revoked',
            'title' => 'Credential Revoked',
            'message' => 'Your credential for ' . $credential->application->project->title . ' has been revoked.',
            'data' => [
                'application_id' => $credential->application_id,
                'project_id' => $credential->application->project_id,
                'credential_id' => $credential->id,
                'credential_number' => $credential->credential_number,
                'revocation_reason' => $validated['revocation_reason'],
            ],
        ]);

        return response()->json([
            'message' => 'Credential revoked successfully.',
            'data' => (new CredentialResource($credential->fresh()))->resolve($request),
        ]);
    }
}
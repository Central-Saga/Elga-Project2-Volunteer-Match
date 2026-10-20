<?php

namespace App\Http\Controllers;

use App\Models\Credential;
use Illuminate\Http\Request;
use App\Models\Notification;

class AdminCredentialController extends Controller
{
    public function index()
    {
        $credentials = Credential::with([
            'application.project',
            'application.studentProfile',
        ])
            ->latest('issued_at')
            ->get();

        return response()->json([
            'message' => 'Credentials retrieved successfully.',
            'data' => $credentials,
        ]);
    }

    public function revoke(Request $request, Credential $credential)
    {
        if ($credential->status === 'revoked') {
            return response()->json([
                'message' => 'Credential has already been revoked.',
                'data' => $credential,
            ], 409);
        }

        $validated = $request->validate([
            'revocation_reason' => [
                'required',
                'string',
                'min:5',
                'max:2000',
            ],
        ]);

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
            'data' => $credential->fresh(),
        ]);
    }
}
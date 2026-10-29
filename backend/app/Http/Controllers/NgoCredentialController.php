<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Credential;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Notification;
use App\Http\Resources\CredentialResource;
use Illuminate\Support\Facades\Gate;

class NgoCredentialController extends Controller
{
    public function issue(Request $request, Application $application)
    {
        Gate::authorize('issueCredential', $application);

        // Application harus accepted
        if ($application->status !== 'accepted') {
            return response()->json([
                'message' => 'Only accepted applications can receive a credential.',
            ], 422);
        }

        // Attendance harus validated
        $attendance = $application->attendance;

        if (!$attendance || $attendance->status !== 'validated') {
            return response()->json([
                'message' => 'Attendance must be validated before issuing a credential.',
            ], 422);
        }

        // Completion harus confirmed
        $completion = $application->completion;

        if (!$completion || $completion->status !== 'confirmed') {
            return response()->json([
                'message' => 'Completion must be confirmed before issuing a credential.',
            ], 422);
        }

        // Jangan terbitkan credential dua kali
        if ($application->credential) {
            return response()->json([
                'message' => 'Credential has already been issued.',
                'data' => $application->credential,
            ], 409);
        }

        $credential = Credential::create([
            'application_id' => $application->id,
            'credential_number' => 'VM-' . now()->format('Ymd') . '-' . strtoupper(Str::random(8)),
            'title' => 'Volunteer Participation Certificate',
            'issued_at' => now(),
            'status' => 'active',
        ]);

        Notification::create([
            'user_id' => $application->studentProfile->user_id,
            'type' => 'credential_issued',
            'title' => 'Credential Issued',
            'message' => 'Your credential for ' . $application->project->title . ' has been issued.',
            'data' => [
                'application_id' => $application->id,
                'project_id' => $application->project_id,
                'credential_id' => $credential->id,
                'credential_number' => $credential->credential_number,
            ],
        ]);

        return response()->json([
            'message' => 'Credential issued successfully.',
            'data' => (new CredentialResource($credential->load([
                'application.project',
                'application.studentProfile',
            ])))->resolve($request),
        ], 201);
    }
}
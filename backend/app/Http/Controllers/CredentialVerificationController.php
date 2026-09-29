<?php

namespace App\Http\Controllers;

use App\Models\Credential;

class CredentialVerificationController extends Controller
{
    public function verify(string $credentialNumber)
    {
        $credential = Credential::with([
            'application.project',
            'application.studentProfile.user',
            'application.studentProfile.campus',
        ])
            ->where('credential_number', $credentialNumber)
            ->first();

        if (!$credential) {
            return response()->json([
                'valid' => false,
                'message' => 'Credential not found.',
            ], 404);
        }

        $studentProfile = $credential
            ->application
            ->studentProfile;

        if ($credential->status === 'revoked') {
            return response()->json([
                'valid' => false,
                'message' => 'Credential has been revoked.',
                'data' => [
                    'application_id' => $credential->application_id,
                    'credential_number' => $credential->credential_number,
                    'title' => $credential->title,
                    'issued_at' => $credential->issued_at,
                    'status' => $credential->status,
                    'revoked_at' => $credential->revoked_at,
                    'revocation_reason' => $credential->revocation_reason,

                    'student' => [
                        'name' => $studentProfile?->user?->name,
                        'nim' => $studentProfile?->nim,
                        'study_program' => $studentProfile?->study_program,
                        'campus' => $studentProfile?->campus?->name,
                    ],

                    'project' => [
                        'id' => $credential->application->project->id,
                        'title' => $credential->application->project->title,
                        'location' => $credential->application->project->location,
                    ],
                ],
            ]);
        }

        return response()->json([
            'valid' => true,
            'message' => 'Credential is valid.',
            'data' => [
                'application_id' => $credential->application_id,
                'credential_number' => $credential->credential_number,
                'title' => $credential->title,
                'issued_at' => $credential->issued_at,
                'status' => $credential->status,

                'student' => [
                    'name' => $studentProfile?->user?->name,
                    'nim' => $studentProfile?->nim,
                    'study_program' => $studentProfile?->study_program,
                    'campus' => $studentProfile?->campus?->name,
                ],

                'project' => [
                    'id' => $credential->application->project->id,
                    'title' => $credential->application->project->title,
                    'location' => $credential->application->project->location,
                ],
            ],
        ]);
    }
}
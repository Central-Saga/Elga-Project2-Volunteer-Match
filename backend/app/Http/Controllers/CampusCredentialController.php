<?php

namespace App\Http\Controllers;

use App\Models\Credential;

class CampusCredentialController extends Controller
{
    public function verify(string $credentialNumber)
    {
        $credential = Credential::with([
            'application.project',
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

        if ($credential->status === 'revoked') {
            return response()->json([
                'valid' => false,
                'message' => 'Credential has been revoked.',
                'data' => [
                    'credential_number' => $credential->credential_number,
                    'status' => $credential->status,
                    'revoked_at' => $credential->revoked_at,
                    'revocation_reason' => $credential->revocation_reason,
                ],
            ]);
        }

        return response()->json([
            'valid' => true,
            'message' => 'Credential is valid.',
            'data' => [
                'credential_number' => $credential->credential_number,
                'title' => $credential->title,
                'issued_at' => $credential->issued_at,
                'status' => $credential->status,

                'student' => [
                    'nim' => $credential->application->studentProfile->nim,
                    'study_program' => $credential->application->studentProfile->study_program,
                    'campus_id' => $credential->application->studentProfile->campus_id,
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
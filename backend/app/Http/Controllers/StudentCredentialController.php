<?php

namespace App\Http\Controllers;

use App\Models\Application;
use Illuminate\Http\Request;

class StudentCredentialController extends Controller
{
    public function show(Request $request, Application $application)
    {
        $studentProfile = $request->user()->studentProfile;

        if (!$studentProfile) {
            return response()->json([
                'message' => 'Student profile not found.',
            ], 404);
        }

        // Pastikan application memang milik student yang sedang login
        if ($application->student_profile_id !== $studentProfile->id) {
            return response()->json([
                'message' => 'You are not allowed to view this credential.',
            ], 403);
        }

        $credential = $application->credential;

        if (!$credential) {
            return response()->json([
                'message' => 'Credential has not been issued yet.',
            ], 404);
        }

        return response()->json([
            'message' => 'Credential retrieved successfully.',
            'data' => $credential->load([
                'application.project',
            ]),
        ]);
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use Illuminate\Http\Request;

class NgoAttendanceController extends Controller
{
    public function validateAttendance(
        Request $request,
        Attendance $attendance
    ) {
        $ngoProfile = $request->user()->ngoProfile;

        if (!$ngoProfile) {
            return response()->json([
                'message' => 'NGO profile not found.',
            ], 404);
        }

        $application = $attendance->application;
        $project = $application->project;

        // Pastikan attendance berasal dari project milik NGO yang login
        if ($project->ngo_profile_id !== $ngoProfile->id) {
            return response()->json([
                'message' => 'You are not allowed to validate this attendance.',
            ], 403);
        }

        // Hanya attendance checked_in yang bisa divalidasi
        if ($attendance->status !== 'checked_in') {
            return response()->json([
                'message' => 'Only checked-in attendance can be validated.',
            ], 422);
        }

        $attendance->update([
            'status' => 'validated',
            'validated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Attendance validated successfully.',
            'data' => $attendance->fresh()->load([
                'application.project',
                'application.studentProfile',
            ]),
        ]);
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Application;
use Illuminate\Http\Request;

class StudentAttendanceController extends Controller
{
    public function checkIn(Request $request, Application $application)
    {
        $studentProfile = $request->user()->studentProfile;

        if (!$studentProfile) {
            return response()->json([
                'message' => 'Student profile not found.',
            ], 404);
        }

        // Pastikan application milik student yang login
        if ($application->student_profile_id !== $studentProfile->id) {
            return response()->json([
                'message' => 'You are not allowed to check in for this application.',
            ], 403);
        }

        // Hanya application accepted yang boleh check-in
        if ($application->status !== 'accepted') {
            return response()->json([
                'message' => 'Only accepted applications can check in.',
            ], 422);
        }

        // Cegah check-in dua kali
        $existingAttendance = $application->attendance;

        if ($existingAttendance) {
            return response()->json([
                'message' => 'You have already checked in.',
                'data' => $existingAttendance,
            ], 409);
        }

        $attendance = Attendance::create([
            'application_id' => $application->id,
            'status' => 'checked_in',
            'checked_in_at' => now(),
        ]);

        return response()->json([
            'message' => 'Check-in successful.',
            'data' => $attendance->load('application'),
        ], 201);
    }

    public function show(Request $request, Application $application)
    {
        $studentProfile = $request->user()->studentProfile;

        if (!$studentProfile) {
            return response()->json([
                'message' => 'Student profile not found.',
            ], 404);
        }

        if ($application->student_profile_id !== $studentProfile->id) {
            return response()->json([
                'message' => 'You are not allowed to view this attendance.',
            ], 403);
        }

        return response()->json([
            'message' => 'Attendance retrieved successfully.',
            'data' => $application->attendance,
        ]);
    }
}
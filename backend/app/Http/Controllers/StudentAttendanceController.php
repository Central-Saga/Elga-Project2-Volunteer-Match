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

        $project = $application->project;

        if (!$project) {
            return response()->json([
                'message' => 'Project not found.',
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | Check-in Window
        |--------------------------------------------------------------------------
        |
        | Check-in dibuka 30 menit sebelum project dimulai
        | dan ditutup ketika project selesai.
        |
        */

        $now = now();

        $checkInOpensAt = $project->start_at
            ->copy()
            ->subMinutes(30);

        $checkInClosesAt = $project->end_at;

        if ($now->lt($checkInOpensAt)) {
            return response()->json([
                'message' => 'Check-in is not open yet.',
                'check_in_opens_at' => $checkInOpensAt,
            ], 422);
        }

        if ($now->gt($checkInClosesAt)) {
            return response()->json([
                'message' => 'Check-in period has ended.',
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
            'data' => $attendance,
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
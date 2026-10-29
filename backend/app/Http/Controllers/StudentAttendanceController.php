<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Application;
use App\Http\Resources\AttendanceResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class StudentAttendanceController extends Controller
{
    public function checkIn(Request $request, Application $application)
    {
        Gate::authorize('checkIn', $application);

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
                'data' => (new AttendanceResource($existingAttendance))->resolve($request),
            ], 409);
        }

        $attendance = Attendance::create([
            'application_id' => $application->id,
            'status' => 'checked_in',
            'checked_in_at' => now(),
        ]);

        return response()->json([
            'message' => 'Check-in successful.',
            'data' => (new AttendanceResource($attendance))->resolve($request),
        ], 201);
    }

    public function show(Request $request, Application $application)
    {
        Gate::authorize('viewAttendance', $application);

        return response()->json([
            'message' => 'Attendance retrieved successfully.',
            'data' => $application->attendance
                ? (new AttendanceResource($application->attendance))->resolve($request)
                : null,
        ]);
    }
}
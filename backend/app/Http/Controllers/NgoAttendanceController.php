<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Http\Resources\AttendanceResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class NgoAttendanceController extends Controller
{
    public function validateAttendance(
        Request $request,
        Attendance $attendance
    ) {
        Gate::authorize('validateAttendance', $attendance);

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
            'data' => (new AttendanceResource($attendance->fresh()->load([
                'application.project',
                'application.studentProfile',
            ])))->resolve($request),
        ]);
    }
}
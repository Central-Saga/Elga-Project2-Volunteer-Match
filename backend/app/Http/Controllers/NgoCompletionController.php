<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Completion;
use Illuminate\Http\Request;

class NgoCompletionController extends Controller
{
    public function confirm(Request $request, Application $application)
    {
        $ngoProfile = $request->user()->ngoProfile;

        if (!$ngoProfile) {
            return response()->json([
                'message' => 'NGO profile not found.',
            ], 404);
        }

        $project = $application->project;

        // Pastikan application berasal dari project milik NGO yang login
        if ($project->ngo_profile_id !== $ngoProfile->id) {
            return response()->json([
                'message' => 'You are not allowed to confirm this completion.',
            ], 403);
        }

        // Hanya application accepted yang bisa diselesaikan
        if ($application->status !== 'accepted') {
            return response()->json([
                'message' => 'Only accepted applications can be completed.',
            ], 422);
        }

        // Attendance wajib sudah divalidasi
        $attendance = $application->attendance;

        if (!$attendance || $attendance->status !== 'validated') {
            return response()->json([
                'message' => 'Attendance must be validated before completion.',
            ], 422);
        }

        // Cegah completion dibuat dua kali
        if ($application->completion) {
            return response()->json([
                'message' => 'Completion has already been confirmed.',
                'data' => $application->completion,
            ], 409);
        }

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $completion = Completion::create([
            'application_id' => $application->id,
            'status' => 'confirmed',
            'confirmed_at' => now(),
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Completion confirmed successfully.',
            'data' => $completion->load([
                'application.project',
                'application.studentProfile',
            ]),
        ], 201);
    }
}
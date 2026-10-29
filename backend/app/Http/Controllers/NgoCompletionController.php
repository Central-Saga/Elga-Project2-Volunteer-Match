<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Completion;
use App\Http\Requests\ConfirmCompletionRequest;
use App\Http\Resources\CompletionResource;

class NgoCompletionController extends Controller
{
    public function confirm(ConfirmCompletionRequest $request, Application $application)
    {
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

        $validated = $request->validated();

        $completion = Completion::create([
            'application_id' => $application->id,
            'status' => 'confirmed',
            'total_hours' => $validated['total_hours'],
            'confirmed_at' => now(),
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Completion confirmed successfully.',
            'data' => (new CompletionResource($completion->load([
                'application.project',
                'application.studentProfile',
            ])))->resolve($request),
        ], 201);
    }
}
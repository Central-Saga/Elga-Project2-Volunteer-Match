<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Project;
use Illuminate\Http\Request;

class StudentApplicationController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $studentProfile = $request->user()->studentProfile;

        if (!$studentProfile) {
            return response()->json([
                'message' => 'Student profile not found. Please complete your profile first.',
            ], 404);
        }

        if ($project->status !== 'published') {
            return response()->json([
                'message' => 'This project is not available for applications.',
            ], 422);
        }

        if ($project->end_at < now()) {
            return response()->json([
                'message' => 'This project has already ended.',
            ], 422);
        }

        $existingApplication = Application::where('project_id', $project->id)
            ->where('student_profile_id', $studentProfile->id)
            ->first();

        if ($existingApplication) {
            return response()->json([
                'message' => 'You have already applied to this project.',
                'data' => $existingApplication,
            ], 409);
        }

        $acceptedCount = Application::where('project_id', $project->id)
            ->where('status', 'accepted')
            ->count();

        if ($acceptedCount >= $project->capacity) {
            return response()->json([
                'message' => 'This project is already full.',
            ], 422);
        }

        $validated = $request->validate([
            'motivation' => ['nullable', 'string', 'max:2000'],
        ]);

        $application = Application::create([
            'project_id' => $project->id,
            'student_profile_id' => $studentProfile->id,
            'motivation' => $validated['motivation'] ?? null,
            'status' => 'pending',
            'applied_at' => now(),
        ]);

        return response()->json([
            'message' => 'Application submitted successfully.',
            'data' => $application->load([
                'project',
                'studentProfile',
            ]),
        ], 201);
    }

    public function index(Request $request)
    {
        $studentProfile = $request->user()->studentProfile;

        if (!$studentProfile) {
            return response()->json([
                'message' => 'Student profile not found.',
            ], 404);
        }

        $applications = $studentProfile->applications()
            ->with('project')
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Applications retrieved successfully.',
            'data' => $applications,
        ]);
    }
}
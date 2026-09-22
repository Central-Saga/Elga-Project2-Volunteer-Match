<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;

class AdminProjectReviewController extends Controller
{
    public function index()
    {
        $projects = Project::with('ngoProfile')
            ->where('status', 'submitted')
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Submitted projects retrieved successfully.',
            'data' => $projects,
        ]);
    }

    public function approve(Project $project)
    {
        if ($project->status !== 'submitted') {
            return response()->json([
                'message' => 'Only submitted projects can be approved.',
            ], 422);
        }

        if ($project->ngoProfile->verification_status !== 'approved') {
            return response()->json([
                'message' => 'Project owner NGO must be verified before approval.',
            ], 422);
        }

        $project->update([
            'status' => 'published',
            'rejection_reason' => null,
        ]);

        return response()->json([
            'message' => 'Project approved and published successfully.',
            'data' => $project->fresh(),
        ]);
    }

    public function reject(Request $request, Project $project)
    {
        if ($project->status !== 'submitted') {
            return response()->json([
                'message' => 'Only submitted projects can be rejected.',
            ], 422);
        }

        $validated = $request->validate([
            'rejection_reason' => [
                'required',
                'string',
                'min:5',
                'max:2000',
            ],
        ]);

        $project->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return response()->json([
            'message' => 'Project rejected successfully.',
            'data' => $project->fresh(),
        ]);
    }
}
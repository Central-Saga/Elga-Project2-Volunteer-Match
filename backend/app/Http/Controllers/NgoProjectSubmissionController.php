<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Http\Resources\ProjectResource;
use Illuminate\Support\Facades\Gate;
use Illuminate\Http\Request;

class NgoProjectSubmissionController extends Controller
{
    public function submit(Request $request, Project $project)
    {
        $ngoProfile = $request->user()->ngoProfile;

        if (!$ngoProfile) {
            return response()->json([
                'message' => 'NGO profile not found.',
            ], 404);
        }

        Gate::authorize('submit', $project);

        if ($ngoProfile->verification_status !== 'approved') {
            return response()->json([
                'message' => 'NGO verification must be approved before submitting a project.',
            ], 403);
        }

        // Project hanya boleh disubmit dari draft
        if ($project->status !== 'draft') {
            return response()->json([
                'message' => 'Only draft projects can be submitted.',
            ], 422);
        }

        $project->update([
            'status' => 'submitted',
            'rejection_reason' => null,
        ]);

        return response()->json([
            'message' => 'Project submitted successfully and is waiting for review.',
            'data' => (new ProjectResource($project->fresh()))->resolve($request),
        ]);
    }
}
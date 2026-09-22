<?php

namespace App\Http\Controllers;

use App\Models\Project;
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

        // Pastikan project memang milik NGO yang sedang login
        if ($project->ngo_profile_id !== $ngoProfile->id) {
            return response()->json([
                'message' => 'You are not allowed to submit this project.',
            ], 403);
        }

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
            'data' => $project->fresh(),
        ]);
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;

class NgoApplicationController extends Controller
{
    public function index(Request $request, Project $project)
    {
        $ngoProfile = $request->user()->ngoProfile;

        if (!$ngoProfile) {
            return response()->json([
                'message' => 'NGO profile not found.',
            ], 404);
        }

        if ($project->ngo_profile_id !== $ngoProfile->id) {
            return response()->json([
                'message' => 'You are not allowed to view applications for this project.',
            ], 403);
        }

        $applications = $project->applications()
            ->with([
                'studentProfile',
                'attendance',
                'completion',
                'credential',
            ])
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Applications retrieved successfully.',
            'data' => $applications,
        ]);
    }
}
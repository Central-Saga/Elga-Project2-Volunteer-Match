<?php

namespace App\Http\Controllers;

use App\Models\Project;

class StudentProjectController extends Controller
{
    public function index()
    {
        $projects = Project::with('ngoProfile')
            ->where('status', 'published')
            ->where('end_at', '>=', now())
            ->latest('start_at')
            ->get();

        return response()->json([
            'message' => 'Published projects retrieved successfully.',
            'data' => $projects,
        ]);
    }

    public function show(Project $project)
    {
        if ($project->status !== 'published') {
            return response()->json([
                'message' => 'Project is not available.',
            ], 404);
        }

        $project->load('ngoProfile');

        return response()->json([
            'message' => 'Project retrieved successfully.',
            'data' => $project,
        ]);
    }
}
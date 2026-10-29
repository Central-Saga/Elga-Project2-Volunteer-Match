<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Application;
use App\Http\Resources\ApplicationResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class NgoApplicationController extends Controller
{
    public function index(Request $request, Project $project)
    {
        Gate::authorize('viewForProject', [Application::class, $project]);

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
            'data' => ApplicationResource::collection($applications)->resolve($request),
        ]);
    }
}
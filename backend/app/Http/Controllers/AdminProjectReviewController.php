<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Http\Requests\PaginationRequest;
use App\Http\Requests\RejectProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Support\ApiPagination;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class AdminProjectReviewController extends Controller
{
    public function index(PaginationRequest $request)
    {
        $paginated = ApiPagination::query(
            $request,
            Project::with('ngoProfile')
                ->where('status', 'submitted')
                ->latest()
        );

        $paginated['data'] = ProjectResource::collection($paginated['data'])->resolve($request);

        return response()->json([
            'message' => 'Submitted projects retrieved successfully.',
            ...$paginated,
        ]);
    }

    public function approve(Request $request, Project $project)
    {
        Gate::authorize('approve', $project);

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
            'data' => (new ProjectResource($project->fresh()))->resolve($request),
        ]);
    }

    public function reject(RejectProjectRequest $request, Project $project)
    {
        Gate::authorize('reject', $project);

        if ($project->status !== 'submitted') {
            return response()->json([
                'message' => 'Only submitted projects can be rejected.',
            ], 422);
        }

        $validated = $request->validated();

        $project->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return response()->json([
            'message' => 'Project rejected successfully.',
            'data' => (new ProjectResource($project->fresh()))->resolve($request),
        ]);
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Http\Requests\PaginationRequest;
use App\Support\ApiPagination;

class NgoProjectController extends Controller
{
    public function index(PaginationRequest $request)
    {
        $ngoProfile = $request->user()->ngoProfile;

        $paginated = ApiPagination::query(
            $request,
            $ngoProfile->projects()->latest()
        );

        $paginated['data'] = ProjectResource::collection(
            $paginated['data']
        )->resolve($request);

        return response()->json([
            'message' => 'Projects retrieved successfully.',
            ...$paginated,
        ]);
    }

    public function store(StoreProjectRequest $request)
    {
        $ngoProfile = $request->user()->ngoProfile;

        $validated = $request->validated();

        $project = $ngoProfile->projects()->create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'location' => $validated['location'] ?? null,
            'start_at' => $validated['start_at'],
            'end_at' => $validated['end_at'],
            'capacity' => $validated['capacity'],
            'required_skills' => $validated['required_skills'] ?? [],
            'required_interests' => $validated['required_interests'] ?? [],
            'risk_level' => $validated['risk_level'],

            // NGO membuat project → status awal draft
            'status' => 'draft',
        ]);

        return response()->json([
            'message' => 'Project created successfully.',
            'data' => (new ProjectResource($project))->resolve($request),
        ], 201);
    }

    public function update(UpdateProjectRequest $request, Project $project)
    {
        $project->update($request->validated());

        return response()->json([
            'message' => 'Project updated successfully.',
            'data' => (new ProjectResource($project->fresh()))->resolve($request),
        ]);
    }
}
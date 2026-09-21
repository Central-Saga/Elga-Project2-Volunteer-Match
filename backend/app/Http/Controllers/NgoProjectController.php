<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;

class NgoProjectController extends Controller
{
    public function index(Request $request)
    {
        $ngoProfile = $request->user()->ngoProfile;

        $projects = $ngoProfile->projects()
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Projects retrieved successfully.',
            'data' => $projects,
        ]);
    }

    public function store(Request $request)
    {
        $ngoProfile = $request->user()->ngoProfile;

        if (!$ngoProfile) {
            return response()->json([
                'message' => 'NGO profile not found.',
            ], 404);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'location' => ['nullable', 'string', 'max:255'],

            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after:start_at'],

            'capacity' => ['required', 'integer', 'min:1'],

            'required_skills' => ['nullable', 'array'],
            'required_skills.*' => ['string', 'max:100'],

            'required_interests' => ['nullable', 'array'],
            'required_interests.*' => ['string', 'max:100'],

            'risk_level' => ['required', 'in:low,medium,high'],
        ]);

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
            'data' => $project,
        ], 201);
    }
}
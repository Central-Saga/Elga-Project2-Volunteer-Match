<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Http\Requests\RejectApplicationRequest;
use App\Http\Resources\ApplicationResource;
use Illuminate\Http\Request;
use App\Models\Notification;
use Illuminate\Support\Facades\Gate;


class NgoApplicationReviewController extends Controller
{
    public function accept(Request $request, Application $application)
    {
        $ngoProfile = $request->user()->ngoProfile;

        if (!$ngoProfile) {
            return response()->json([
                'message' => 'NGO profile not found.',
            ], 404);
        }

        Gate::authorize('review', $application);

        // Hanya application pending yang boleh diterima
        if ($application->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending applications can be accepted.',
            ], 422);
        }

        // Hitung jumlah applicant yang sudah accepted
        $acceptedCount = Application::where('project_id', $application->project_id)
            ->where('status', 'accepted')
            ->count();

        if ($acceptedCount >= $application->project->capacity) {
            return response()->json([
                'message' => 'This project is already full.',
            ], 422);
        }

        $application->update([
            'status' => 'accepted',
            'reviewed_at' => now(),
            'rejection_reason' => null,
        ]);

        Notification::create([
            'user_id' => $application->studentProfile->user_id,
            'type' => 'application_accepted',
            'title' => 'Application Accepted',
            'message' => 'Your application for ' . $application->project->title . ' has been accepted.',
            'data' => [
                'application_id' => $application->id,
                'project_id' => $application->project_id,
            ],
        ]);

        return response()->json([
            'message' => 'Application accepted successfully.',
            'data' => (new ApplicationResource($application->fresh()->load([
                'project',
                'studentProfile',
            ])))->resolve($request),
        ]);
    }

    public function reject(RejectApplicationRequest $request, Application $application)
    {
        $ngoProfile = $request->user()->ngoProfile;

        if (!$ngoProfile) {
            return response()->json([
                'message' => 'NGO profile not found.',
            ], 404);
        }

        Gate::authorize('review', $application);

        if ($application->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending applications can be rejected.',
            ], 422);
        }

        $validated = $request->validated();

        $application->update([
            'status' => 'rejected',
            'reviewed_at' => now(),
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        Notification::create([
             'user_id' => $application->studentProfile->user_id,
             'type' => 'application_rejected',
             'title' => 'Application Rejected',
             'message' => 'Your application for ' . $application->project->title . ' has been rejected.',
             'data' => [
                 'application_id' => $application->id,
                 'project_id' => $application->project_id,
                 'rejection_reason' => $validated['rejection_reason'],
            ],
       ]);

        return response()->json([
            'message' => 'Application rejected successfully.',
            'data' => (new ApplicationResource($application->fresh()->load([
                'project',
                'studentProfile',
            ])))->resolve($request),
        ]);
    }
}
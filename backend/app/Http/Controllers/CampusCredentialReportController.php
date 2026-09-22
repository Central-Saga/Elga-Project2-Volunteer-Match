<?php

namespace App\Http\Controllers;

use App\Models\Credential;
use Illuminate\Http\Request;


class CampusCredentialReportController extends Controller
{
    public function index(Request $request)
    {

        
        $campusProfile = $request->user()->campusProfile;

        if (!$campusProfile) {
            return response()->json([
                'message' => 'Campus profile not found.',
            ], 404);
        }

        $campusId = $campusProfile->campus_id;

        $credentials = Credential::with([
            'application.project',
            'application.studentProfile',
        ])
            ->whereHas('application.studentProfile', function ($query) use ($campusId) {
                $query->where('campus_id', $campusId);
            })
            ->latest('issued_at')
            ->get();

        return response()->json([
            'message' => 'Campus credential report retrieved successfully.',
            'data' => $credentials,
        ]);
    }

    public function volunteerActivities(Request $request)
{
    $campusProfile = $request->user()->campusProfile;

    if (!$campusProfile) {
        return response()->json([
            'message' => 'Campus profile not found.',
        ], 404);
    }

    $validated = $request->validate([
        'from' => ['nullable', 'date'],
        'to' => ['nullable', 'date', 'after_or_equal:from'],
        'credential_status' => ['nullable', 'in:active,revoked'],
    ]);

    $campusId = $campusProfile->campus_id;

    $query = Credential::with([
        'application.project',
        'application.studentProfile',
        'application.completion',
    ])
        ->whereHas('application.studentProfile', function ($query) use ($campusId) {
            $query->where('campus_id', $campusId);
        });

    // Filter berdasarkan tanggal penerbitan credential
    if (!empty($validated['from'])) {
        $query->whereDate('issued_at', '>=', $validated['from']);
    }

    if (!empty($validated['to'])) {
        $query->whereDate('issued_at', '<=', $validated['to']);
    }

    // Filter status credential
    if (!empty($validated['credential_status'])) {
        $query->where('status', $validated['credential_status']);
    }

    $credentials = $query
        ->latest('issued_at')
        ->get();

    $report = $credentials->map(function ($credential) {
        $application = $credential->application;
        $student = $application->studentProfile;
        $project = $application->project;
        $completion = $application->completion;

        return [
            'credential_number' => $credential->credential_number,
            'credential_status' => $credential->status,

            'student' => [
                'nim' => $student->nim,
                'study_program' => $student->study_program,
            ],

            'volunteer_activity' => [
                'project_id' => $project->id,
                'title' => $project->title,
                'location' => $project->location,
                'start_at' => $project->start_at,
                'end_at' => $project->end_at,
            ],

            'completion' => [
                'status' => $completion?->status,
                'total_hours' => $completion?->total_hours,
                'confirmed_at' => $completion?->confirmed_at,
            ],
        ];
    });

    return response()->json([
        'message' => 'Campus volunteer activity report retrieved successfully.',
        'data' => $report,
        'meta' => [
            'total_records' => $report->count(),
            'total_hours' => $report->sum(function ($item) {
                return (float) ($item['completion']['total_hours'] ?? 0);
            }),
            'filters' => [
                'from' => $validated['from'] ?? null,
                'to' => $validated['to'] ?? null,
                'credential_status' => $validated['credential_status'] ?? null,
            ],
        ],
    ]);
}

public function exportVolunteerActivities(Request $request)
{
    $campusProfile = $request->user()->campusProfile;

    if (!$campusProfile) {
        return response()->json([
            'message' => 'Campus profile not found.',
        ], 404);
    }

    $validated = $request->validate([
        'from' => ['nullable', 'date'],
        'to' => ['nullable', 'date', 'after_or_equal:from'],
        'credential_status' => ['nullable', 'in:active,revoked'],
    ]);

    $campusId = $campusProfile->campus_id;

    $query = Credential::with([
        'application.project',
        'application.studentProfile',
        'application.completion',
    ])
        ->whereHas('application.studentProfile', function ($query) use ($campusId) {
            $query->where('campus_id', $campusId);
        });

    if (!empty($validated['from'])) {
        $query->whereDate('issued_at', '>=', $validated['from']);
    }

    if (!empty($validated['to'])) {
        $query->whereDate('issued_at', '<=', $validated['to']);
    }

    if (!empty($validated['credential_status'])) {
        $query->where('status', $validated['credential_status']);
    }

    $credentials = $query
        ->latest('issued_at')
        ->get();

    $filename = 'volunteer-activities-' . now()->format('Ymd-His') . '.csv';

    return response()->streamDownload(function () use ($credentials) {
        $handle = fopen('php://output', 'w');

        fputcsv($handle, [
            'Credential Number',
            'Credential Status',
            'NIM',
            'Study Program',
            'Project ID',
            'Project Title',
            'Location',
            'Start At',
            'End At',
            'Completion Status',
            'Total Hours',
            'Confirmed At',
            'Issued At',
        ]);

        foreach ($credentials as $credential) {
            $application = $credential->application;
            $student = $application->studentProfile;
            $project = $application->project;
            $completion = $application->completion;

            fputcsv($handle, [
                $credential->credential_number,
                $credential->status,
                $student->nim,
                $student->study_program,
                $project->id,
                $project->title,
                $project->location,
                $project->start_at,
                $project->end_at,
                $completion?->status,
                $completion?->total_hours,
                $completion?->confirmed_at,
                $credential->issued_at,
            ]);
        }

        fclose($handle);
    }, $filename, [
        'Content-Type' => 'text/csv; charset=UTF-8',
    ]);
}

}
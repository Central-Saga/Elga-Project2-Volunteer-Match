<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Http\Resources\CredentialResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class StudentCredentialController extends Controller
{
    public function show(Request $request, Application $application)
    {
        Gate::authorize('viewCredential', $application);

        $credential = $application->credential;

        if (!$credential) {
            return response()->json([
                'message' => 'Credential has not been issued yet.',
            ], 404);
        }

        return response()->json([
            'message' => 'Credential retrieved successfully.',
            'data' => (new CredentialResource($credential->load([
                'application.project',
            ])))->resolve($request),
        ]);
    }
}
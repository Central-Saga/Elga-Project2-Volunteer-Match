<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campus;
use Illuminate\Http\JsonResponse;

class CampusController extends Controller
{
    public function index(): JsonResponse
    {
        $campuses = Campus::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'code',
            ]);

        return response()->json([
            'message' => 'Campuses retrieved successfully.',
            'data' => $campuses,
        ]);
    }
}
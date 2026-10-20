<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::query()
            ->with([
                'studentProfile',
                'ngoProfile',
                'campusProfile',
            ])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'message' => 'Users retrieved successfully.',
            'data' => $users,
        ]);
    }

    public function suspend(
        Request $request,
        User $user,
    ): JsonResponse {
        $admin = $request->user();

        if ($admin->id === $user->id) {
            return response()->json([
                'message' => 'You cannot suspend your own account from user management.',
            ], 422);
        }

        if ($user->status === 'deleted') {
            return response()->json([
                'message' => 'Deleted account cannot be suspended.',
            ], 422);
        }

        if ($user->status === 'suspended') {
            return response()->json([
                'message' => 'Account is already suspended.',
                'data' => $user,
            ]);
        }

        $user->status = 'suspended';
        $user->save();

        /*
        |--------------------------------------------------------------------------
        | Revoke all active sessions
        |--------------------------------------------------------------------------
        |
        | Begitu user disuspend, semua token Sanctum user langsung dicabut.
        |
        */

        $user->tokens()->delete();

        return response()->json([
            'message' => 'Account suspended successfully.',
            'data' => $user->fresh(),
        ]);
    }

    public function activate(
        Request $request,
        User $user,
    ): JsonResponse {
        if ($user->status === 'deleted') {
            return response()->json([
                'message' => 'Deleted account cannot be reactivated.',
            ], 422);
        }

        if ($user->status === 'active') {
            return response()->json([
                'message' => 'Account is already active.',
                'data' => $user,
            ]);
        }

        $user->status = 'active';
        $user->save();

        return response()->json([
            'message' => 'Account activated successfully.',
            'data' => $user->fresh(),
        ]);
    }

    public function destroy(
        Request $request,
        User $user,
    ): JsonResponse {
        $admin = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Protect current admin
        |--------------------------------------------------------------------------
        |
        | Admin tetap boleh menghapus akun sendiri lewat /auth/account,
        | tapi tidak dari halaman user management agar tidak salah klik.
        |
        */

        if ($admin->id === $user->id) {
            return response()->json([
                'message' => 'You cannot delete your own account from user management. Use your profile Danger Zone instead.',
            ], 422);
        }

        if ($user->status === 'deleted') {
            return response()->json([
                'message' => 'Account is already deleted.',
                'data' => $user,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Soft account deletion
        |--------------------------------------------------------------------------
        |
        | Record user tetap berada di database agar application, project,
        | attendance, credential, verification, dan historical record aman.
        |
        */

        $user->status = 'deleted';
        $user->save();

        /*
        |--------------------------------------------------------------------------
        | Kill every session
        |--------------------------------------------------------------------------
        */

        $user->tokens()->delete();

        return response()->json([
            'message' => 'Account deleted successfully.',
            'data' => $user->fresh(),
        ]);
    }
}
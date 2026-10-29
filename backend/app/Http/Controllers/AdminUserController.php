<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class AdminUserController extends Controller
{
    public function index(): JsonResponse
    {
        Gate::authorize('viewAny', User::class);

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
            'data' => UserResource::collection($users)->resolve(request()),
        ]);
    }

    public function suspend(
        Request $request,
        User $user,
    ): JsonResponse {
        Gate::authorize('manage', $user);

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
                'data' => (new UserResource($user))->resolve($request),
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
            'data' => (new UserResource($user->fresh()))->resolve($request),
        ]);
    }

    public function activate(
        Request $request,
        User $user,
    ): JsonResponse {
        Gate::authorize('manage', $user);

        if ($user->status === 'deleted') {
            return response()->json([
                'message' => 'Deleted account cannot be reactivated.',
            ], 422);
        }

        if ($user->status === 'active') {
            return response()->json([
                'message' => 'Account is already active.',
                'data' => (new UserResource($user))->resolve($request),
            ]);
        }

        $user->status = 'active';
        $user->save();

        return response()->json([
            'message' => 'Account activated successfully.',
            'data' => (new UserResource($user->fresh()))->resolve($request),
        ]);
    }

    public function destroy(
        Request $request,
        User $user,
    ): JsonResponse {
        Gate::authorize('manage', $user);

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
                'data' => (new UserResource($user))->resolve($request),
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
            'data' => (new UserResource($user->fresh()))->resolve($request),
        ]);
    }
}
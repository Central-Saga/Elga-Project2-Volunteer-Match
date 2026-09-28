<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],

            'role' => [
                'required',
                'string',
                'in:student,ngo',
            ],

            /*
            |--------------------------------------------------------------------------
            | Student-only fields
            |--------------------------------------------------------------------------
            |
            | Field ini wajib hanya jika role = student.
            | Untuk NGO, field ini boleh tidak dikirim.
            |
            */

            'campus_id' => [
                'required_if:role,student',
                'nullable',
                'integer',
                'exists:campuses,id',
            ],

            'nim' => [
                'required_if:role,student',
                'nullable',
                'string',
                'max:100',
                'unique:student_profiles,nim',
            ],

            'study_program' => [
                'required_if:role,student',
                'nullable',
                'string',
                'max:255',
            ],
        ]);

        $user = DB::transaction(function () use ($validated) {
            /*
            |--------------------------------------------------------------------------
            | Create User
            |--------------------------------------------------------------------------
            */

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => $validated['role'],
            ]);

            /*
            |--------------------------------------------------------------------------
            | Create Student Profile
            |--------------------------------------------------------------------------
            |
            | Student langsung punya profile akademik sejak registrasi.
            | NGO tidak dibuatkan StudentProfile.
            |
            */

            if ($validated['role'] === 'student') {
                StudentProfile::create([
                    'user_id' => $user->id,
                    'campus_id' => $validated['campus_id'],
                    'nim' => $validated['nim'],
                    'study_program' => $validated['study_program'],

                    /*
                    |--------------------------------------------------------------------------
                    | Matching fields
                    |--------------------------------------------------------------------------
                    |
                    | Dikosongkan dulu. Student dapat mengisinya dari Profile.
                    |
                    */

                    'interests' => [],
                    'skills' => [],
                    'availability' => [],
                    'location' => null,
                    'bio' => null,
                    'avatar_url' => null,

                    /*
                    |--------------------------------------------------------------------------
                    | Initial completion
                    |--------------------------------------------------------------------------
                    |
                    | Dari 9 field utama profile:
                    | campus, nim, study program = 3 / 9 = 33%.
                    |
                    */

                    'profile_completion' => 33,
                ]);
            }

            return $user;
        });

        $token = $user
            ->createToken('auth-token')
            ->plainTextToken;

        return response()->json([
            'message' => 'Registration successful.',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => [
                'required',
                'email',
            ],

            'password' => [
                'required',
                'string',
            ],
        ]);

        $user = User::where(
            'email',
            $validated['email'],
        )->first();

        if (
            !$user ||
            !Hash::check(
                $validated['password'],
                $user->password,
            )
        ) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if ($user->status === 'suspended') {
            return response()->json([
                'message' => 'This account has been suspended.',
            ], 403);
        }

        if ($user->status === 'deleted') {
            return response()->json([
                'message' => 'This account has been deleted.',
            ], 403);
        }

        $token = $user
            ->createToken('volunteer-match')
            ->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request
            ->user()
            ->currentAccessToken()
            ?->delete();

        return response()->json([
            'message' => 'Logout successful.',
        ]);
    }

    public function deleteAccount(
        Request $request,
    ): JsonResponse {
        $validated = $request->validate([
            'password' => [
                'required',
                'string',
            ],
        ]);

        $user = $request->user();

        if (
            !Hash::check(
                $validated['password'],
                $user->password,
            )
        ) {
            return response()->json([
                'message' => 'Password is incorrect.',
            ], 422);
        }

        if ($user->status === 'deleted') {
            return response()->json([
                'message' => 'Account is already deleted.',
            ], 409);
        }

        $user->status = 'deleted';
        $user->save();

        $user
            ->tokens()
            ->delete();

        return response()->json([
            'message' => 'Account deleted successfully.',
        ]);
    }
}
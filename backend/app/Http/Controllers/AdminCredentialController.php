<?php

namespace App\Http\Controllers;

use App\Models\Credential;
use Illuminate\Http\Request;

class AdminCredentialController extends Controller
{
    public function revoke(Request $request, Credential $credential)
    {
        if ($credential->status === 'revoked') {
            return response()->json([
                'message' => 'Credential has already been revoked.',
                'data' => $credential,
            ], 409);
        }

        $validated = $request->validate([
            'revocation_reason' => [
                'required',
                'string',
                'min:5',
                'max:2000',
            ],
        ]);

        $credential->update([
            'status' => 'revoked',
            'revoked_at' => now(),
            'revocation_reason' => $validated['revocation_reason'],
        ]);

        return response()->json([
            'message' => 'Credential revoked successfully.',
            'data' => $credential->fresh(),
        ]);
    }
}
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CredentialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'application_id' => $this->application_id,
            'credential_number' => $this->credential_number,
            'title' => $this->title,
            'issued_at' => $this->issued_at,
            'status' => $this->status,
            'revoked_at' => $this->revoked_at,
            'revocation_reason' => $this->revocation_reason,
            'application' => $this->whenLoaded(
                'application',
                fn () => (new ApplicationResource($this->application))->resolve($request)
            ),
        ];
    }
}

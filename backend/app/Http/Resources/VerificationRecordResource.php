<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VerificationRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ngo_id' => $this->ngo_id,
            'reviewer_id' => $this->reviewer_id,
            'status' => $this->status,
            'notes' => $this->notes,
            'evidence_reference' => $this->evidence_reference,
            'submitted_at' => $this->submitted_at,
            'reviewed_at' => $this->reviewed_at,
            'ngo_profile' => $this->whenLoaded(
                'ngoProfile',
                fn () => $this->ngoProfile->only([
                    'id',
                    'organization_name',
                    'verification_status',
                    'verification_tier',
                ])
            ),
        ];
    }
}

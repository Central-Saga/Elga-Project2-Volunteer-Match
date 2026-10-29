<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NgoProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'organization_name' => $this->organization_name,
            'description' => $this->description,
            'focus_areas' => $this->focus_areas,
            'contact_email' => $this->contact_email,
            'contact_phone' => $this->contact_phone,
            'address' => $this->address,
            'verification_tier' => $this->verification_tier,
            'verification_status' => $this->verification_status,
            'risk_level' => $this->risk_level,
        ];
    }
}

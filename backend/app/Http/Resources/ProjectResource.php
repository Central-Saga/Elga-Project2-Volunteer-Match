<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ngo_profile_id' => $this->ngo_profile_id,
            'title' => $this->title,
            'description' => $this->description,
            'location' => $this->location,
            'start_at' => $this->start_at,
            'end_at' => $this->end_at,
            'capacity' => $this->capacity,
            'required_skills' => $this->required_skills,
            'required_interests' => $this->required_interests,
            'status' => $this->status,
            'risk_level' => $this->risk_level,
            'rejection_reason' => $this->rejection_reason,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'ngo_profile' => $this->whenLoaded(
                'ngoProfile',
                fn () => $this->ngoProfile?->toArray()
            ),
        ];
    }
}

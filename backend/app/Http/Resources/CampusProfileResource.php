<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CampusProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'campus_id' => $this->campus_id,
            'position' => $this->position,
            'campus' => $this->whenLoaded(
                'campus',
                fn () => $this->campus?->only(['id', 'name'])
            ),
        ];
    }
}

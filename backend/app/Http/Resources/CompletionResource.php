<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompletionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'application_id' => $this->application_id,
            'status' => $this->status,
            'total_hours' => $this->total_hours,
            'confirmed_at' => $this->confirmed_at,
            'notes' => $this->notes,
            'application' => $this->whenLoaded(
                'application',
                fn () => (new ApplicationResource($this->application))->resolve($request)
            ),
        ];
    }
}

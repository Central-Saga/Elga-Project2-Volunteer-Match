<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'application_id' => $this->application_id,
            'status' => $this->status,
            'checked_in_at' => $this->checked_in_at,
            'checked_out_at' => $this->checked_out_at,
            'validated_at' => $this->validated_at,
            'application' => $this->whenLoaded(
                'application',
                fn () => (new ApplicationResource($this->application))->resolve($request)
            ),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'campus_id' => $this->campus_id,
            'nim' => $this->nim,
            'faculty' => $this->faculty,
            'study_program' => $this->study_program,
            'semester' => $this->semester,
            'bio' => $this->bio,
            'avatar_url' => $this->avatar_url,
            'skills' => $this->skills,
            'interests' => $this->interests,
            'availability' => $this->availability,
            'location' => $this->location,
            'profile_completion' => $this->profile_completion,
            'campus' => $this->whenLoaded(
                'campus',
                fn () => $this->campus?->only(['id', 'name', 'code'])
            ),
        ];
    }
}

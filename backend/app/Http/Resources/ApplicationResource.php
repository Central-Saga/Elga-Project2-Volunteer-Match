<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'student_profile_id' => $this->student_profile_id,
            'motivation' => $this->motivation,
            'status' => $this->status,
            'applied_at' => $this->applied_at,
            'reviewed_at' => $this->reviewed_at,
            'rejection_reason' => $this->rejection_reason,
            'project' => $this->whenLoaded(
                'project',
                fn () => (new ProjectResource($this->project))->resolve($request)
            ),
            'student_profile' => $this->whenLoaded(
                'studentProfile',
                fn () => $this->studentProfile?->only([
                    'id',
                    'user_id',
                    'campus_id',
                    'nim',
                    'faculty',
                    'study_program',
                    'semester',
                    'bio',
                    'avatar_url',
                    'skills',
                    'interests',
                    'availability',
                    'location',
                    'profile_completion',
                ])
            ),
        ];
    }
}

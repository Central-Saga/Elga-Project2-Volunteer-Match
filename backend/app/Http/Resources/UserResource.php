<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'status' => $this->status,
            'email_verified_at' => $this->email_verified_at,
            'created_at' => $this->created_at,
            'student_profile' => $this->whenLoaded(
                'studentProfile',
                fn () => $this->studentProfile
                    ? (new StudentProfileResource($this->studentProfile))->resolve($request)
                    : null
            ),
            'ngo_profile' => $this->whenLoaded(
                'ngoProfile',
                fn () => $this->ngoProfile
                    ? (new NgoProfileResource($this->ngoProfile))->resolve($request)
                    : null
            ),
            'campus_profile' => $this->whenLoaded(
                'campusProfile',
                fn () => $this->campusProfile
                    ? (new CampusProfileResource($this->campusProfile))->resolve($request)
                    : null
            ),
        ];
    }
}

<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function create(User $user): bool
    {
        return $user->role === 'ngo'
            && $user->ngoProfile?->verification_status === 'approved';
    }

    public function update(User $user, Project $project): bool
    {
        return $this->ownsProject($user, $project)
            && $project->status === 'draft';
    }

    public function submit(User $user, Project $project): bool
    {
        return $this->ownsProject($user, $project);
    }

    public function approve(User $user, Project $project): bool
    {
        return $user->role === 'admin';
    }

    public function reject(User $user, Project $project): bool
    {
        return $user->role === 'admin';
    }

    private function ownsProject(User $user, Project $project): bool
    {
        return $user->role === 'ngo'
            && $user->ngoProfile?->id !== null
            && $user->ngoProfile->id === $project->ngo_profile_id;
    }
}

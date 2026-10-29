<?php

namespace App\Policies;

use App\Models\Application;
use App\Models\Project;
use App\Models\User;

class ApplicationPolicy
{
    public function create(User $user, Project $project): bool
    {
        return $user->role === 'student'
            && $user->studentProfile !== null;
    }

    public function review(User $user, Application $application): bool
    {
        return $user->role === 'ngo'
            && $user->ngoProfile?->id !== null
            && $user->ngoProfile->id === $application->project->ngo_profile_id;
    }

    public function viewForProject(User $user, Project $project): bool
    {
        return $user->role === 'ngo'
            && $user->ngoProfile?->id !== null
            && $user->ngoProfile->id === $project->ngo_profile_id;
    }

    public function confirmCompletion(User $user, Application $application): bool
    {
        return $this->review($user, $application);
    }

    public function issueCredential(User $user, Application $application): bool
    {
        return $this->review($user, $application);
    }

    public function checkIn(User $user, Application $application): bool
    {
        return $user->role === 'student'
            && $user->studentProfile?->id !== null
            && $user->studentProfile->id === $application->student_profile_id;
    }

    public function viewAttendance(User $user, Application $application): bool
    {
        return $this->checkIn($user, $application);
    }

    public function viewCredential(User $user, Application $application): bool
    {
        return $this->checkIn($user, $application);
    }
}

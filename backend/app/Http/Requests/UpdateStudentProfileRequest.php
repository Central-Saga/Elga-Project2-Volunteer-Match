<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'student';
    }

    public function rules(): array
    {
        return [
            'campus_id' => ['nullable', 'exists:campuses,id'],
            'nim' => ['nullable', 'string', 'max:100'],
            'study_program' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'avatar_url' => ['nullable', 'string', 'max:2048'],
            'interests' => ['nullable', 'array', 'max:20'],
            'interests.*' => ['string', 'max:100'],
            'skills' => ['nullable', 'array', 'max:20'],
            'skills.*' => ['string', 'max:100'],
            'availability' => ['nullable', 'array'],
            'location' => ['nullable', 'string', 'max:255'],
        ];
    }
}

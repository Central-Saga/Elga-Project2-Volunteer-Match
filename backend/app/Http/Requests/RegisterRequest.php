<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['required', 'string', 'in:student,ngo'],
            'campus_id' => ['required_if:role,student', 'nullable', 'integer', 'exists:campuses,id'],
            'nim' => ['required_if:role,student', 'nullable', 'string', 'max:100', 'unique:student_profiles,nim'],
            'study_program' => ['required_if:role,student', 'nullable', 'string', 'max:255'],
        ];
    }
}

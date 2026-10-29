<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCampusProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'campus';
    }

    public function rules(): array
    {
        return [
            'campus_id' => ['required', 'exists:campuses,id'],
            'position' => ['nullable', 'string', 'max:255'],
        ];
    }
}

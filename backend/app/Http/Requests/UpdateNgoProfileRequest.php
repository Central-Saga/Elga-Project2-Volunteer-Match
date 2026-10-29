<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNgoProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'ngo';
    }

    public function rules(): array
    {
        return [
            'organization_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'focus_areas' => ['nullable', 'array'],
            'focus_areas.*' => ['string', 'max:100'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string'],
            'risk_level' => ['nullable', 'in:low,medium,high'],
        ];
    }
}

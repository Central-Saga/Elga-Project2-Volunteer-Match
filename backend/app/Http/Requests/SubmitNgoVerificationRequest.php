<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitNgoVerificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'ngo'
            && $this->user()?->ngoProfile !== null;
    }

    public function rules(): array
    {
        return [
            'evidence_reference' => ['required', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

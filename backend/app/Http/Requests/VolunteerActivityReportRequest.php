<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VolunteerActivityReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'campus';
    }

    public function rules(): array
    {
        return [
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'credential_status' => ['nullable', 'in:active,revoked'],
        ];
    }
}

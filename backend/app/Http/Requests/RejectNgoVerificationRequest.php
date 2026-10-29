<?php

namespace App\Http\Requests;

use App\Models\VerificationRecord;
use Illuminate\Foundation\Http\FormRequest;

class RejectNgoVerificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $verification = $this->route('verification');

        return $verification instanceof VerificationRecord
            && ($this->user()?->can('reject', $verification) ?? false);
    }

    public function rules(): array
    {
        return [
            'notes' => ['required', 'string', 'min:5', 'max:2000'],
        ];
    }
}

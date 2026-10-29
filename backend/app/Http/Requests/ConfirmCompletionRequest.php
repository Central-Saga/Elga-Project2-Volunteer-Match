<?php

namespace App\Http\Requests;

use App\Models\Application;
use Illuminate\Foundation\Http\FormRequest;

class ConfirmCompletionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $application = $this->route('application');

        return $application instanceof Application
            && ($this->user()?->can('confirmCompletion', $application) ?? false);
    }

    public function rules(): array
    {
        return [
            'total_hours' => ['required', 'numeric', 'min:0.5', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

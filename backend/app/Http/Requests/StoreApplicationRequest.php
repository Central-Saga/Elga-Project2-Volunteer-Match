<?php

namespace App\Http\Requests;

use App\Models\Application;
use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;

class StoreApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $project = $this->route('project');

        return $project instanceof Project
            && ($this->user()?->can('create', [Application::class, $project]) ?? false);
    }

    public function rules(): array
    {
        return [
            'motivation' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

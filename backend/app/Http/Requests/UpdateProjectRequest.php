<?php

namespace App\Http\Requests;

use App\Models\Project;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        $project = $this->route('project');

        return $project instanceof Project
            && ($this->user()?->can('update', $project) ?? false);
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'required', 'string'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'start_at' => ['sometimes', 'required', 'date'],
            'end_at' => ['sometimes', 'required', 'date'],
            'capacity' => ['sometimes', 'required', 'integer', 'min:1'],
            'required_skills' => ['sometimes', 'nullable', 'array'],
            'required_skills.*' => ['string', 'max:100'],
            'required_interests' => ['sometimes', 'nullable', 'array'],
            'required_interests.*' => ['string', 'max:100'],
            'risk_level' => ['sometimes', 'required', 'in:low,medium,high'],
        ];
    }

    /** Keep the schedule valid even when PATCH changes only one timestamp. */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $project = $this->route('project');
                if (! $project instanceof Project) {
                    return;
                }

                $start = $this->input('start_at', $project->start_at);
                $end = $this->input('end_at', $project->end_at);

                if (Carbon::parse($end)->lessThanOrEqualTo(Carbon::parse($start))) {
                    $validator->errors()->add(
                        'end_at',
                        'The end at field must be a date after start at.'
                    );
                }
            },
        ];
    }
}

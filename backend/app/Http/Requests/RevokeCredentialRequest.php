<?php

namespace App\Http\Requests;

use App\Models\Credential;
use Illuminate\Foundation\Http\FormRequest;

class RevokeCredentialRequest extends FormRequest
{
    public function authorize(): bool
    {
        $credential = $this->route('credential');

        return $credential instanceof Credential
            && ($this->user()?->can('revoke', $credential) ?? false);
    }

    public function rules(): array
    {
        return [
            'revocation_reason' => ['required', 'string', 'min:5', 'max:2000'],
        ];
    }
}

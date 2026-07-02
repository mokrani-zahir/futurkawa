<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateZoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'         => ['sometimes', 'string', 'max:255'],
            'api_url'      => ['sometimes', 'url', 'max:500'],
            'api_username' => ['sometimes', 'string', 'max:255'],
            'api_password' => ['sometimes', 'string'],
        ];
    }
}

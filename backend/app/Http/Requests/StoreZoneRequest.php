<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreZoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // authorization handled by policy in controller
    }

    public function rules(): array
    {
        return [
            'name'         => ['required', 'string', 'max:255'],
            'api_url'      => ['required', 'url', 'max:500'],
            'api_username' => ['required', 'string', 'max:255'],
            'api_password' => ['required', 'string'],
        ];
    }
}

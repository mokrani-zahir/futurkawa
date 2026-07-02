<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'zone_id'               => ['required', 'uuid', 'exists:zones,id'],
            'name'                  => ['required', 'string', 'max:255'],
            'storage_start_date'    => ['required', 'date'],
            'storage_duration_days' => ['required', 'integer', 'min:1'],
            'sensors'               => ['sometimes', 'array'],
            'sensors.*'             => ['string', 'max:255'],
        ];
    }
}

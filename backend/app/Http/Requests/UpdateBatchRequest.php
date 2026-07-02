<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                  => ['sometimes', 'string', 'max:255'],
            'storage_start_date'    => ['sometimes', 'date'],
            'storage_duration_days' => ['sometimes', 'integer', 'min:1'],
            'sensors'               => ['sometimes', 'array'],
            'sensors.*'             => ['string', 'max:255'],
        ];
    }
}

<?php

namespace App\Http\Requests\Policies;

use Illuminate\Foundation\Http\FormRequest;

class ProgressivePolicyStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $rules = [
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'underwriter_id' => ['required', 'integer', 'exists:underwriters,id'],
            'policy_type' => ['required', 'string', 'in:motor,medical,wiba'],
            'policy_number' => ['nullable', 'string', 'max:50'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'premium_amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:3'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'members' => ['nullable', 'array'],
            'members.*.name' => ['required_with:members', 'string', 'max:255'],
            'members.*.identifier' => ['nullable', 'string', 'max:100'],
            'members.*.relationship' => ['required_with:members', 'string', 'max:50'],
            'members.*.phone' => ['nullable', 'string', 'max:50'],
            'members.*.id_number' => ['nullable', 'string', 'max:50'],
            'members.*.payroll_number' => ['nullable', 'string', 'max:50'],
            'members.*.annual_salary' => ['nullable', 'numeric', 'min:0'],
            'medical_benefits' => ['nullable', 'array'],
            'medical_benefits.*' => ['string', 'in:inpatient,outpatient,optical,maternity'],
        ];

        if ($this->input('policy_type') === 'medical') {
            $rules['medical_category'] = [
                'nullable',
                'string',
                'in:A,B,C,D',
                'required_if:client_type,corporate',
            ];
        }

        if ($this->input('policy_type') === 'motor') {
            $rules['vehicle_use'] = ['required', 'string', 'in:private,commercial'];
            $rules['cover_type'] = ['required', 'string', 'in:third_party,comprehensive'];

            if ($this->input('vehicle_use') === 'private') {
                $rules['private_use_class'] = ['required', 'string', 'in:hire,chauffeur,taxi_hire,taxi_self_drive'];
            }

            if ($this->input('vehicle_use') === 'commercial') {
                $rules['commercial_class'] = ['required', 'string', 'in:matatu,bus,truck,taxi,other'];
            }

            if ($this->input('cover_type') === 'comprehensive') {
                $rules['capacity'] = ['required', 'numeric', 'min:0.01'];
                $rules['capacity_unit'] = ['nullable', 'string', 'in:cc'];
            }

            $rules['vehicle_model'] = ['required', 'string', 'max:255'];
            $rules['vehicle_color'] = ['required', 'string', 'max:50'];
            $rules['chassis_number'] = ['required', 'string', 'max:100'];
            $rules['engine_number'] = ['required', 'string', 'max:100'];
            $rules['carriage_capacity'] = ['required', 'numeric', 'min:0.01'];
            $rules['engine_size'] = ['required', 'string', 'max:50'];
        }

        if (
            $this->input('client_type') === 'corporate'
            && in_array($this->input('policy_type'), ['medical', 'wiba'], true)
        ) {
            $rules['members'] = ['required', 'array', 'min:1'];
            $rules['members.*.id_number'] = ['required', 'string', 'max:50'];
            $rules['members.*.payroll_number'] = ['required', 'string', 'max:50'];
            $rules['members.*.annual_salary'] = ['required', 'numeric', 'min:0'];
            $rules['members.*.phone'] = ['required', 'string', 'max:50'];
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'client_id.required' => 'Client is required.',
            'underwriter_id.required' => 'Underwriter is required.',
            'policy_type.required' => 'Policy type is required.',
            'start_date.required' => 'Start date is required.',
            'end_date.required' => 'End date is required.',
            'end_date.after' => 'End date must be after start date.',
            'premium_amount.required' => 'Premium amount is required.',
            'vehicle_use.required' => 'Vehicle use is required for motor policies.',
            'cover_type.required' => 'Cover type is required for motor policies.',
            'private_use_class.required' => 'Private use class is required for private vehicles.',
            'commercial_class.required' => 'Commercial class is required for commercial vehicles.',
            'capacity.required' => 'Capacity is required for comprehensive cover.',
            'vehicle_model.required' => 'Vehicle model is required for motor policies.',
            'vehicle_color.required' => 'Vehicle color is required for motor policies.',
            'chassis_number.required' => 'Chassis number is required for motor policies.',
            'engine_number.required' => 'Engine number is required for motor policies.',
            'carriage_capacity.required' => 'Carriage capacity is required for motor policies.',
            'engine_size.required' => 'Engine size is required for motor policies.',
            'medical_category.required_if' => 'Medical category is required for corporate medical policies.',
            'members.*.phone.required' => 'Phone is required for corporate members.',
        ];
    }
}

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
            'insurer_id' => ['required', 'integer', 'exists:insurers,id'],
            'underwriter_id' => ['required', 'integer', 'exists:underwriters,id'],
            'binder_version_id' => ['nullable', 'integer', 'exists:binder_versions,id'],
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
        ];

        if ($this->input('policy_type') === 'medical') {
            $rules['medical_category'] = [
                'nullable',
                'string',
                'in:A,B,C,D,E,F',
                'required_if:client_type,corporate',
            ];
            $rules['outpatient_benefit'] = ['nullable', 'boolean'];
            $rules['outpatient_amount'] = ['nullable', 'numeric', 'min:0', 'required_if:outpatient_benefit,true'];
            $rules['inpatient_benefit'] = ['nullable', 'boolean'];
            $rules['inpatient_amount'] = ['nullable', 'numeric', 'min:0', 'required_if:inpatient_benefit,true'];
            $rules['optical_benefit'] = ['nullable', 'boolean'];
            $rules['optical_amount'] = ['nullable', 'numeric', 'min:0', 'required_if:optical_benefit,true'];
            $rules['maternity_benefit'] = ['nullable', 'boolean'];
            $rules['maternity_amount'] = ['nullable', 'numeric', 'min:0', 'required_if:maternity_benefit,true'];
        }

        if ($this->input('policy_type') === 'motor') {
            $rules['vehicle_use'] = ['required', 'string', 'in:private,commercial'];
            $rules['cover_type'] = ['required', 'string', 'in:third_party,comprehensive'];
            $rules['cover_plan'] = ['nullable', 'string', 'max:100'];
            $rules['cover_addons'] = ['nullable', 'array'];
            $rules['cover_addons.*'] = ['string', 'in:comprehensive,excess,pvt'];

            if ($this->input('vehicle_use') === 'private' && $this->input('cover_type') === 'third_party') {
                $rules['cover_plan'] = ['required', 'string', 'in:third_party_only,third_party_and_fire'];
            }

            if ($this->input('vehicle_use') === 'private' && $this->input('cover_type') === 'comprehensive') {
                $rules['cover_addons'] = ['required', 'array', 'min:1'];
                $rules['capacity'] = ['nullable', 'numeric', 'min:0.01'];
                $rules['capacity_unit'] = ['nullable', 'string', 'in:cc'];
            }

            if ($this->input('vehicle_use') === 'commercial' && $this->input('cover_type') === 'third_party') {
                $rules['cover_plan'] = ['required', 'string', 'in:third_party_psv,third_party_matatu,third_party_general_cartag,third_party_own_goods,third_party_bus,third_party_heavy_trucks,third_party_school_bus,third_party_ambulance'];
            }

            if ($this->input('vehicle_use') === 'commercial' && $this->input('cover_type') === 'comprehensive') {
                $rules['cover_plan'] = ['required', 'string', 'in:comprehensive_psv,comprehensive_matatu,comprehensive_general_cartag,comprehensive_own_goods,comprehensive_bus,comprehensive_heavy_trucks,comprehensive_school_bus,comprehensive_ambulance'];
                $rules['capacity'] = ['nullable', 'numeric', 'min:0.01'];
                $rules['capacity_unit'] = ['nullable', 'string', 'in:cc'];
            }

            $rules['registration_number'] = ['required', 'string', 'max:50'];
            $rules['vehicle_value'] = ['required', 'numeric', 'min:0'];
            $rules['vehicle_model'] = ['nullable', 'string', 'max:255'];
            $rules['vehicle_make'] = ['nullable', 'string', 'max:100'];
            $rules['year_of_manufacture'] = ['nullable', 'integer', 'min:1999', 'max:'.now()->year];
            $rules['vehicle_color'] = ['required', 'string', 'max:50'];
            $rules['chassis_number'] = ['required', 'string', 'max:100'];
            $rules['engine_number'] = ['nullable', 'string', 'max:100'];
            $rules['carriage_capacity'] = ['nullable', 'numeric', 'min:0.01'];
            $rules['engine_size'] = ['nullable', 'string', 'max:50'];
            $rules['insurer_policy_number'] = ['nullable', 'string', 'max:80'];
            $rules['internal_policy_number'] = ['nullable', 'string', 'max:80'];
            $rules['customer_id'] = ['nullable', 'string', 'max:80'];
            $rules['mobile_number'] = ['nullable', 'string', 'max:50'];
            $rules['telephone_other'] = ['nullable', 'string', 'max:50'];
            $rules['postal_code'] = ['nullable', 'string', 'max:20'];
            $rules['country'] = ['nullable', 'string', 'max:80'];
            $rules['bank_account_number'] = ['nullable', 'string', 'max:80'];
            $rules['branch_code'] = ['nullable', 'string', 'max:50'];
            $rules['pin_number'] = ['nullable', 'string', 'max:50'];
            $rules['time_on_risk_start_date'] = ['nullable', 'date'];
            $rules['time_on_risk_end_date'] = ['nullable', 'date', 'after_or_equal:time_on_risk_start_date'];
            $rules['passenger_count'] = ['nullable', 'integer', 'min:1'];
            $rules['logbook_status'] = ['nullable', 'string', 'max:50'];
            $rules['accessories_value'] = ['nullable', 'numeric', 'min:0'];
            $rules['windscreen_value'] = ['nullable', 'numeric', 'min:0'];
            $rules['radio_value'] = ['nullable', 'numeric', 'min:0'];
            $rules['limits_liability'] = ['nullable', 'array'];
            $rules['limits_liability.*.description'] = ['required_with:limits_liability', 'string', 'max:255'];
            $rules['limits_liability.*.limit'] = ['nullable', 'string', 'max:255'];
            $rules['limits_liability.*.excess'] = ['nullable', 'string', 'max:255'];
            $rules['excess_rules'] = ['nullable', 'array'];
            $rules['applicable_clauses'] = ['nullable', 'array'];
            $rules['applicable_clauses.*'] = ['string', 'max:500'];
            $rules['exclusions'] = ['nullable', 'array'];
            $rules['exclusions.*'] = ['string', 'max:500'];
            $rules['time_on_risk_premium'] = ['nullable', 'numeric', 'min:0'];
            $rules['policyholders_fund'] = ['nullable', 'numeric', 'min:0'];
            $rules['training_levy'] = ['nullable', 'numeric', 'min:0'];
            $rules['first_premium_total'] = ['nullable', 'numeric', 'min:0'];
            $rules['time_on_risk_total_premium'] = ['nullable', 'numeric', 'min:0'];
            $rules['payment_method'] = ['nullable', 'string', 'max:50'];
            $rules['issuing_officer_name'] = ['nullable', 'string', 'max:255'];
            $rules['verifying_officer_name'] = ['nullable', 'string', 'max:255'];
            $rules['issued_on'] = ['nullable', 'date'];
            $rules['payment_plan_type'] = ['nullable', 'string', 'in:one_time,installments'];
            $rules['installment_count'] = ['nullable', 'integer', 'min:2', 'max:10', 'required_if:payment_plan_type,installments'];
            $rules['installment_amount'] = ['nullable', 'numeric', 'min:0'];
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

        if (
            $this->input('client_type') === 'corporate'
            && $this->input('policy_type') === 'medical'
        ) {
            $rules['members.*.relationship'] = ['required', 'string', 'in:Employee'];
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
            'cover_plan.required' => 'Please select a cover plan for this motor policy.',
            'cover_addons.required' => 'Please select at least one comprehensive option.',
            'registration_number.required' => 'Car registration number is required for motor policies.',
            'vehicle_value.required' => 'Vehicle value is required for motor policies.',
            'vehicle_color.required' => 'Vehicle color is required for motor policies.',
            'chassis_number.required' => 'Chassis number is required for motor policies.',
            'medical_category.required_if' => 'Medical category is required for corporate medical policies.',
            'members.*.phone.required' => 'Phone is required for corporate members.',
        ];
    }
}

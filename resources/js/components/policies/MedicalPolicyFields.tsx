import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

type Props = {
    register: any;
    errors: any;
    watch: any;
};

export default function MedicalPolicyFields({ register, errors, watch }: Props) {
    const outpatientBenefit = watch('outpatient_benefit');
    const inpatientBenefit = watch('inpatient_benefit');
    const opticalBenefit = watch('optical_benefit');
    const maternityBenefit = watch('maternity_benefit');

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="medical_category">Medical Category</Label>
                <Select
                    {...register('medical_category')}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select medical category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="A">Category A</SelectItem>
                        <SelectItem value="B">Category B</SelectItem>
                        <SelectItem value="C">Category C</SelectItem>
                        <SelectItem value="D">Category D</SelectItem>
                        <SelectItem value="E">Category E</SelectItem>
                        <SelectItem value="F">Category F</SelectItem>
                    </SelectContent>
                </Select>
                <InputError message={errors.medical_category?.message} />
            </div>

            <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Medical Benefits</h4>
                <div className="space-y-3">
                    {/* Outpatient Benefit */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="outpatient_benefit"
                            {...register('outpatient_benefit')}
                        />
                        <Label htmlFor="outpatient_benefit" className="cursor-pointer">
                            Outpatient Benefit
                        </Label>
                    </div>
                    {outpatientBenefit && (
                        <div className="ml-6">
                            <Label htmlFor="outpatient_amount">Outpatient Amount</Label>
                            <Input
                                id="outpatient_amount"
                                type="number"
                                step="0.01"
                                placeholder="Enter amount"
                                {...register('outpatient_amount')}
                            />
                            <InputError message={errors.outpatient_amount?.message} />
                        </div>
                    )}

                    {/* Inpatient Benefit */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="inpatient_benefit"
                            {...register('inpatient_benefit')}
                        />
                        <Label htmlFor="inpatient_benefit" className="cursor-pointer">
                            Inpatient Benefit
                        </Label>
                    </div>
                    {inpatientBenefit && (
                        <div className="ml-6">
                            <Label htmlFor="inpatient_amount">Inpatient Amount</Label>
                            <Input
                                id="inpatient_amount"
                                type="number"
                                step="0.01"
                                placeholder="Enter amount"
                                {...register('inpatient_amount')}
                            />
                            <InputError message={errors.inpatient_amount?.message} />
                        </div>
                    )}

                    {/* Optical Benefit */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="optical_benefit"
                            {...register('optical_benefit')}
                        />
                        <Label htmlFor="optical_benefit" className="cursor-pointer">
                            Optical Benefit
                        </Label>
                    </div>
                    {opticalBenefit && (
                        <div className="ml-6">
                            <Label htmlFor="optical_amount">Optical Amount</Label>
                            <Input
                                id="optical_amount"
                                type="number"
                                step="0.01"
                                placeholder="Enter amount"
                                {...register('optical_amount')}
                            />
                            <InputError message={errors.optical_amount?.message} />
                        </div>
                    )}

                    {/* Maternity Benefit */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="maternity_benefit"
                            {...register('maternity_benefit')}
                        />
                        <Label htmlFor="maternity_benefit" className="cursor-pointer">
                            Maternity Benefit
                        </Label>
                    </div>
                    {maternityBenefit && (
                        <div className="ml-6">
                            <Label htmlFor="maternity_amount">Maternity Amount</Label>
                            <Input
                                id="maternity_amount"
                                type="number"
                                step="0.01"
                                placeholder="Enter amount"
                                {...register('maternity_amount')}
                            />
                            <InputError message={errors.maternity_amount?.message} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

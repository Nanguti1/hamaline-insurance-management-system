import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Props = {
    register: any;
    errors: any;
};

export default function MedicalPolicyFields({ register, errors }: Props) {
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
                    </SelectContent>
                </Select>
                <InputError message={errors.medical_category?.message} />
            </div>
        </div>
    );
}

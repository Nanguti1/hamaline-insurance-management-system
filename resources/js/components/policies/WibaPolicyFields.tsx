import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type Props = {
    register: any;
    errors: any;
};

export default function WibaPolicyFields({ register, errors }: Props) {
    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="wiba_notes">WIBA Policy Notes</Label>
                <Textarea
                    id="wiba_notes"
                    rows={3}
                    placeholder="Enter WIBA-specific policy details..."
                    {...register('notes')}
                />
                {/* Note: Using the same 'notes' field from base schema */}
            </div>
        </div>
    );
}

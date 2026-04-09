import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Props = {
    register: any;
    errors: any;
    watchedVehicleUse?: string;
    watchedCoverType?: string;
};

export default function MotorPolicyFields({ register, errors, watchedVehicleUse, watchedCoverType }: Props) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <Label htmlFor="vehicle_use">Vehicle Use</Label>
                    <Select
                        {...register('vehicle_use')}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select vehicle use" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.vehicle_use?.message} />
                </div>

                <div>
                    <Label htmlFor="cover_type">Cover Type</Label>
                    <Select
                        {...register('cover_type')}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select cover type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="third_party">Third Party</SelectItem>
                            <SelectItem value="comprehensive">Comprehensive</SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.cover_type?.message} />
                </div>
            </div>

            {/* Conditional fields based on vehicle use */}
            {watchedVehicleUse === 'commercial' && (
                <div>
                    <Label htmlFor="commercial_class">Commercial Class</Label>
                    <Select
                        {...register('commercial_class')}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select commercial class" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="matatu">Matatu</SelectItem>
                            <SelectItem value="bus">Bus</SelectItem>
                            <SelectItem value="truck">Truck</SelectItem>
                            <SelectItem value="taxi">Taxi</SelectItem>
                            <SelectItem value="van">Van</SelectItem>
                            <SelectItem value="lorry">Lorry</SelectItem>
                            <SelectItem value="trailer">Trailer</SelectItem>
                            <SelectItem value="motorcycle">Motorcycle</SelectItem>
                            <SelectItem value="bodaboda">Bodaboda</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.commercial_class?.message} />
                </div>
            )}

            {watchedVehicleUse === 'private' && (
                <div>
                    <Label htmlFor="private_use_class">Private Use Class</Label>
                    <Select
                        {...register('private_use_class')}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select private use class" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="hire">Hire</SelectItem>
                            <SelectItem value="chauffeur">Chauffeur</SelectItem>
                            <SelectItem value="taxi_hire">Taxi Hire</SelectItem>
                            <SelectItem value="taxi_self_drive">Taxi Self Drive</SelectItem>
                            <SelectItem value="private_pleasure">Private Pleasure</SelectItem>
                            <SelectItem value="school_transport">School Transport</SelectItem>
                            <SelectItem value="courier">Courier</SelectItem>
                            <SelectItem value="delivery">Delivery</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.private_use_class?.message} />
                </div>
            )}

            {/* Capacity field for comprehensive cover */}
            {watchedCoverType === 'comprehensive' && (
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input
                            id="capacity"
                            type="number"
                            step="0.01"
                            placeholder="Enter capacity"
                            {...register('capacity')}
                        />
                        <InputError message={errors.capacity?.message} />
                    </div>
                    <div>
                        <Label htmlFor="capacity_unit">Unit</Label>
                        <Select
                            {...register('capacity_unit')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cc">CC (Cubic Centimeters)</SelectItem>
                                <SelectItem value="tons">Tons</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.capacity_unit?.message} />
                    </div>
                </div>
            )}
        </div>
    );
}

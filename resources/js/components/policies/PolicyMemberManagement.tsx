import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Member = {
    id: number;
    name: string;
    identifier?: string;
    id_number?: string;
    payroll_number?: string;
    annual_salary?: number;
    relationship: string;
    phone?: string;
};

type Props = {
    members: Member[];
    onMembersChange: (members: Member[]) => void;
    policyType: 'medical' | 'wiba';
    clientType: 'individual' | 'corporate';
};

export default function PolicyMemberManagement({ members, onMembersChange, policyType, clientType }: Props) {
    const isCorporate = clientType === 'corporate';
    const isCorporateMedical = isCorporate && policyType === 'medical';
    const createBlankMember = (): Member => ({
        id: Date.now() + Math.floor(Math.random() * 100000),
        name: '',
        identifier: '',
        id_number: '',
        payroll_number: '',
        annual_salary: undefined,
        relationship: isCorporateMedical ? 'Employee' : '',
        phone: '',
    });
    const [newMember, setNewMember] = useState<Member>(createBlankMember);

    const addMember = () => {
        const missingCorporate = isCorporate
            && (!newMember.id_number || !newMember.payroll_number || !newMember.phone || newMember.annual_salary === undefined);
        const missingBasic = !newMember.name || !newMember.relationship || (!isCorporate && (!newMember.identifier || !newMember.phone));
        if (missingBasic || missingCorporate) {
            alert(isCorporate
                ? 'Please fill name, relationship, ID, payroll number, phone and annual salary.'
                : 'Please fill name, identifier, relationship and phone.');
            return;
        }

        onMembersChange([...members, newMember]);
        setNewMember(createBlankMember());
    };

    const removeMember = (index: number) => {
        onMembersChange(members.filter((_, i) => i !== index));
    };

    const updateMember = (index: number, field: keyof Member, value: any) => {
        const updatedMembers = [...members];
        updatedMembers[index] = { ...updatedMembers[index], [field]: value };
        onMembersChange(updatedMembers);
    };

    const relationshipOptions = isCorporate
        ? (isCorporateMedical ? ['Employee'] : ['Employee', 'Spouse', 'Child', 'Other'])
        : (policyType === 'medical' ? ['Principal', 'Spouse', 'Child', 'Parent', 'Other'] : ['Employee', 'Other']);

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {policyType === 'medical' ? 'Medical Members' : 'WIBA Employees'}
                </CardTitle>
                <p className="text-sm text-gray-600">
                    {isCorporate
                        ? `Add employees covered under this ${policyType.toUpperCase()} policy`
                        : `Add ${policyType === 'medical' ? 'members' : 'employees'} covered under this policy`}
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium mb-3">Add New {policyType === 'medical' ? 'Member' : 'Employee'}</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label htmlFor="new-name">Name *</Label>
                            <Input
                                id="new-name"
                                value={newMember.name}
                                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                placeholder="Full name"
                            />
                        </div>
                        {isCorporate ? (
                            <>
                                <div>
                                    <Label htmlFor="new-id-number">ID Number *</Label>
                                    <Input
                                        id="new-id-number"
                                        value={newMember.id_number}
                                        onChange={(e) => setNewMember({ ...newMember, id_number: e.target.value })}
                                        placeholder="National ID number"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="new-payroll-number">Payroll Number *</Label>
                                    <Input
                                        id="new-payroll-number"
                                        value={newMember.payroll_number}
                                        onChange={(e) => setNewMember({ ...newMember, payroll_number: e.target.value })}
                                        placeholder="Payroll number"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="new-annual-salary">Annual Salary *</Label>
                                    <Input
                                        id="new-annual-salary"
                                        type="number"
                                        step="0.01"
                                        value={newMember.annual_salary ?? ''}
                                        onChange={(e) => setNewMember({ ...newMember, annual_salary: e.target.value ? Number(e.target.value) : undefined })}
                                        placeholder="Annual salary"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="new-phone">Phone *</Label>
                                    <Input
                                        id="new-phone"
                                        value={newMember.phone}
                                        onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                                        placeholder="Phone number"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <Label htmlFor="new-identifier">Identifier *</Label>
                                    <Input
                                        id="new-identifier"
                                        value={newMember.identifier}
                                        onChange={(e) => setNewMember({ ...newMember, identifier: e.target.value })}
                                        placeholder={policyType === 'medical' ? 'ID or member number' : 'Payroll or ID number'}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="new-phone">Phone *</Label>
                                    <Input
                                        id="new-phone"
                                        value={newMember.phone}
                                        onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                                        placeholder="Phone number"
                                    />
                                </div>
                            </>
                        )}
                        <div>
                            <Label htmlFor="new-relationship">Relationship</Label>
                            <Select
                                value={newMember.relationship || ''}
                                onValueChange={(value) => setNewMember({ ...newMember, relationship: value })}
                                disabled={isCorporateMedical}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select relationship" />
                                </SelectTrigger>
                                <SelectContent>
                                    {relationshipOptions.map((rel) => (
                                        <SelectItem key={rel} value={rel}>
                                            {rel}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end mt-3">
                        <Button type="button" onClick={addMember}>
                            + Add {policyType === 'medical' ? 'Member' : 'Employee'}
                        </Button>
                    </div>
                </div>

                {members.length > 0 && (
                    <div>
                        <h4 className="font-medium mb-3">
                            {policyType === 'medical' ? 'Members' : 'Employees'} ({members.length})
                        </h4>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    {isCorporate ? (
                                        <>
                                            <TableHead>ID Number</TableHead>
                                            <TableHead>Payroll Number</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Annual Salary</TableHead>
                                        </>
                                    ) : (
                                        <>
                                            <TableHead>Identifier</TableHead>
                                            <TableHead>Phone</TableHead>
                                        </>
                                    )}
                                    <TableHead>Relationship</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((member, index) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <Input
                                                value={member.name}
                                                onChange={(e) => updateMember(index, 'name', e.target.value)}
                                                className="w-full"
                                            />
                                        </TableCell>
                                        {isCorporate ? (
                                            <>
                                                <TableCell>
                                                    <Input
                                                        value={member.id_number ?? ''}
                                                        onChange={(e) => updateMember(index, 'id_number', e.target.value)}
                                                        className="w-full"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={member.payroll_number ?? ''}
                                                        onChange={(e) => updateMember(index, 'payroll_number', e.target.value)}
                                                        className="w-full"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={member.phone ?? ''}
                                                        onChange={(e) => updateMember(index, 'phone', e.target.value)}
                                                        className="w-full"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={member.annual_salary ?? ''}
                                                        onChange={(e) => updateMember(index, 'annual_salary', e.target.value ? Number(e.target.value) : undefined)}
                                                        className="w-full"
                                                    />
                                                </TableCell>
                                            </>
                                        ) : (
                                            <>
                                                <TableCell>
                                                    <Input
                                                        value={member.identifier ?? ''}
                                                        onChange={(e) => updateMember(index, 'identifier', e.target.value)}
                                                        className="w-full"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={member.phone ?? ''}
                                                        onChange={(e) => updateMember(index, 'phone', e.target.value)}
                                                        className="w-full"
                                                    />
                                                </TableCell>
                                            </>
                                        )}
                                        <TableCell>
                                            <Select
                                                value={member.relationship}
                                                onValueChange={(value) => updateMember(index, 'relationship', value)}
                                                disabled={isCorporateMedical}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {relationshipOptions.map((rel) => (
                                                        <SelectItem key={rel} value={rel}>
                                                            {rel}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => removeMember(index)}
                                            >
                                                Remove
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

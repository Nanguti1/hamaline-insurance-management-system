import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type MedicalCategory = {
    id: number;
    category_code: string;
    category_name: string;
    description?: string;
    is_active: boolean;
};

type Props = {
    clientId: number;
};

export default function ClientMedicalCategoryManager({ clientId }: Props) {
    const [categories, setCategories] = useState<MedicalCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<MedicalCategory | null>(null);
    
    const [formData, setFormData] = useState({
        category_code: '',
        category_name: '',
        description: '',
        is_active: true,
    });

    const loadCategories = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/clients/${clientId}/medical-categories`);
            const data = await response.json();
            setCategories(data.data || []);
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, [clientId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const url = editingCategory 
                ? `/clients/${clientId}/medical-categories/${editingCategory.id}`
                : `/clients/${clientId}/medical-categories`;
            
            const method = editingCategory ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                await loadCategories();
                setShowAddForm(false);
                setEditingCategory(null);
                setFormData({ category_code: '', category_name: '', description: '', is_active: true });
            }
        } catch (error) {
            console.error('Failed to save category:', error);
        }
    };

    const handleEdit = (category: MedicalCategory) => {
        setEditingCategory(category);
        setFormData({
            category_code: category.category_code,
            category_name: category.category_name,
            description: category.description || '',
            is_active: category.is_active,
        });
        setShowAddForm(true);
    };

    const handleDelete = async (category: MedicalCategory) => {
        if (!confirm(`Are you sure you want to delete ${category.category_name}?`)) return;
        
        try {
            const response = await fetch(`/clients/${clientId}/medical-categories/${category.id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                await loadCategories();
            }
        } catch (error) {
            console.error('Failed to delete category:', error);
        }
    };

    const handleCancel = () => {
        setShowAddForm(false);
        setEditingCategory(null);
        setFormData({ category_code: '', category_name: '', description: '', is_active: true });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Medical Categories</CardTitle>
                    {!showAddForm && (
                        <Button onClick={() => setShowAddForm(true)}>
                            + Add Category
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {showAddForm && (
                    <form onSubmit={handleSubmit} className="mb-6 border rounded-lg p-4 space-y-4">
                        <h4 className="font-medium">
                            {editingCategory ? 'Edit Category' : 'Add New Category'}
                        </h4>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="category_code">Category Code</Label>
                                <Select
                                    value={formData.category_code}
                                    onValueChange={(value) => setFormData({ ...formData, category_code: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select code" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="A">A</SelectItem>
                                        <SelectItem value="B">B</SelectItem>
                                        <SelectItem value="C">C</SelectItem>
                                        <SelectItem value="D">D</SelectItem>
                                        <SelectItem value="E">E</SelectItem>
                                        <SelectItem value="F">F</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="category_name">Category Name</Label>
                                <Input
                                    id="category_name"
                                    value={formData.category_name}
                                    onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                                    placeholder="e.g., Executive Package"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Category description..."
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="rounded border-gray-300"
                            />
                            <Label htmlFor="is_active" className="cursor-pointer">
                                Active
                            </Label>
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit">
                                {editingCategory ? 'Update' : 'Add'} Category
                            </Button>
                            <Button type="button" variant="outline" onClick={handleCancel}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}

                {loading ? (
                    <div className="text-center py-4">Loading...</div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                        No medical categories configured for this client
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">{category.category_code}</TableCell>
                                    <TableCell>{category.category_name}</TableCell>
                                    <TableCell>{category.description || '-'}</TableCell>
                                    <TableCell>
                                        {category.is_active ? (
                                            <span className="text-green-600">Active</span>
                                        ) : (
                                            <span className="text-gray-400">Inactive</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(category)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(category)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

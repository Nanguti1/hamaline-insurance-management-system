import { useState, useEffect, useCallback } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Client = { 
    id: number; 
    name: string; 
    company_name?: string; 
    type: string; 
    phone: string; 
    email: string;
    documents?: Array<{ document_type: string; filename: string; }>;
    medical_categories?: Array<{ category_code: string; category_name: string; category_identifier: string; }>;
};

type Props = {
    onClientSelect: (client: Client) => void;
};

export default function ClientSelector({ onClientSelect }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const searchClients = useCallback(async (query: string) => {
        if (query.length < 2) {
            setClients([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/clients/search?q=${encodeURIComponent(query)}&page=${page}`);
            const data = await response.json();
            setClients(data.data || []);
            setLastPage(data.meta?.last_page ?? 1);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    }, [page]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchClients(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, searchClients]);

    useEffect(() => {
        setPage(1);
    }, [searchQuery]);

    const handleClientSelect = async (client: Client) => {
        // Load medical categories for corporate clients
        if (client.type === 'corporate') {
            try {
                const response = await fetch(`/clients/${client.id}/medical-categories`);
                const data = await response.json();
                client.medical_categories = data.data || [];
            } catch (error) {
                console.error('Failed to load medical categories:', error);
                client.medical_categories = [];
            }
        }
        
        setSelectedClient(client);
        onClientSelect(client);
    };

    const clearSelection = () => {
        setSelectedClient(null);
        setSearchQuery('');
        setClients([]);
        setPage(1);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Select Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Search Input */}
                <div>
                    <Label htmlFor="client-search">Search Client</Label>
                    <div className="relative">
                        <Input
                            id="client-search"
                            type="text"
                            placeholder="Search by name, company, phone, email, ID/registration..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-10"
                        />
                        {loading && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search Results */}
                {clients.length > 0 && !selectedClient && (
                    <div className="border rounded-lg max-h-60 overflow-y-auto">
                        {clients.map((client) => (
                            <div
                                key={client.id}
                                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                onClick={() => handleClientSelect(client)}
                            >
                                <div className="font-medium">
                                    {client.type === 'individual' ? client.name : client.company_name}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {client.type === 'individual' ? 'Individual' : 'Corporate'}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {client.phone} | {client.email}
                                </div>
                                {client.documents && (
                                    <div className="flex gap-2 mt-1">
                                        {client.documents.map((doc) => (
                                            <span key={doc.document_type} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                {doc.document_type === 'national_id' ? 'ID' : 'KRA'}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {clients.length > 0 && !selectedClient && (
                    <div className="flex items-center justify-between text-sm">
                        <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1}>
                            Previous
                        </Button>
                        <span>Page {page} of {lastPage}</span>
                        <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.min(lastPage, prev + 1))} disabled={page >= lastPage}>
                            Next
                        </Button>
                    </div>
                )}

                {/* Selected Client Display */}
                {selectedClient && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-lg">
                                    {selectedClient.type === 'individual' ? selectedClient.name : selectedClient.company_name}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {selectedClient.type === 'individual' ? 'Individual' : 'Corporate'}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {selectedClient.phone} | {selectedClient.email}
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearSelection}
                            >
                                Change Client
                            </Button>
                        </div>
                    </div>
                )}

                {/* No Results */}
                {searchQuery.length >= 2 && clients.length === 0 && !loading && (
                    <div className="text-center py-4 text-gray-500">
                        No clients found matching "{searchQuery}"
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

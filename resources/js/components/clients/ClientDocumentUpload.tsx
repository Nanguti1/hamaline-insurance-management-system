import { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Document = {
    id: number;
    document_type: string;
    filename: string;
    original_filename: string;
    is_required: boolean;
    download_url?: string;
};

type Props = {
    clientId: number;
    documents: Document[];
    onUploadComplete: (document: Document) => void;
    onDeleteComplete: (documentId: number) => void;
};

export default function ClientDocumentUpload({ 
    clientId, 
    documents, 
    onUploadComplete, 
    onDeleteComplete 
}: Props) {
    const [uploading, setUploading] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<number | null>(null);

    const requiredTypes = ['national_id', 'kra_pin'];
    
    const getDocumentStatus = (type: string) => {
        const doc = documents.find(d => d.document_type === type);
        return {
            id: doc?.id,
            uploaded: !!doc,
            filename: doc?.filename || '',
            downloadUrl: doc?.download_url || '',
        };
    };

    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(documentType);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', documentType);

        try {
            const response = await fetch(`/clients/${clientId}/documents/upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                const result = await response.json();
                onUploadComplete(result.document);
            } else {
                console.error('Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setUploading(null);
        }
    }, [clientId, onUploadComplete]);

    const handleDelete = useCallback(async (document: Document) => {
        if (!confirm(`Are you sure you want to delete ${document.original_filename}?`)) return;
        
        setDeleting(document.id);
        
        try {
            const response = await fetch(`/clients/${clientId}/documents/${document.id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                onDeleteComplete(document.id);
            } else {
                console.error('Delete failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
        } finally {
            setDeleting(null);
        }
    }, [clientId, onDeleteComplete]);

    const allRequiredUploaded = requiredTypes.every(type => 
        documents.some(doc => doc.document_type === type)
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Required Documents</CardTitle>
                <p className="text-sm text-gray-600">
                    Upload National ID and KRA PIN documents to complete client setup
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                {requiredTypes.map((docType) => {
                    const status = getDocumentStatus(docType);
                    const isRequired = true;
                    
                    return (
                        <div key={docType} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base font-medium">
                                        {docType === 'national_id' ? 'National ID Document' : 'KRA PIN Document'}
                                    </Label>
                                    {isRequired && (
                                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                            Required
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    {status.uploaded ? (
                                        <>
                                            <span className="text-sm text-green-600">✓ Uploaded</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(status.downloadUrl, '_blank')}
                                            >
                                                View
                                            </Button>
                                            {status.id ? (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleDelete(
                                                            documents.find((doc) => doc.id === status.id)!,
                                                        )
                                                    }
                                                    disabled={deleting === status.id}
                                                >
                                                    {deleting === status.id ? 'Deleting...' : 'Delete'}
                                                </Button>
                                            ) : null}
                                        </>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => handleFileUpload(e, docType)}
                                                disabled={uploading === docType}
                                            />
                                            {uploading === docType && (
                                                <span className="text-sm text-blue-600">Uploading...</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                        {allRequiredUploaded ? (
                            <span className="text-green-600">✓ All required documents uploaded</span>
                        ) : (
                            <span className="text-orange-600">⚠ Some required documents are missing</span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

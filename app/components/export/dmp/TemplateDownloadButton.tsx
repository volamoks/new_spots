'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Download } from 'lucide-react';
import { generateExcelTemplate } from '@/lib/excel-template';

// Define props
interface TemplateDownloadButtonProps {
    uploadType: 'zones' | 'inn' | 'brands';
}

export function TemplateDownloadButton({ uploadType }: TemplateDownloadButtonProps) {
    const { toast } = useToast();

    const downloadTemplate = () => {
        try {
            // Pass the type to the generation function
            const blob = generateExcelTemplate(uploadType);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            // Set filename based on type
            a.download = `template-${uploadType}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error: unknown) {
            console.error('Ошибка скачивания шаблона:', error);
            toast({
                title: 'Ошибка',
                description: 'Не удалось скачать шаблон',
                variant: 'destructive',
            });
        }
    };

    return (
        <Button
            variant="outline"
            onClick={downloadTemplate}
            className="w-full"
        >
            <Download className="mr-2 h-4 w-4" />
            Скачать шаблон Excel
        </Button>
    );
}

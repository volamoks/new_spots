'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Download } from 'lucide-react';
import { generateExcelTemplate } from '@/lib/excel-template';

export function TemplateDownloadButton() {
    const { toast } = useToast();

    const downloadTemplate = () => {
        try {
            const blob = generateExcelTemplate();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'template-zones.xlsx';
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
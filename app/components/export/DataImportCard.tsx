'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { DownloadIcon, UploadIcon } from 'lucide-react';

export function DataImportCard() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [importType, setImportType] = useState<'zones' | 'inn'>('zones');
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast({
                title: 'Ошибка',
                description: 'Выберите файл для загрузки',
                variant: 'destructive',
            });
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', importType);

            const response = await fetch('/api/upload-excel', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                toast({
                    title: 'Успешно',
                    description: `Данные успешно импортированы. Обработано записей: ${result.count}`,
                    variant: 'success',
                });
                setFile(null);
                // Reset the file input
                const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            } else {
                toast({
                    title: 'Ошибка',
                    description: result.error || 'Произошла ошибка при импорте данных',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Ошибка при загрузке файла:', error);
            toast({
                title: 'Ошибка',
                description: 'Произошла ошибка при загрузке файла',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const downloadTemplate = () => {
        // Redirect to the appropriate template download endpoint
        window.location.href = `/api/excel-template?type=${importType}`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Импорт данных</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Тип импорта</Label>
                        <RadioGroup
                            value={importType}
                            onValueChange={(value) => setImportType(value as 'zones' | 'inn')}
                            className="flex flex-col space-y-1"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="zones" id="zones" />
                                <Label htmlFor="zones">Зоны</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="inn" id="inn" />
                                <Label htmlFor="inn">ИНН организаций</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={downloadTemplate}
                        >
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Скачать шаблон Excel
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="file-upload">Выберите файл Excel</Label>
                        <div className="flex items-center space-x-2">
                            <input
                                id="file-upload"
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                onClick={() => document.getElementById('file-upload')?.click()}
                                className="w-full"
                            >
                                {file ? file.name : 'Выбрать файл'}
                            </Button>
                        </div>
                        <p className="text-sm text-gray-500">
                            Поддерживаемые форматы: .xlsx, .xls. Максимальный размер: 10MB
                        </p>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                    >
                        {isUploading ? (
                            'Загрузка...'
                        ) : (
                            <>
                                <UploadIcon className="mr-2 h-4 w-4" />
                                Загрузить данные
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

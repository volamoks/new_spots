'use client';

import type React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // Import RadioGroup
import { Label } from '@/components/ui/label'; // Import Label
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { PreviewTable } from '../../dmp-manager/upload/preview-table';
// import type { ZoneData } from '@/types/zone'; // Ensure this line is commented out or removed
import * as XLSX from 'xlsx';

export function ExcelUploadForm() {
    // Remove props
    const [file, setFile] = useState<File | null>(null);
    // Restore internal state for uploadType
    const [uploadType, setUploadType] = useState<'zones' | 'inn' | 'brands'>('zones');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);
    // Make previewData more generic, though validation/display might need adjustment
    const [previewData, setPreviewData] = useState<Record<string, any>[]>([]);
    const router = useRouter();
    const { toast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFile = e.target.files[0];
            if (selectedFile.name.match(/\.(xlsx|xls)$/)) {
                setFile(selectedFile);
                setErrors([]);

                // Читаем файл для предпросмотра
                const reader = new FileReader();
                reader.onload = async e => {
                    try {
                        const data = new Uint8Array(e.target?.result as ArrayBuffer);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

                        // Clean up headers before converting to JSON
                        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z1');
                        for (let C = range.s.c; C <= range.e.c; ++C) {
                            const address = XLSX.utils.encode_cell({ r: range.s.r, c: C });
                            const cell = worksheet[address];
                            if (cell && cell.v) {
                                cell.v = cell.v
                                    .toString()
                                    .replace(/[\n\r"]/g, '')
                                    .trim();
                            }
                        }

                        // Use generic Record type for preview
                        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
                        setPreviewData(jsonData);
                    } catch (error: unknown) {
                        console.error('Ошибка чтения файла:', error);
                        setErrors(['Ошибка чтения файла. Проверьте формат данных.']);
                        setPreviewData([]);
                    }
                };
                reader.readAsArrayBuffer(selectedFile);
            } else {
                setErrors(['Пожалуйста, загрузите файл Excel (.xlsx или .xls)']);
                setFile(null);
                setPreviewData([]);
            }
        }
    };

    // Update validateData to accept generic data and check based on uploadType
    const validateData = (
        data: Record<string, any>[],
        type: 'zones' | 'inn' | 'brands',
    ): string[] => {
        const errors: string[] = [];
        data.forEach((row, index) => {
            const rowNum = index + 2; // +2 because Excel starts from 1 and we have header row

            // Clean up the column names by removing extra spaces and quotes
            const cleanRow = Object.fromEntries(
                Object.entries(row).map(([key, value]) => [
                    key.replace(/[\n\r"]/g, '').trim(),
                    value,
                ]),
            );

            // Validation based on type
            if (type === 'zones') {
                // Check for required fields using cleaned column names
                if (!cleanRow['Уникальный идентификатор']) {
                    errors.push(`Строка ${rowNum}: Отсутствует уникальный идентификатор`);
                }
                if (!cleanRow['Город']) {
                    errors.push(`Строка ${rowNum}: Отсутствует город`);
                }
                if (!cleanRow['Маркет']) {
                    errors.push(`Строка ${rowNum}: Отсутствует маркет`);
                }
                if (!cleanRow['Основная Макрозона']) {
                    errors.push(`Строка ${rowNum}: Отсутствует основная макрозона`);
                }
                // Note: Status validation was removed here, but present in API. Add back if needed.
                // if (!cleanRow['Статус']) {
                //     errors.push(`Строка ${rowNum}: Отсутствует статус`);
                // }
                // Add back the filter check from API if needed client-side
                // if (!cleanRow["Поставщик"] || !cleanRow["Brand"] || !cleanRow["Категория товара"]) {
                //     errors.push(`Строка ${rowNum}: Отсутствуют Поставщик, Brand или Категория товара (необходимы для типа 'zones')`);
                // }
            } else if (type === 'inn') {
                if (!cleanRow['Поставщик']) {
                    errors.push(`Строка ${rowNum}: Отсутствует название поставщика`);
                }
                if (!cleanRow['Налоговый номер']) {
                    errors.push(`Строка ${rowNum}: Отсутствует ИНН`);
                }
            } else if (type === 'brands') {
                if (!cleanRow['Название Бренда']) {
                    errors.push(`Строка ${rowNum}: Отсутствует Название Бренда`);
                }
                // Optional INN format validation
                // if (cleanRow["ИНН Поставщика"] && !/^\d{10,12}$/.test(String(cleanRow["ИНН Поставщика"]))) {
                //   errors.push(`Строка ${rowNum}: Некорректный формат ИНН Поставщика`)
                // }
            }
        });
        return errors;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!file || previewData.length === 0) {
            setErrors(['Пожалуйста, выберите файл для загрузки']);
            return;
        }

        // Pass uploadType to validateData
        const validationErrors = validateData(previewData, uploadType);
        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        setUploading(true);
        setProgress(0);
        setErrors([]);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', uploadType); // Add upload type to form data

        try {
            // Имитация прогресса загрузки
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 500);

            const response = await fetch('/api/upload-excel', {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);
            setProgress(100);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Произошла ошибка при загрузке');
            }

            toast({
                title: 'Успешно',
                // Adjust success message based on type and API response structure
                description: `Данные (${uploadType}) успешно загружены. Обработано строк: ${
                    data.processedRows ?? data.count ?? 'N/A'
                }. Всего строк в файле: ${data.totalRows ?? 'N/A'}`,
                variant: 'success',
            });

            // Даем время увидеть 100% прогресс
            setTimeout(() => {
                router.push('/dmp-manager');
            }, 1000);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Произошла ошибка при загрузке данных';
            setErrors([errorMessage]);
            toast({
                title: 'Ошибка',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
        }
    };

    console.log('Rendering ExcelUploadForm, current uploadType:', uploadType); // Add console log here
    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6" // Increased spacing
        >
            {/* Add Radio Group for Upload Type */}
            <RadioGroup
                value={uploadType} // Use internal state value
                onValueChange={(value: 'zones' | 'inn' | 'brands') => setUploadType(value)} // Use internal state setter
                className="flex space-x-4"
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem
                        value="zones"
                        id="r-zones"
                    />
                    <Label htmlFor="r-zones">Зоны</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem
                        value="inn"
                        id="r-inn"
                    />
                    <Label htmlFor="r-inn">ИНН Поставщиков</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem
                        value="brands"
                        id="r-brands"
                    />
                    <Label htmlFor="r-brands">Бренды</Label>
                </div>
            </RadioGroup>

            <div className="grid w-full items-center gap-1.5">
                <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                    <div className="flex-1">
                        <Input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            disabled={uploading}
                            className="cursor-pointer"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                            Поддерживаемые форматы: .xlsx, .xls. Максимальный размер: 10MB
                        </p>
                    </div>
                </div>
            </div>

            {errors.length > 0 && (
                <Alert variant="destructive">
                    <AlertTitle>Ошибки</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc pl-4">
                            {errors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {previewData.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Предпросмотр данных</h3>
                    {/* Cast data for PreviewTable - assumes it expects ZoneData structure */}
                    <PreviewTable data={previewData as any[]} />
                </div>
            )}

            {uploading && (
                <div className="space-y-2">
                    <Progress
                        value={progress}
                        className="w-full"
                    />
                    <p className="text-sm text-muted-foreground text-center">
                        {progress === 100 ? (
                            <span className="flex items-center justify-center">
                                Загрузка завершена{' '}
                                <CheckCircle2 className="ml-2 h-4 w-4 text-green-500" />
                            </span>
                        ) : (
                            `Загрузка... ${progress}%`
                        )}
                    </p>
                </div>
            )}

            <Button
                type="submit"
                className="w-full"
                disabled={!file || uploading || previewData.length === 0}
            >
                {uploading ? (
                    <span className="flex items-center">
                        <Upload className="mr-2 h-4 w-4 animate-bounce" />
                        Загрузка...
                    </span>
                ) : (
                    <span className="flex items-center">
                        <Upload className="mr-2 h-4 w-4" />
                        Загрузить данные
                    </span>
                )}
            </Button>
        </form>
    );
}

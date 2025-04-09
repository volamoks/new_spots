'use client';

import type React from 'react';
import { useState } from 'react';
// Remove unused useRouter import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // Import RadioGroup
import { Label } from '@/components/ui/label'; // Import Label
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { PreviewTable } from '../../../../to delete/dmp-manager/upload/preview-table';
import type { ZoneData } from '@/types/zone'; // Import ZoneData type
import * as XLSX from 'xlsx'; // Keep for potential direct use if needed, though parseExcelFile encapsulates it

// --- Refactoring: Utility Functions ---
// Ideally, move these to separate files (e.g., lib/utils/excelUtils.ts, lib/services/uploadService.ts)

type UploadType = 'zones' | 'inn' | 'brands';

// Define constants for column names to avoid magic strings
const COLUMNS = {
    ZONES: {
        ID: 'Уникальный идентификатор',
        CITY: 'Город',
        MARKET: 'Маркет',
        MACROZONE: 'Основная Макрозона',
    },
    INN: {
        SUPPLIER_NAME: 'Поставщик',
        TAX_NUMBER: 'Налоговый номер',
    },
    BRANDS: {
        BRAND_NAME: 'Название Бренда',
    },
};

/**
 * Parses an Excel file (.xlsx, .xls) and returns data as an array of objects.
 * Cleans headers by trimming and removing newline/quote characters.
 */
// Use unknown for values as we don't know the exact types from Excel
const parseExcelFile = async (file: File): Promise<Record<string, unknown>[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async e => {
            try {
                if (!e.target?.result) {
                    return reject(new Error('Ошибка чтения файла: результат пуст.'));
                }
                const data = new Uint8Array(e.target.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                if (!worksheet) {
                    return reject(new Error('Не найден лист в Excel файле.'));
                }

                // Clean up headers
                const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z1');
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const address = XLSX.utils.encode_cell({ r: range.s.r, c: C });
                    const cell = worksheet[address];
                    if (cell?.v) {
                        // Check if cell and cell.v exist
                        cell.v = String(cell.v)
                            .replace(/[\n\r"]/g, '')
                            .trim();
                    }
                }

                // Use unknown for values
                const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
                    defval: '', // Treat empty cells as empty strings
                });
                resolve(jsonData);
            } catch (error) {
                console.error('Ошибка парсинга Excel файла:', error);
                reject(new Error('Ошибка парсинга Excel файла. Проверьте формат данных.'));
            }
        };
        reader.onerror = error => {
            console.error('FileReader error:', error);
            reject(new Error('Ошибка при чтении файла на стороне клиента.'));
        };
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Validates the structure of the parsed Excel data based on the upload type.
 */
// Use unknown for values in the input data array
const validateUploadData = (data: Record<string, unknown>[], type: UploadType): string[] => {
    const errors: string[] = [];
    if (!data || data.length === 0) {
        // Handle case where data might be empty or undefined after parsing
        // errors.push("Нет данных для валидации."); // Or handle appropriately
        return errors; // No data to validate
    }

    data.forEach((row, index) => {
        const rowNum = index + 2; // Excel row number (1-based index + 1 for header)

        // Clean keys only once per row for efficiency
        // Ensure row is an object before trying to get entries
        const cleanRow =
            typeof row === 'object' && row !== null
                ? Object.fromEntries(
                      Object.entries(row).map(([key, value]) => [
                          key.replace(/[\n\r"]/g, '').trim(),
                          value, // Keep original value type
                      ]),
                  )
                : {}; // Provide an empty object if row is not valid

        switch (type) {
            case 'zones':
                if (!cleanRow[COLUMNS.ZONES.ID])
                    errors.push(`Строка ${rowNum}: Отсутствует '${COLUMNS.ZONES.ID}'`);
                if (!cleanRow[COLUMNS.ZONES.CITY])
                    errors.push(`Строка ${rowNum}: Отсутствует '${COLUMNS.ZONES.CITY}'`);
                if (!cleanRow[COLUMNS.ZONES.MARKET])
                    errors.push(`Строка ${rowNum}: Отсутствует '${COLUMNS.ZONES.MARKET}'`);
                if (!cleanRow[COLUMNS.ZONES.MACROZONE])
                    errors.push(`Строка ${rowNum}: Отсутствует '${COLUMNS.ZONES.MACROZONE}'`);
                break;
            case 'inn':
                if (!cleanRow[COLUMNS.INN.SUPPLIER_NAME])
                    errors.push(`Строка ${rowNum}: Отсутствует '${COLUMNS.INN.SUPPLIER_NAME}'`);
                if (!cleanRow[COLUMNS.INN.TAX_NUMBER])
                    errors.push(`Строка ${rowNum}: Отсутствует '${COLUMNS.INN.TAX_NUMBER}'`);
                break;
            case 'brands':
                if (!cleanRow[COLUMNS.BRANDS.BRAND_NAME])
                    errors.push(`Строка ${rowNum}: Отсутствует '${COLUMNS.BRANDS.BRAND_NAME}'`);
                break;
            default:
                // Should not happen with TypeScript, but good practice
                console.warn(`Неизвестный тип загрузки для валидации: ${type}`);
        }
    });
    return errors;
};

/**
 * Sends the Excel file and upload type to the backend API.
 */
// The API response structure isn't strictly defined here, so unknown is safer than any
const uploadExcelData = async (formData: FormData): Promise<unknown> => {
    const response = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData,
    });

    // Try parsing JSON regardless of status code, as errors might be in JSON body
    let responseData;
    try {
        responseData = await response.json();
    } catch (jsonError: unknown) {
        // Catch as unknown
        console.error('Failed to parse JSON response:', jsonError); // Log the actual error
        // If JSON parsing fails, throw a generic error based on status
        if (!response.ok) {
            throw new Error(
                `Ошибка сервера: ${response.status} ${response.statusText} (ответ не JSON)`,
            );
        }
        // If response was ok but JSON failed
        throw new Error('Не удалось обработать ответ сервера (неверный формат JSON).');
    }

    if (!response.ok) {
        // Use error message from JSON if available, otherwise use status text
        throw new Error(
            responseData?.error || `Ошибка сервера: ${response.status} ${response.statusText}`,
        );
    }

    return responseData; // Return the successful response data
};

// --- End Utility Functions ---

// Define a type for the expected API success response
interface UploadApiResponse {
    message: string;
    totalRowsRead: number;
    rowsAttempted: number;
    rowsSucceeded: number;
    rowsFailed: number;
}

export function ExcelUploadForm() {
    // Remove props
    const [file, setFile] = useState<File | null>(null);
    // Restore internal state for uploadType
    const [uploadType, setUploadType] = useState<'zones' | 'inn' | 'brands'>('zones');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);
    // Make previewData more generic, though validation/display might need adjustment
    // Use unknown[] for preview data state, as structure varies
    // Use Record<string, unknown>[] for preview data state
    const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
    const [uploadStats, setUploadStats] = useState<UploadApiResponse | null>(null); // State for statistics
    // const router = useRouter(); // Removed unused router
    const { toast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setFile(null); // Reset file state immediately
        setPreviewData([]); // Clear preview
        setErrors([]); // Clear errors
        setUploadStats(null); // Clear previous stats

        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];

            // Basic client-side validation (type)
            if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
                setErrors(['Пожалуйста, загрузите файл Excel (.xlsx или .xls)']);
                return; // Stop processing
            }
            // Optional: Add size check here if needed

            setFile(selectedFile); // Set file state only if basic validation passes

            // Attempt to parse the file for preview using the utility function
            try {
                const jsonData = await parseExcelFile(selectedFile);
                if (jsonData.length === 0) {
                    setErrors(['Файл пуст или не удалось извлечь данные.']);
                    // Keep file selected, but show error and no preview
                } else {
                    setPreviewData(jsonData); // Set the parsed data (Record<string, unknown>[])
                }
            } catch (error: unknown) {
                console.error('Ошибка обработки файла для предпросмотра:', error);
                const message =
                    error instanceof Error
                        ? error.message
                        : 'Неизвестная ошибка при обработке файла.';
                setErrors([`Ошибка предпросмотра: ${message}`]);
                // Keep file selected, but show error and no preview
                setPreviewData([]); // Ensure preview is empty on error
            }
        } else {
            // No file selected (e.g., user cancelled file dialog)
            // State is already reset at the beginning of the function
        }
    };

    // The validation logic is now in the standalone `validateUploadData` function defined above.
    // We will call it directly in handleSubmit.

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!file || previewData.length === 0) {
            setErrors(['Пожалуйста, выберите файл для загрузки']);
            return;
        }

        // Pass uploadType to validateData
        // Use the extracted validation function
        // Cast previewData to the type expected by validateUploadData
        const validationErrors = validateUploadData(
            previewData as Record<string, unknown>[],
            uploadType,
        );
        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        setUploading(true);
        setProgress(0);
        setErrors([]);
        setUploadStats(null); // Clear previous stats

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

            // Use the extracted API call function
            const responseData = await uploadExcelData(formData);
            const stats = responseData as UploadApiResponse; // Assert type

            // Stop progress simulation *after* successful API call
            clearInterval(progressInterval);
            setProgress(100);

            // Store stats
            setUploadStats(stats);

            // Show detailed toast
            toast({
                title: 'Загрузка завершена',
                description: `Успешно: ${stats.rowsSucceeded}, Ошибки: ${stats.rowsFailed} (из ${stats.rowsAttempted} попыток). Всего строк в файле: ${stats.totalRowsRead}.`,
                variant: stats.rowsFailed > 0 ? 'destructive' : 'success', // Use destructive for errors
                duration: 9000, // Keep toast longer
            });

            // Remove automatic redirect to show stats
            // setTimeout(() => {
            //     router.push('/dmp-manager'); // Or maybe refresh current page?
            // }, 1000);
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

    // console.log('Rendering ExcelUploadForm, current uploadType:', uploadType); // Keep or remove debug logs as needed
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

            {/* Conditionally render PreviewTable only for 'zones' upload type */}
            {uploadType === 'zones' && previewData.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Предпросмотр данных (Зоны)</h3>
                    {/*
                      Cast previewData to ZoneData[] here.
                      This assumes that when uploadType is 'zones', the parsed data
                      will conform to the ZoneData structure. If the Excel file is
                      incorrectly formatted, this could still cause runtime issues inside PreviewTable.
                    */}
                    <PreviewTable data={previewData as unknown as ZoneData[]} />
                </div>
            )}
            {/* Fallback preview for other types */}
            {uploadType !== 'zones' && previewData.length > 0 && (
                <div className="space-y-2 p-4 border rounded-md bg-muted/50">
                    <h3 className="text-lg font-semibold">
                        Предпросмотр данных ({uploadType === 'inn' ? 'ИНН' : 'Бренды'})
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Загружено {previewData.length} строк для предпросмотра. Детальный
                        предпросмотр для этого типа данных не отображается.
                    </p>
                    {/* You could render a very basic table here if desired */}
                </div>
            )}

            {/* Display Upload Statistics */}
            {uploadStats && !uploading && (
                <Alert variant={uploadStats.rowsFailed > 0 ? 'destructive' : 'default'}>
                    <AlertTitle>Результаты импорта ({uploadType})</AlertTitle>
                    <AlertDescription>
                        <ul className="list-none space-y-1">
                            <li>
                                Прочитано строк из файла (без заголовка):{' '}
                                {uploadStats.totalRowsRead}
                            </li>
                            <li>
                                Строк прошло валидацию и отправлено на обработку:{' '}
                                {uploadStats.rowsAttempted}
                            </li>
                            <li>Успешно сохранено/обновлено: {uploadStats.rowsSucceeded}</li>
                            <li>
                                Не удалось сохранить/обновить (ошибки): {uploadStats.rowsFailed}
                            </li>
                        </ul>
                        {uploadStats.rowsFailed > 0 && (
                            <p className="mt-2 text-xs">
                                Подробности об ошибках смотрите в консоли сервера.
                            </p>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            {/* Progress Bar */}
            {uploading && (
                <div className="space-y-2">
                    <Progress
                        value={progress}
                        className="w-full"
                    />
                    <p className="text-sm text-muted-foreground text-center">
                        {progress === 100 ? (
                            <span className="flex items-center justify-center">
                                Обработка на сервере...{' '}
                                <CheckCircle2 className="ml-2 h-4 w-4 text-green-500" />
                            </span>
                        ) : (
                            `Загрузка файла... ${progress}%`
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

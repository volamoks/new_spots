"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
// import Navigation from "@/components/Navigation"
import { Download, Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react"
import { PreviewTable } from "./preview-table"
import { generateExcelTemplate } from "@/lib/excel-template"
import type { ZoneData } from "@/types/zone"
import * as XLSX from "xlsx"
import Navigation from "@/app/components/Navigation"

export default function DMPUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [previewData, setPreviewData] = useState<ZoneData[]>([])
  const router = useRouter()
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0]
      if (selectedFile.name.match(/\.(xlsx|xls)$/)) {
        setFile(selectedFile)
        setErrors([])

        // Читаем файл для предпросмотра
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer)
            const workbook = XLSX.read(data, { type: "array" })
            const worksheet = workbook.Sheets[workbook.SheetNames[0]]

            // Clean up headers before converting to JSON
            const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:Z1")
            for (let C = range.s.c; C <= range.e.c; ++C) {
              const address = XLSX.utils.encode_cell({ r: range.s.r, c: C })
              const cell = worksheet[address]
              if (cell && cell.v) {
                cell.v = cell.v
                  .toString()
                  .replace(/[\n\r"]/g, "")
                  .trim()
              }
            }

            const jsonData = XLSX.utils.sheet_to_json<ZoneData>(worksheet)
            setPreviewData(jsonData)
          } catch (error:unknown) {
            setErrors(["Ошибка чтения файла. Проверьте формат данных."])
            setPreviewData([])
          }
        }
        reader.readAsArrayBuffer(selectedFile)
      } else {
        setErrors(["Пожалуйста, загрузите файл Excel (.xlsx или .xls)"])
        setFile(null)
        setPreviewData([])
      }
    }
  }

  const validateData = (data: ZoneData[]): string[] => {
    const errors: string[] = []
    data.forEach((row, index) => {
      const rowNum = index + 2 // +2 because Excel starts from 1 and we have header row

      // Clean up the column names by removing extra spaces and quotes
      const cleanRow = Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key.replace(/[\n\r"]/g, "").trim(), value]),
      )

      // Check for required fields using cleaned column names
      if (!cleanRow["Уникальный идентификатор"]) {
        errors.push(`Строка ${rowNum}: Отсутствует уникальный идентификатор`)
      }
      if (!cleanRow["Город"]) {
        errors.push(`Строка ${rowNum}: Отсутствует город`)
      }
      if (!cleanRow["Маркет"]) {
        errors.push(`Строка ${rowNum}: Отсутствует маркет`)
      }
      if (!cleanRow["Основная Макрозона"]) {
        errors.push(`Строка ${rowNum}: Отсутствует основная макрозона`)
      }
      if (!cleanRow["Статус"]) {
        errors.push(`Строка ${rowNum}: Отсутствует статус`)
      }
    })
    return errors
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file || previewData.length === 0) {
      setErrors(["Пожалуйста, выберите файл для загрузки"])
      return
    }

    const validationErrors = validateData(previewData)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setUploading(true)
    setProgress(0)
    setErrors([])

    const formData = new FormData()
    formData.append("file", file)

    try {
      // Имитация прогресса загрузки
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 500)

      const response = await fetch("/api/upload-excel", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Произошла ошибка при загрузке")
      }

      toast({
        title: "Успех",
        description: `Данные успешно загружены. Обработано записей: ${data.count}`,
      })

      // Даем время увидеть 100% прогресс
      setTimeout(() => {
        router.push("/dmp-manager")
      }, 1000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Произошла ошибка при загрузке данных"
      setErrors([errorMessage])
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    try {
      const blob = generateExcelTemplate()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "template-zones.xlsx"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скачать шаблон",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-corporate">Загрузка данных из Excel</CardTitle>
            <CardDescription>
              Загрузите файл Excel с данными о зонах продаж. Убедитесь, что структура файла соответствует шаблону.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Button variant="outline" onClick={downloadTemplate} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Скачать шаблон Excel
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <PreviewTable data={previewData} />
                </div>
              )}

              {uploading && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    {progress === 100 ? (
                      <span className="flex items-center justify-center">
                        Загрузка завершена <CheckCircle2 className="ml-2 h-4 w-4 text-green-500" />
                      </span>
                    ) : (
                      `Загрузка... ${progress}%`
                    )}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={!file || uploading || previewData.length === 0}>
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
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


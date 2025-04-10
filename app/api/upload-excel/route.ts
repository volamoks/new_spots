import { type NextRequest, NextResponse } from "next/server"
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { put } from '@vercel/blob'; // Import Vercel Blob client

// Define the payload structure for the background job API
interface ExcelUploadJobPayload {
  storageIdentifier: string; // URL from Vercel Blob
  fileName: string;
  importType: string;
  userId: string;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log(`[API Start] Received request at ${new Date(startTime).toISOString()}`);
  try {
    // --- Authentication & Authorization Check ---
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== Role.DMP_MANAGER) {
      return NextResponse.json(
        { error: "Forbidden: Only DMP Managers can upload data." },
        { status: 403 }
      )
    }
    console.log(`[API Auth] Passed. User: ${session.user.id}. Time: ${Date.now() - startTime} ms`);

    // --- Form Data & File Validation ---
    const formData = await req.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string || req.nextUrl.searchParams.get("type") || "zones"

    if (!file) {
      return NextResponse.json({ error: "Файл не загружен" }, { status: 400 })
    }

    // --- File Size Check ---
    // Consider if this limit is still appropriate or should be handled by Blob storage limits
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // Example: 10MB limit
    console.log(`[API File Check] Size: ${file.size} bytes`);
    if (file.size > MAX_FILE_SIZE) {
      console.error(`[API File Check] File size ${file.size} exceeds limit ${MAX_FILE_SIZE}`);
      return NextResponse.json({ error: `Файл слишком большой (${(file.size / (1024 * 1024)).toFixed(2)} MB). Максимальный размер: 10 MB.` }, { status: 413 });
    }

    // --- Step 1: Upload file to Vercel Blob ---
    console.log(`[API Storage] Attempting to upload file "${file.name}" to Vercel Blob...`);
    const blob = await put(
      `excel-uploads/${type}/${Date.now()}-${file.name}`, // Unique path including type and timestamp
      file,
      {
        access: 'public', // Required by type definition, even for private blobs (default behavior)
        // Optional: Add metadata if needed
        // addRandomSuffix: false, // Consider if you need predictable URLs
      }
    );
    console.log(`[API Storage] File uploaded to ${blob.url}. Time: ${Date.now() - startTime} ms`);
    const storageIdentifier = blob.url; // Use the returned URL as the identifier

    // --- Step 2: Trigger background job API asynchronously ---
    const jobPayload: ExcelUploadJobPayload = {
      storageIdentifier: storageIdentifier,
      fileName: file.name,
      importType: type,
      userId: session.user.id,
    };
    console.log(`[API Job Trigger] Triggering background job via fetch with payload:`, jobPayload);

    // Construct the full URL for the job handler API route
    // Ensure NEXT_PUBLIC_APP_URL is set in your environment variables
    const jobApiUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/process-upload-job`;
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.warn("[API Job Trigger] NEXT_PUBLIC_APP_URL is not set. Using relative path for job trigger, which might fail in some environments.");
    }

    // Fire-and-forget fetch call to the job handler
    // DO NOT await this call, otherwise this route will wait for the job to finish
    fetch(jobApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add security header if implemented in the job handler
        // 'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
      },
      body: JSON.stringify(jobPayload),
    }).catch(fetchError => {
      // Log errors initiating the background job, but don't fail the initial request
      console.error("[API Job Trigger] Error initiating background job fetch:", fetchError);
      // Optional: Implement more robust error handling/retry for the trigger if needed
    });

    // --- Step 3: Return immediate success response ---
    console.log(`[API End] Job triggered. Returning 202 Accepted. Total API time: ${Date.now() - startTime} ms`);
    return NextResponse.json(
      { message: "Файл принят и поставлен в очередь на обработку.", jobId: storageIdentifier }, // Optionally return blob URL as a job identifier
      { status: 202 } // 202 Accepted
    );

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[API Error] Error during initial upload/trigger after ${totalTime} ms:`, error);
    return NextResponse.json({
      error: "Ошибка при инициации загрузки файла",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

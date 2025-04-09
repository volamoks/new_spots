import { type NextRequest, NextResponse } from "next/server"
// Removed unused prisma import
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
// Import necessary clients for your storage and queue system
// import { put } from '@vercel/blob'; // Example: Vercel Blob
// import { triggerVercelQueue } from '@/lib/queue'; // Example: Your queue trigger function

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
    const type = formData.get("type") as string || req.nextUrl.searchParams.get("type") || "zones" // Get type early

    if (!file) {
      return NextResponse.json({ error: "Файл не загружен" }, { status: 400 })
    }

    // --- File Size Check ---
    const VERCEL_HOBBY_LIMIT = 4.5 * 1024 * 1024; // Example limit
    console.log(`[API File Check] Size: ${file.size} bytes`);
    if (file.size > VERCEL_HOBBY_LIMIT) { // Adjust limit as needed
      console.error(`[API File Check] File size ${file.size} exceeds limit`);
      return NextResponse.json({ error: `Файл слишком большой (${(file.size / (1024 * 1024)).toFixed(2)} MB).` }, { status: 413 });
    }

    // --- TODO: Step 1: Upload file to temporary storage (e.g., Vercel Blob) ---
    console.log(`[API Storage] Attempting to upload file to storage...`);
    // Example using Vercel Blob:
    // const blob = await put(file.name, file, { access: 'private' });
    // console.log(`[API Storage] File uploaded to ${blob.url}. Time: ${Date.now() - startTime} ms`);
    // const storageUrl = blob.url; // Get the URL or identifier of the stored file
    // *** Replace Placeholder Below ***
    const storageIdentifier = `placeholder/path/to/${file.name}`; // Replace with actual storage path/URL/ID

    // --- TODO: Step 2: Trigger background job ---
    // Pass necessary info: storage identifier, import type, user ID
    const jobPayload = {
      storageIdentifier: storageIdentifier, // Use the actual identifier from storage upload
      fileName: file.name, // Keep original filename for context
      importType: type,
      userId: session.user.id,
    };
    console.log(`[API Queue] Triggering background job with payload:`, jobPayload);
    // Example using a hypothetical queue trigger:
    // await triggerVercelQueue('process-excel-upload', jobPayload);
    // *** Replace Placeholder Below ***
    const jobTriggered = true; // Replace with actual job trigger call result

    if (!jobTriggered) {
      // Optional: Handle failure to trigger the job (e.g., delete stored file)
      console.error("[API Queue] Failed to trigger background job.");
      // await deleteFromBlob(storageIdentifier); // Example cleanup
      throw new Error("Не удалось запустить фоновую обработку файла.");
    }

    // --- Step 3: Return immediate success response ---
    console.log(`[API End] Job triggered. Returning 202 Accepted. Total API time: ${Date.now() - startTime} ms`);
    return NextResponse.json(
      { message: "Файл принят и поставлен в очередь на обработку." },
      { status: 202 } // 202 Accepted
    );

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[API Error] Error after ${totalTime} ms:`, error);
    return NextResponse.json({
      error: "Ошибка при постановке файла в очередь",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// NOTE: All the processing functions (formatZoneData, batchUpsert*, getZoneStatus)
// should be moved to the background worker function/file.
// They are removed from this API route file.

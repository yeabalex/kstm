import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import dotenv from "dotenv";
import { validateToken } from "@/lib/utils";
import { cookies } from "next/headers";

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const ALLOWED_TYPES = {
  csv: "text/csv",
  json: "application/json",
  pdf: "application/pdf",
  txt: "text/plain",
};

// Define a type that matches the properties we need from the FormDataEntryValue
interface FileEntry {
  name: string;
  size: number;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const token = (await cookieStore).get("access_token")?.value;

  if (!token) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/login",
      },
    });
  }
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("user_id");
    const botId = searchParams.get("bot_id");
    const kbId = searchParams.get("kb_id");

    if (!userId || !botId || !kbId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const allFiles: FileEntry[] = [];

    // Collect all files from each file type
    for (const fileType of Object.keys(ALLOWED_TYPES)) {
      const filesOfType = formData.getAll(fileType);
      for (const file of filesOfType) {
        // Check if this is a file-like object
        if (
          typeof file === "object" &&
          file !== null &&
          "name" in file &&
          "size" in file &&
          "type" in file &&
          "arrayBuffer" in file &&
          typeof (file as any).arrayBuffer === "function"
        ) {
          allFiles.push(file as FileEntry);
        }
      }
    }

    if (allFiles.length === 0) {
      return NextResponse.json(
        { error: "No valid files provided" },
        { status: 400 }
      );
    }

    if (allFiles.length > 3) {
      return NextResponse.json(
        { error: "You can upload a maximum of 3 files" },
        { status: 400 }
      );
    }

    const uploadedFiles = [];
    for (const file of allFiles) {
      const extension = file.name.split(".").pop()?.toLowerCase();

      if (!extension || !(extension in ALLOWED_TYPES)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}` },
          { status: 400 }
        );
      }

      // Get the file content as ArrayBuffer and convert to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const s3Key = `${userId}/${botId}/${kbId}/${Date.now()}-${sanitizedName}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: s3Key,
          Body: buffer,
          ContentType: ALLOWED_TYPES[extension as keyof typeof ALLOWED_TYPES],
        })
      );

      const presignedUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: s3Key,
        }),
        { expiresIn: 3600 }
      );

      uploadedFiles.push({
        fileName: sanitizedName,
        fileUrl: presignedUrl,
        s3Key,
        fileType: extension,
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

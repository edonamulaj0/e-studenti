import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { kv } from "@vercel/kv";

// Configure R2 client (R2 is S3-compatible)
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const materialData = JSON.parse(formData.get("materialData"));

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create organized file path
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${materialData.faculty}/${materialData.department}/${materialData.subject}/${timestamp}_${safeFileName}`;

    // Upload to R2
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: filePath,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        uploadedBy: "system", // You can add user info here later
      },
    });

    await r2Client.send(uploadCommand);

    // Create public URL
    const publicUrl = `${process.env.R2_BUCKET_URL}/${filePath}`;

    // Create material record
    const materialId = timestamp.toString();
    const material = {
      id: materialId,
      ...materialData,
      fileName: file.name,
      filePath: filePath,
      fileUrl: publicUrl,
      fileSize: file.size,
      fileType: file.type,
      uploadDate: new Date().toISOString().split("T")[0],
    };

    // Store in KV
    await kv.hset(`material:${materialId}`, material);

    // Update material list
    const currentIds = (await kv.get("material:list")) || [];
    await kv.set("material:list", [...currentIds, materialId]);

    return Response.json({
      success: true,
      material,
      fileUrl: publicUrl,
    });
  } catch (error) {
    console.error("R2 Upload error:", error);
    return Response.json(
      { error: "Upload failed: " + error.message },
      { status: 500 }
    );
  }
}

// Generate secure download URL (optional - for private files)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get("id");

    if (!materialId) {
      return Response.json({ error: "Material ID required" }, { status: 400 });
    }

    const material = await kv.hgetall(`material:${materialId}`);

    if (!material) {
      return Response.json({ error: "Material not found" }, { status: 404 });
    }

    // For public files, just return the URL
    // For private files, generate a signed URL:
    /*
    const getCommand = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: material.filePath,
    });
    
    const signedUrl = await getSignedUrl(r2Client, getCommand, { 
      expiresIn: 3600 // 1 hour
    });
    */

    return Response.json({
      success: true,
      downloadUrl: material.fileUrl, // or signedUrl for private files
      fileName: material.fileName,
    });
  } catch (error) {
    console.error("Download error:", error);
    return Response.json(
      { error: "Failed to get download URL" },
      { status: 500 }
    );
  }
}

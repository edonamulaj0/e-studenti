import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { kv } from "@vercel/kv";

// configure R2 client
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

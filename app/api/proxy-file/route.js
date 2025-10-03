import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("url");

    if (!fileUrl) {
      return NextResponse.json(
        { error: "URL është e nevojshme" },
        { status: 400 }
      );
    }

    // Fetch the file from the media server
    const response = await fetch(fileUrl, {
      cache: "no-cache",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Dështoi ngarkimi: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    // Get the file as an array buffer
    const arrayBuffer = await response.arrayBuffer();

    // Return the file with proper CORS headers
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/octet-stream",
        "Content-Length": arrayBuffer.byteLength.toString(),
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Gabim në proxy:", error);
    return NextResponse.json(
      { error: "Gabim gjatë ngarkimit të skedarit" },
      { status: 500 }
    );
  }
}

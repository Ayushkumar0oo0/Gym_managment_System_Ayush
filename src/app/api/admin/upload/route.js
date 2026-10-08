import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";

const ALLOWED_FOLDERS = {
  promotions: "gym-management/promotions",
  workoutMachines: "gym-management/workout-machines",
  products: "gym-management/products",
};

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request) {
  try {
    // --------------------------------------------------
    // AUTH
    // --------------------------------------------------

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // FORM DATA
    // --------------------------------------------------

    const formData = await request.formData();

    const file = formData.get("file");
    const folderType = formData.get("folder") || "promotions";

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No file uploaded.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // VALIDATE FILE
    // --------------------------------------------------

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid file.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid image type. Only JPG, JPEG, PNG, WEBP and AVIF are allowed.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Image must be smaller than 10 MB.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // FOLDER
    // --------------------------------------------------

    const cloudinaryFolder =
      ALLOWED_FOLDERS[folderType];

    if (!cloudinaryFolder) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid upload folder.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // CLOUDINARY ENVIRONMENT
    // --------------------------------------------------

    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME;

    const apiKey =
      process.env.CLOUDINARY_API_KEY;

    const apiSecret =
      process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error(
        "Cloudinary environment variables are missing."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Cloudinary configuration is missing.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // FILE BUFFER
    // --------------------------------------------------

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // --------------------------------------------------
    // CLOUDINARY UPLOAD
    // --------------------------------------------------

    const cloudinaryUrl =
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const cloudinaryForm = new FormData();

    cloudinaryForm.append(
      "file",
      new Blob([buffer], {
        type: file.type,
      }),
      file.name
    );

    cloudinaryForm.append(
      "folder",
      cloudinaryFolder
    );

    const basicAuth = Buffer.from(
      `${apiKey}:${apiSecret}`
    ).toString("base64");

    const response = await fetch(
      cloudinaryUrl,
      {
        method: "POST",

        headers: {
          Authorization: `Basic ${basicAuth}`,
        },

        body: cloudinaryForm,
      }
    );

    const responseText =
      await response.text();

    // --------------------------------------------------
    // CLOUDINARY RESPONSE
    // --------------------------------------------------

    if (!response.ok) {
      console.error(
        "Cloudinary upload failed:",
        response.status,
        responseText
      );

      return NextResponse.json(
        {
          success: false,
          message:
            response.headers.get("X-Cld-Error") ||
            responseText ||
            "Cloudinary upload failed.",
        },
        {
          status: 500,
        }
      );
    }

    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid response received from Cloudinary.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      message: "Image uploaded successfully.",

      url: result.secure_url,

      publicId: result.public_id,

      width: result.width,

      height: result.height,

      folder: cloudinaryFolder,
    });
  } catch (error) {
    console.error(
      "Upload route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Upload failed.",
      },
      { status: 500 }
    );
  }
}
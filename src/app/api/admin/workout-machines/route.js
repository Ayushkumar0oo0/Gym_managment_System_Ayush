import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import WorkoutMachine from "@/models/WorkoutMachine";
import MACHINES from "@/lib/workouts/machines";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function detectTutorialPlatform(url = "") {
  const value = String(url).toLowerCase().trim();

  if (!value) return "";

  if (
    value.includes("instagram.com") ||
    value.includes("instagr.am")
  ) {
    return "instagram";
  }

  if (
    value.includes("youtube.com") ||
    value.includes("youtu.be")
  ) {
    return "youtube";
  }

  return "other";
}

function cleanString(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function getMachineKey(machine) {
  return (
    machine.key ||
    machine.slug ||
    machine.id ||
    machine.machineKey ||
    ""
  );
}

/*
|--------------------------------------------------------------------------
| Default catalog synchronization
|--------------------------------------------------------------------------
|
| Important:
|
| - New catalog machines are automatically created.
| - Existing admin-customized values are NEVER overwritten.
| - Default image/tutorial is only used when the DB value is empty.
|
|--------------------------------------------------------------------------
*/

async function syncDefaultCatalog() {
  if (!Array.isArray(MACHINES) || MACHINES.length === 0) {
    return {
      created: 0,
      updated: 0,
    };
  }

  let created = 0;
  let updated = 0;

  for (const machine of MACHINES) {
    const key = getMachineKey(machine);

    if (!key) {
      continue;
    }

    const defaultImageUrl = cleanString(machine.imageUrl);
    const defaultImagePublicId = cleanString(machine.imagePublicId);
    const defaultTutorialUrl = cleanString(machine.tutorialUrl);

    const defaultTutorialPlatform =
      cleanString(machine.tutorialPlatform) ||
      detectTutorialPlatform(defaultTutorialUrl);

    const existing = await WorkoutMachine.findOne({
      key,
    });

    /*
    |--------------------------------------------------------------------------
    | Create missing machine
    |--------------------------------------------------------------------------
    */

    if (!existing) {
      await WorkoutMachine.create({
        ...machine,

        key,

        imageUrl: defaultImageUrl,
        imagePublicId: defaultImagePublicId,

        tutorialUrl: defaultTutorialUrl,
        tutorialPlatform: defaultTutorialPlatform,

        isDefaultCatalogItem: true,
        isActive:
          typeof machine.isActive === "boolean"
            ? machine.isActive
            : true,
      });

      created++;
      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | Existing machine
    |--------------------------------------------------------------------------
    |
    | DO NOT overwrite admin changes.
    |
    */

    const update = {};

    if (
      !cleanString(existing.imageUrl) &&
      defaultImageUrl
    ) {
      update.imageUrl = defaultImageUrl;
    }

    if (
      !cleanString(existing.imagePublicId) &&
      defaultImagePublicId
    ) {
      update.imagePublicId = defaultImagePublicId;
    }

    if (
      !cleanString(existing.tutorialUrl) &&
      defaultTutorialUrl
    ) {
      update.tutorialUrl = defaultTutorialUrl;
      update.tutorialPlatform =
        defaultTutorialPlatform ||
        detectTutorialPlatform(defaultTutorialUrl);
    }

    if (
      !cleanString(existing.tutorialPlatform) &&
      defaultTutorialPlatform
    ) {
      update.tutorialPlatform = defaultTutorialPlatform;
    }

    if (existing.isDefaultCatalogItem !== true) {
      update.isDefaultCatalogItem = true;
    }

    if (Object.keys(update).length > 0) {
      await WorkoutMachine.updateOne(
        { _id: existing._id },
        { $set: update }
      );

      updated++;
    }
  }

  return {
    created,
    updated,
  };
}

/*
|--------------------------------------------------------------------------
| Admin authentication
|--------------------------------------------------------------------------
*/

async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      ),
    };
  }

  if (session.user.role !== "admin") {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        { status: 403 }
      ),
    };
  }

  return {
    session,
  };
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
*/

export async function GET(request) {
  try {
    const admin = await requireAdmin();

    if (admin.error) {
      return admin.error;
    }

    await connectDB();

    /*
     * Keep MongoDB synchronized with the master catalog.
     */
    const syncResult = await syncDefaultCatalog();

    const { searchParams } = new URL(request.url);

    const search = cleanString(
      searchParams.get("search")
    );

    const category = cleanString(
      searchParams.get("category")
    );

    const activeParam = searchParams.get("isActive");

    const filter = {};

    /*
     * Active filter
     */
    if (activeParam === "true") {
      filter.isActive = true;
    }

    if (activeParam === "false") {
      filter.isActive = false;
    }

    /*
     * Category filter
     */
    if (category) {
      filter.category = category;
    }

    /*
     * Search
     */
    if (search) {
      const regex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      filter.$or = [
        { name: regex },
        { key: regex },
        { category: regex },
        { equipmentType: regex },
        { bodyParts: regex },
      ];
    }

    const machines = await WorkoutMachine.find(filter)
      .sort({
        category: 1,
        name: 1,
      })
      .lean();

    return NextResponse.json({
      success: true,
      machines,

      sync: syncResult,

      count: machines.length,
    });
  } catch (error) {
    console.error(
      "ADMIN WORKOUT MACHINES GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to fetch workout machines",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
|
| Create a custom machine.
|
|--------------------------------------------------------------------------
*/

export async function POST(request) {
  try {
    const admin = await requireAdmin();

    if (admin.error) {
      return admin.error;
    }

    await connectDB();

    const body = await request.json();

    const {
      key,
      name,
      category,
      bodyParts,
      equipmentType,
      description,
      instructions,
      imageUrl,
      imagePublicId,
      tutorialUrl,
      tutorialPlatform,
      isActive,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Machine name is required",
        },
        { status: 400 }
      );
    }

    if (!category?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Category is required",
        },
        { status: 400 }
      );
    }

    const machineKey =
      cleanString(key) ||
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const existing = await WorkoutMachine.findOne({
      key: machineKey,
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A workout machine with this key already exists",
        },
        { status: 409 }
      );
    }

    const finalTutorialUrl =
      cleanString(tutorialUrl);

    const finalTutorialPlatform =
      cleanString(tutorialPlatform) ||
      detectTutorialPlatform(finalTutorialUrl);

    const machine =
      await WorkoutMachine.create({
        key: machineKey,

        name: name.trim(),

        category: category.trim(),

        bodyParts: Array.isArray(bodyParts)
          ? bodyParts
          : [],

        equipmentType:
          cleanString(equipmentType),

        description:
          cleanString(description),

        instructions:
          cleanString(instructions),

        imageUrl:
          cleanString(imageUrl),

        imagePublicId:
          cleanString(imagePublicId),

        tutorialUrl:
          finalTutorialUrl,

        tutorialPlatform:
          finalTutorialPlatform,

        isActive:
          typeof isActive === "boolean"
            ? isActive
            : true,

        isDefaultCatalogItem: false,
      });

    return NextResponse.json(
      {
        success: true,
        message: "Workout machine created successfully",
        machine,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "ADMIN WORKOUT MACHINES POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to create workout machine",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH
|--------------------------------------------------------------------------
|
| Admin can update:
|
| - name
| - category
| - bodyParts
| - description
| - instructions
| - image
| - tutorial
| - active state
|
|--------------------------------------------------------------------------
*/

export async function PATCH(request) {
  try {
    const admin = await requireAdmin();

    if (admin.error) {
      return admin.error;
    }

    await connectDB();

    const body = await request.json();

    const {
      id,
      key,

      name,
      category,
      bodyParts,
      equipmentType,
      description,
      instructions,

      imageUrl,
      imagePublicId,

      tutorialUrl,
      tutorialPlatform,

      isActive,
    } = body;

    if (!id && !key) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Machine id or key is required",
        },
        { status: 400 }
      );
    }

    const filter = id
      ? { _id: id }
      : { key };

    const machine =
      await WorkoutMachine.findOne(filter);

    if (!machine) {
      return NextResponse.json(
        {
          success: false,
          message: "Workout machine not found",
        },
        { status: 404 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Update only fields actually supplied.
    |--------------------------------------------------------------------------
    */

    if (name !== undefined) {
      machine.name = cleanString(name);
    }

    if (category !== undefined) {
      machine.category = cleanString(category);
    }

    if (bodyParts !== undefined) {
      machine.bodyParts = Array.isArray(bodyParts)
        ? bodyParts
        : [];
    }

    if (equipmentType !== undefined) {
      machine.equipmentType =
        cleanString(equipmentType);
    }

    if (description !== undefined) {
      machine.description =
        cleanString(description);
    }

    if (instructions !== undefined) {
      machine.instructions =
        cleanString(instructions);
    }

    /*
    |--------------------------------------------------------------------------
    | IMAGE
    |--------------------------------------------------------------------------
    */

    if (imageUrl !== undefined) {
      machine.imageUrl =
        cleanString(imageUrl);
    }

    if (imagePublicId !== undefined) {
      machine.imagePublicId =
        cleanString(imagePublicId);
    }

    /*
    |--------------------------------------------------------------------------
    | TUTORIAL
    |--------------------------------------------------------------------------
    */

    if (tutorialUrl !== undefined) {
      const finalTutorialUrl =
        cleanString(tutorialUrl);

      machine.tutorialUrl =
        finalTutorialUrl;

      machine.tutorialPlatform =
        cleanString(tutorialPlatform) ||
        detectTutorialPlatform(
          finalTutorialUrl
        );
    } else if (
      tutorialPlatform !== undefined
    ) {
      machine.tutorialPlatform =
        cleanString(tutorialPlatform);
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVE / INACTIVE
    |--------------------------------------------------------------------------
    */

    if (typeof isActive === "boolean") {
      machine.isActive = isActive;
    }

    await machine.save();

    return NextResponse.json({
      success: true,
      message:
        "Workout machine updated successfully",
      machine,
    });
  } catch (error) {
    console.error(
      "ADMIN WORKOUT MACHINES PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to update workout machine",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
|
| For default catalog machines we don't permanently delete them.
| We simply deactivate them.
|
| Custom machines can be deleted.
|
|--------------------------------------------------------------------------
*/

export async function DELETE(request) {
  try {
    const admin = await requireAdmin();

    if (admin.error) {
      return admin.error;
    }

    await connectDB();

    const { searchParams } =
      new URL(request.url);

    const id = searchParams.get("id");
    const key = searchParams.get("key");

    if (!id && !key) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Machine id or key is required",
        },
        { status: 400 }
      );
    }

    const filter = id
      ? { _id: id }
      : { key };

    const machine =
      await WorkoutMachine.findOne(filter);

    if (!machine) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Workout machine not found",
        },
        { status: 404 }
      );
    }

    /*
     * Never permanently remove a default catalog machine.
     */
    if (machine.isDefaultCatalogItem) {
      machine.isActive = false;

      await machine.save();

      return NextResponse.json({
        success: true,
        message:
          "Default machine has been deactivated",
        machine,
      });
    }

    /*
     * Custom machine.
     */
    await WorkoutMachine.deleteOne({
      _id: machine._id,
    });

    return NextResponse.json({
      success: true,
      message:
        "Custom workout machine deleted successfully",
    });
  } catch (error) {
    console.error(
      "ADMIN WORKOUT MACHINES DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to delete workout machine",
      },
      { status: 500 }
    );
  }
}
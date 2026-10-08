import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import DietProfile from "@/models/DietProfile";
import DietProgress from "@/models/DietProgress";
import { generateDietPlan } from "@/lib/diet/generator";

/*
|--------------------------------------------------------------------------
| Small PDF helpers
|--------------------------------------------------------------------------
*/

function escapePdfText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r/g, "")
    .replace(/\n/g, " ");
}

function wrapText(text, maxCharacters = 90) {
  const words = String(text || "").split(/\s+/);
  const lines = [];

  let current = "";

  for (const word of words) {
    if (!word) continue;

    const test =
      current.length > 0
        ? `${current} ${word}`
        : word;

    if (test.length > maxCharacters) {
      if (current) {
        lines.push(current);
      }

      current = word;
    } else {
      current = test;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function formatDate(date) {
  if (!date) {
    return "--";
  }

  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatMeal(meal) {
  if (!meal) {
    return [];
  }

  /*
   * The generator may return meals in slightly
   * different shapes, so we handle the common
   * structures safely.
   */

  if (typeof meal === "string") {
    return [meal];
  }

  if (Array.isArray(meal)) {
    return meal.flatMap((item) =>
      formatMeal(item)
    );
  }

  const lines = [];

  if (meal.name) {
    lines.push(String(meal.name));
  }

  if (meal.title) {
    lines.push(String(meal.title));
  }

  if (meal.food) {
    lines.push(String(meal.food));
  }

  if (meal.description) {
    lines.push(
      String(meal.description)
    );
  }

  if (meal.quantity) {
    lines.push(
      `Quantity: ${meal.quantity}`
    );
  }

  if (meal.serving) {
    lines.push(
      `Serving: ${meal.serving}`
    );
  }

  if (meal.grams) {
    lines.push(
      `Serving: ${meal.grams} g`
    );
  }

  if (meal.calories != null) {
    lines.push(
      `${Math.round(
        Number(meal.calories)
      )} kcal`
    );
  }

  if (meal.protein != null) {
    lines.push(
      `Protein: ${Math.round(
        Number(meal.protein)
      )} g`
    );
  }

  return lines;
}

function getDayMeals(day) {
  if (!day) {
    return [];
  }

  /*
   * Standard structure from our generator.
   */

  if (Array.isArray(day.meals)) {
    return day.meals;
  }

  /*
   * Fallback if meals are stored as
   * individual properties.
   */

  const possibleMeals = [
    ["Breakfast", day.breakfast],
    ["Lunch", day.lunch],
    [
      "Vegetarian Lunch",
      day.vegetarianLunch,
    ],
    ["Snack", day.snack],
    [
      "Pre-Workout",
      day.preWorkout,
    ],
    [
      "Post-Workout",
      day.postWorkout,
    ],
    ["Dinner", day.dinner],
  ];

  return possibleMeals
    .filter(([, value]) => value)
    .map(([name, value]) => ({
      name,
      items: value,
    }));
}

/*
|--------------------------------------------------------------------------
| Simple PDF generator
|--------------------------------------------------------------------------
|
| This creates a standard PDF without requiring
| another npm package.
|
*/

function createPdfDocument(lines) {
  const pageWidth = 595;
  const pageHeight = 842;

  const marginLeft = 42;
  const marginTop = 48;
  const marginBottom = 48;

  const fontSize = 10;
  const lineHeight = 15;

  const maxLinesPerPage = Math.floor(
    (pageHeight -
      marginTop -
      marginBottom) /
      lineHeight
  );

  const pages = [];

  let currentPage = [];

  for (const line of lines) {
    const wrapped = wrapText(
      line,
      92
    );

    if (wrapped.length === 0) {
      wrapped.push("");
    }

    for (const wrappedLine of wrapped) {
      if (
        currentPage.length >=
        maxLinesPerPage
      ) {
        pages.push(currentPage);
        currentPage = [];
      }

      currentPage.push(wrappedLine);
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  if (pages.length === 0) {
    pages.push([""]);
  }

  const objects = [];

  /*
   * Object 1 = Catalog
   * Object 2 = Pages
   * Fonts and page objects follow.
   */

  objects.push(
    "<< /Type /Catalog /Pages 2 0 R >>"
  );

  const pageObjectNumbers = [];

  /*
   * Reserve Pages object.
   */
  objects.push("");

  /*
   * Font object.
   */
  const fontObjectNumber =
    objects.length + 1;

  objects.push(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  );

  for (
    let pageIndex = 0;
    pageIndex < pages.length;
    pageIndex++
  ) {
    const pageLines =
      pages[pageIndex];

    const contentCommands = [];

    contentCommands.push(
      "BT"
    );

    contentCommands.push(
      `/F1 ${fontSize} Tf`
    );

    contentCommands.push(
      `${marginLeft} ${
        pageHeight - marginTop
      } Td`
    );

    for (
      let i = 0;
      i < pageLines.length;
      i++
    ) {
      const line =
        pageLines[i];

      /*
       * Slightly larger text for headings
       * marked with [TITLE] / [HEADING].
       */

      if (
        line.startsWith("[TITLE]")
      ) {
        const text =
          line.replace(
            "[TITLE]",
            ""
          ).trim();

        contentCommands.push(
          "/F1 18 Tf"
        );

        contentCommands.push(
          `(${escapePdfText(
            text
          )}) Tj`
        );

        contentCommands.push(
          "0 -24 Td"
        );

        contentCommands.push(
          `/F1 ${fontSize} Tf`
        );

        continue;
      }

      if (
        line.startsWith("[HEADING]")
      ) {
        const text =
          line.replace(
            "[HEADING]",
            ""
          ).trim();

        contentCommands.push(
          "/F1 12 Tf"
        );

        contentCommands.push(
          `(${escapePdfText(
            text
          )}) Tj`
        );

        contentCommands.push(
          "0 -19 Td"
        );

        contentCommands.push(
          `/F1 ${fontSize} Tf`
        );

        continue;
      }

      contentCommands.push(
        `(${escapePdfText(
          line
        )}) Tj`
      );

      contentCommands.push(
        `0 -${lineHeight} Td`
      );
    }

    contentCommands.push(
      "ET"
    );

    const stream =
      contentCommands.join(
        "\n"
      );

    const contentObjectNumber =
      objects.length + 1;

    objects.push(
      `<< /Length ${Buffer.byteLength(
        stream,
        "utf8"
      )} >>\nstream\n${stream}\nendstream`
    );

    const pageObjectNumber =
      objects.length + 1;

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
    );

    pageObjectNumbers.push(
      pageObjectNumber
    );
  }

  objects[1] =
    `<< /Type /Pages /Kids [${pageObjectNumbers
      .map(
        (number) =>
          `${number} 0 R`
      )
      .join(
        " "
      )}] /Count ${pageObjectNumbers.length} >>`;

  let pdf =
    "%PDF-1.4\n";

  const offsets = [0];

  for (
    let i = 0;
    i < objects.length;
    i++
  ) {
    const objectNumber =
      i + 1;

    offsets.push(
      Buffer.byteLength(
        pdf,
        "utf8"
      )
    );

    pdf += `${objectNumber} 0 obj\n`;
    pdf += `${objects[i]}\n`;
    pdf += "endobj\n";
  }

  const xrefOffset =
    Buffer.byteLength(
      pdf,
      "utf8"
    );

  pdf +=
    `xref\n0 ${
      objects.length + 1
    }\n`;

  pdf +=
    "0000000000 65535 f \n";

  for (
    let i = 1;
    i < offsets.length;
    i++
  ) {
    pdf += `${String(
      offsets[i]
    ).padStart(
      10,
      "0"
    )} 00000 n \n`;
  }

  pdf +=
    `trailer\n<< /Size ${
      objects.length + 1
    } /Root 1 0 R >>\n`;

  pdf +=
    `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(
    pdf,
    "utf8"
  );
}

/*
|--------------------------------------------------------------------------
| GET /api/member/diet/pdf
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    /*
     * --------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------
     */

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized.",
        },
        { status: 401 }
      );
    }

    if (
      session.user.role !==
      "member"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only members can download diet charts.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    /*
     * --------------------------------------------------
     * MEMBER
     * --------------------------------------------------
     */

    const user =
      await User.findById(
        session.user.id
      )
        .select(
          "_id name email gender isActive"
        )
        .lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Member account not found.",
        },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account is inactive.",
        },
        { status: 403 }
      );
    }

    /*
     * --------------------------------------------------
     * DIET PROFILE
     * --------------------------------------------------
     */

    const profile =
      await DietProfile.findOne({
        user: user._id,
        isActive: true,
      }).lean();

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please create your diet profile first.",
        },
        { status: 404 }
      );
    }

    /*
     * --------------------------------------------------
     * PROGRESS
     * --------------------------------------------------
     */

    const progress =
      await DietProgress.find({
        user: user._id,
        dietProfile:
          profile._id,
      })
        .sort({
          recordedAt: 1,
        })
        .lean();

    /*
     * --------------------------------------------------
     * GENERATE CURRENT DIET
     * --------------------------------------------------
     */

    const dietPlan =
      generateDietPlan({
        profile,
        progress,
      });

    if (!dietPlan) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to generate your diet plan.",
        },
        { status: 500 }
      );
    }

    /*
     * --------------------------------------------------
     * BUILD PDF CONTENT
     * --------------------------------------------------
     */

    const lines = [];

    lines.push(
      "[TITLE]GYM DIET & NUTRITION PLAN"
    );

    lines.push(
      `Member: ${user.name || "--"}`
    );

    lines.push(
      `Generated: ${formatDate(
        new Date()
      )}`
    );

    lines.push(
      `Diet Start Date: ${formatDate(
        profile.dietStartDate
      )}`
    );

    lines.push(
      `Phase: ${
        dietPlan.phase ||
        profile.currentPhase ||
        1
      } - ${
        dietPlan.phaseName ||
        "Current Phase"
      }`
    );

    lines.push("");

    /*
     * --------------------------------------------------
     * MEMBER SUMMARY
     * --------------------------------------------------
     */

    lines.push(
      "[HEADING]MEMBER SUMMARY"
    );

    lines.push(
      `Goal: ${
        dietPlan.goal ||
        profile.goal ||
        "--"
      }`
    );

    lines.push(
      `Gender: ${
        dietPlan.gender ||
        profile.gender ||
        user.gender ||
        "--"
      }`
    );

    lines.push(
      `Age: ${
        dietPlan.age ||
        profile.age ||
        "--"
      } years`
    );

    lines.push(
      `Height: ${
        dietPlan.height ||
        profile.heightCm ||
        "--"
      } cm`
    );

    lines.push(
      `Current Weight: ${
        dietPlan.currentWeight ||
        profile.currentWeightKg ||
        "--"
      } kg`
    );

    lines.push(
      `Diet Type: ${
        dietPlan.dietType ||
        profile.dietType ||
        "--"
      }`
    );

    lines.push(
      `Workout Days: ${
        dietPlan.workoutDays ||
        dietPlan.workoutDaysPerWeek ||
        profile.workoutDaysPerWeek ||
        0
      } days/week`
    );

    if (
      dietPlan.bmi != null
    ) {
      lines.push(
        `BMI: ${Number(
          dietPlan.bmi
        ).toFixed(1)}`
      );
    }

    lines.push("");

    /*
     * --------------------------------------------------
     * DAILY TARGETS
     * --------------------------------------------------
     */

    lines.push(
      "[HEADING]DAILY NUTRITION TARGET"
    );

    if (
      dietPlan.calories !=
      null
    ) {
      lines.push(
        `Calories: ${Math.round(
          Number(
            dietPlan.calories
          )
        )} kcal`
      );
    }

    if (
      dietPlan.protein !=
      null
    ) {
      lines.push(
        `Protein: ${Math.round(
          Number(
            dietPlan.protein
          )
        )} g`
      );
    }

    if (
      dietPlan.carbs !=
      null
    ) {
      lines.push(
        `Carbohydrates: ${Math.round(
          Number(
            dietPlan.carbs
          )
        )} g`
      );
    }

    if (
      dietPlan.fats !=
      null
    ) {
      lines.push(
        `Fats: ${Math.round(
          Number(
            dietPlan.fats
          )
        )} g`
      );
    }

    lines.push("");

    /*
     * --------------------------------------------------
     * PROGRESS
     * --------------------------------------------------
     */

    if (
      dietPlan.startingWeight !=
        null ||
      dietPlan.weightChange !=
        null ||
      dietPlan.progressRecommendation
    ) {
      lines.push(
        "[HEADING]PROGRESS"
      );

      if (
        dietPlan.startingWeight !=
        null
      ) {
        lines.push(
          `Starting Weight: ${dietPlan.startingWeight} kg`
        );
      }

      if (
        dietPlan.weightChange !=
        null
      ) {
        lines.push(
          `Weight Change: ${
            Number(
              dietPlan.weightChange
            ) > 0
              ? "+"
              : ""
          }${Number(
            dietPlan.weightChange
          ).toFixed(1)} kg`
        );
      }

      if (
        dietPlan.progressRecommendation
      ) {
        lines.push(
          `Recommendation: ${dietPlan.progressRecommendation}`
        );
      }

      lines.push("");
    }

    /*
     * --------------------------------------------------
     * 7-DAY DIET
     * --------------------------------------------------
     */

    lines.push(
      "[TITLE]7-DAY MEAL PLAN"
    );

    const days =
      Array.isArray(
        dietPlan.days
      )
        ? dietPlan.days
        : [];

    days.forEach(
      (day, dayIndex) => {
        const dayName =
          day.day ||
          day.name ||
          `Day ${
            dayIndex + 1
          }`;

        lines.push("");

        lines.push(
          `[HEADING]${dayName}`
        );

        const meals =
          getDayMeals(day);

        if (
          meals.length === 0
        ) {
          lines.push(
            "No meal information available."
          );

          return;
        }

        meals.forEach(
          (
            meal,
            mealIndex
          ) => {
            let mealName =
              meal?.name ||
              meal?.title ||
              `Meal ${
                mealIndex + 1
              }`;

            lines.push(
              `${mealName}:`
            );

            const items =
              meal?.items ||
              meal?.foods ||
              meal?.food ||
              meal;

            const itemLines =
              formatMeal(
                items
              );

            if (
              itemLines.length ===
              0
            ) {
              lines.push(
                "  See diet plan for serving details."
              );
            } else {
              itemLines.forEach(
                (item) => {
                  lines.push(
                    `  • ${item}`
                  );
                }
              );
            }
          }
        );

        if (
          day.totalCalories !=
          null
        ) {
          lines.push(
            `Daily Calories: ${Math.round(
              Number(
                day.totalCalories
              )
            )} kcal`
          );
        }

        if (
          day.calories != null
        ) {
          lines.push(
            `Daily Calories: ${Math.round(
              Number(
                day.calories
              )
            )} kcal`
          );
        }

        if (
          day.totalProtein !=
          null
        ) {
          lines.push(
            `Daily Protein: ${Math.round(
              Number(
                day.totalProtein
              )
            )} g`
          );
        }

        if (
          day.protein != null
        ) {
          lines.push(
            `Daily Protein: ${Math.round(
              Number(
                day.protein
              )
            )} g`
          );
        }
      }
    );

    /*
     * --------------------------------------------------
     * NOTES
     * --------------------------------------------------
     */

    lines.push("");

    lines.push(
      "[HEADING]IMPORTANT NOTES"
    );

    lines.push(
      "• Prefer affordable, home-style Indian foods."
    );

    lines.push(
      "• Drink sufficient water throughout the day."
    );

    lines.push(
      "• Follow the portions shown in your plan."
    );

    lines.push(
      "• Supplements are optional and are not required to follow the diet."
    );

    lines.push(
      "• You may ask the gym office about available gym nutrition products."
    );

    if (
      Array.isArray(
        dietPlan.restrictedDays
      ) &&
      dietPlan.restrictedDays
        .length > 0
    ) {
      lines.push(
        `Non-veg restricted days: ${dietPlan.restrictedDays.join(
          ", "
        )}`
      );
    }

    if (
      dietPlan.daysUntilReview !=
      null
    ) {
      lines.push(
        `Recommended review in approximately ${dietPlan.daysUntilReview} days.`
      );
    }

    lines.push("");

    lines.push(
      "[HEADING]WHEN TO UPDATE YOUR DIET"
    );

    lines.push(
      "Update your progress when your weight, workout routine, or goal changes."
    );

    lines.push(
      "The diet system can generate a new plan based on your latest progress."
    );

    lines.push("");

    lines.push(
      "[HEADING]DISCLAIMER"
    );

    lines.push(
      "This diet chart is general fitness guidance and is not medical advice."
    );

    lines.push(
      "If you have a medical condition, food allergy, or other health concern, consult a qualified healthcare professional."
    );

    /*
     * --------------------------------------------------
     * CREATE PDF
     * --------------------------------------------------
     */

    const pdfBuffer =
      createPdfDocument(
        lines
      );

    const safeName =
      String(
        user.name ||
          "member"
      )
        .trim()
        .replace(
          /[^a-zA-Z0-9-_]+/g,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          ""
        )
        .toLowerCase();

    const filename =
      `${safeName || "member"}-diet-plan.pdf`;

    return new NextResponse(
      pdfBuffer,
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="${filename}"`,

          "Cache-Control":
            "private, no-store, max-age=0",

          "Content-Length":
            String(
              pdfBuffer.length
            ),
        },
      }
    );
  } catch (error) {
    console.error(
      "DIET PDF ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to generate your diet PDF.",
      },
      { status: 500 }
    );
  }
}
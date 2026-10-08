const MACHINES = [
  // ==================================================
  // CHEST
  // ==================================================

  {
    key: "chest-press-machine",
    name: "Chest Press Machine",
    shortName: "Chest Press",
    category: "chest",
    bodyParts: ["chest", "triceps", "shoulders"],
    muscleGroups: ["Pectoralis Major", "Triceps", "Anterior Deltoid"],
    exerciseType: "machine",
    equipmentType: "Chest Press Machine",
    description:
      "A guided pressing machine for developing the chest while reducing the balance and stability requirements of free-weight pressing.",
    instructions: [
      "Adjust the seat so the handles are around mid-chest level.",
      "Sit with your back firmly against the pad.",
      "Grip the handles and keep your wrists straight.",
      "Press the handles forward without locking your elbows.",
      "Slowly return to the starting position.",
    ],
    tips: [
      "Keep your shoulders down and back.",
      "Move under control throughout the exercise.",
      "Do not bounce the weight.",
    ],
    commonMistakes: [
      "Using excessive weight.",
      "Locking the elbows aggressively.",
      "Lifting the shoulders off the pad.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "10-12",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "pec-deck-machine",
      "incline-chest-press-machine",
    ],
    alternativeMachineKeys: [
      "smith-machine-bench-press",
      "cable-crossover",
    ],
    displayOrder: 10,
  },

  {
    key: "incline-chest-press-machine",
    name: "Incline Chest Press Machine",
    shortName: "Incline Chest Press",
    category: "chest",
    bodyParts: ["chest", "shoulders", "triceps"],
    muscleGroups: [
      "Upper Chest",
      "Anterior Deltoid",
      "Triceps",
    ],
    exerciseType: "machine",
    equipmentType: "Incline Chest Press Machine",
    description:
      "A guided pressing movement emphasizing the upper portion of the chest.",
    instructions: [
      "Adjust the seat so the handles are slightly below shoulder level.",
      "Keep your back against the pad.",
      "Press the handles upward and forward.",
      "Pause briefly near the top.",
      "Return slowly.",
    ],
    tips: [
      "Keep your chest lifted.",
      "Use a controlled range of motion.",
    ],
    commonMistakes: [
      "Using too much weight.",
      "Arching excessively.",
      "Shrugging the shoulders.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "8-12",
    defaultRestSeconds: 75,
    recommendedMachineKeys: [
      "chest-press-machine",
      "pec-deck-machine",
    ],
    alternativeMachineKeys: [
      "incline-bench-dumbbell-press",
      "smith-machine-incline-press",
    ],
    displayOrder: 20,
  },

  {
    key: "decline-chest-press-machine",
    name: "Decline Chest Press Machine",
    shortName: "Decline Chest Press",
    category: "chest",
    bodyParts: ["chest", "triceps"],
    muscleGroups: ["Lower Chest", "Triceps"],
    exerciseType: "machine",
    equipmentType: "Decline Chest Press Machine",
    description:
      "A guided pressing movement that places more emphasis on the lower portion of the chest.",
    instructions: [
      "Adjust the seat according to the machine.",
      "Keep your back and head supported.",
      "Grip the handles firmly.",
      "Press forward smoothly.",
      "Return the handles under control.",
    ],
    tips: [
      "Keep your elbows comfortably below shoulder level.",
      "Avoid locking out aggressively.",
    ],
    commonMistakes: [
      "Using momentum.",
      "Dropping the weight quickly.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "10-12",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "chest-press-machine",
      "pec-deck-machine",
    ],
    alternativeMachineKeys: [
      "decline-bench-dumbbell-press",
      "cable-crossover",
    ],
    displayOrder: 30,
  },

  {
    key: "pec-deck-machine",
    name: "Pec Deck / Chest Fly Machine",
    shortName: "Pec Deck",
    category: "chest",
    bodyParts: ["chest"],
    muscleGroups: ["Pectoralis Major"],
    exerciseType: "machine",
    equipmentType: "Pec Deck",
    description:
      "An isolation machine designed to train the chest through a controlled fly movement.",
    instructions: [
      "Adjust the seat so the handles are around chest height.",
      "Place your back firmly against the pad.",
      "Bring the handles together using your chest.",
      "Squeeze the chest briefly.",
      "Return slowly until you feel a controlled stretch.",
    ],
    tips: [
      "Keep a slight bend in your elbows.",
      "Focus on bringing your upper arms together.",
    ],
    commonMistakes: [
      "Using momentum.",
      "Overstretching the shoulders.",
      "Using excessive weight.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "12-15",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "chest-press-machine",
      "cable-crossover",
    ],
    alternativeMachineKeys: [
      "dumbbell-fly",
      "cable-chest-fly",
    ],
    displayOrder: 40,
  },

  {
    key: "cable-crossover",
    name: "Cable Crossover",
    shortName: "Cable Crossover",
    category: "chest",
    bodyParts: ["chest", "shoulders"],
    muscleGroups: ["Pectoralis Major", "Anterior Deltoid"],
    exerciseType: "cable",
    equipmentType: "Cable Station",
    description:
      "A versatile cable exercise that can train the chest from different angles.",
    instructions: [
      "Set both cable pulleys to an appropriate height.",
      "Stand in the center with a stable stance.",
      "Hold the handles with a slight bend in your elbows.",
      "Bring your hands together in front of your body.",
      "Return slowly.",
    ],
    tips: [
      "Keep your core tight.",
      "Do not swing your body.",
    ],
    commonMistakes: [
      "Using excessive weight.",
      "Turning the movement into a shoulder exercise.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "12-15",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "pec-deck-machine",
      "chest-press-machine",
    ],
    alternativeMachineKeys: [
      "dumbbell-fly",
      "cable-chest-fly",
    ],
    displayOrder: 50,
  },

  // ==================================================
  // BACK
  // ==================================================

  {
    key: "lat-pulldown-machine",
    name: "Lat Pulldown Machine",
    shortName: "Lat Pulldown",
    category: "back",
    bodyParts: ["back", "biceps"],
    muscleGroups: ["Latissimus Dorsi", "Biceps", "Teres Major"],
    exerciseType: "machine",
    equipmentType: "Lat Pulldown",
    description:
      "A foundational vertical pulling exercise for developing the back.",
    instructions: [
      "Adjust the thigh pad so your legs are secured.",
      "Grip the bar slightly wider than shoulder width.",
      "Pull the bar toward the upper chest.",
      "Keep your torso controlled.",
      "Slowly return the bar upward.",
    ],
    tips: [
      "Think about pulling your elbows down.",
      "Keep your chest lifted.",
    ],
    commonMistakes: [
      "Pulling the bar behind the neck.",
      "Swinging the torso.",
      "Using momentum.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "8-12",
    defaultRestSeconds: 75,
    recommendedMachineKeys: [
      "seated-cable-row",
      "assisted-pull-up-machine",
    ],
    alternativeMachineKeys: [
      "single-arm-lat-pulldown",
      "pull-up-bar",
    ],
    displayOrder: 100,
  },

  {
    key: "seated-cable-row",
    name: "Seated Cable Row",
    shortName: "Cable Row",
    category: "back",
    bodyParts: ["back", "biceps"],
    muscleGroups: [
      "Rhomboids",
      "Latissimus Dorsi",
      "Trapezius",
      "Biceps",
    ],
    exerciseType: "cable",
    equipmentType: "Cable Row Station",
    description:
      "A horizontal pulling movement for overall back thickness and strength.",
    instructions: [
      "Sit upright with your feet firmly positioned.",
      "Grip the handle.",
      "Pull toward your lower ribs.",
      "Squeeze your shoulder blades together.",
      "Return slowly while maintaining control.",
    ],
    tips: [
      "Keep your chest open.",
      "Avoid excessive torso movement.",
    ],
    commonMistakes: [
      "Rounding the lower back.",
      "Using momentum.",
      "Pulling with only the arms.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "10-12",
    defaultRestSeconds: 75,
    recommendedMachineKeys: [
      "lat-pulldown-machine",
      "t-bar-row-machine",
    ],
    alternativeMachineKeys: [
      "chest-supported-row-machine",
      "one-arm-dumbbell-row",
    ],
    displayOrder: 110,
  },

  {
    key: "t-bar-row-machine",
    name: "T-Bar Row Machine",
    shortName: "T-Bar Row",
    category: "back",
    bodyParts: ["back", "biceps"],
    muscleGroups: [
      "Middle Back",
      "Latissimus Dorsi",
      "Rhomboids",
      "Trapezius",
    ],
    exerciseType: "machine",
    equipmentType: "T-Bar Row",
    description:
      "A supported or guided rowing movement for building back thickness.",
    instructions: [
      "Position your chest or body according to the machine.",
      "Grip the handles.",
      "Pull the handles toward your torso.",
      "Squeeze your back.",
      "Lower the weight slowly.",
    ],
    tips: [
      "Keep your spine neutral.",
      "Drive the elbows backward.",
    ],
    commonMistakes: [
      "Jerking the weight.",
      "Shrugging excessively.",
    ],
    difficulty: "intermediate",
    defaultSets: 3,
    defaultReps: "8-12",
    defaultRestSeconds: 90,
    recommendedMachineKeys: [
      "lat-pulldown-machine",
      "seated-cable-row",
    ],
    alternativeMachineKeys: [
      "barbell-row",
      "one-arm-dumbbell-row",
    ],
    displayOrder: 120,
  },

  {
    key: "assisted-pull-up-machine",
    name: "Assisted Pull-Up Machine",
    shortName: "Assisted Pull-Up",
    category: "back",
    bodyParts: ["back", "biceps"],
    muscleGroups: [
      "Latissimus Dorsi",
      "Biceps",
      "Teres Major",
    ],
    exerciseType: "machine",
    equipmentType: "Assisted Pull-Up",
    description:
      "An assisted vertical pulling machine that helps beginners develop pull-up strength.",
    instructions: [
      "Select an appropriate assistance level.",
      "Place your knees or feet on the platform.",
      "Grip the pull-up handles.",
      "Pull your body upward.",
      "Lower yourself under control.",
    ],
    tips: [
      "Use less assistance as your strength improves.",
      "Avoid swinging.",
    ],
    commonMistakes: [
      "Using too much momentum.",
      "Partial repetitions.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "6-10",
    defaultRestSeconds: 90,
    recommendedMachineKeys: [
      "lat-pulldown-machine",
      "seated-cable-row",
    ],
    alternativeMachineKeys: [
      "pull-up-bar",
    ],
    displayOrder: 130,
  },

  {
    key: "chest-supported-row-machine",
    name: "Chest Supported Row Machine",
    shortName: "Chest Supported Row",
    category: "back",
    bodyParts: ["back", "biceps"],
    muscleGroups: [
      "Rhomboids",
      "Middle Trapezius",
      "Latissimus Dorsi",
      "Biceps",
    ],
    exerciseType: "machine",
    equipmentType: "Chest Supported Row",
    description:
      "A supported rowing movement that reduces lower-back involvement.",
    instructions: [
      "Set the chest pad comfortably.",
      "Grip the handles.",
      "Pull toward your torso.",
      "Squeeze the shoulder blades.",
      "Return slowly.",
    ],
    tips: [
      "Keep your chest against the pad.",
      "Focus on elbow movement.",
    ],
    commonMistakes: [
      "Lifting the chest from the pad.",
      "Using momentum.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "10-12",
    defaultRestSeconds: 75,
    recommendedMachineKeys: [
      "lat-pulldown-machine",
      "seated-cable-row",
    ],
    alternativeMachineKeys: [
      "t-bar-row-machine",
    ],
    displayOrder: 140,
  },

  {
    key: "back-extension-machine",
    name: "Back Extension Machine",
    shortName: "Back Extension",
    category: "back",
    bodyParts: ["back", "glutes", "legs"],
    muscleGroups: [
      "Erector Spinae",
      "Glutes",
      "Hamstrings",
    ],
    exerciseType: "machine",
    equipmentType: "Back Extension",
    description:
      "A controlled movement for strengthening the posterior chain and lower back.",
    instructions: [
      "Adjust the machine to support your body correctly.",
      "Brace your core.",
      "Extend your torso through a comfortable range.",
      "Pause briefly.",
      "Return under control.",
    ],
    tips: [
      "Keep the movement controlled.",
      "Do not hyperextend the spine.",
    ],
    commonMistakes: [
      "Overextending the back.",
      "Using momentum.",
    ],
    difficulty: "beginner",
    defaultSets: 2,
    defaultReps: "12-15",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "seated-cable-row",
      "chest-supported-row-machine",
    ],
    alternativeMachineKeys: [
      "roman-chair",
    ],
    displayOrder: 150,
  },

  // ==================================================
  // SHOULDERS
  // ==================================================

  {
    key: "shoulder-press-machine",
    name: "Shoulder Press Machine",
    shortName: "Shoulder Press",
    category: "shoulders",
    bodyParts: ["shoulders", "triceps"],
    muscleGroups: [
      "Anterior Deltoid",
      "Lateral Deltoid",
      "Triceps",
    ],
    exerciseType: "machine",
    equipmentType: "Shoulder Press",
    description:
      "A guided overhead pressing movement for developing shoulder strength.",
    instructions: [
      "Adjust the seat so the handles begin around shoulder height.",
      "Sit with your back supported.",
      "Press the handles overhead.",
      "Stop before aggressively locking the elbows.",
      "Lower under control.",
    ],
    tips: [
      "Keep your core braced.",
      "Do not shrug excessively.",
    ],
    commonMistakes: [
      "Using excessive weight.",
      "Overarching the lower back.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "8-12",
    defaultRestSeconds: 75,
    recommendedMachineKeys: [
      "lateral-raise-machine",
      "rear-delt-machine",
    ],
    alternativeMachineKeys: [
      "dumbbell-shoulder-press",
      "smith-machine-overhead-press",
    ],
    displayOrder: 200,
  },

  {
    key: "lateral-raise-machine",
    name: "Lateral Raise Machine",
    shortName: "Lateral Raise",
    category: "shoulders",
    bodyParts: ["shoulders"],
    muscleGroups: ["Lateral Deltoid"],
    exerciseType: "machine",
    equipmentType: "Lateral Raise",
    description:
      "An isolation exercise targeting the side deltoids.",
    instructions: [
      "Adjust the seat and arm pads.",
      "Sit upright.",
      "Raise your arms outward.",
      "Stop around shoulder height.",
      "Lower slowly.",
    ],
    tips: [
      "Use light to moderate resistance.",
      "Keep the movement smooth.",
    ],
    commonMistakes: [
      "Swinging the body.",
      "Using excessive weight.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "12-15",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "shoulder-press-machine",
      "rear-delt-machine",
    ],
    alternativeMachineKeys: [
      "cable-lateral-raise",
      "dumbbell-lateral-raise",
    ],
    displayOrder: 210,
  },

  {
    key: "rear-delt-machine",
    name: "Rear Delt / Reverse Fly Machine",
    shortName: "Rear Delt",
    category: "shoulders",
    bodyParts: ["shoulders", "back"],
    muscleGroups: [
      "Posterior Deltoid",
      "Rhomboids",
      "Middle Trapezius",
    ],
    exerciseType: "machine",
    equipmentType: "Rear Delt / Reverse Fly",
    description:
      "An isolation movement for the rear shoulders and upper back.",
    instructions: [
      "Adjust the seat and handles.",
      "Keep your chest supported.",
      "Move the handles outward.",
      "Squeeze the rear shoulders.",
      "Return slowly.",
    ],
    tips: [
      "Keep your shoulders down.",
      "Use controlled repetitions.",
    ],
    commonMistakes: [
      "Using momentum.",
      "Shrugging the shoulders.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "12-15",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "lateral-raise-machine",
      "face-pull-cable",
    ],
    alternativeMachineKeys: [
      "bent-over-reverse-fly",
    ],
    displayOrder: 220,
  },

  {
    key: "face-pull-cable",
    name: "Cable Face Pull",
    shortName: "Face Pull",
    category: "shoulders",
    bodyParts: ["shoulders", "back"],
    muscleGroups: [
      "Rear Deltoid",
      "Rotator Cuff",
      "Trapezius",
    ],
    exerciseType: "cable",
    equipmentType: "Cable Station",
    description:
      "A cable movement commonly used for rear shoulders and upper-back development.",
    instructions: [
      "Set the cable around face height.",
      "Attach a rope.",
      "Pull the rope toward your face.",
      "Rotate the hands outward as appropriate.",
      "Return slowly.",
    ],
    tips: [
      "Keep your elbows comfortably high.",
      "Use moderate resistance.",
    ],
    commonMistakes: [
      "Using excessive weight.",
      "Turning it into a row.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "12-15",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "rear-delt-machine",
      "lateral-raise-machine",
    ],
    alternativeMachineKeys: [
      "band-face-pull",
    ],
    displayOrder: 230,
  },

  // ==================================================
  // LEGS
  // ==================================================

  {
    key: "leg-press-machine",
    name: "Leg Press Machine",
    shortName: "Leg Press",
    category: "legs",
    bodyParts: ["legs", "glutes"],
    muscleGroups: [
      "Quadriceps",
      "Glutes",
      "Hamstrings",
    ],
    exerciseType: "machine",
    equipmentType: "Leg Press",
    description:
      "A stable lower-body pressing machine for developing the legs.",
    instructions: [
      "Position your feet comfortably on the platform.",
      "Keep your back and hips supported.",
      "Lower the platform under control.",
      "Press through the feet.",
      "Return without locking the knees aggressively.",
    ],
    tips: [
      "Keep your knees tracking with your toes.",
      "Use a comfortable depth.",
    ],
    commonMistakes: [
      "Allowing the knees to collapse inward.",
      "Lowering too far without control.",
      "Locking the knees aggressively.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "10-15",
    defaultRestSeconds: 90,
    recommendedMachineKeys: [
      "leg-extension-machine",
      "seated-leg-curl-machine",
    ],
    alternativeMachineKeys: [
      "hack-squat-machine",
      "smith-machine-squat",
    ],
    displayOrder: 300,
  },

  {
    key: "hack-squat-machine",
    name: "Hack Squat Machine",
    shortName: "Hack Squat",
    category: "legs",
    bodyParts: ["legs", "glutes"],
    muscleGroups: [
      "Quadriceps",
      "Glutes",
      "Hamstrings",
    ],
    exerciseType: "machine",
    equipmentType: "Hack Squat",
    description:
      "A guided squat variation emphasizing the lower body.",
    instructions: [
      "Position your shoulders securely under the pads.",
      "Place your feet at a comfortable width.",
      "Lower your body under control.",
      "Drive through the feet to stand.",
      "Repeat smoothly.",
    ],
    tips: [
      "Keep your knees aligned with your toes.",
      "Maintain controlled depth.",
    ],
    commonMistakes: [
      "Raising the heels.",
      "Allowing knees to collapse inward.",
    ],
    difficulty: "intermediate",
    defaultSets: 3,
    defaultReps: "8-12",
    defaultRestSeconds: 90,
    recommendedMachineKeys: [
      "leg-extension-machine",
      "seated-leg-curl-machine",
    ],
    alternativeMachineKeys: [
      "leg-press-machine",
      "smith-machine-squat",
    ],
    displayOrder: 310,
  },

  {
    key: "leg-extension-machine",
    name: "Leg Extension Machine",
    shortName: "Leg Extension",
    category: "legs",
    bodyParts: ["legs"],
    muscleGroups: ["Quadriceps"],
    exerciseType: "machine",
    equipmentType: "Leg Extension",
    description:
      "An isolation movement targeting the quadriceps.",
    instructions: [
      "Adjust the seat and shin pad.",
      "Keep your back against the pad.",
      "Extend your knees smoothly.",
      "Pause briefly at the top.",
      "Lower the weight slowly.",
    ],
    tips: [
      "Use controlled movement.",
      "Avoid swinging the weight.",
    ],
    commonMistakes: [
      "Using excessive weight.",
      "Moving too quickly.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "12-15",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "leg-press-machine",
      "hack-squat-machine",
    ],
    alternativeMachineKeys: [
      "bodyweight-squat",
    ],
    displayOrder: 320,
  },

  {
    key: "seated-leg-curl-machine",
    name: "Seated Leg Curl Machine",
    shortName: "Seated Leg Curl",
    category: "legs",
    bodyParts: ["legs", "hamstrings"],
    muscleGroups: ["Hamstrings", "Calves"],
    exerciseType: "machine",
    equipmentType: "Seated Leg Curl",
    description:
      "An isolation exercise for the hamstrings.",
    instructions: [
      "Adjust the seat and thigh pad.",
      "Position your lower legs against the pads.",
      "Curl your legs downward and backward.",
      "Squeeze the hamstrings.",
      "Return slowly.",
    ],
    tips: [
      "Keep your hips against the seat.",
      "Use a full comfortable range.",
    ],
    commonMistakes: [
      "Lifting the hips.",
      "Using momentum.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "10-15",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "leg-press-machine",
      "leg-extension-machine",
    ],
    alternativeMachineKeys: [
      "lying-leg-curl-machine",
    ],
    displayOrder: 330,
  },

  {
    key: "lying-leg-curl-machine",
    name: "Lying Leg Curl Machine",
    shortName: "Lying Leg Curl",
    category: "legs",
    bodyParts: ["legs", "hamstrings"],
    muscleGroups: ["Hamstrings", "Calves"],
    exerciseType: "machine",
    equipmentType: "Lying Leg Curl",
    description:
      "A prone hamstring curl machine.",
    instructions: [
      "Lie face down with your knees aligned to the machine pivot.",
      "Position the ankle pad comfortably.",
      "Curl your heels toward your body.",
      "Squeeze the hamstrings.",
      "Lower slowly.",
    ],
    tips: [
      "Keep your hips down.",
      "Do not swing the weight.",
    ],
    commonMistakes: [
      "Lifting the hips.",
      "Using excessive resistance.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "10-15",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "leg-press-machine",
      "leg-extension-machine",
    ],
    alternativeMachineKeys: [
      "seated-leg-curl-machine",
    ],
    displayOrder: 340,
  },

  {
    key: "calf-raise-machine",
    name: "Calf Raise Machine",
    shortName: "Calf Raise",
    category: "legs",
    bodyParts: ["legs", "calves"],
    muscleGroups: ["Gastrocnemius", "Soleus"],
    exerciseType: "machine",
    equipmentType: "Calf Raise",
    description:
      "A focused movement for developing the calf muscles.",
    instructions: [
      "Position your feet on the platform.",
      "Lower your heels under control.",
      "Push through the balls of your feet.",
      "Raise your heels as high as comfortable.",
      "Pause briefly and lower.",
    ],
    tips: [
      "Use a controlled stretch.",
      "Avoid bouncing.",
    ],
    commonMistakes: [
      "Using partial repetitions.",
      "Bouncing at the bottom.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "12-20",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "leg-press-machine",
    ],
    alternativeMachineKeys: [
      "standing-calf-raise",
      "seated-calf-raise",
    ],
    displayOrder: 350,
  },

  {
    key: "hip-abductor-machine",
    name: "Hip Abductor Machine",
    shortName: "Hip Abductor",
    category: "legs",
    bodyParts: ["legs", "glutes"],
    muscleGroups: [
      "Gluteus Medius",
      "Gluteus Minimus",
      "Hip Abductors",
    ],
    exerciseType: "machine",
    equipmentType: "Hip Abductor",
    description:
      "An isolation movement for the outer hip and glute muscles.",
    instructions: [
      "Sit comfortably against the back pad.",
      "Place your legs against the pads.",
      "Push your knees outward.",
      "Pause briefly.",
      "Return slowly.",
    ],
    tips: [
      "Use controlled repetitions.",
      "Do not slam the weight stack.",
    ],
    commonMistakes: [
      "Using momentum.",
      "Using excessive weight.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "12-20",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "leg-press-machine",
      "glute-machine",
    ],
    alternativeMachineKeys: [
      "cable-hip-abduction",
    ],
    displayOrder: 360,
  },

  {
    key: "hip-adductor-machine",
    name: "Hip Adductor Machine",
    shortName: "Hip Adductor",
    category: "legs",
    bodyParts: ["legs"],
    muscleGroups: [
      "Adductors",
      "Inner Thigh",
    ],
    exerciseType: "machine",
    equipmentType: "Hip Adductor",
    description:
      "An isolation movement for the inner thigh muscles.",
    instructions: [
      "Sit with your back supported.",
      "Position your legs against the pads.",
      "Bring your legs together smoothly.",
      "Pause briefly.",
      "Return under control.",
    ],
    tips: [
      "Avoid fast repetitions.",
      "Use a comfortable range.",
    ],
    commonMistakes: [
      "Using momentum.",
      "Overstretching.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "12-20",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "leg-press-machine",
      "hip-abductor-machine",
    ],
    alternativeMachineKeys: [
      "cable-hip-adduction",
    ],
    displayOrder: 370,
  },

  {
    key: "glute-machine",
    name: "Glute Kickback Machine",
    shortName: "Glute Kickback",
    category: "legs",
    bodyParts: ["legs", "glutes"],
    muscleGroups: ["Gluteus Maximus", "Hamstrings"],
    exerciseType: "machine",
    equipmentType: "Glute Kickback",
    description:
      "A machine-based hip extension exercise targeting the glutes.",
    instructions: [
      "Position your body according to the machine.",
      "Brace your core.",
      "Drive the working leg backward.",
      "Squeeze the glute.",
      "Return slowly.",
    ],
    tips: [
      "Avoid rotating the hips.",
      "Use controlled resistance.",
    ],
    commonMistakes: [
      "Arching the lower back.",
      "Using momentum.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "10-15",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "hip-abductor-machine",
      "leg-press-machine",
    ],
    alternativeMachineKeys: [
      "cable-glute-kickback",
    ],
    displayOrder: 380,
  },

  // ==================================================
  // ARMS
  // ==================================================

  {
    key: "preacher-curl-machine",
    name: "Preacher Curl Machine",
    shortName: "Preacher Curl",
    category: "arms",
    bodyParts: ["biceps", "forearms"],
    muscleGroups: ["Biceps", "Brachialis"],
    exerciseType: "machine",
    equipmentType: "Preacher Curl",
    description:
      "A supported biceps isolation exercise.",
    instructions: [
      "Adjust the seat so your upper arms rest comfortably on the pad.",
      "Grip the handles.",
      "Curl the weight upward.",
      "Squeeze the biceps.",
      "Lower slowly.",
    ],
    tips: [
      "Keep your upper arms against the pad.",
      "Use a controlled range.",
    ],
    commonMistakes: [
      "Lifting the elbows from the pad.",
      "Using momentum.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "10-15",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "triceps-extension-machine",
      "cable-biceps-curl",
    ],
    alternativeMachineKeys: [
      "ez-bar-curl",
      "dumbbell-biceps-curl",
    ],
    displayOrder: 400,
  },

  {
    key: "biceps-curl-machine",
    name: "Biceps Curl Machine",
    shortName: "Biceps Curl",
    category: "arms",
    bodyParts: ["biceps", "forearms"],
    muscleGroups: ["Biceps", "Brachialis"],
    exerciseType: "machine",
    equipmentType: "Biceps Curl Machine",
    description:
      "A guided biceps curl for controlled arm training.",
    instructions: [
      "Adjust the seat and arm position.",
      "Grip the handles.",
      "Curl the handles toward your shoulders.",
      "Squeeze the biceps.",
      "Lower slowly.",
    ],
    tips: [
      "Keep the movement strict.",
      "Avoid swinging.",
    ],
    commonMistakes: [
      "Using excessive weight.",
      "Moving the shoulders.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "10-15",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "preacher-curl-machine",
      "triceps-extension-machine",
    ],
    alternativeMachineKeys: [
      "cable-biceps-curl",
    ],
    displayOrder: 410,
  },

  {
    key: "triceps-extension-machine",
    name: "Triceps Extension Machine",
    shortName: "Triceps Extension",
    category: "arms",
    bodyParts: ["triceps"],
    muscleGroups: ["Triceps"],
    exerciseType: "machine",
    equipmentType: "Triceps Extension",
    description:
      "A supported machine exercise for isolating the triceps.",
    instructions: [
      "Adjust the seat and arm position.",
      "Grip the handles.",
      "Extend your arms against the resistance.",
      "Squeeze the triceps.",
      "Return slowly.",
    ],
    tips: [
      "Keep the elbows controlled.",
      "Avoid using body momentum.",
    ],
    commonMistakes: [
      "Using excessive weight.",
      "Moving the shoulders.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "10-15",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "preacher-curl-machine",
      "cable-triceps-pushdown",
    ],
    alternativeMachineKeys: [
      "overhead-cable-triceps-extension",
    ],
    displayOrder: 420,
  },

  {
    key: "cable-triceps-pushdown",
    name: "Cable Triceps Pushdown",
    shortName: "Triceps Pushdown",
    category: "arms",
    bodyParts: ["triceps"],
    muscleGroups: ["Triceps"],
    exerciseType: "cable",
    equipmentType: "Cable Station",
    description:
      "A popular cable exercise for strengthening and developing the triceps.",
    instructions: [
      "Set the cable around upper chest height.",
      "Attach a rope or bar.",
      "Keep your elbows close to your body.",
      "Push the attachment downward.",
      "Return slowly.",
    ],
    tips: [
      "Keep your upper arms mostly stationary.",
      "Control the return.",
    ],
    commonMistakes: [
      "Swinging the torso.",
      "Moving the elbows excessively.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "10-15",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "triceps-extension-machine",
      "cable-biceps-curl",
    ],
    alternativeMachineKeys: [
      "assisted-dip-machine",
    ],
    displayOrder: 430,
  },

  {
    key: "cable-biceps-curl",
    name: "Cable Biceps Curl",
    shortName: "Cable Curl",
    category: "arms",
    bodyParts: ["biceps", "forearms"],
    muscleGroups: ["Biceps", "Brachialis"],
    exerciseType: "cable",
    equipmentType: "Cable Station",
    description:
      "A constant-tension cable curl for the biceps.",
    instructions: [
      "Attach a straight bar or suitable handle.",
      "Stand upright with a stable stance.",
      "Curl the handle toward your shoulders.",
      "Squeeze the biceps.",
      "Lower slowly.",
    ],
    tips: [
      "Keep your elbows near your sides.",
      "Avoid leaning backward.",
    ],
    commonMistakes: [
      "Using momentum.",
      "Swinging the torso.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "10-15",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "cable-triceps-pushdown",
      "preacher-curl-machine",
    ],
    alternativeMachineKeys: [
      "biceps-curl-machine",
    ],
    displayOrder: 440,
  },

  {
    key: "assisted-dip-machine",
    name: "Assisted Dip Machine",
    shortName: "Assisted Dip",
    category: "arms",
    bodyParts: ["triceps", "chest", "shoulders"],
    muscleGroups: [
      "Triceps",
      "Lower Chest",
      "Anterior Deltoid",
    ],
    exerciseType: "machine",
    equipmentType: "Assisted Dip",
    description:
      "An assisted bodyweight pressing movement for the triceps and chest.",
    instructions: [
      "Select an appropriate assistance level.",
      "Grip the handles.",
      "Lower your body under control.",
      "Press back to the starting position.",
      "Keep the movement smooth.",
    ],
    tips: [
      "Keep your shoulders controlled.",
      "Reduce assistance gradually as strength improves.",
    ],
    commonMistakes: [
      "Dropping too quickly.",
      "Using momentum.",
    ],
    difficulty: "intermediate",
    defaultSets: 3,
    defaultReps: "6-12",
    defaultRestSeconds: 90,
    recommendedMachineKeys: [
      "cable-triceps-pushdown",
      "triceps-extension-machine",
    ],
    alternativeMachineKeys: [
      "parallel-bar-dip",
    ],
    displayOrder: 450,
  },

  // ==================================================
  // CORE
  // ==================================================

  {
    key: "ab-crunch-machine",
    name: "Ab Crunch Machine",
    shortName: "Ab Crunch",
    category: "core",
    bodyParts: ["abs"],
    muscleGroups: [
      "Rectus Abdominis",
      "Obliques",
    ],
    exerciseType: "machine",
    equipmentType: "Ab Crunch",
    description:
      "A resistance machine for controlled abdominal flexion.",
    instructions: [
      "Adjust the seat and resistance.",
      "Position your body against the pads.",
      "Contract your abs to bring your torso forward.",
      "Pause briefly.",
      "Return slowly.",
    ],
    tips: [
      "Focus on curling the torso.",
      "Do not pull with your arms.",
    ],
    commonMistakes: [
      "Using momentum.",
      "Moving only the hips.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "12-20",
    defaultRestSeconds: 45,
    recommendedMachineKeys: [
      "cable-crunch",
      "captains-chair",
    ],
    alternativeMachineKeys: [
      "floor-crunch",
      "ab-wheel",
    ],
    displayOrder: 500,
  },

  {
    key: "captains-chair",
    name: "Captain's Chair",
    shortName: "Captain's Chair",
    category: "core",
    bodyParts: ["abs", "legs"],
    muscleGroups: [
      "Rectus Abdominis",
      "Hip Flexors",
      "Obliques",
    ],
    exerciseType: "machine",
    equipmentType: "Captain's Chair",
    description:
      "A bodyweight station commonly used for controlled knee and leg raises.",
    instructions: [
      "Support your body on the arm pads.",
      "Keep your back supported.",
      "Raise your knees toward your chest.",
      "Pause briefly.",
      "Lower under control.",
    ],
    tips: [
      "Avoid swinging.",
      "Focus on controlled abdominal contraction.",
    ],
    commonMistakes: [
      "Using momentum.",
      "Dropping the legs quickly.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "10-15",
    defaultRestSeconds: 45,
    recommendedMachineKeys: [
      "ab-crunch-machine",
      "cable-crunch",
    ],
    alternativeMachineKeys: [
      "hanging-knee-raise",
    ],
    displayOrder: 510,
  },

  {
    key: "roman-chair",
    name: "Roman Chair",
    shortName: "Roman Chair",
    category: "core",
    bodyParts: ["abs", "back", "glutes"],
    muscleGroups: [
      "Erector Spinae",
      "Rectus Abdominis",
      "Glutes",
    ],
    exerciseType: "bodyweight",
    equipmentType: "Roman Chair",
    description:
      "A support station for controlled trunk and posterior-chain exercises.",
    instructions: [
      "Position your body securely on the pads.",
      "Brace your core.",
      "Perform the selected movement under control.",
      "Avoid excessive spinal extension.",
    ],
    tips: [
      "Use slow controlled repetitions.",
      "Keep your spine comfortable.",
    ],
    commonMistakes: [
      "Hyperextending the lower back.",
      "Using momentum.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "10-15",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "ab-crunch-machine",
      "back-extension-machine",
    ],
    alternativeMachineKeys: [
      "floor-core-work",
    ],
    displayOrder: 520,
  },

  {
    key: "cable-crunch",
    name: "Cable Crunch",
    shortName: "Cable Crunch",
    category: "core",
    bodyParts: ["abs"],
    muscleGroups: [
      "Rectus Abdominis",
      "Obliques",
    ],
    exerciseType: "cable",
    equipmentType: "Cable Station",
    description:
      "A weighted abdominal exercise using a cable and rope attachment.",
    instructions: [
      "Attach a rope to the upper cable.",
      "Kneel at a comfortable distance.",
      "Hold the rope near your head.",
      "Curl your torso downward using your abs.",
      "Return slowly.",
    ],
    tips: [
      "Keep your hips relatively stable.",
      "Focus on spinal flexion rather than pulling with your arms.",
    ],
    commonMistakes: [
      "Turning the movement into a hip hinge.",
      "Using excessive weight.",
    ],
    difficulty: "intermediate",
    defaultSets: 3,
    defaultReps: "10-15",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "ab-crunch-machine",
      "captains-chair",
    ],
    alternativeMachineKeys: [
      "weighted-crunch",
    ],
    displayOrder: 530,
  },

  // ==================================================
  // CARDIO
  // ==================================================

  {
    key: "treadmill",
    name: "Treadmill",
    shortName: "Treadmill",
    category: "cardio",
    bodyParts: ["cardio", "legs"],
    muscleGroups: [
      "Cardiovascular System",
      "Quadriceps",
      "Hamstrings",
      "Calves",
    ],
    exerciseType: "cardio",
    equipmentType: "Treadmill",
    description:
      "A treadmill provides walking, jogging and running-based cardiovascular training.",
    instructions: [
      "Start at a comfortable speed.",
      "Maintain an upright posture.",
      "Keep your steps controlled.",
      "Increase speed or incline gradually.",
      "Cool down before stopping.",
    ],
    tips: [
      "Wear suitable training shoes.",
      "Increase intensity gradually.",
    ],
    commonMistakes: [
      "Starting too fast.",
      "Holding the rails unnecessarily.",
    ],
    difficulty: "beginner",
    defaultSets: 1,
    defaultReps: "15-30 min",
    defaultRestSeconds: 0,
    recommendedMachineKeys: [
      "elliptical-cross-trainer",
      "upright-bike",
    ],
    alternativeMachineKeys: [
      "outdoor-walking",
    ],
    displayOrder: 600,
  },

  {
    key: "elliptical-cross-trainer",
    name: "Elliptical / Cross Trainer",
    shortName: "Elliptical",
    category: "cardio",
    bodyParts: ["cardio", "legs", "arms"],
    muscleGroups: [
      "Cardiovascular System",
      "Quadriceps",
      "Glutes",
      "Hamstrings",
    ],
    exerciseType: "cardio",
    equipmentType: "Elliptical",
    description:
      "A low-impact cardio machine combining lower and upper body movement.",
    instructions: [
      "Step onto the pedals carefully.",
      "Hold the handles comfortably.",
      "Start at a low resistance.",
      "Maintain a steady rhythm.",
      "Increase resistance gradually if appropriate.",
    ],
    tips: [
      "Maintain an upright posture.",
      "Keep your movement smooth.",
    ],
    commonMistakes: [
      "Leaning heavily on the handles.",
      "Starting with excessive resistance.",
    ],
    difficulty: "beginner",
    defaultSets: 1,
    defaultReps: "15-30 min",
    defaultRestSeconds: 0,
    recommendedMachineKeys: [
      "treadmill",
      "upright-bike",
    ],
    alternativeMachineKeys: [
      "recumbent-bike",
    ],
    displayOrder: 610,
  },

  {
    key: "upright-bike",
    name: "Upright Exercise Bike",
    shortName: "Upright Bike",
    category: "cardio",
    bodyParts: ["cardio", "legs"],
    muscleGroups: [
      "Cardiovascular System",
      "Quadriceps",
      "Hamstrings",
      "Calves",
    ],
    exerciseType: "cardio",
    equipmentType: "Upright Bike",
    description:
      "A stationary cycling machine for cardiovascular conditioning.",
    instructions: [
      "Adjust the seat height.",
      "Place your feet securely on the pedals.",
      "Begin at a comfortable resistance.",
      "Maintain a steady cadence.",
      "Increase resistance gradually.",
    ],
    tips: [
      "Keep your knees comfortable.",
      "Maintain a stable posture.",
    ],
    commonMistakes: [
      "Incorrect seat height.",
      "Starting at excessive resistance.",
    ],
    difficulty: "beginner",
    defaultSets: 1,
    defaultReps: "15-30 min",
    defaultRestSeconds: 0,
    recommendedMachineKeys: [
      "treadmill",
      "elliptical-cross-trainer",
    ],
    alternativeMachineKeys: [
      "recumbent-bike",
      "spin-bike",
    ],
    displayOrder: 620,
  },

  {
    key: "recumbent-bike",
    name: "Recumbent Bike",
    shortName: "Recumbent Bike",
    category: "cardio",
    bodyParts: ["cardio", "legs"],
    muscleGroups: [
      "Cardiovascular System",
      "Quadriceps",
      "Hamstrings",
    ],
    exerciseType: "cardio",
    equipmentType: "Recumbent Bike",
    description:
      "A seated cardio machine with back support.",
    instructions: [
      "Adjust the seat so your knees remain comfortably bent.",
      "Place your feet on the pedals.",
      "Begin pedaling at a comfortable pace.",
      "Adjust resistance gradually.",
    ],
    tips: [
      "Keep your back supported.",
      "Maintain a steady pace.",
    ],
    commonMistakes: [
      "Incorrect seat adjustment.",
      "Starting with excessive resistance.",
    ],
    difficulty: "beginner",
    defaultSets: 1,
    defaultReps: "15-30 min",
    defaultRestSeconds: 0,
    recommendedMachineKeys: [
      "upright-bike",
      "elliptical-cross-trainer",
    ],
    alternativeMachineKeys: [
      "treadmill",
    ],
    displayOrder: 630,
  },

  {
    key: "spin-bike",
    name: "Spin Bike",
    shortName: "Spin Bike",
    category: "cardio",
    bodyParts: ["cardio", "legs"],
    muscleGroups: [
      "Cardiovascular System",
      "Quadriceps",
      "Hamstrings",
      "Calves",
    ],
    exerciseType: "cardio",
    equipmentType: "Spin Bike",
    description:
      "A cycling machine suitable for steady-state and interval cardio.",
    instructions: [
      "Adjust the seat and handlebar position.",
      "Start with low resistance.",
      "Pedal smoothly.",
      "Increase resistance according to the workout.",
      "Cool down gradually.",
    ],
    tips: [
      "Maintain a stable posture.",
      "Do not start at maximum resistance.",
    ],
    commonMistakes: [
      "Incorrect bike setup.",
      "Excessive resistance.",
    ],
    difficulty: "beginner",
    defaultSets: 1,
    defaultReps: "15-30 min",
    defaultRestSeconds: 0,
    recommendedMachineKeys: [
      "upright-bike",
      "treadmill",
    ],
    alternativeMachineKeys: [
      "recumbent-bike",
    ],
    displayOrder: 640,
  },

  {
    key: "rowing-machine",
    name: "Rowing Machine",
    shortName: "Rowing Machine",
    category: "cardio",
    bodyParts: ["cardio", "back", "legs", "arms"],
    muscleGroups: [
      "Cardiovascular System",
      "Quadriceps",
      "Glutes",
      "Back",
      "Biceps",
    ],
    exerciseType: "cardio",
    equipmentType: "Rowing Machine",
    description:
      "A full-body cardio machine combining leg drive, trunk control and upper-body pulling.",
    instructions: [
      "Secure your feet.",
      "Begin with the legs compressed.",
      "Drive through the legs.",
      "Then pull the handle toward your torso.",
      "Return smoothly in reverse order.",
    ],
    tips: [
      "Learn the movement sequence before increasing intensity.",
      "Keep the back controlled.",
    ],
    commonMistakes: [
      "Pulling with the arms too early.",
      "Rounding the back.",
    ],
    difficulty: "intermediate",
    defaultSets: 1,
    defaultReps: "10-20 min",
    defaultRestSeconds: 0,
    recommendedMachineKeys: [
      "treadmill",
      "elliptical-cross-trainer",
    ],
    alternativeMachineKeys: [
      "spin-bike",
    ],
    displayOrder: 650,
  },

  {
    key: "stair-climber",
    name: "Stair Climber",
    shortName: "Stair Climber",
    category: "cardio",
    bodyParts: ["cardio", "legs", "glutes"],
    muscleGroups: [
      "Cardiovascular System",
      "Quadriceps",
      "Glutes",
      "Calves",
    ],
    exerciseType: "cardio",
    equipmentType: "Stair Climber",
    description:
      "A stair-climbing cardio machine that strongly involves the lower body.",
    instructions: [
      "Step onto the machine carefully.",
      "Start at a low speed.",
      "Maintain an upright posture.",
      "Step continuously at a manageable pace.",
      "Cool down gradually.",
    ],
    tips: [
      "Use the rails only when needed.",
      "Keep your steps controlled.",
    ],
    commonMistakes: [
      "Leaning heavily on the rails.",
      "Starting too fast.",
    ],
    difficulty: "intermediate",
    defaultSets: 1,
    defaultReps: "10-20 min",
    defaultRestSeconds: 0,
    recommendedMachineKeys: [
      "treadmill",
      "elliptical-cross-trainer",
    ],
    alternativeMachineKeys: [
      "spin-bike",
    ],
    displayOrder: 660,
  },

  // ==================================================
  // FUNCTIONAL / FREE WEIGHT
  // ==================================================

  {
    key: "smith-machine",
    name: "Smith Machine",
    shortName: "Smith Machine",
    category: "functional",
    bodyParts: [
      "chest",
      "back",
      "shoulders",
      "legs",
    ],
    muscleGroups: [
      "Full Body",
      "Quadriceps",
      "Glutes",
      "Chest",
      "Shoulders",
    ],
    exerciseType: "free_weight",
    equipmentType: "Smith Machine",
    description:
      "A guided barbell system that can be used for presses, squats and other compound movements.",
    instructions: [
      "Set the safety stops appropriately.",
      "Choose a stable stance and setup.",
      "Perform the selected exercise with controlled movement.",
      "Keep the bar path controlled.",
    ],
    tips: [
      "Learn the exercise before adding significant load.",
      "Use safety catches correctly.",
    ],
    commonMistakes: [
      "Adding weight too quickly.",
      "Incorrect foot or body position.",
    ],
    difficulty: "intermediate",
    defaultSets: 3,
    defaultReps: "8-12",
    defaultRestSeconds: 90,
    recommendedMachineKeys: [
      "adjustable-bench",
      "flat-bench",
      "incline-bench",
    ],
    alternativeMachineKeys: [
      "power-rack",
      "squat-rack",
    ],
    displayOrder: 700,
  },

  {
    key: "power-rack",
    name: "Power Rack",
    shortName: "Power Rack",
    category: "functional",
    bodyParts: [
      "legs",
      "chest",
      "shoulders",
      "back",
    ],
    muscleGroups: [
      "Full Body",
      "Quadriceps",
      "Glutes",
      "Chest",
      "Shoulders",
    ],
    exerciseType: "free_weight",
    equipmentType: "Power Rack",
    description:
      "A versatile strength-training station for squats, presses and barbell exercises.",
    instructions: [
      "Set the rack height and safety bars.",
      "Use an appropriate barbell setup.",
      "Perform the selected compound exercise.",
      "Keep the movement controlled.",
    ],
    tips: [
      "Always set the safety bars correctly.",
      "Use a spotter when appropriate.",
    ],
    commonMistakes: [
      "Incorrect rack setup.",
      "Using unsafe loads.",
    ],
    difficulty: "intermediate",
    defaultSets: 3,
    defaultReps: "6-10",
    defaultRestSeconds: 120,
    recommendedMachineKeys: [
      "adjustable-bench",
      "barbell",
      "weight-plates",
    ],
    alternativeMachineKeys: [
      "smith-machine",
    ],
    displayOrder: 710,
  },

  {
    key: "adjustable-bench",
    name: "Adjustable Bench",
    shortName: "Adjustable Bench",
    category: "functional",
    bodyParts: [
      "chest",
      "shoulders",
      "arms",
      "legs",
    ],
    muscleGroups: [
      "Varies By Exercise",
    ],
    exerciseType: "free_weight",
    equipmentType: "Adjustable Bench",
    description:
      "An adjustable bench used with dumbbells, barbells and other equipment.",
    instructions: [
      "Adjust the bench angle for the selected exercise.",
      "Secure the bench.",
      "Perform the exercise with controlled technique.",
    ],
    tips: [
      "Check the adjustment mechanism before lifting.",
    ],
    commonMistakes: [
      "Incorrect bench angle.",
      "Unstable setup.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "8-15",
    defaultRestSeconds: 75,
    recommendedMachineKeys: [
      "dumbbell-rack",
      "smith-machine",
      "power-rack",
    ],
    alternativeMachineKeys: [
      "flat-bench",
    ],
    displayOrder: 720,
  },

  {
    key: "dumbbell-rack",
    name: "Dumbbell Rack",
    shortName: "Dumbbells",
    category: "functional",
    bodyParts: [
      "chest",
      "back",
      "shoulders",
      "arms",
      "legs",
    ],
    muscleGroups: [
      "Varies By Exercise",
    ],
    exerciseType: "free_weight",
    equipmentType: "Dumbbells",
    description:
      "Free weights that can be used for a wide variety of strength exercises.",
    instructions: [
      "Choose an appropriate dumbbell weight.",
      "Set up with stable posture.",
      "Perform the selected exercise using controlled movement.",
    ],
    tips: [
      "Choose weight based on technique, not ego.",
      "Keep movements controlled.",
    ],
    commonMistakes: [
      "Using excessive weight.",
      "Poor posture.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "8-15",
    defaultRestSeconds: 75,
    recommendedMachineKeys: [
      "adjustable-bench",
      "flat-bench",
      "incline-bench",
    ],
    alternativeMachineKeys: [
      "smith-machine",
    ],
    displayOrder: 730,
  },

  {
    key: "flat-bench",
    name: "Flat Bench",
    shortName: "Flat Bench",
    category: "functional",
    bodyParts: [
      "chest",
      "shoulders",
      "arms",
    ],
    muscleGroups: [
      "Varies By Exercise",
    ],
    exerciseType: "free_weight",
    equipmentType: "Flat Bench",
    description:
      "A stable flat bench for pressing, rowing and other strength exercises.",
    instructions: [
      "Ensure the bench is stable.",
      "Position yourself according to the exercise.",
      "Perform the movement under control.",
    ],
    tips: [
      "Check stability before use.",
    ],
    commonMistakes: [
      "Poor setup.",
      "Using unsuitable weight.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "8-15",
    defaultRestSeconds: 75,
    recommendedMachineKeys: [
      "dumbbell-rack",
      "barbell",
      "weight-plates",
    ],
    alternativeMachineKeys: [
      "adjustable-bench",
    ],
    displayOrder: 740,
  },

  {
    key: "incline-bench",
    name: "Incline Bench",
    shortName: "Incline Bench",
    category: "functional",
    bodyParts: [
      "chest",
      "shoulders",
      "arms",
    ],
    muscleGroups: [
      "Varies By Exercise",
    ],
    exerciseType: "free_weight",
    equipmentType: "Incline Bench",
    description:
      "An incline bench used for upper-body pressing and other exercises.",
    instructions: [
      "Set the bench at the required angle.",
      "Check that it is secure.",
      "Perform the selected movement with controlled technique.",
    ],
    tips: [
      "Choose a comfortable angle.",
    ],
    commonMistakes: [
      "Using an unstable setup.",
      "Choosing excessive weight.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "8-15",
    defaultRestSeconds: 75,
    recommendedMachineKeys: [
      "dumbbell-rack",
      "smith-machine",
    ],
    alternativeMachineKeys: [
      "adjustable-bench",
    ],
    displayOrder: 750,
  },

  // ==================================================
  // GENERAL CABLE / MULTI PURPOSE
  // ==================================================

  {
    key: "functional-trainer",
    name: "Functional Trainer",
    shortName: "Functional Trainer",
    category: "functional",
    bodyParts: [
      "chest",
      "back",
      "shoulders",
      "arms",
      "legs",
      "core",
    ],
    muscleGroups: [
      "Varies By Exercise",
    ],
    exerciseType: "cable",
    equipmentType: "Functional Trainer",
    description:
      "A dual adjustable cable system that supports a large range of exercises.",
    instructions: [
      "Set the pulley height according to the exercise.",
      "Select the appropriate attachment.",
      "Use a stable stance.",
      "Perform the movement with controlled resistance.",
    ],
    tips: [
      "Keep the cable path clear.",
      "Use the correct attachment.",
    ],
    commonMistakes: [
      "Incorrect pulley height.",
      "Using excessive weight.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "10-15",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "cable-crossover",
      "face-pull-cable",
      "cable-triceps-pushdown",
    ],
    alternativeMachineKeys: [
      "adjustable-cable-machine",
    ],
    displayOrder: 800,
  },

  {
    key: "multi-gym-station",
    name: "Multi Gym Station",
    shortName: "Multi Gym",
    category: "functional",
    bodyParts: [
      "chest",
      "back",
      "shoulders",
      "arms",
      "legs",
    ],
    muscleGroups: [
      "Varies By Exercise",
    ],
    exerciseType: "machine",
    equipmentType: "Multi Gym",
    description:
      "A multi-station resistance machine combining several common gym movements.",
    instructions: [
      "Identify the station for the selected exercise.",
      "Adjust the seat and pads correctly.",
      "Select an appropriate resistance.",
      "Perform controlled repetitions.",
    ],
    tips: [
      "Read the machine labels before use.",
      "Start with manageable resistance.",
    ],
    commonMistakes: [
      "Incorrect setup.",
      "Using excessive weight.",
    ],
    difficulty: "beginner",
    defaultSets: 3,
    defaultReps: "10-15",
    defaultRestSeconds: 60,
    recommendedMachineKeys: [
      "chest-press-machine",
      "lat-pulldown-machine",
      "leg-extension-machine",
    ],
    alternativeMachineKeys: [
      "functional-trainer",
    ],
    displayOrder: 810,
  },
];

// ==================================================
// DEFAULT MEDIA
// ==================================================
// Keep media separate from the workout catalog.
// Admin-uploaded/custom media will override these values.
//
// IMPORTANT:
// Only put verified public URLs here.
// Leave a value empty when no verified source is available.

const MACHINE_MEDIA = {
  "chest-press-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "incline-chest-press-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "decline-chest-press-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "pec-deck-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "cable-crossover": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "lat-pulldown-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "seated-cable-row": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "t-bar-row-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "assisted-pull-up-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "chest-supported-row-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "back-extension-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "shoulder-press-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "lateral-raise-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "rear-delt-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "face-pull-cable": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "leg-press-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "hack-squat-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "leg-extension-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "seated-leg-curl-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "lying-leg-curl-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "calf-raise-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "hip-abductor-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "hip-adductor-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "glute-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "preacher-curl-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "biceps-curl-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "triceps-extension-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "cable-triceps-pushdown": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "cable-biceps-curl": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "assisted-dip-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "ab-crunch-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "captains-chair": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "roman-chair": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "cable-crunch": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "treadmill": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "elliptical-cross-trainer": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "upright-bike": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "recumbent-bike": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "spin-bike": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "rowing-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "stair-climber": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "smith-machine": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "power-rack": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "adjustable-bench": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "dumbbell-rack": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "flat-bench": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "incline-bench": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "functional-trainer": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },

  "multi-gym-station": {
    imageUrl: "",
    tutorialUrl: "",
    tutorialPlatform: "",
  },
};

// Merge media into the catalog without changing the existing
// workout/exercise information.
const MACHINES_WITH_MEDIA = MACHINES.map((machine) => ({
  ...machine,
  ...(MACHINE_MEDIA[machine.key] || {}),
}));

export default MACHINES_WITH_MEDIA;
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Check,
  ChevronDown,
  Dumbbell,
  ExternalLink,
  ImagePlus,
  Link2,
  Loader2,
  Play,
  Search,
  Sparkles,
  Upload,
  Video,
  X,
} from "lucide-react";

const CATEGORIES = [
  { key: "all", label: "All Equipment" },
  { key: "chest", label: "Chest" },
  { key: "back", label: "Back" },
  { key: "shoulders", label: "Shoulders" },
  { key: "legs", label: "Legs" },
  { key: "arms", label: "Arms" },
  { key: "core", label: "Core" },
  { key: "cardio", label: "Cardio" },
  { key: "functional", label: "Functional" },
];

const CATEGORY_META = {
  chest: {
    label: "Chest",
    icon: "CHEST",
  },
  back: {
    label: "Back",
    icon: "BACK",
  },
  shoulders: {
    label: "Shoulders",
    icon: "SHOULDER",
  },
  legs: {
    label: "Legs",
    icon: "LEGS",
  },
  arms: {
    label: "Arms",
    icon: "ARMS",
  },
  core: {
    label: "Core",
    icon: "CORE",
  },
  cardio: {
    label: "Cardio",
    icon: "CARDIO",
  },
  functional: {
    label: "Functional",
    icon: "FUNCTIONAL",
  },
  full_body: {
    label: "Full Body",
    icon: "FULL",
  },
};

function formatCategory(category) {
  return (
    CATEGORY_META[category]?.label ||
    category
      ?.replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      ) ||
    "Equipment"
  );
}

function getTutorialLabel(platform) {
  if (platform === "youtube") return "YouTube";
  if (platform === "instagram") return "Instagram";
  if (platform === "google_drive") return "Google Drive";
  if (platform === "other") return "Tutorial";
  return "";
}

function getInitials(name = "Machine") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function WorkoutMachinesPage() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [uploadingKey, setUploadingKey] = useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [showInactive, setShowInactive] = useState(false);

  const [selectedMachine, setSelectedMachine] =
    useState(null);

  const [tutorialUrl, setTutorialUrl] =
    useState("");

  const [imagePreview, setImagePreview] =
    useState("");

  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);
  const uploadMachineRef = useRef(null);

  const notify = (type, message) => {
    setToast({ type, message });

    window.clearTimeout(
      notify.timeoutId
    );

    notify.timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  const loadMachines = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      params.set(
  "isActive",
  String(!showInactive)
);

      if (category !== "all") {
        params.set("category", category);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(
        `/api/admin/workout-machines?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load workout machines."
        );
      }

      setMachines(data.machines || []);
    } catch (error) {
      console.error(error);

      notify(
        "error",
        error.message ||
          "Failed to load workout machines."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadMachines();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search, category, showInactive]);

  const stats = useMemo(() => {
    const active = machines.filter(
      (machine) => machine.isActive
    );

    const withImages = machines.filter(
      (machine) =>
        Boolean(machine.imageUrl)
    );

    const withTutorials = machines.filter(
      (machine) =>
        Boolean(machine.tutorialUrl)
    );

    return {
      total: machines.length,
      active: active.length,
      images: withImages.length,
      tutorials: withTutorials.length,
    };
  }, [machines]);

  const openEditor = (machine) => {
    setSelectedMachine(machine);
    setTutorialUrl(
      machine.tutorialUrl || ""
    );
    setImagePreview(
      machine.imageUrl || ""
    );
  };

  const closeEditor = () => {
    if (savingKey || uploadingKey) return;

    setSelectedMachine(null);
    setTutorialUrl("");
    setImagePreview("");
  };

  const saveMachine = async () => {
    if (!selectedMachine) return;

    try {
      setSavingKey(selectedMachine.key);

      const response = await fetch(
        "/api/admin/workout-machines",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: selectedMachine.key,
            imageUrl:
              selectedMachine.imageUrl || "",
            imagePublicId:
              selectedMachine.imagePublicId || "",
            tutorialUrl:
              tutorialUrl.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to save machine."
        );
      }

      setMachines((current) =>
        current.map((machine) =>
          machine.key ===
          selectedMachine.key
            ? data.machine
            : machine
        )
      );

      setSelectedMachine(data.machine);
      setImagePreview(
        data.machine.imageUrl || ""
      );

      notify(
        "success",
        "Machine details saved."
      );
    } catch (error) {
      console.error(error);

      notify(
        "error",
        error.message ||
          "Failed to save machine."
      );
    } finally {
      setSavingKey(null);
    }
  };

  const uploadImage = async (file) => {
    if (!selectedMachine || !file) return;

    try {
      setUploadingKey(
        selectedMachine.key
      );

      const formData = new FormData();

      formData.append("file", file);
      formData.append(
        "folder",
        "workoutMachines"
      );

      const uploadResponse =
        await fetch(
          "/api/admin/upload",
          {
            method: "POST",
            body: formData,
          }
        );

      const uploadData =
        await uploadResponse.json();

      if (
        !uploadResponse.ok ||
        !uploadData.success
      ) {
        throw new Error(
          uploadData.message ||
            "Image upload failed."
        );
      }

      const saveResponse =
        await fetch(
          "/api/admin/workout-machines",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              key: selectedMachine.key,
              imageUrl:
                uploadData.url,
              imagePublicId:
                uploadData.publicId,
            }),
          }
        );

      const saveData =
        await saveResponse.json();

      if (
        !saveResponse.ok ||
        !saveData.success
      ) {
        throw new Error(
          saveData.message ||
            "Machine image could not be saved."
        );
      }

      setMachines((current) =>
        current.map((machine) =>
          machine.key ===
          selectedMachine.key
            ? saveData.machine
            : machine
        )
      );

      setSelectedMachine(
        saveData.machine
      );

      setImagePreview(
        saveData.machine.imageUrl || ""
      );

      notify(
        "success",
        "Machine image uploaded."
      );
    } catch (error) {
      console.error(error);

      notify(
        "error",
        error.message ||
          "Image upload failed."
      );
    } finally {
      setUploadingKey(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify(
        "error",
        "Please select an image file."
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      notify(
        "error",
        "Image must be smaller than 10 MB."
      );
      return;
    }

    uploadImage(file);
  };

  const deactivateMachine = async (
    machine
  ) => {
    const confirmed = window.confirm(
      `Deactivate ${machine.name}?`
    );

    if (!confirmed) return;

    try {
      setSavingKey(machine.key);

      const response = await fetch(
        `/api/admin/workout-machines?key=${encodeURIComponent(
          machine.key
        )}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to deactivate machine."
        );
      }

      setMachines((current) =>
        current.filter(
          (item) =>
            item.key !== machine.key
        )
      );

      if (
        selectedMachine?.key ===
        machine.key
      ) {
        closeEditor();
      }

      notify(
        "success",
        "Machine deactivated."
      );
    } catch (error) {
      console.error(error);

      notify(
        "error",
        error.message ||
          "Failed to deactivate machine."
      );
    } finally {
      setSavingKey(null);
    }
  };

  const activateMachine = async (
    machine
  ) => {
    try {
      setSavingKey(machine.key);

      const response = await fetch(
        "/api/admin/workout-machines",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            key: machine.key,
            isActive: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to activate machine."
        );
      }

      await loadMachines();

      notify(
        "success",
        "Machine activated."
      );
    } catch (error) {
      console.error(error);

      notify(
        "error",
        error.message ||
          "Failed to activate machine."
      );
    } finally {
      setSavingKey(null);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const totalCatalogCount = 50;

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-orange-500/[0.07] blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-orange-600/[0.04] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {/* HEADER */}
        <section className="mb-7 overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#171717] via-[#101010] to-[#0b0b0b] shadow-2xl">
          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-orange-500/[0.08] blur-3xl" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">
                  <Dumbbell size={14} />
                  Workout Library
                </div>

                <h1 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                  Gym equipment
                  <span className="text-orange-500">
                    {" "}
                    library.
                  </span>
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                  Your exercise catalog is already
                  pre-configured. You only need to add
                  machine photos and tutorial links.
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-orange-500/20 bg-black/30 px-4 py-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                  <Sparkles size={20} />
                </div>

                <div>
                  <p className="text-xs font-medium text-zinc-500">
                    Automated catalog
                  </p>
                  <p className="text-sm font-bold text-white">
                    {totalCatalogCount}+ exercises
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={<Dumbbell size={19} />}
            label="Equipment"
            value={stats.total}
          />

          <StatCard
            icon={<Activity size={19} />}
            label="Active"
            value={stats.active}
          />

          <StatCard
            icon={<ImagePlus size={19} />}
            label="With Photos"
            value={stats.images}
          />

          <StatCard
            icon={<Video size={19} />}
            label="Tutorials"
            value={stats.tutorials}
          />
        </section>

        {/* FILTERS */}
        <section className="mb-6 rounded-2xl border border-white/[0.07] bg-[#101010] p-3 shadow-xl sm:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search machines, muscles or body parts..."
                className="h-12 w-full rounded-xl border border-white/[0.07] bg-[#080808] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 xl:max-w-[760px]">
              {CATEGORIES.map(
                (item) => (
                  <button
                    key={item.key}
                    onClick={() =>
                      setCategory(item.key)
                    }
                    className={`whitespace-nowrap rounded-xl px-4 py-3 text-xs font-bold transition ${
                      category === item.key
                        ? "bg-orange-500 text-black shadow-lg shadow-orange-500/10"
                        : "border border-white/[0.06] bg-[#080808] text-zinc-400 hover:border-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() =>
                setShowInactive(
                  (value) => !value
                )
              }
              className={`flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold transition ${
                showInactive
                  ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                  : "border-white/[0.07] bg-[#080808] text-zinc-400 hover:text-white"
              }`}
            >
              <Activity size={15} />
              {showInactive
                ? "All equipment"
                : "Active only"}
            </button>
          </div>
        </section>

        {/* CONTENT */}
        {loading ? (
          <LoadingState />
        ) : machines.length === 0 ? (
          <EmptyState
            search={search}
            onClear={() => {
              setSearch("");
              setCategory("all");
            }}
          />
        ) : (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {machines.map(
              (machine) => (
                <MachineCard
                  key={machine.key}
                  machine={machine}
                  saving={
                    savingKey ===
                    machine.key
                  }
                  onEdit={() =>
                    openEditor(machine)
                  }
                  onDeactivate={() =>
                    deactivateMachine(
                      machine
                    )
                  }
                  onActivate={() =>
                    activateMachine(
                      machine
                    )
                  }
                />
              )
            )}
          </section>
        )}
      </div>

      {/* HIDDEN FILE INPUT */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* EDIT DRAWER */}
      {selectedMachine && (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close"
            onClick={closeEditor}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-white/[0.08] bg-[#0c0c0c] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                  Machine setup
                </p>

                <h2 className="mt-1 text-xl font-black text-white">
                  {selectedMachine.name}
                </h2>
              </div>

              <button
                onClick={closeEditor}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
              {/* IMAGE */}
              <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111]">
                <div className="relative aspect-[16/10]">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={
                        selectedMachine.name
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-orange-500/10 to-transparent">
                      <Dumbbell
                        size={42}
                        className="text-orange-500/50"
                      />

                      <p className="mt-3 text-sm font-bold text-zinc-400">
                        No machine photo
                      </p>
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 pt-12">
                    <span className="rounded-lg bg-black/70 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-orange-400 backdrop-blur">
                      {formatCategory(
                        selectedMachine.category
                      )}
                    </span>

                    <button
                      disabled={
                        uploadingKey ===
                        selectedMachine.key
                      }
                      onClick={
                        triggerUpload
                      }
                      className="flex items-center gap-2 rounded-xl bg-orange-500 px-3.5 py-2.5 text-xs font-black text-black shadow-lg shadow-orange-500/20 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {uploadingKey ===
                      selectedMachine.key ? (
                        <>
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />
                          Uploading
                        </>
                      ) : (
                        <>
                          <Upload
                            size={15}
                          />
                          {imagePreview
                            ? "Change photo"
                            : "Upload photo"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* AUTO INFO */}
              <div className="mt-5 rounded-2xl border border-orange-500/15 bg-orange-500/[0.04] p-4">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                    <Sparkles size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white">
                      Smart catalog information
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Category, muscles, difficulty,
                      instructions, sets, reps and
                      related equipment are already
                      managed by the system.
                    </p>
                  </div>
                </div>
              </div>

              {/* BODY PARTS */}
              <div className="mt-6">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Target muscles
                </label>

                <div className="flex flex-wrap gap-2">
                  {(
                    selectedMachine.bodyParts ||
                    []
                  ).map((part) => (
                    <span
                      key={part}
                      className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-xs font-semibold text-zinc-300"
                    >
                      {part.replaceAll(
                        "_",
                        " "
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* TUTORIAL */}
              <div className="mt-6">
                <label className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
                  <span>
                    Tutorial / Video Link
                  </span>

                  {selectedMachine.tutorialPlatform && (
                    <span className="normal-case tracking-normal text-orange-400">
                      {getTutorialLabel(
                        selectedMachine.tutorialPlatform
                      )}
                    </span>
                  )}
                </label>

                <div className="relative">
                  <Link2
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                  />

                  <input
                    value={tutorialUrl}
                    onChange={(event) =>
                      setTutorialUrl(
                        event.target.value
                      )
                    }
                    placeholder="https://youtube.com/..."
                    className="h-12 w-full rounded-xl border border-white/[0.07] bg-[#080808] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10"
                  />
                </div>

                <p className="mt-2 text-xs text-zinc-600">
                  YouTube, Instagram, Google Drive or
                  another tutorial link.
                </p>

                {tutorialUrl &&
                  /^https?:\/\//i.test(
                    tutorialUrl
                  ) && (
                    <a
                      href={tutorialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-orange-400 hover:text-orange-300"
                    >
                      Preview tutorial
                      <ExternalLink
                        size={13}
                      />
                    </a>
                  )}
              </div>

              {/* WORKOUT DETAILS */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <InfoBox
                  label="Difficulty"
                  value={
                    selectedMachine.difficulty
                  }
                />

                <InfoBox
                  label="Exercise type"
                  value={
                    selectedMachine.exerciseType
                  }
                />

                <InfoBox
                  label="Default sets"
                  value={
                    selectedMachine.defaultSets
                  }
                />

                <InfoBox
                  label="Default reps"
                  value={
                    selectedMachine.defaultReps
                  }
                />
              </div>

              {/* DESCRIPTION */}
              {selectedMachine.description && (
                <div className="mt-6 rounded-2xl border border-white/[0.07] bg-[#111] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                    Description
                  </p>

                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {
                      selectedMachine.description
                    }
                  </p>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="border-t border-white/[0.07] bg-[#0c0c0c] p-5 sm:px-7">
              <button
                onClick={saveMachine}
                disabled={
                  savingKey ===
                  selectedMachine.key
                }
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-black text-black shadow-xl shadow-orange-500/10 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingKey ===
                selectedMachine.key ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={17} />
                    Save Machine
                  </>
                )}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[70] flex max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${
            toast.type === "error"
              ? "border-red-500/20 bg-[#170b0b] text-red-300"
              : "border-orange-500/20 bg-[#15100a] text-orange-300"
          }`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              toast.type === "error"
                ? "bg-red-500/10"
                : "bg-orange-500/10"
            }`}
          >
            {toast.type === "error" ? (
              <X size={16} />
            ) : (
              <Check size={16} />
            )}
          </div>

          <p className="text-sm font-semibold">
            {toast.message}
          </p>
        </div>
      )}
    </main>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function StatCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-4 shadow-lg sm:p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
          {icon}
        </div>

        <ArrowUpRight
          size={15}
          className="text-zinc-700"
        />
      </div>

      <p className="mt-4 text-xs font-semibold text-zinc-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function MachineCard({
  machine,
  saving,
  onEdit,
  onDeactivate,
  onActivate,
}) {
  const category =
    CATEGORY_META[
      machine.category
    ];

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101010] shadow-xl transition duration-300 hover:-translate-y-1 hover:border-orange-500/20 hover:shadow-orange-500/[0.04]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#151515]">
        {machine.imageUrl ? (
          <img
            src={machine.imageUrl}
            alt={machine.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="relative flex h-full items-center justify-center overflow-hidden bg-gradient-to-br from-orange-500/10 via-[#151515] to-[#0b0b0b]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(249,115,22,0.12),transparent_45%)]" />

            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-orange-500/15 bg-orange-500/[0.06] text-orange-500/60">
              <Dumbbell size={34} />
            </div>

            <span className="absolute bottom-4 left-4 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
              Photo not added
            </span>
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span className="rounded-lg border border-white/10 bg-black/70 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-orange-400 backdrop-blur">
            {category?.label ||
              formatCategory(
                machine.category
              )}
          </span>

          <span
            className={`rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider backdrop-blur ${
              machine.isActive
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-red-500/15 text-red-300"
            }`}
          >
            {machine.isActive
              ? "Active"
              : "Inactive"}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-4 pt-16">
          <h3 className="truncate text-lg font-black text-white">
            {machine.name}
          </h3>

          <p className="mt-0.5 truncate text-xs text-zinc-400">
            {machine.equipmentType}
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-1.5">
          {(
            machine.bodyParts || []
          )
            .slice(0, 3)
            .map((part) => (
              <span
                key={part}
                className="rounded-md bg-white/[0.04] px-2 py-1 text-[10px] font-semibold capitalize text-zinc-500"
              >
                {part.replaceAll(
                  "_",
                  " "
                )}
              </span>
            ))}

          {machine.bodyParts?.length >
            3 && (
            <span className="rounded-md bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-zinc-600">
              +
              {machine.bodyParts.length -
                3}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex items-center gap-1.5 text-[11px] font-bold ${
                machine.imageUrl
                  ? "text-emerald-400"
                  : "text-zinc-600"
              }`}
            >
              {machine.imageUrl ? (
                <Check size={13} />
              ) : (
                <ImagePlus size={13} />
              )}
              Photo
            </span>

            <span
              className={`flex items-center gap-1.5 text-[11px] font-bold ${
                machine.tutorialUrl
                  ? "text-emerald-400"
                  : "text-zinc-600"
              }`}
            >
              {machine.tutorialUrl ? (
                <Check size={13} />
              ) : (
                <Video size={13} />
              )}
              Video
            </span>
          </div>

          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-3 py-2 text-xs font-black text-orange-400 transition hover:bg-orange-500 hover:text-black"
          >
            Manage
            <ChevronDown
              size={14}
              className="-rotate-90"
            />
          </button>
        </div>

        {machine.isActive ? (
          <button
            disabled={saving}
            onClick={onDeactivate}
            className="mt-3 w-full rounded-lg py-1.5 text-[10px] font-bold text-zinc-700 transition hover:bg-red-500/[0.05] hover:text-red-400 disabled:opacity-50"
          >
            {saving
              ? "Updating..."
              : "Deactivate equipment"}
          </button>
        ) : (
          <button
            disabled={saving}
            onClick={onActivate}
            className="mt-3 w-full rounded-lg py-1.5 text-[10px] font-bold text-orange-500 transition hover:bg-orange-500/[0.05] disabled:opacity-50"
          >
            {saving
              ? "Updating..."
              : "Activate equipment"}
          </button>
        )}
      </div>
    </article>
  );
}

function InfoBox({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
        {label}
      </p>

      <p className="mt-1.5 truncate text-sm font-bold capitalize text-zinc-200">
        {String(value ?? "-").replaceAll(
          "_",
          " "
        )}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 8 }).map(
        (_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#101010]"
          >
            <div className="aspect-[16/10] animate-pulse bg-white/[0.04]" />

            <div className="space-y-3 p-4">
              <div className="h-5 w-3/4 animate-pulse rounded bg-white/[0.05]" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.04]" />
              <div className="h-9 animate-pulse rounded bg-white/[0.04]" />
            </div>
          </div>
        )
      )}
    </div>
  );
}

function EmptyState({
  search,
  onClear,
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/[0.1] bg-[#101010] px-6 py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
        <Dumbbell size={28} />
      </div>

      <h3 className="mt-5 text-xl font-black text-white">
        No equipment found
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
        {search
          ? "Try a different machine name, muscle group or body part."
          : "There are no machines matching the current filter."}
      </p>

      <button
        onClick={onClear}
        className="mt-5 rounded-xl bg-orange-500 px-5 py-3 text-xs font-black text-black transition hover:bg-orange-400"
      >
        Clear filters
      </button>
    </div>
  );
}
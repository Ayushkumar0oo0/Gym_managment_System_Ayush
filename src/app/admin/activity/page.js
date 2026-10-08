"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Activity,
  Clock3,
  User,
  Database,
  Eye,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function AdminActivityPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState("all");
  const [admins, setAdmins] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadAdmins();
    loadActivities(1, "all", "");
  }, []);

  async function loadAdmins() {
    try {
      const response = await fetch(
        "/api/admin/admin-accounts",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load admins."
        );
      }

      setAdmins(data.admins || []);
    } catch (err) {
      console.error("LOAD ADMINS ERROR:", err);
    }
  }

  async function loadActivities(
    currentPage = 1,
    adminFilter = "all",
    searchQuery = ""
  ) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set("page", currentPage.toString());
      params.set("limit", "20");

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      if (adminFilter !== "all") {
        params.set("admin", adminFilter);
      }

      const response = await fetch(
        `/api/admin/activity?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load activity."
        );
      }

      setActivities(data.activities || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("LOAD ACTIVITY ERROR:", err);

      setError(
        err.message || "Failed to load activity."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event) {
    event.preventDefault();

    setPage(1);
    loadActivities(1, selectedAdmin, search);
  }

  function handleAdminFilter(event) {
    const value = event.target.value;

    setSelectedAdmin(value);
    setPage(1);

    loadActivities(1, value, search);
  }

  function changePage(newPage) {
    if (newPage < 1 || newPage > totalPages) {
      return;
    }

    setPage(newPage);
    loadActivities(
      newPage,
      selectedAdmin,
      search
    );
  }

  function refresh() {
    loadActivities(
      page,
      selectedAdmin,
      search
    );
  }

  function formatDate(date) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatAction(action) {
    if (!action) return "Unknown Action";

    return action
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  function getActionConfig(action) {
    if (!action) {
      return {
        className:
          "border-zinc-700 bg-zinc-800 text-zinc-300",
        dot: "bg-zinc-500",
      };
    }

    const normalizedAction = action.toUpperCase();

    if (
      normalizedAction.includes("DELETE") ||
      normalizedAction.includes("DEACTIVATE") ||
      normalizedAction.includes("BLOCK") ||
      normalizedAction.includes("CANCEL")
    ) {
      return {
        className:
          "border-red-500/20 bg-red-500/10 text-red-400",
        dot: "bg-red-500",
      };
    }

    if (
      normalizedAction.includes("PAYMENT") ||
      normalizedAction.includes("REVENUE") ||
      normalizedAction.includes("CONFIRM")
    ) {
      return {
        className:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
        dot: "bg-emerald-500",
      };
    }

    if (
      normalizedAction.includes("CREATE") ||
      normalizedAction.includes("ACTIVATE") ||
      normalizedAction.includes("ADD")
    ) {
      return {
        className:
          "border-blue-500/20 bg-blue-500/10 text-blue-400",
        dot: "bg-blue-500",
      };
    }

    if (
      normalizedAction.includes("UPDATE") ||
      normalizedAction.includes("CHANGE") ||
      normalizedAction.includes("EDIT")
    ) {
      return {
        className:
          "border-amber-500/20 bg-amber-500/10 text-amber-400",
        dot: "bg-amber-500",
      };
    }

    return {
      className:
        "border-zinc-700 bg-zinc-800 text-zinc-300",
      dot: "bg-zinc-500",
    };
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-orange-500">
              <ShieldCheck className="h-4 w-4" />
              Security & Audit
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Admin Activity
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
              Track important actions performed by gym
              administrators.
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-3 text-sm font-bold text-zinc-300 transition hover:border-orange-500/30 hover:text-orange-400 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>

        {/* SECURITY BANNER */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-orange-500/20 bg-orange-500/[0.04]">
          <div className="flex items-start gap-4 p-5 sm:p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-black">
                Audit Log
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">
                Important administrator actions are recorded
                here so the gym can see who performed an
                operation and when it happened.
              </p>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="mb-6 rounded-2xl border border-white/[0.08] bg-zinc-950 p-5 sm:p-6">
          <form
            onSubmit={handleSearch}
            className="grid gap-4 lg:grid-cols-[1fr_250px_auto]"
          >
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                Search Activity
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-700" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search activity..."
                  className="input pl-11"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                Admin
              </label>

              <select
                value={selectedAdmin}
                onChange={handleAdminFilter}
                className="input"
              >
                <option value="all">
                  All Admins
                </option>

                {admins.map((admin) => (
                  <option
                    key={admin._id}
                    value={admin._id}
                  >
                    {admin.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-black text-black transition hover:bg-orange-400 disabled:opacity-50 lg:w-auto"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
          </form>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-4 text-sm text-red-400">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ACTIVITY */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950">
          <div className="flex flex-col gap-2 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="font-black">
                Activity History
              </h2>

              <p className="mt-1 text-xs text-zinc-600">
                Recent administrator operations.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/[0.07] bg-black px-3 py-1.5 text-xs font-bold text-zinc-500">
              <Activity className="h-3.5 w-3.5 text-orange-500" />
              Page {page} / {totalPages}
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-orange-500" />

                <p className="mt-3 text-sm text-zinc-600">
                  Loading activity...
                </p>
              </div>
            </div>
          ) : activities.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
                <Activity className="h-7 w-7" />
              </div>

              <h3 className="mt-5 font-black">
                No activity found
              </h3>

              <p className="mt-2 text-sm text-zinc-600">
                Try changing your search or admin filter.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {activities.map((activity) => {
                const actionConfig =
                  getActionConfig(activity.action);

                return (
                  <div
                    key={activity._id}
                    className="p-5 transition hover:bg-white/[0.015] sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      {/* LEFT */}
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-sm font-black text-orange-500">
                          {activity.admin?.name
                            ?.charAt(0)
                            ?.toUpperCase() || "A"}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-white">
                              {activity.admin?.name ||
                                "Unknown Admin"}
                            </span>

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${actionConfig.className}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${actionConfig.dot}`}
                              />
                              {formatAction(
                                activity.action
                              )}
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-zinc-400">
                            {activity.description ||
                              "No description available."}
                          </p>

                          {activity.entityType && (
                            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black px-3 py-2 text-xs text-zinc-600">
                              <Database className="h-3.5 w-3.5 text-zinc-700" />

                              <span>
                                Entity:{" "}
                                <span className="font-bold text-zinc-400">
                                  {activity.entityType}
                                </span>
                              </span>

                              {activity.entityId && (
                                <span className="max-w-[180px] truncate text-zinc-700">
                                  • {activity.entityId}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-700">
                            <span className="flex items-center gap-1.5">
                              <Clock3 className="h-3.5 w-3.5" />
                              {formatDate(
                                activity.createdAt
                              )}
                            </span>

                            {activity.admin?.email && (
                              <span className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" />
                                {activity.admin.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* METADATA */}
                      {activity.metadata &&
                        typeof activity.metadata ===
                          "object" &&
                        Object.keys(activity.metadata)
                          .length > 0 && (
                          <details className="w-full lg:w-auto lg:max-w-sm">
                            <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-black px-4 py-2.5 text-xs font-bold text-zinc-500 transition hover:border-orange-500/20 hover:text-orange-400">
                              <Eye className="h-3.5 w-3.5" />
                              View Details
                            </summary>

                            <pre className="mt-3 max-h-64 overflow-auto rounded-xl border border-white/[0.07] bg-black p-4 text-left text-[11px] leading-5 text-zinc-600">
                              {JSON.stringify(
                                activity.metadata,
                                null,
                                2
                              )}
                            </pre>
                          </details>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {!loading && activities.length > 0 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs font-bold text-zinc-600">
              Page {page} of {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  changePage(page - 1)
                }
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm font-bold text-zinc-400 transition hover:border-orange-500/30 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  changePage(page + 1)
                }
                disabled={
                  page >= totalPages || loading
                }
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm font-bold text-zinc-400 transition hover:border-orange-500/30 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: #080808;
          padding: 0.75rem 1rem;
          color: white;
          outline: none;
          transition: all 150ms ease;
        }

        .input::placeholder {
          color: #3f3f46;
        }

        .input:focus {
          border-color: rgba(249, 115, 22, 0.7);
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.06);
        }

        select.input option {
          background: #090909;
          color: white;
        }
      `}</style>
    </div>
  );
}
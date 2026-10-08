"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Dumbbell,
  Edit3,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserRound,
  Users,
  X,
  XCircle,
} from "lucide-react";

/* =========================================================
   HELPERS
========================================================= */

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "0";
  }

  return number.toLocaleString("en-IN");
}

function capitalize(value) {
  if (!value) return "";

  const text = String(value);

  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  );
}

function formatPaymentType(type) {
  if (!type) return "-";

  return String(type)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
        active
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : "border-red-500/20 bg-red-500/10 text-red-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active
            ? "bg-emerald-500"
            : "bg-red-500"
        }`}
      />

      {active ? "Active" : "Inactive"}
    </span>
  );
}

/* =========================================================
   REGISTRATION BADGE
========================================================= */

function RegistrationBadge({ paid }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
        paid
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : "border-red-500/20 bg-red-500/10 text-red-400"
      }`}
    >
      {paid ? (
        <CheckCircle2 size={12} />
      ) : (
        <XCircle size={12} />
      )}

      {paid ? "Paid" : "Unpaid"}
    </span>
  );
}

/* =========================================================
   PAYMENT STATUS
========================================================= */

function PaymentStatus({ status }) {
  const normalized = String(
    status || ""
  ).toLowerCase();

  let className =
    "border-white/10 bg-white/5 text-white/50";

  if (normalized === "paid") {
    className =
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  } else if (normalized === "pending") {
    className =
      "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";
  } else if (normalized === "failed") {
    className =
      "border-red-500/20 bg-red-500/10 text-red-400";
  } else if (normalized === "refunded") {
    className =
      "border-purple-500/20 bg-purple-500/10 text-purple-400";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${className}`}
    >
      {capitalize(status || "unknown")}
    </span>
  );
}

/* =========================================================
   STATUS TEXT
========================================================= */

function StatusText({ status }) {
  const normalized = String(
    status || ""
  ).toLowerCase();

  let className =
    "border-white/10 bg-white/5 text-white/50";

  if (normalized === "active") {
    className =
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  } else if (normalized === "expired") {
    className =
      "border-red-500/20 bg-red-500/10 text-red-400";
  } else if (normalized === "cancelled") {
    className =
      "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${className}`}
    >
      {capitalize(status || "unknown")}
    </span>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}) {
  const colors = {
    orange:
      "bg-orange-500/10 text-orange-400 border-orange-500/10",
    green:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/10",
    red:
      "bg-red-500/10 text-red-400 border-red-500/10",
    blue:
      "bg-blue-500/10 text-blue-400 border-blue-500/10",
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-4 transition hover:border-white/[0.14] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-white/35 sm:text-sm">
            {title}
          </p>

          <p className="mt-2 text-2xl font-black text-white sm:text-3xl">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
            colors[color] || colors.orange
          }`}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/25">
        {label}
      </p>

      <p className="mt-1 truncate text-sm text-white/70">
        {value || "-"}
      </p>
    </div>
  );
}

/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/25">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-white/75">
        {value || "-"}
      </p>
    </div>
  );
}

/* =========================================================
   SECTION TITLE
========================================================= */

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
        <Icon size={15} />
      </div>

      <h3 className="text-sm font-bold text-white sm:text-base">
        {children}
      </h3>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({ text }) {
  return (
    <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 text-center">
      <p className="text-sm text-white/30">
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [selectedMember, setSelectedMember] =
    useState(null);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [showDetailsModal, setShowDetailsModal] =
    useState(false);

  const [memberDetails, setMemberDetails] =
    useState(null);

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const [detailsError, setDetailsError] =
    useState("");

  /* =======================================================
     FETCH MEMBERS
  ======================================================= */

  async function fetchMembers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/members",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to fetch members."
        );
      }

      setMembers(data.members || []);
    } catch (error) {
      console.error(
        "Fetch members error:",
        error
      );

      setError(
        error?.message ||
          "Failed to load members."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredMembers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return members;
    }

    return members.filter((member) => {
      const name = member.name || "";
      const email = member.email || "";
      const phone = member.phone || "";

      return (
        name.toLowerCase().includes(value) ||
        email.toLowerCase().includes(value) ||
        phone.toLowerCase().includes(value)
      );
    });
  }, [members, search]);

  /* =======================================================
     EDIT
  ======================================================= */

  function openEditModal(member) {
    setSelectedMember(member);

    setForm({
      name: member.name || "",
      email: member.email || "",
      phone: member.phone || "",
    });

    setShowEditModal(true);
  }

  function closeEditModal() {
    if (saving) return;

    setShowEditModal(false);
    setSelectedMember(null);

    setForm({
      name: "",
      email: "",
      phone: "",
    });
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  /* =======================================================
     UPDATE MEMBER
  ======================================================= */

  async function updateMember(event) {
    event.preventDefault();

    if (!selectedMember) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/admin/members/${selectedMember._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to update member."
        );
      }

      setMembers((previous) =>
        previous.map((member) =>
          member._id === selectedMember._id
            ? {
                ...member,
                ...data.member,
              }
            : member
        )
      );

      if (
        memberDetails?.member?._id ===
        selectedMember._id
      ) {
        setMemberDetails((previous) => {
          if (!previous) return previous;

          return {
            ...previous,
            member: {
              ...previous.member,
              ...data.member,
            },
          };
        });
      }

      closeEditModal();
    } catch (error) {
      console.error(
        "Update member error:",
        error
      );

      setError(
        error?.message ||
          "Failed to update member."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     TOGGLE STATUS
  ======================================================= */

  async function toggleMemberStatus(member) {
    const newStatus = !member.isActive;

    const action = newStatus
      ? "activate"
      : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${member.name}?`
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(
        `/api/admin/members/${member._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to ${action} member.`
        );
      }

      setMembers((previous) =>
        previous.map((item) =>
          item._id === member._id
            ? {
                ...item,
                isActive: newStatus,
              }
            : item
        )
      );

      if (
        memberDetails?.member?._id ===
        member._id
      ) {
        setMemberDetails((previous) => {
          if (!previous) return previous;

          return {
            ...previous,
            member: {
              ...previous.member,
              isActive: newStatus,
            },
          };
        });
      }
    } catch (error) {
      console.error(
        "Toggle member status error:",
        error
      );

      setError(
        error?.message ||
          `Failed to ${action} member.`
      );
    }
  }

  /* =======================================================
     MEMBER DETAILS
  ======================================================= */

  async function openMemberDetails(member) {
    try {
      setSelectedMember(member);
      setShowDetailsModal(true);
      setDetailsLoading(true);
      setDetailsError("");
      setMemberDetails(null);

      const response = await fetch(
        `/api/admin/members/${member._id}/details`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to load member details."
        );
      }

      setMemberDetails(data);
    } catch (error) {
      console.error(
        "Fetch member details error:",
        error
      );

      setDetailsError(
        error?.message ||
          "Failed to load member details."
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeMemberDetails() {
    if (detailsLoading) return;

    setShowDetailsModal(false);
    setMemberDetails(null);
    setDetailsError("");
    setSelectedMember(null);
  }

  /* =======================================================
     COUNTS
  ======================================================= */

  const activeMembers = members.filter(
    (member) => member.isActive
  ).length;

  const inactiveMembers = members.filter(
    (member) => !member.isActive
  ).length;

  const registrationPaidMembers =
    members.filter(
      (member) => member.registrationFeePaid
    ).length;

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-76px)] bg-[#050505] p-4 text-white sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px]">
          <div className="animate-pulse">
            <div className="h-8 w-48 rounded-lg bg-white/[0.07]" />

            <div className="mt-3 h-4 w-80 rounded bg-white/[0.04]" />

            <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="h-28 rounded-2xl bg-[#0d0d0d]"
                  />
                )
              )}
            </div>

            <div className="mt-6 h-20 rounded-2xl bg-[#0d0d0d]" />

            <div className="mt-4 h-96 rounded-2xl bg-[#0d0d0d]" />
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <main className="min-h-[calc(100vh-76px)] bg-[#050505] p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        {/* =================================================
            HEADER
        ================================================== */}

        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10">
                <Users
                  size={14}
                  className="text-orange-400"
                />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-400">
                Gym Management
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Members
            </h1>

            <p className="mt-1 text-sm text-white/35 sm:text-base">
              Manage your gym members, accounts and
              registration status.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchMembers}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-50 sm:w-auto"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>

        {/* =================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-400">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span className="flex-1">
              {error}
            </span>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 rounded-lg p-1 hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* =================================================
            SUMMARY
        ================================================== */}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <StatCard
            title="Total Members"
            value={members.length}
            icon={Users}
            color="orange"
          />

          <StatCard
            title="Active"
            value={activeMembers}
            icon={UserCheck}
            color="green"
          />

          <StatCard
            title="Inactive"
            value={inactiveMembers}
            icon={XCircle}
            color="red"
          />

          <StatCard
            title="Registration Paid"
            value={registrationPaidMembers}
            icon={CreditCard}
            color="blue"
          />
        </div>

        {/* =================================================
            SEARCH
        ================================================== */}

        <section className="mb-6 rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Search
                  size={17}
                  className="text-orange-400"
                />

                <h2 className="font-bold">
                  Search Members
                </h2>
              </div>

              <p className="mt-1 text-xs text-white/30 sm:text-sm">
                Search by name, email or phone
                number.
              </p>
            </div>

            <div className="relative w-full lg:max-w-md">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search member..."
                className="w-full rounded-xl border border-white/[0.08] bg-black py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-white/30 hover:bg-white/10 hover:text-white"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {search && (
            <div className="mt-4 flex items-center gap-2 text-xs text-white/30">
              <span>
                Showing
              </span>

              <strong className="text-white/70">
                {filteredMembers.length}
              </strong>

              <span>of</span>

              <strong className="text-white/70">
                {members.length}
              </strong>

              <span>members</span>
            </div>
          )}
        </section>

        {/* =================================================
            EMPTY
        ================================================== */}

        {members.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10">
              <Users
                size={24}
                className="text-orange-400"
              />
            </div>

            <h2 className="mt-4 text-lg font-bold">
              No members found
            </h2>

            <p className="mt-2 text-sm text-white/30">
              Registered members will appear here.
            </p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
              <Search
                size={23}
                className="text-white/40"
              />
            </div>

            <h2 className="mt-4 text-lg font-bold">
              No matching members
            </h2>

            <p className="mt-2 text-sm text-white/30">
              Try searching with a different name,
              email or phone number.
            </p>

            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-5 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-400"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <>
            {/* =============================================
                MOBILE CARDS
            ============================================== */}

            <div className="space-y-4 md:hidden">
              {filteredMembers.map((member) => (
                <div
                  key={member._id}
                  className="rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600">
                      <UserRound
                        size={19}
                        className="text-white"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="truncate font-bold">
                            {member.name ||
                              "Unknown"}
                          </h2>

                          <p className="mt-1 truncate text-xs text-white/30">
                            {member.email || "-"}
                          </p>
                        </div>

                        <StatusBadge
                          active={
                            member.isActive
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4">
                    <InfoItem
                      label="Phone"
                      value={
                        member.phone || "-"
                      }
                    />

                    <InfoItem
                      label="Joined"
                      value={formatDate(
                        member.createdAt
                      )}
                    />

                    <InfoItem
                      label="Role"
                      value={
                        member.role ||
                        "Member"
                      }
                    />

                    <InfoItem
                      label="Registration"
                      value={
                        member.registrationFeePaid
                          ? "Paid"
                          : "Unpaid"
                      }
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openMemberDetails(
                          member
                        )
                      }
                      className="rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-black transition hover:bg-gray-200"
                    >
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openEditModal(member)
                      }
                      className="rounded-xl border border-white/[0.08] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-white/[0.06]"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        toggleMemberStatus(
                          member
                        )
                      }
                      className={`rounded-xl px-3 py-2.5 text-xs font-semibold ${
                        member.isActive
                          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      }`}
                    >
                      {member.isActive
                        ? "Block"
                        : "Activate"}
                    </button>
                  </div>

                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2.5 text-xs font-semibold text-white/60 transition hover:bg-white/[0.05] hover:text-white"
                    >
                      <Phone size={14} />
                      Call Member
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* =============================================
                DESKTOP TABLE
            ============================================== */}

            <div className="hidden overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d0d] md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px]">
                  <thead className="border-b border-white/[0.07] bg-white/[0.025]">
                    <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-white/30">
                      <th className="px-5 py-4">
                        Member
                      </th>

                      <th className="px-5 py-4">
                        Phone
                      </th>

                      <th className="px-5 py-4">
                        Registration
                      </th>

                      <th className="px-5 py-4">
                        Joined
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMembers.map(
                      (member) => (
                        <tr
                          key={member._id}
                          className="border-b border-white/[0.05] transition last:border-0 hover:bg-white/[0.025]"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600">
                                <UserRound
                                  size={17}
                                  className="text-white"
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-white">
                                  {member.name ||
                                    "Unknown"}
                                </p>

                                <p className="mt-0.5 truncate text-xs text-white/30">
                                  {member.email ||
                                    "-"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-white/50">
                            {member.phone ||
                              "-"}
                          </td>

                          <td className="px-5 py-4">
                            <RegistrationBadge
                              paid={
                                member.registrationFeePaid
                              }
                            />
                          </td>

                          <td className="px-5 py-4 text-sm text-white/45">
                            {formatDate(
                              member.createdAt
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              active={
                                member.isActive
                              }
                            />
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openMemberDetails(
                                    member
                                  )
                                }
                                className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-black transition hover:bg-gray-200"
                              >
                                View
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    member
                                  )
                                }
                                className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.06]"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  toggleMemberStatus(
                                    member
                                  )
                                }
                                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                                  member.isActive
                                    ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                    : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                }`}
                              >
                                {member.isActive
                                  ? "Block"
                                  : "Activate"}
                              </button>

                              {member.phone && (
                                <a
                                  href={`tel:${member.phone}`}
                                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-semibold text-white/50 transition hover:bg-white/[0.06] hover:text-white"
                                >
                                  <Phone
                                    size={13}
                                  />
                                  Call
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ===================================================
          MEMBER DETAILS MODAL
      =================================================== */}

      {showDetailsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 backdrop-blur-md sm:p-5">
          <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0a0a0a] shadow-2xl">
            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600">
                  <UserRound
                    size={18}
                    className="text-white"
                  />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold sm:text-xl">
                    Member Details
                  </h2>

                  {memberDetails?.member && (
                    <p className="truncate text-xs text-white/30">
                      {memberDetails.member.name}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={closeMemberDetails}
                disabled={detailsLoading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* CONTENT */}

            <div className="overflow-y-auto p-4 sm:p-6">
              {detailsLoading && (
                <div className="space-y-4">
                  <div className="h-32 animate-pulse rounded-2xl bg-white/[0.04]" />
                  <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
                  <div className="h-60 animate-pulse rounded-2xl bg-white/[0.04]" />
                </div>
              )}

              {detailsError &&
                !detailsLoading && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                    {detailsError}
                  </div>
                )}

              {memberDetails &&
                !detailsLoading &&
                !detailsError && (
                  <div className="space-y-5">
                    {/* PROFILE */}

                    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-black">
                              {
                                memberDetails
                                  .member
                                  .name
                              }
                            </h3>

                            <StatusBadge
                              active={
                                memberDetails
                                  .member
                                  .isActive
                              }
                            />
                          </div>

                          <p className="mt-2 text-xs text-white/30">
                            Member since{" "}
                            {formatDate(
                              memberDetails
                                .member
                                .createdAt
                            )}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {memberDetails
                            .member
                            .phone && (
                            <a
                              href={`tel:${memberDetails.member.phone}`}
                              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black transition hover:bg-gray-200"
                            >
                              <Phone size={14} />
                              Call Member
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              closeMemberDetails();
                              openEditModal(
                                memberDetails.member
                              );
                            }}
                            className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/[0.06]"
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>
                        </div>
                      </div>
                    </section>

                    {/* PERSONAL */}

                    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                      <SectionTitle icon={UserRound}>
                        Personal Information
                      </SectionTitle>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailItem
                          label="Full Name"
                          value={
                            memberDetails
                              .member.name
                          }
                        />

                        <DetailItem
                          label="Email"
                          value={
                            memberDetails
                              .member.email
                          }
                        />

                        <DetailItem
                          label="Phone"
                          value={
                            memberDetails
                              .member.phone
                          }
                        />

                        <DetailItem
                          label="Account Status"
                          value={
                            memberDetails
                              .member.isActive
                              ? "Active"
                              : "Inactive"
                          }
                        />

                        <DetailItem
                          label="Joined"
                          value={formatDate(
                            memberDetails
                              .member
                              .createdAt
                          )}
                        />

                        <DetailItem
                          label="Member ID"
                          value={String(
                            memberDetails
                              .member._id
                          )}
                        />
                      </div>
                    </section>

                    {/* EMERGENCY */}

                    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                      <SectionTitle icon={ShieldCheck}>
                        Emergency Contact
                      </SectionTitle>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <DetailItem
                          label="Name"
                          value={
                            memberDetails
                              .member
                              .emergencyContact
                              ?.name ||
                            "-"
                          }
                        />

                        <DetailItem
                          label="Phone"
                          value={
                            memberDetails
                              .member
                              .emergencyContact
                              ?.phone ||
                            "-"
                          }
                        />

                        <DetailItem
                          label="Relation"
                          value={
                            memberDetails
                              .member
                              .emergencyContact
                              ?.relation ||
                            "-"
                          }
                        />
                      </div>

                      {memberDetails.member
                        .emergencyContact
                        ?.phone && (
                        <a
                          href={`tel:${memberDetails.member.emergencyContact.phone}`}
                          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2.5 text-xs font-semibold text-white/60 transition hover:bg-white/[0.05] hover:text-white"
                        >
                          <Phone size={14} />
                          Call Emergency Contact
                        </a>
                      )}
                    </section>

                    {/* REGISTRATION */}

                    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                      <SectionTitle icon={CreditCard}>
                        Registration Fee
                      </SectionTitle>

                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p
                            className={`text-xl font-black ${
                              memberDetails
                                .member
                                .registration
                                ?.paid
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {memberDetails
                              .member
                              .registration
                              ?.paid
                              ? "₹500 Paid"
                              : "₹500 Unpaid"}
                          </p>

                          {memberDetails
                            .member
                            .registration
                            ?.paidAt && (
                            <p className="mt-1 text-xs text-white/30">
                              Paid on{" "}
                              {formatDate(
                                memberDetails
                                  .member
                                  .registration
                                  .paidAt
                              )}
                            </p>
                          )}
                        </div>

                        <RegistrationBadge
                          paid={
                            memberDetails
                              .member
                              .registration
                              ?.paid
                          }
                        />
                      </div>
                    </section>

                    {/* CURRENT MEMBERSHIP */}

                    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                      <SectionTitle icon={Dumbbell}>
                        Current Membership
                      </SectionTitle>

                      {!memberDetails
                        .currentMembership ? (
                        <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                          <p className="font-semibold text-yellow-400">
                            No active membership
                          </p>

                          <p className="mt-1 text-xs text-white/30">
                            This member currently
                            does not have an active
                            membership.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4">
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <DetailItem
                              label="Plan"
                              value={
                                memberDetails
                                  .currentMembership
                                  .plan?.name ||
                                "-"
                              }
                            />

                            <DetailItem
                              label="Price"
                              value={`₹${formatNumber(
                                memberDetails
                                  .currentMembership
                                  .priceAtPurchase
                              )}`}
                            />

                            <DetailItem
                              label="Start Date"
                              value={formatDate(
                                memberDetails
                                  .currentMembership
                                  .startDate
                              )}
                            />

                            <DetailItem
                              label="End Date"
                              value={formatDate(
                                memberDetails
                                  .currentMembership
                                  .endDate
                              )}
                            />
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/25">
                                Status
                              </p>

                              <div className="mt-2">
                                <StatusText
                                  status={
                                    memberDetails
                                      .currentMembership
                                      .status
                                  }
                                />
                              </div>
                            </div>

                            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/25">
                                Days Remaining
                              </p>

                              <p
                                className={`mt-2 text-lg font-black ${
                                  memberDetails
                                    .currentMembership
                                    .daysRemaining >
                                  7
                                    ? "text-emerald-400"
                                    : "text-yellow-400"
                                }`}
                              >
                                {memberDetails
                                  .currentMembership
                                  .daysRemaining ??
                                  0}{" "}
                                days
                              </p>
                            </div>
                          </div>

                          {/* EXTENSIONS */}

                          {memberDetails
                            .currentMembership
                            .extensions
                            ?.length >
                            0 && (
                            <div className="mt-5">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-white/35">
                                Extensions
                              </h4>

                              <div className="mt-3 space-y-2">
                                {memberDetails.currentMembership.extensions.map(
                                  (
                                    extension,
                                    index
                                  ) => (
                                    <div
                                      key={
                                        extension._id ||
                                        index
                                      }
                                      className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"
                                    >
                                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                          <p className="font-semibold">
                                            +
                                            {
                                              extension.daysAdded
                                            }{" "}
                                            days
                                          </p>

                                          <p className="mt-1 text-xs text-white/30">
                                            {extension.reason ||
                                              "No reason provided"}
                                          </p>
                                        </div>

                                        <span className="text-[11px] text-white/30">
                                          {capitalize(
                                            extension.source ||
                                              "admin"
                                          )}
                                        </span>
                                      </div>

                                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                        <InfoItem
                                          label="Old End"
                                          value={formatDate(
                                            extension.oldEndDate
                                          )}
                                        />

                                        <InfoItem
                                          label="New End"
                                          value={formatDate(
                                            extension.newEndDate
                                          )}
                                        />

                                        <InfoItem
                                          label="Added"
                                          value={formatDate(
                                            extension.createdAt
                                          )}
                                        />
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </section>

                    {/* MEMBERSHIP HISTORY */}

                    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                      <SectionTitle icon={CalendarDays}>
                        Membership History
                      </SectionTitle>

                      {memberDetails
                        .memberships?.length ===
                      0 ? (
                        <EmptyState text="No membership history found." />
                      ) : (
                        <div className="mt-4 space-y-3">
                          {memberDetails.memberships.map(
                            (membership) => (
                              <div
                                key={
                                  membership._id
                                }
                                className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <h4 className="font-semibold">
                                      {membership
                                        .plan
                                        ?.name ||
                                        "Membership"}
                                    </h4>

                                    <p className="mt-1 text-xs text-white/30">
                                      {formatDate(
                                        membership.startDate
                                      )}{" "}
                                      →{" "}
                                      {formatDate(
                                        membership.endDate
                                      )}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <span className="font-bold">
                                      ₹
                                      {formatNumber(
                                        membership.priceAtPurchase
                                      )}
                                    </span>

                                    <StatusText
                                      status={
                                        membership.status
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </section>

                    {/* PAYMENTS */}

                    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                      <div className="flex items-center justify-between">
                        <SectionTitle icon={CreditCard}>
                          Payment History
                        </SectionTitle>

                        <span className="text-[11px] text-white/25">
                          {memberDetails
                            .payments?.length ||
                            0}{" "}
                          payments
                        </span>
                      </div>

                      {memberDetails.payments
                        ?.length === 0 ? (
                        <EmptyState text="No payment history found." />
                      ) : (
                        <div className="mt-4 overflow-x-auto">
                          <table className="w-full min-w-[700px]">
                            <thead className="border-b border-white/[0.07]">
                              <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-white/25">
                                <th className="px-3 py-3">
                                  Date
                                </th>

                                <th className="px-3 py-3">
                                  Type
                                </th>

                                <th className="px-3 py-3">
                                  Amount
                                </th>

                                <th className="px-3 py-3">
                                  Method
                                </th>

                                <th className="px-3 py-3">
                                  Status
                                </th>

                                <th className="px-3 py-3">
                                  Received By
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {memberDetails.payments.map(
                                (payment) => (
                                  <tr
                                    key={
                                      payment._id
                                    }
                                    className="border-b border-white/[0.04] last:border-0"
                                  >
                                    <td className="px-3 py-4 text-xs text-white/50">
                                      {formatDate(
                                        payment.paidAt ||
                                          payment.createdAt
                                      )}
                                    </td>

                                    <td className="px-3 py-4">
                                      <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] text-white/50">
                                        {formatPaymentType(
                                          payment.paymentType
                                        )}
                                      </span>
                                    </td>

                                    <td className="px-3 py-4 text-sm font-bold">
                                      ₹
                                      {formatNumber(
                                        payment.amount
                                      )}
                                    </td>

                                    <td className="px-3 py-4 text-xs uppercase text-white/35">
                                      {payment.method ||
                                        "-"}
                                    </td>

                                    <td className="px-3 py-4">
                                      <PaymentStatus
                                        status={
                                          payment.status
                                        }
                                      />
                                    </td>

                                    <td className="px-3 py-4 text-xs text-white/35">
                                      {payment
                                        .receivedBy
                                        ?.name ||
                                        payment
                                          .recordedBy
                                          ?.name ||
                                        "-"}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  </div>
                )}
            </div>

            {/* FOOTER */}

            <div className="flex shrink-0 justify-end border-t border-white/[0.07] p-4 sm:p-5">
              <button
                type="button"
                onClick={closeMemberDetails}
                disabled={detailsLoading}
                className="rounded-xl border border-white/[0.08] px-5 py-2.5 text-xs font-semibold text-white/60 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          EDIT MODAL
      =================================================== */}

      {showEditModal && selectedMember && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0b0b0b] shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                  <Edit3 size={18} />
                </div>

                <div>
                  <h2 className="text-lg font-bold">
                    Edit Member
                  </h2>

                  <p className="text-xs text-white/30">
                    Update member information.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/35 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={updateMember}
              className="p-5 sm:p-6"
            >
              <div className="space-y-4">
                {/* NAME */}

                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40"
                  >
                    Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    className="w-full rounded-xl border border-white/[0.08] bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/10"
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40"
                  >
                    Email
                  </label>

                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                    />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-white/[0.08] bg-black py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/10"
                    />
                  </div>
                </div>

                {/* PHONE */}

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40"
                  >
                    Phone
                  </label>

                  <div className="relative">
                    <Phone
                      size={15}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                    />

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      maxLength={10}
                      pattern="[0-9]{10}"
                      className="w-full rounded-xl border border-white/[0.08] bg-black py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/10"
                    />
                  </div>
                </div>
              </div>

              {/* ACTIONS */}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="rounded-xl border border-white/[0.08] px-5 py-3 text-sm font-semibold text-white/60 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/10 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <RefreshCw
                      size={15}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
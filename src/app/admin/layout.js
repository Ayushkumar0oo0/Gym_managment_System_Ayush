
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Activity,
  Bell,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Moon,
  Package,
  ShieldCheck,
  ShoppingCart,
  Sun,
  Settings,
  Users,
  X,
  Plus,
  MessageSquare,
  TrendingUp,
  Wrench,
  Tags,
} from "lucide-react";

const navigationGroups = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
      {
        label: "Activity Log",
        href: "/admin/activity",
        icon: Activity,
      },
    ],
  },
  {
    label: "Members",
    items: [
      {
        label: "Members",
        href: "/admin/members",
        icon: Users,
      },
      {
        label: "Memberships",
        href: "/admin/memberships",
        icon: Dumbbell,
      },
      {
        label: "Membership Plans",
        href: "/admin/membership-plans",
        icon: ClipboardList,
      },
    ],
  },
  {
    label: "Payments & Orders",
    items: [
      {
        label: "Payments",
        href: "/admin/payments",
        icon: CreditCard,
      },
      {
        label: "Purchase Requests",
        href: "/admin/purchase-requests",
        icon: ShoppingCart,
      },
      {
        label: "Product Orders",
        href: "/admin/product-orders",
        icon: Package,
      },
    ],
  },
  {
    label: "Products & Services",
    items: [
      {
        label: "Products",
        href: "/admin/products",
        icon: Package,
      },
      {
        label: "Add-ons",
        href: "/admin/add-ons",
        icon: Plus,
      },
      {
        label: "Workout Machines",
        href: "/admin/workout-machines",
        icon: Wrench,
      },
    ],
  },
  {
    label: "Gym Configuration",
    items: [
      {
        label: "Promotions",
        href: "/admin/promotions",
        icon: Tags,
      },
      {
        label: "Announcements",
        href: "/admin/gym-announcements",
        icon: Megaphone,
      },
      {
        label: "Gym Settings",
        href: "/admin/gym-settings",
        icon: Settings,
      },
    ],
  },
  {
    label: "Reports & Administration",
    items: [
      {
        label: "Revenue Analytics",
        href: "/admin/revenue",
        icon: TrendingUp,
      },
      {
        label: "Feedback",
        href: "/admin/feedback",
        icon: MessageSquare,
      },
      {
        label: "Admin Accounts",
        href: "/admin/admin-accounts",
        icon: ShieldCheck,
      },
    ],
  },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const isActive = (href) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const activeGroup = navigationGroups.find((group) =>
    group.items.some((item) => isActive(item.href))
  );

  const currentPage =
    navigationGroups
      .flatMap((group) => group.items)
      .find((item) => isActive(item.href))?.label || "Admin Panel";

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("admin-theme");

      if (savedTheme === "light") {
        setDarkMode(false);
      } else if (savedTheme === "dark") {
        setDarkMode(true);
      } else {
        setDarkMode(
          window.matchMedia("(prefers-color-scheme: dark)").matches
        );
      }
    } catch (error) {
      console.error("Unable to load admin theme:", error);
    } finally {
      setThemeLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!themeLoaded) return;

    try {
      localStorage.setItem("admin-theme", darkMode ? "dark" : "light");
    } catch (error) {
      console.error("Unable to save admin theme:", error);
    }
  }, [darkMode, themeLoaded]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.replace("/login");
      return;
    }

    if (session.user?.role !== "admin") {
      router.replace("/member");
    }
  }, [session, status, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (activeGroup) {
      setCollapsedGroups((previous) => ({
        ...previous,
        [activeGroup.label]: false,
      }));
    }
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const toggleGroup = (label) => {
    setCollapsedGroups((previous) => ({
      ...previous,
      [label]: !previous[label],
    }));
  };

  const mutedText = darkMode ? "text-white/45" : "text-gray-500";
  const borderColor = darkMode ? "border-white/[0.08]" : "border-gray-200";
  const panelColor = darkMode ? "bg-[#0b0b0b]" : "bg-white";
  const pageColor = darkMode
    ? "bg-[#050505] text-white"
    : "bg-[#f5f6f8] text-gray-900";

  if (
    status === "loading" ||
    (status === "authenticated" && session?.user?.role !== "admin")
  ) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${pageColor}`}>
        <div className="flex flex-col items-center gap-4">
          <div
            className={`h-12 w-12 animate-spin rounded-full border-4 ${
              darkMode
                ? "border-white/10 border-t-orange-500"
                : "border-gray-200 border-t-orange-500"
            }`}
          />
          <p className={`text-sm ${mutedText}`}>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== "admin") {
    return null;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${pageColor}`}>
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${panelColor} ${borderColor}`}
      >
        {/* Brand */}
        <div
          className={`flex h-[76px] shrink-0 items-center justify-between border-b px-5 ${borderColor}`}
        >
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/20">
              <Dumbbell size={23} className="text-white" />
            </div>

            <div>
              <p className="text-lg font-black tracking-tight">
                GYM<span className="text-orange-500">PRO</span>
              </p>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${mutedText}`}>
                Management
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className={`rounded-lg p-2 lg:hidden ${
              darkMode ? "hover:bg-white/10" : "hover:bg-gray-100"
            }`}
          >
            <X size={19} />
          </button>
        </div>

        {/* Admin profile */}
        <div className="shrink-0 px-4 pt-5">
          <div
            className={`rounded-2xl border p-4 ${
              darkMode
                ? "border-white/[0.07] bg-white/[0.035]"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-sm font-black text-white">
                {(session.user?.name || "A").charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {session.user?.name || "Administrator"}
                </p>
                <p className={`mt-0.5 truncate text-xs ${mutedText}`}>
                  {session.user?.email}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-semibold text-emerald-500">
                Administrator
              </span>
            </div>
          </div>
        </div>

        {/* Grouped navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p
            className={`mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] ${mutedText}`}
          >
            Workspace
          </p>

          <nav className="space-y-3">
            {navigationGroups.map((group) => {
              const GroupIcon = group.items[0].icon;
              const groupActive = group.items.some((item) =>
                isActive(item.href)
              );
              const collapsed = Boolean(collapsedGroups[group.label]);

              return (
                <div key={group.label}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.label)}
                    aria-expanded={!collapsed}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.12em] transition ${
                      groupActive
                        ? "text-orange-500"
                        : mutedText
                    } ${
                      darkMode ? "hover:bg-white/[0.04]" : "hover:bg-gray-100"
                    }`}
                  >
                    <GroupIcon size={14} />

                    <span className="flex-1">{group.label}</span>

                    <ChevronDown
                      size={14}
                      className={`transition-transform ${
                        collapsed ? "-rotate-90" : ""
                      }`}
                    />
                  </button>

                  {!collapsed && (
                    <div className="mt-1 space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={`group flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                              active
                                ? darkMode
                                  ? "border-orange-500/15 bg-orange-500/10 text-orange-400"
                                  : "border-orange-100 bg-orange-50 text-orange-600"
                                : `border-transparent ${
                                    darkMode
                                      ? "text-white/60 hover:bg-white/[0.045] hover:text-white"
                                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                  }`
                            }`}
                          >
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                                active
                                  ? "bg-orange-500 text-white"
                                  : darkMode
                                    ? "bg-white/[0.04] text-white/45 group-hover:text-white/80"
                                    : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              <Icon size={16} />
                            </span>

                            <span className="min-w-0 flex-1 truncate">
                              {item.label}
                            </span>

                            {active && (
                              <ChevronRight
                                size={15}
                                className="shrink-0 text-orange-500"
                              />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sidebar footer */}
        <div className={`shrink-0 border-t p-3 ${borderColor}`}>
          <button
            type="button"
            onClick={() => setDarkMode((previous) => !previous)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
              darkMode
                ? "text-white/65 hover:bg-white/[0.05] hover:text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            <span className="flex-1 text-left">
              {darkMode ? "Light mode" : "Dark mode"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 transition ${
              darkMode ? "hover:bg-red-500/10" : "hover:bg-red-50"
            }`}
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-h-screen lg:pl-[280px]">
        <header
          className={`sticky top-0 z-30 flex h-[68px] items-center justify-between border-b px-4 backdrop-blur-xl sm:px-6 ${borderColor} ${
            darkMode ? "bg-[#050505]/90" : "bg-white/90"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              className={`rounded-xl border p-2 lg:hidden ${borderColor}`}
            >
              <Menu size={19} />
            </button>

            <div className="min-w-0">
              <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${mutedText}`}>
                Gym Management
              </p>
              <h1 className="truncate text-sm font-black sm:text-base">
                {currentPage}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/admin/members"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-3 py-2 text-xs font-black text-black transition hover:bg-orange-400 sm:px-4"
            >
              <Users size={15} />
              <span className="hidden sm:inline">Members</span>
            </Link>

            <Link
              href="/admin/payments"
              aria-label="Open payments"
              className={`rounded-xl border p-2.5 transition ${
                darkMode
                  ? "border-white/[0.08] text-white/65 hover:bg-white/[0.05]"
                  : "border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <CreditCard size={17} />
            </Link>
          </div>
        </header>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

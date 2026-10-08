"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  CreditCard,
  ShoppingCart,
  Megaphone,
  Package,
  ShieldCheck,
  Settings,
  Bell,
  Activity,
  ClipboardList,
  LogOut,
  Globe,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  UserRound,
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
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
    label: "Promotions",
    href: "/admin/promotions",
    icon: Megaphone,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    label: "Admin Accounts",
    href: "/admin/admin-accounts",
    icon: ShieldCheck,
  },
  {
    label: "Gym Settings",
    href: "/admin/gym-settings",
    icon: Settings,
  },
  {
    label: "Announcements",
    href: "/admin/gym-announcements",
    icon: Bell,
  },
  {
    label: "Activity",
    href: "/admin/activity",
    icon: Activity,
  },
  {
    label: "Product Orders",
    href: "/admin/product-orders",
    icon: ShoppingCart,
  },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // ---------------------------------------------------------
  // Theme
  // ---------------------------------------------------------

  useEffect(() => {
    const savedTheme = localStorage.getItem("admin-theme");

    if (savedTheme === "light") {
      setDarkMode(false);
      return;
    }

    if (savedTheme === "dark") {
      setDarkMode(true);
      return;
    }

    // Default to system preference
    const systemDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    setDarkMode(systemDark);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "admin-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  // ---------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------

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

  // ---------------------------------------------------------
  // Close mobile sidebar when route changes
  // ---------------------------------------------------------

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // ---------------------------------------------------------
  // Prevent body scroll when mobile sidebar is open
  // ---------------------------------------------------------

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------

  if (status === "loading") {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode
            ? "bg-[#050505] text-white"
            : "bg-gray-50 text-gray-900"
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div
              className={`w-12 h-12 rounded-full border-4 ${
                darkMode
                  ? "border-white/10 border-t-orange-500"
                  : "border-gray-200 border-t-orange-500"
              } animate-spin`}
            />
          </div>

          <p
            className={`text-sm ${
              darkMode ? "text-white/50" : "text-gray-500"
            }`}
          >
            Loading admin panel...
          </p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== "admin") {
    return null;
  }

  // ---------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------

  const isActive = (href) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const currentPage =
    menuItems.find((item) => isActive(item.href))?.label ||
    "Admin Panel";

  // ---------------------------------------------------------
  // Logout
  // ---------------------------------------------------------

  const handleLogout = async () => {
    await signOut({
      callbackUrl: "/login",
    });
  };

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? "bg-[#050505] text-white"
          : "bg-[#f5f6f8] text-gray-900"
      }`}
    >
      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          w-[280px]
          transform
          transition-transform
          duration-300
          ease-in-out
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
          ${
            darkMode
              ? "bg-[#0b0b0b] border-white/[0.08]"
              : "bg-white border-gray-200"
          }
          border-r
          flex
          flex-col
        `}
      >
        {/* =================================================
            LOGO
        ================================================== */}

        <div
          className={`h-[76px] px-5 flex items-center justify-between border-b ${
            darkMode
              ? "border-white/[0.08]"
              : "border-gray-200"
          }`}
        >
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center gap-3 text-left"
          >
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Dumbbell
                  size={23}
                  strokeWidth={2.4}
                  className="text-white"
                />
              </div>

              <div className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full bg-emerald-500 border-[3px] border-[#0b0b0b]" />
            </div>

            <div>
              <p
                className={`font-black text-lg tracking-tight ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                GYM<span className="text-orange-500">PRO</span>
              </p>

              <p
                className={`text-[10px] uppercase tracking-[0.18em] font-semibold ${
                  darkMode
                    ? "text-white/35"
                    : "text-gray-400"
                }`}
              >
                Management
              </p>
            </div>
          </button>

          <button
            onClick={() => setSidebarOpen(false)}
            className={`lg:hidden p-2 rounded-lg ${
              darkMode
                ? "hover:bg-white/10 text-white/60"
                : "hover:bg-gray-100 text-gray-500"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* =================================================
            ADMIN PROFILE
        ================================================== */}

        <div className="px-4 pt-5">
          <div
            className={`rounded-2xl p-4 border ${
              darkMode
                ? "bg-white/[0.035] border-white/[0.07]"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shrink-0">
                <UserRound
                  size={19}
                  className="text-white"
                />
              </div>

              <div className="min-w-0">
                <p
                  className={`font-bold text-sm truncate ${
                    darkMode
                      ? "text-white"
                      : "text-gray-900"
                  }`}
                >
                  {session.user?.name || "Administrator"}
                </p>

                <p
                  className={`text-xs truncate mt-0.5 ${
                    darkMode
                      ? "text-white/40"
                      : "text-gray-500"
                  }`}
                >
                  {session.user?.email}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />

              <span
                className={`text-[11px] font-semibold ${
                  darkMode
                    ? "text-emerald-400"
                    : "text-emerald-600"
                }`}
              >
                Administrator
              </span>
            </div>
          </div>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================== */}

        <div className="flex-1 overflow-y-auto px-3 py-5 scrollbar-thin">
          <p
            className={`px-3 mb-3 text-[10px] font-bold uppercase tracking-[0.18em] ${
              darkMode
                ? "text-white/25"
                : "text-gray-400"
            }`}
          >
            Management
          </p>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`
                    w-full
                    group
                    flex
                    items-center
                    gap-3
                    px-3
                    py-2.5
                    rounded-xl
                    text-sm
                    font-medium
                    transition-all
                    duration-200
                    ${
                      active
                        ? darkMode
                          ? "bg-orange-500/10 text-orange-400 border border-orange-500/15"
                          : "bg-orange-50 text-orange-600 border border-orange-100"
                        : darkMode
                        ? "text-white/55 hover:text-white hover:bg-white/[0.045]"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }
                  `}
                >
                  <span
                    className={`
                      flex
                      items-center
                      justify-center
                      w-9
                      h-9
                      rounded-lg
                      shrink-0
                      transition-all
                      ${
                        active
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                          : darkMode
                          ? "bg-white/[0.04] text-white/45 group-hover:text-white/80"
                          : "bg-gray-100 text-gray-500 group-hover:text-gray-800"
                      }
                    `}
                  >
                    <Icon size={17} strokeWidth={2} />
                  </span>

                  <span className="flex-1 text-left truncate">
                    {item.label}
                  </span>

                  {active && (
                    <ChevronRight
                      size={15}
                      className="text-orange-500 shrink-0"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* =================================================
            SIDEBAR FOOTER
        ================================================== */}

        <div
          className={`p-3 border-t ${
            darkMode
              ? "border-white/[0.08]"
              : "border-gray-200"
          }`}
        >
          {/* Website */}

          <button
            onClick={() => router.push("/")}
            className={`
              w-full
              flex
              items-center
              gap-3
              px-3
              py-2.5
              rounded-xl
              text-sm
              font-medium
              transition
              ${
                darkMode
                  ? "text-white/55 hover:text-white hover:bg-white/[0.045]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }
            `}
          >
            <Globe size={18} />
            <span>View Website</span>
          </button>

          {/* Logout */}

          <button
            onClick={handleLogout}
            className="
              w-full
              mt-1
              flex
              items-center
              gap-3
              px-3
              py-2.5
              rounded-xl
              text-sm
              font-medium
              text-red-500
              hover:bg-red-500/10
              transition
            "
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN AREA
      ====================================================== */}

      <div className="lg:pl-[280px] min-h-screen">
        {/* =================================================
            TOP BAR
        ================================================== */}

        <header
          className={`
            sticky
            top-0
            z-30
            h-[76px]
            border-b
            backdrop-blur-xl
            ${
              darkMode
                ? "bg-[#050505]/85 border-white/[0.08]"
                : "bg-white/85 border-gray-200"
            }
          `}
        >
          <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Left */}

            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className={`
                  lg:hidden
                  w-10
                  h-10
                  rounded-xl
                  flex
                  items-center
                  justify-center
                  ${
                    darkMode
                      ? "bg-white/[0.05] text-white/70 hover:bg-white/10"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }
                `}
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-xs hidden sm:block ${
                      darkMode
                        ? "text-white/35"
                        : "text-gray-400"
                    }`}
                  >
                    Admin
                  </p>

                  <ChevronRight
                    size={13}
                    className={
                      darkMode
                        ? "text-white/20 hidden sm:block"
                        : "text-gray-300 hidden sm:block"
                    }
                  />

                  <h1
                    className={`font-bold text-sm sm:text-base truncate ${
                      darkMode
                        ? "text-white"
                        : "text-gray-900"
                    }`}
                  >
                    {currentPage}
                  </h1>
                </div>

                <p
                  className={`hidden md:block text-xs mt-0.5 ${
                    darkMode
                      ? "text-white/30"
                      : "text-gray-400"
                  }`}
                >
                  Manage your gym from one place
                </p>
              </div>
            </div>

            {/* Right */}

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Status */}

              <div
                className={`
                  hidden sm:flex
                  items-center
                  gap-2
                  px-3
                  py-2
                  rounded-full
                  text-xs
                  font-semibold
                  ${
                    darkMode
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                      : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  }
                `}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                System Online
              </div>

              {/* Theme */}

              <button
                onClick={() => setDarkMode((value) => !value)}
                title={
                  darkMode
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                className={`
                  w-10
                  h-10
                  rounded-xl
                  flex
                  items-center
                  justify-center
                  transition
                  ${
                    darkMode
                      ? "bg-white/[0.05] text-yellow-400 hover:bg-white/10"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }
                `}
              >
                {darkMode ? (
                  <Sun size={18} />
                ) : (
                  <Moon size={18} />
                )}
              </button>

              {/* Admin avatar */}

              <div
                className={`
                  hidden sm:flex
                  items-center
                  gap-2.5
                  pl-2
                  border-l
                  ${
                    darkMode
                      ? "border-white/10"
                      : "border-gray-200"
                  }
                `}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <UserRound
                    size={16}
                    className="text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* =================================================
            PAGE CONTENT
        ================================================== */}

        <main className="min-h-[calc(100vh-76px)]">
          {children}
        </main>
      </div>

      {/* =====================================================
          MOBILE BOTTOM BRAND
      ====================================================== */}

      <div
        className={`
          fixed
          bottom-4
          right-4
          z-20
          lg:hidden
          pointer-events-none
        `}
      >
        <div
          className={`
            flex
            items-center
            gap-2
            px-3
            py-2
            rounded-full
            backdrop-blur-xl
            border
            ${
              darkMode
                ? "bg-black/70 border-white/10 text-white/50"
                : "bg-white/80 border-gray-200 text-gray-500"
            }
          `}
        >
          <Sparkles
            size={13}
            className="text-orange-500"
          />

          <span className="text-[10px] font-semibold">
            Gym Admin
          </span>
        </div>
      </div>
    </div>
  );
}
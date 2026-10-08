"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Dumbbell,
  Home,
  ShoppingBag,
  LayoutDashboard,
  ShieldCheck,
  LogIn,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import { useState } from "react";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);

    await signOut({
      redirect: false,
    });

    router.push("/login");
  }

  if (status === "loading") {
    return null;
  }

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: Home,
    },
    {
      href: "/products",
      label: "Products",
      icon: ShoppingBag,
    },
  ];

  if (session?.user) {
    navItems.push({
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    });
  }

  if (session?.user?.role === "admin") {
    navItems.push({
      href: "/admin",
      label: "Admin",
      icon: ShieldCheck,
    });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-2xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="group flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-black shadow-lg shadow-orange-500/20 transition duration-300 group-hover:scale-105 group-hover:bg-orange-400">
            <Dumbbell size={21} strokeWidth={2.5} />
          </div>

          <div className="leading-none">
            <p className="text-base font-black tracking-tight text-white sm:text-lg">
              GYM
              <span className="text-orange-500">.</span>
            </p>

            <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.28em] text-zinc-600">
              Management
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              pathname={pathname}
              icon={item.icon}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Right Side */}
        <div className="hidden items-center gap-3 md:flex">
          {session?.user ? (
            <>
              <NotificationBell />

              <div className="h-7 w-px bg-white/10" />

              <div className="flex items-center gap-2.5">
                <div className="hidden text-right lg:block">
                  <p className="max-w-[130px] truncate text-sm font-semibold text-white">
                    {session.user.name || "Member"}
                  </p>

                  <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500">
                    {session.user.role || "member"}
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 text-zinc-400">
                  <User size={17} />
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm font-semibold text-zinc-400 transition hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5"
                />
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="group flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-orange-500/10 transition hover:bg-orange-400 hover:shadow-orange-500/20"
            >
              <LogIn size={16} />
              Login
            </Link>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2 md:hidden">
          {session?.user && <NotificationBell />}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-300 transition hover:border-orange-500/30 hover:text-orange-400"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-black/95 px-4 pb-5 pt-3 backdrop-blur-2xl md:hidden">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <MobileNavLink
                key={item.href}
                href={item.href}
                pathname={pathname}
                icon={item.icon}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </MobileNavLink>
            ))}
          </nav>

          <div className="mt-4 border-t border-white/10 pt-4">
            {session?.user ? (
              <>
                <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                    <User size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {session.user.name || "Member"}
                    </p>

                    <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500">
                      {session.user.role || "member"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                  <LogOut size={16} />
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-black transition hover:bg-orange-400"
              >
                <LogIn size={16} />
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, pathname, children, icon: Icon }) {
  const active =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-orange-500/10 text-orange-400"
          : "text-zinc-500 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      <Icon
        size={15}
        className={
          active
            ? "text-orange-400"
            : "text-zinc-600 transition group-hover:text-zinc-300"
        }
      />

      {children}

      {active && (
        <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-orange-500" />
      )}
    </Link>
  );
}

function MobileNavLink({
  href,
  pathname,
  children,
  icon: Icon,
  onClick,
}) {
  const active =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
        active
          ? "bg-orange-500/10 text-orange-400"
          : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      <Icon
        size={17}
        className={active ? "text-orange-400" : "text-zinc-600"}
      />

      {children}
    </Link>
  );
}
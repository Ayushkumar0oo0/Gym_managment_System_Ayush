"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Dumbbell,
  Loader2,
  Package,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Tag,
  Wallet,
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/products",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load products."
        );
      }

      setProducts(data.products || []);
    } catch (error) {
      console.error(
        "Load products error:",
        error
      );

      setError(
        error.message ||
          "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <AmbientGlow />

      {/* Header */}
      <section className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <Link
            href="/member"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-600 transition hover:text-orange-400"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>

          <div className="mt-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingBag
                  size={15}
                  className="text-orange-500"
                />

                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
                  Gym Store
                </p>
              </div>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Train Hard.
                <br />
                <span className="text-orange-500">
                  Shop Smart.
                </span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
                Browse gym products and place
                your order directly through the
                gym.
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-2xl border border-orange-500/15 bg-orange-500/[0.04] px-4 py-3">
              <Wallet
                size={17}
                className="text-orange-400"
              />

              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-700">
                  Flexible Payment
                </p>

                <p className="mt-0.5 text-xs font-bold text-zinc-400">
                  Pay from 30% initially
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Error */}
        {error && (
          <div className="mb-7 flex items-start justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-red-400">
                Store Error
              </p>

              <p className="mt-1 text-sm text-red-300/80">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={loadProducts}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-500/20 px-3 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/10"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        )}

        {/* Intro cards */}
        {!loading &&
          products.length > 0 && (
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <StoreInfo
                icon={<Dumbbell size={18} />}
                title="Gym Essentials"
                text="Products selected for your training."
              />

              <StoreInfo
                icon={<Wallet size={18} />}
                title="Flexible Payments"
                text="Pay 30% or more initially."
              />

              <StoreInfo
                icon={<Package size={18} />}
                title="Gym Pickup"
                text="Collect your order directly at the gym."
              />
            </div>
          )}

        {/* Loading */}
        {loading ? (
          <LoadingProducts />
        ) : products.length === 0 ? (
          <EmptyProducts />
        ) : (
          <>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
                  Available Now
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Gym Products
                </h2>
              </div>

              <span className="rounded-full border border-white/10 bg-zinc-950 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-600">
                {products.length}{" "}
                {products.length === 1
                  ? "Product"
                  : "Products"}
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const originalPrice =
                  Number(
                    product.originalPrice ??
                      product.price
                  ) || 0;

                const price =
                  Number(product.price) || 0;

                const savings =
                  Number(
                    product.savings
                  ) ||
                  (originalPrice > price
                    ? originalPrice - price
                    : 0);

                const discountPercentage =
                  Number(
                    product.discountPercentage
                  ) ||
                  (originalPrice > 0 &&
                  price < originalPrice
                    ? Math.round(
                        ((originalPrice -
                          price) /
                          originalPrice) *
                          100
                      )
                    : 0);

                return (
                  <article
                    key={product._id}
                    className="group overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 transition duration-300 hover:-translate-y-1 hover:border-orange-500/20 hover:shadow-2xl hover:shadow-orange-500/[0.04]"
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden bg-black">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-64 w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-64 items-center justify-center bg-zinc-900">
                          <Dumbbell
                            size={50}
                            className="text-zinc-800"
                          />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                      {discountPercentage >
                        0 && (
                        <div className="absolute left-4 top-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1.5 text-[10px] font-black text-black shadow-lg shadow-orange-500/20">
                            <Sparkles size={11} />
                            {discountPercentage}% OFF
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-4 left-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/60 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-zinc-300 backdrop-blur-md">
                          <Tag size={10} />
                          Gym Store
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5">
                      <h2 className="text-lg font-black text-white">
                        {product.name}
                      </h2>

                      {product.description && (
                        <p className="mt-2 line-clamp-3 text-xs leading-6 text-zinc-700">
                          {product.description}
                        </p>
                      )}

                      {/* Price */}
                      <div className="mt-5">
                        <div className="flex flex-wrap items-end gap-2">
                          {discountPercentage >
                            0 && (
                            <span className="text-sm font-bold text-zinc-800 line-through">
                              ₹
                              {originalPrice.toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          )}

                          <span className="text-2xl font-black text-white">
                            ₹
                            {price.toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        </div>

                        {savings > 0 && (
                          <p className="mt-1 text-xs font-bold text-emerald-400">
                            Save ₹
                            {savings.toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        )}
                      </div>

                      {/* Payment info */}
                      <div className="mt-5 rounded-2xl border border-orange-500/10 bg-orange-500/[0.03] p-3.5">
                        <div className="flex items-start gap-2.5">
                          <Wallet
                            size={14}
                            className="mt-0.5 shrink-0 text-orange-400"
                          />

                          <p className="text-[10px] leading-5 text-zinc-700">
                            Pay 30% or more
                            initially. Pay the
                            remaining amount when
                            you collect your
                            product.
                          </p>
                        </div>
                      </div>

                      {/* Order */}
                      <Link
                        href={`/products/${product._id}`}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3.5 text-sm font-black text-black transition hover:bg-orange-400"
                      >
                        Order Product
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function StoreInfo({
  icon,
  title,
  text,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-black text-zinc-300">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-zinc-700">
        {text}
      </p>
    </div>
  );
}

function LoadingProducts() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map(
        (_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950"
          >
            <div className="h-64 animate-pulse bg-zinc-900" />

            <div className="space-y-4 p-5">
              <div className="h-5 w-2/3 animate-pulse rounded bg-zinc-900" />

              <div className="h-10 w-full animate-pulse rounded bg-zinc-900" />

              <div className="h-7 w-1/3 animate-pulse rounded bg-zinc-900" />

              <div className="h-14 w-full animate-pulse rounded-2xl bg-zinc-900" />

              <div className="h-12 w-full animate-pulse rounded-2xl bg-zinc-900" />
            </div>
          </div>
        )
      )}
    </div>
  );
}

function EmptyProducts() {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-zinc-950 p-10 text-center sm:p-16">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
        <ShoppingBag size={28} />
      </div>

      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
        Gym Store
      </p>

      <h2 className="mt-2 text-2xl font-black">
        No Products Available
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-700">
        There are currently no products
        available. Please check again later.
      </p>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-black text-black transition hover:bg-orange-400"
      >
        <RefreshCw size={15} />
        Check Again
      </button>
    </div>
  );
}

function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-300px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-orange-500/[0.07] blur-[150px]" />

      <div className="absolute bottom-[-250px] right-[-180px] h-[500px] w-[500px] rounded-full bg-orange-500/[0.04] blur-[140px]" />
    </div>
  );
}
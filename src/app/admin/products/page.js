"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Power,
  Upload,
  Image as ImageIcon,
  IndianRupee,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Tag,
} from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    originalPrice: "",
    price: "",
    isActive: true,
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/products", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load products.");
      }

      setProducts(data.products || []);
    } catch (error) {
      console.error("Load products error:", error);
      setError(error.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      imageUrl: "",
      originalPrice: "",
      price: "",
      isActive: true,
    });

    setEditingProduct(null);
  };

  const openAddForm = () => {
    setError("");
    setSuccess("");
    resetForm();
    setShowForm(true);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, JPEG, PNG and WebP images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Image upload failed.");
      }

      setForm((previous) => ({
        ...previous,
        imageUrl: data.url,
      }));

      setSuccess("Product image uploaded successfully.");
    } catch (error) {
      console.error("Product image upload error:", error);
      setError(error.message || "Failed to upload image.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const originalPrice = Number(form.originalPrice) || 0;
  const sellingPrice = Number(form.price) || 0;

  const savings =
    originalPrice > sellingPrice ? originalPrice - sellingPrice : 0;

  const discountPercentage =
    originalPrice > 0 && sellingPrice <= originalPrice
      ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
      : 0;

  const stats = useMemo(() => {
    const active = products.filter((product) => product.isActive).length;
    const inactive = products.length - active;

    const discounted = products.filter((product) => {
      const original = Number(
        product.originalPrice ?? product.price
      );
      const price = Number(product.price);

      return original > price;
    }).length;

    return {
      total: products.length,
      active,
      inactive,
      discounted,
    };
  }, [products]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanName = form.name.trim();
    const cleanDescription = form.description.trim();
    const imageUrl = form.imageUrl.trim();

    const original = Number(form.originalPrice);
    const price = Number(form.price);

    if (!cleanName) {
      setError("Product name is required.");
      return;
    }

    if (cleanName.length < 2) {
      setError("Product name must be at least 2 characters.");
      return;
    }

    if (!imageUrl) {
      setError("Product image is required.");
      return;
    }

    if (!Number.isFinite(original) || original < 0) {
      setError("Please enter a valid market price.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Please enter a valid selling price.");
      return;
    }

    if (price > original) {
      setError("Selling price cannot be greater than market price.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: cleanName,
        description: cleanDescription,
        imageUrl,
        originalPrice: original,
        price,
        isActive: form.isActive,
      };

      const url = editingProduct
        ? `/api/admin/products/${editingProduct._id}`
        : "/api/admin/products";

      const method = editingProduct ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save product.");
      }

      setSuccess(
        editingProduct
          ? "Product updated successfully."
          : "Product created successfully."
      );

      resetForm();
      setShowForm(false);

      await loadProducts();
    } catch (error) {
      console.error("Save product error:", error);
      setError(error.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setError("");
    setSuccess("");

    setEditingProduct(product);

    setForm({
      name: product.name || "",
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      originalPrice: product.originalPrice ?? product.price ?? "",
      price: product.price ?? "",
      isActive: product.isActive !== false,
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleToggleActive = async (product) => {
    const action = product.isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/products/${product._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !product.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Failed to ${action} product.`
        );
      }

      setSuccess(
        product.isActive
          ? "Product is now unavailable."
          : "Product is now available."
      );

      await loadProducts();
    } catch (error) {
      console.error("Toggle product error:", error);
      setError(error.message || "Failed to update product.");
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/products/${product._id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete product.");
      }

      setSuccess("Product deleted successfully.");

      if (editingProduct?._id === product._id) {
        resetForm();
        setShowForm(false);
      }

      await loadProducts();
    } catch (error) {
      console.error("Delete product error:", error);
      setError(error.message || "Failed to delete product.");
    }
  };

  const getProductDiscount = (product) => {
    const original =
      Number(product.originalPrice ?? product.price) || 0;

    const price = Number(product.price) || 0;

    if (original <= 0 || price >= original) {
      return {
        percentage: 0,
        savings: 0,
      };
    }

    return {
      percentage: Math.round(((original - price) / original) * 100),
      savings: original - price,
    };
  };

  const formatPrice = (value) =>
    Number(value || 0).toLocaleString("en-IN");

  return (
    <main className="min-h-screen bg-[#070707] px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <header className="mb-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                  <ShoppingBag size={18} />
                </div>

                <span className="text-sm font-semibold uppercase tracking-wider text-orange-400">
                  Gym Store
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Products
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
                Manage supplements and products available for your
                gym members.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-black shadow-lg shadow-orange-500/10 transition hover:bg-orange-400"
            >
              <Plus size={18} />
              Add Product
            </button>
          </div>
        </header>

        {/* ALERTS */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto text-red-400 transition hover:text-white"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
            <Check className="mt-0.5 shrink-0" size={18} />
            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="ml-auto text-green-400 transition hover:text-white"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* STATS */}
        <section className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={<Package size={19} />}
            label="Total Products"
            value={stats.total}
          />

          <StatCard
            icon={<Check size={19} />}
            label="Available"
            value={stats.active}
            accent="green"
          />

          <StatCard
            icon={<Power size={19} />}
            label="Unavailable"
            value={stats.inactive}
          />

          <StatCard
            icon={<Tag size={19} />}
            label="On Discount"
            value={stats.discounted}
            accent="orange"
          />
        </section>

        {/* ADD / EDIT FORM */}
        {showForm && (
          <section className="mb-9 overflow-hidden rounded-3xl border border-zinc-800 bg-[#0c0c0c] shadow-2xl shadow-black/30">
            <div className="border-b border-zinc-800 bg-gradient-to-r from-orange-500/10 via-transparent to-transparent px-5 py-5 sm:px-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-black">
                      {editingProduct ? (
                        <Pencil size={17} />
                      ) : (
                        <Plus size={19} />
                      )}
                    </div>

                    <h2 className="text-xl font-bold">
                      {editingProduct
                        ? "Edit Product"
                        : "Add Product"}
                    </h2>
                  </div>

                  <p className="mt-2 text-sm text-zinc-500">
                    Configure product information, pricing and
                    availability.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[1fr_360px]"
            >
              {/* LEFT */}
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-300">
                    Product Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Example: Whey Protein"
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-300">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Describe the product..."
                    className="w-full resize-none rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
                  />
                </div>

                {/* IMAGE */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-300">
                    Product Image
                  </label>

                  <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-black">
                    {form.imageUrl ? (
                      <div className="relative">
                        <img
                          src={form.imageUrl}
                          alt={form.name || "Product preview"}
                          className="h-64 w-full object-cover sm:h-80"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setForm((previous) => ({
                              ...previous,
                              imageUrl: "",
                            }))
                          }
                          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-black/80 text-white backdrop-blur transition hover:bg-red-500"
                        >
                          <X size={17} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-64 flex-col items-center justify-center gap-3 text-zinc-600 sm:h-80">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900">
                          <ImageIcon size={25} />
                        </div>

                        <span className="text-sm">
                          No product image selected
                        </span>
                      </div>
                    )}

                    <div className="border-t border-zinc-800 p-4">
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-200 transition hover:border-orange-500 hover:bg-orange-500/5 hover:text-orange-400">
                        <Upload size={17} />

                        {uploading
                          ? "Uploading..."
                          : "Upload Product Image"}

                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>

                      <p className="mt-2 text-center text-xs text-zinc-600">
                        JPG, JPEG, PNG or WebP · Maximum 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="space-y-5">
                <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                  <div className="mb-5 flex items-center gap-2">
                    <IndianRupee
                      size={17}
                      className="text-orange-400"
                    />

                    <h3 className="font-bold">Pricing</h3>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-400">
                        Market Price
                      </label>

                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
                          ₹
                        </span>

                        <input
                          type="number"
                          name="originalPrice"
                          value={form.originalPrice}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          placeholder="1000"
                          className="w-full rounded-xl border border-zinc-800 bg-[#0c0c0c] py-3.5 pl-9 pr-4 text-sm text-white outline-none transition focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-400">
                        Selling Price
                      </label>

                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400">
                          ₹
                        </span>

                        <input
                          type="number"
                          name="price"
                          value={form.price}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          placeholder="800"
                          className="w-full rounded-xl border border-orange-500/30 bg-[#0c0c0c] py-3.5 pl-9 pr-4 text-sm font-semibold text-white outline-none transition focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* CUSTOMER PREVIEW */}
                {originalPrice > 0 &&
                  sellingPrice >= 0 &&
                  sellingPrice <= originalPrice && (
                    <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.04] p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                          Member Preview
                        </span>

                        {discountPercentage > 0 && (
                          <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-black text-black">
                            {discountPercentage}% OFF
                          </span>
                        )}
                      </div>

                      <div className="flex items-end gap-3">
                        {sellingPrice < originalPrice && (
                          <span className="text-sm text-zinc-600 line-through">
                            ₹{formatPrice(originalPrice)}
                          </span>
                        )}

                        <span className="text-3xl font-black">
                          ₹{formatPrice(sellingPrice)}
                        </span>
                      </div>

                      {savings > 0 && (
                        <p className="mt-2 text-sm font-medium text-green-400">
                          Member saves ₹{formatPrice(savings)}
                        </p>
                      )}
                    </div>
                  )}

                {/* AVAILABILITY */}
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-800 bg-black p-5 transition hover:border-zinc-700">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 accent-orange-500"
                  />

                  <span>
                    <span className="block text-sm font-bold text-white">
                      Product is available
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-zinc-600">
                      Members can see and order this product when
                      enabled.
                    </span>
                  </span>
                </label>

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingProduct ? (
                        <Pencil size={17} />
                      ) : (
                        <Plus size={18} />
                      )}

                      {editingProduct
                        ? "Update Product"
                        : "Add Product"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* PRODUCTS */}
        <section>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Package
                  size={19}
                  className="text-orange-400"
                />

                <h2 className="text-xl font-bold">
                  Product Inventory
                </h2>
              </div>

              <p className="mt-1 text-sm text-zinc-600">
                {products.length}{" "}
                {products.length === 1 ? "product" : "products"}{" "}
                in the gym store
              </p>
            </div>

            <button
              type="button"
              onClick={loadProducts}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white disabled:opacity-50 sm:self-auto"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c0c0c]"
                >
                  <div className="h-56 animate-pulse bg-zinc-900" />
                  <div className="space-y-3 p-5">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-zinc-900" />
                    <div className="h-4 w-full animate-pulse rounded bg-zinc-900" />
                    <div className="h-8 w-1/3 animate-pulse rounded bg-zinc-900" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-800 bg-[#0c0c0c] px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                <Package size={28} />
              </div>

              <h3 className="mt-5 text-lg font-bold">
                No products yet
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-600">
                Add your first supplement or gym product to make it
                available to members.
              </p>

              <button
                type="button"
                onClick={openAddForm}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-orange-400"
              >
                <Plus size={17} />
                Add First Product
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => {
                const discount = getProductDiscount(product);

                return (
                  <article
                    key={product._id}
                    className="group overflow-hidden rounded-3xl border border-zinc-800 bg-[#0c0c0c] shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-zinc-700"
                  >
                    {/* IMAGE */}
                    <div className="relative overflow-hidden bg-zinc-900">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-60 w-full object-cover transition duration-500 group-hover:scale-105"
                      />

                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />

                      <div className="absolute left-3 top-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black ${
                            product.isActive
                              ? "bg-green-500 text-black"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              product.isActive
                                ? "bg-black"
                                : "bg-zinc-500"
                            }`}
                          />

                          {product.isActive
                            ? "Available"
                            : "Unavailable"}
                        </span>
                      </div>

                      {discount.percentage > 0 && (
                        <div className="absolute right-3 top-3">
                          <span className="rounded-full bg-orange-500 px-3 py-1.5 text-[11px] font-black text-black">
                            {discount.percentage}% OFF
                          </span>
                        </div>
                      )}
                    </div>

                    {/* CONTENT */}
                    <div className="p-5">
                      <div className="min-h-[82px]">
                        <h3 className="text-lg font-bold text-white">
                          {product.name}
                        </h3>

                        {product.description && (
                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-500">
                            {product.description}
                          </p>
                        )}
                      </div>

                      {/* PRICE */}
                      <div className="mt-4 border-t border-zinc-800 pt-4">
                        <div className="flex flex-wrap items-end gap-2">
                          {discount.percentage > 0 && (
                            <span className="text-sm text-zinc-600 line-through">
                              ₹
                              {formatPrice(
                                product.originalPrice
                              )}
                            </span>
                          )}

                          <span className="text-2xl font-black text-white">
                            ₹{formatPrice(product.price)}
                          </span>
                        </div>

                        {discount.savings > 0 && (
                          <p className="mt-1 text-xs font-medium text-green-400">
                            Save ₹{formatPrice(discount.savings)}
                          </p>
                        )}
                      </div>

                      {/* ACTIONS */}
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-3 py-3 text-sm font-bold text-zinc-200 transition hover:border-orange-500/50 hover:bg-orange-500/5 hover:text-orange-400"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleActive(product)
                          }
                          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold transition ${
                            product.isActive
                              ? "border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10"
                              : "border-green-500/20 text-green-400 hover:bg-green-500/10"
                          }`}
                        >
                          <Power size={16} />

                          {product.isActive
                            ? "Disable"
                            : "Enable"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 px-3 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500/10"
                        >
                          <Trash2 size={16} />
                          Delete Product
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent = "default",
}) {
  const accentClass =
    accent === "green"
      ? "text-green-400 bg-green-500/10"
      : accent === "orange"
        ? "text-orange-400 bg-orange-500/10"
        : "text-zinc-300 bg-zinc-800/70";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#0c0c0c] p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClass}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-zinc-600">
            {label}
          </p>

          <p className="mt-0.5 text-2xl font-black text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
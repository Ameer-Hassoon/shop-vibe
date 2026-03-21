"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/store/language";
import Link from "next/link";
import Image from "next/image";

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/80x80?text=N/A";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    image: string;
    price: number;
    stock: number;
  };
}

interface Order {
  id: string;
  status: string;
  total: number;
  shippingAddress: string;
  city: string;
  state: string;
  zipCode: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  estimatedDelivery?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  items: OrderItem[];
  coupon?: {
    id: string;
    code: string;
    type: string;
    value: number;
  } | null;
  discountAmount: number;
}

export default function AdminOrderDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const t = useLanguage((state) => state.t);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [restoreStock, setRestoreStock] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const orderId = params.id as string;

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch order");
      }
      const data = await res.json();
      setOrder(data);
      setNewStatus(data.status);
      setTrackingNumber(data.trackingNumber || "");
      setCarrier(data.carrier || "");
      setEstimatedDelivery(
        data.estimatedDelivery
          ? new Date(data.estimatedDelivery).toISOString().split("T")[0]
          : "",
      );
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (
      status === "authenticated" &&
      (session?.user as { role?: string }).role === "ADMIN"
    ) {
      fetchOrder();
    }
  }, [status, session, fetchOrder]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber,
          carrier,
          estimatedDelivery: estimatedDelivery || null,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update order");
      }
      await fetchOrder();
    } catch (error) {
      console.error("Update error:", error);
      alert(t("adminOrders.updateFailed"));
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELLED",
          restoreStock,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to cancel order");
      }
      await fetchOrder();
      setShowCancelModal(false);
    } catch (error) {
      console.error("Cancel error:", error);
      alert(t("adminOrders.cancelFailed"));
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400";
      case "PROCESSING":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400";
      case "CONFIRMED":
        return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400";
      case "SHIPPED":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400";
      case "DELIVERED":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400";
      case "CANCELLED":
        return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400";
      case "REFUNDED":
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statuses = [
    { value: "PENDING", label: t("adminOrders.pending") },
    { value: "PROCESSING", label: t("adminOrders.processing") },
    { value: "CONFIRMED", label: t("adminOrders.confirmed") },
    { value: "SHIPPED", label: t("adminOrders.shipped") },
    { value: "DELIVERED", label: t("adminOrders.delivered") },
  ];

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t("admin.accessDenied")}
          </h2>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t("adminOrders.orderNotFound")}
        </h2>
        <Link
          href="/admin/orders"
          className="text-indigo-600 dark:text-indigo-400 hover:underline mt-4 inline-block"
        >
          {t("adminOrders.backToOrders")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/admin/orders"
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t("adminOrders.backToOrders")}
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("adminOrders.orderDetails")} #{order.id.slice(0, 8)}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <span
          className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}
        >
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            {t("adminOrders.customer")}
          </h3>
          <p className="font-medium text-gray-900 dark:text-white">
            {order.user.name || t("adminOrders.guest")}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {order.user.email}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            ID: {order.user.id.slice(0, 8)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            {t("adminOrders.shipping")}
          </h3>
          <p className="text-gray-900 dark:text-white">
            {order.shippingAddress}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {order.city}, {order.state} {order.zipCode}
          </p>
          {order.trackingNumber && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {order.carrier && <span>{order.carrier}: </span>}
                <span className="font-mono">{order.trackingNumber}</span>
              </p>
              {order.estimatedDelivery && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ETA: {new Date(order.estimatedDelivery).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            {t("adminOrders.summary")}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                {t("adminOrders.subtotal")}
              </span>
              <span className="text-gray-900 dark:text-white">
                ${(order.total + order.discountAmount).toFixed(2)}
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>{t("adminOrders.discount")}</span>
                <span>-${order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-900 dark:text-white">
                {t("adminOrders.total")}
              </span>
              <span className="text-indigo-600 dark:text-indigo-400">
                ${order.total.toFixed(2)}
              </span>
            </div>
            {order.coupon && (
              <div className="text-xs text-gray-500 dark:text-gray-400 pt-2">
                Coupon: {order.coupon.code} ({order.coupon.type === "PERCENT" ? `${order.coupon.value}%` : `$${order.coupon.value}`})
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t("adminOrders.updateOrder")}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("adminOrders.status")}
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                disabled={order.status === "CANCELLED" || order.status === "DELIVERED"}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              >
                {statuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("adminOrders.carrier")}
              </label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="UPS, FedEx, USPS..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("adminOrders.trackingNumber")}
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="1Z999AA..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("adminOrders.estimatedDelivery")}
              </label>
              <input
                type="date"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleUpdate}
              disabled={updating || (order.status === "CANCELLED" || order.status === "DELIVERED")}
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updating ? t("adminOrders.updating") : t("adminOrders.updateStatus")}
            </button>
            {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={updating}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t("adminOrders.cancel")}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t("adminOrders.items")} ({order.items.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {order.items.map((item) => (
            <div key={item.id} className="p-6 flex items-center gap-4">
              <Link
                href={`/product/${item.product.id}`}
                className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity"
              >
                <Image
                  src={failedImages.has(item.product.id) ? PLACEHOLDER_IMAGE : item.product.image}
                  alt={item.product.name}
                  width={80}
                  height={80}
                  className="object-cover"
                  onError={() => {
                    setFailedImages((prev) => new Set(prev).add(item.product.id));
                  }}
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/product/${item.product.id}`}
                  className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {item.product.name}
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  SKU: {item.product.id.slice(0, 8)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.quantity} × ${item.price.toFixed(2)}
                </p>
                <p className="font-bold text-gray-900 dark:text-white">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t("adminOrders.cancelOrder")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t("adminOrders.cancelConfirm")}
            </p>
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={restoreStock}
                onChange={(e) => setRestoreStock(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t("adminOrders.restoreStock")}
              </span>
            </label>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={updating}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {t("adminOrders.keepOrder")}
              </button>
              <button
                onClick={handleCancel}
                disabled={updating}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {updating ? t("adminOrders.cancelling") : t("adminOrders.confirmCancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

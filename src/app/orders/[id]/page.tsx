"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/store/language";
import Image from "next/image";
import Link from "next/link";
import { OrderTrackingTimeline } from "@/components/OrderTrackingTimeline";

function OrderItemImage({ src, alt }: { src: string; alt: string }) {
  const [imageSrc, setImageSrc] = useState(src);

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={80}
      height={80}
      className="object-cover"
      onError={() => setImageSrc("/images/placeholder-80.png")}
    />
  );
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    image: string;
    price: number;
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
  trackingNumber: string | null;
  carrier: string | null;
  estimatedDelivery: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const t = useLanguage((state) => state.t);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !params.id) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        } else {
          router.push("/orders");
        }
      } catch (error) {
        console.error("Failed to fetch order:", error);
        router.push("/orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [status, params.id, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/orders"
        className="text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-block"
      >
        &larr; {t("tracking.backToOrders")}
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("orders.orderId")} #{order.id.slice(0, 8)}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t("tracking.placedOn")} {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <OrderTrackingTimeline
            status={order.status}
            estimatedDelivery={order.estimatedDelivery}
          />

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t("tracking.orderItems")}</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <Link
                    href={`/product/${item.product.id}`}
                    className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0"
                  >
                    <OrderItemImage
                      src={item.product.image}
                      alt={item.product.name}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.product.id}`}
                      className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t("checkout.qty")}: {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold dark:text-white">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t("checkout.subtotal")}</span>
                <span className="dark:text-gray-200">${order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500 dark:text-gray-400">{t("checkout.shipping")}</span>
                <span className="dark:text-gray-200">{t("checkout.free")}</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="dark:text-white">{t("checkout.total")}</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              {t("orders.shippingAddress")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {order.shippingAddress}
              <br />
              {order.city}, {order.state}
              <br />
              {order.zipCode}
            </p>
          </div>

          {order.trackingNumber && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                {t("tracking.trackingNumber")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("tracking.carrier")}</p>
              <p className="font-medium mb-2 dark:text-gray-200">
                {order.carrier || t("tracking.standardShipping")}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("tracking.trackingNumber")}</p>
              <p className="font-mono font-medium dark:text-gray-200">{order.trackingNumber}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

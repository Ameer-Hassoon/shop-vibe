"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
        className="text-indigo-600 hover:underline mb-4 inline-block"
      >
        &larr; Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order.id.slice(0, 8)}
          </h1>
          <p className="text-gray-500 mt-1">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <OrderTrackingTimeline
            status={order.status}
            estimatedDelivery={order.estimatedDelivery}
          />

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <Link
                    href={`/product/${item.product.id}`}
                    className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"
                  >
                    <OrderItemImage
                      src={item.product.image}
                      alt={item.product.name}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.product.id}`}
                      className="font-medium text-gray-900 hover:text-indigo-600"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">
                      Qty: {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t border-gray-200">
                <span>Total</span>
                <span className="text-indigo-600">
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Shipping Address
            </h3>
            <p className="text-gray-600">
              {order.shippingAddress}
              <br />
              {order.city}, {order.state}
              <br />
              {order.zipCode}
            </p>
          </div>

          {order.trackingNumber && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Tracking Information
              </h3>
              <p className="text-sm text-gray-500">Carrier</p>
              <p className="font-medium mb-2">
                {order.carrier || "Standard Shipping"}
              </p>
              <p className="text-sm text-gray-500">Tracking Number</p>
              <p className="font-mono font-medium">{order.trackingNumber}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

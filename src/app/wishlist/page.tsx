"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cart";
import { Product } from "@/types";

function WishlistItemImage({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
        <span className="text-xs">No image</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
      className="object-cover"
      onError={() => setErrored(true)}
    />
  );
}

interface WishlistItem {
  id: string;
  product: Product;
  createdAt: string;
}

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchWishlist();
    }
  }, [status]);

  const fetchWishlist = async () => {
    try {
      const res = await fetch("/api/wishlist");
      if (res.ok) {
        const data = await res.json();
        setWishlist(data);
      }
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const res = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        setWishlist((prev) =>
          prev.filter((item) => item.product.id !== productId),
        );
      }
    } catch (error) {
      console.error("Failed to remove from wishlist:", error);
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    removeFromWishlist(product.id);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        My Wishlist ({wishlist.length})
      </h1>

      {wishlist.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <p className="text-gray-500 text-lg mb-4">Your wishlist is empty</p>
          <Link href="/" className="text-indigo-600 hover:underline">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <Link href={`/product/${item.product.id}`} className="block">
                <div className="relative aspect-square bg-gray-50">
                  <WishlistItemImage
                    src={item.product.image}
                    alt={item.product.name}
                  />
                </div>
              </Link>
              <div className="p-4">
                <Link href={`/product/${item.product.id}`}>
                  <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-indigo-600">
                    {item.product.name}
                  </h3>
                </Link>
                <p className="text-sm text-gray-500 mt-1">
                  {item.product.category}
                </p>
                <p className="text-xl font-bold text-gray-900 mt-2">
                  ${item.product.price.toFixed(2)}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleAddToCart(item.product)}
                    disabled={item.product.stock <= 0}
                    className="flex-1 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    {item.product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                  </button>
                  <button
                    onClick={() => removeFromWishlist(item.product.id)}
                    aria-label={`Remove ${item.product.name} from wishlist`}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

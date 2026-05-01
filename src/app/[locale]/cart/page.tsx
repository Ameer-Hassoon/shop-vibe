"use client";

import Image from "next/image";
import { useCartStore } from "@/store/cart";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

export default function CartPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('cart.emptyCart')}</h1>
        <p className="text-gray-500 mt-2">{t("cart.addSomeItems")}</p>
        <Link
          href="/"
          locale={locale}
          className="inline-block mt-6 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {t('cart.continueShopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        {t('cart.yourCart')} ({items.length})
      </h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200">
          {items.map((item) => (
            <div key={item.id} className="p-6 flex gap-6">
              <Link
                href={`/product/${item.product.id}`}
                locale={locale}
                className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity"
              >
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  width={96}
                  height={96}
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/96x96?text=No";
                  }}
                />
              </Link>

              <div className="flex-1">
                <Link
                  href={`/product/${item.product.id}`}
                  locale={locale}
                  className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                >
                  {item.product.name}
                </Link>
                <p className="text-sm text-gray-500 mt-1">
                  ${item.product.price.toFixed(2)}
                </p>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (item.quantity > 1) {
                          updateQuantity(item.productId, item.quantity - 1);
                        }
                      }}
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={t("cart.decreaseQuantity")}
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-medium text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-900"
                      aria-label={t("cart.increaseQuantity")}
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-bold text-lg text-gray-900">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      aria-label={t("cart.removeProduct")}
                      className="text-red-600 hover:text-red-800 transition-colors"
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
            </div>
          ))}
        </div>

        <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 cart-footer-section">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">
              {t('cart.subtotal')}
            </span>
            <span className="font-medium text-gray-900">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-2xl font-bold mb-6">
            <span className="text-gray-900">
              {t('cart.total')}
            </span>
            <span className="text-indigo-600">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
          <button
            onClick={() => router.push("/checkout", { locale })}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
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
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {t('cart.checkout')}
          </button>
          <Link
            href="/"
            locale={locale}
            className="block text-center mt-4 text-gray-500 hover:text-indigo-600 transition-colors"
          >
            {t('cart.continueShopping')}
          </Link>
        </div>
      </div>
    </div>
  );
}

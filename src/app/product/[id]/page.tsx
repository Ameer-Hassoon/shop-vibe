'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { Product } from '@/types';
import Link from 'next/link';

export default function ProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch product:', err);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
        <Link href="/" className="text-indigo-600 hover:underline mt-4 inline-block">
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/" className="text-indigo-600 hover:underline mb-4 inline-block">
        &larr; Back to products
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x600?text=No+Image';
            }}
          />
        </div>
        
        <div>
          <span className="text-sm text-indigo-600 font-medium uppercase">
            {product.category}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            {product.name}
          </h1>
          <p className="text-3xl font-bold text-gray-900 mt-4">
            ${product.price.toFixed(2)}
          </p>
          <p className="text-gray-600 mt-6 leading-relaxed">
            {product.description}
          </p>
          
          <div className="mt-6">
            {product.stock > 0 ? (
              <p className="text-green-600 font-medium flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {product.stock} in stock
              </p>
            ) : (
              <p className="text-red-600 font-medium flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Out of stock
              </p>
            )}
          </div>
          
          <button
            onClick={() => addToCart(product)}
            disabled={product.stock <= 0}
            className="w-full mt-4 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}

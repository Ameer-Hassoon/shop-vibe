'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import Link from 'next/link';
import { Product } from '@/types';

const CATEGORIES = [
  'Electronics',
  'Computers & Laptops',
  'Phones & Tablets',
  'Cameras & Photography',
  'TV & Home Entertainment',
  'Audio & Headphones',
  'Clothing',
  'Shoes & Footwear',
  'Jewelry & Watches',
  'Bags & Backpacks',
  'Home & Garden',
  'Kitchen & Dining',
  'Furniture',
  'Lighting',
  'Sports & Outdoors',
  'Fitness Equipment',
  'Cycling',
  'Camping & Hiking',
  'Books',
  'Toys & Games',
  'Beauty & Personal Care',
  'Automotive',
  'Pet Supplies',
  'Office Supplies',
];

const ITEMS_PER_PAGE = 20;
const MAX_PRICE = 1000;

function DualRangeSlider({ 
  min, 
  max, 
  onMinChange, 
  onMaxChange 
}: { 
  min: number; 
  max: number; 
  onMinChange: (val: number) => void; 
  onMaxChange: (val: number) => void; 
}) {
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);
  
  const handleMouseDown = (type: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(type);
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      
      const slider = document.getElementById('price-slider');
      if (!slider) return;
      
      const rect = slider.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const value = Math.round((percentage / 100) * MAX_PRICE / 10) * 10;
      
      if (dragging === 'min') {
        onMinChange(Math.min(value, max - 10));
      } else {
        onMaxChange(Math.max(value, min + 10));
      }
    };
    
    const handleMouseUp = () => {
      setDragging(null);
    };
    
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, min, max, onMinChange, onMaxChange]);

  const minPercent = (min / MAX_PRICE) * 100;
  const maxPercent = (max / MAX_PRICE) * 100;

  return (
    <div className="px-2" id="price-slider">
      <div className="relative h-2 bg-gray-200 rounded-full">
        <div 
          className="absolute h-full bg-indigo-600 rounded-full"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <div
          className="absolute w-5 h-5 bg-white border-2 border-indigo-600 rounded-full -top-1.5 cursor-grab active:cursor-grabbing shadow-md"
          style={{ left: `calc(${minPercent}% - 10px)` }}
          onMouseDown={handleMouseDown('min')}
        />
        <div
          className="absolute w-5 h-5 bg-white border-2 border-indigo-600 rounded-full -top-1.5 cursor-grab active:cursor-grabbing shadow-md"
          style={{ left: `calc(${maxPercent}% - 10px)` }}
          onMouseDown={handleMouseDown('max')}
        />
      </div>
      <div className="flex justify-between text-sm mt-3">
        <span className="font-medium text-indigo-600">${min}</span>
        <span className="font-medium text-indigo-600">${max === MAX_PRICE ? `${MAX_PRICE}+` : max}</span>
      </div>
    </div>
  );
}

function HomePageContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    let filteredProducts = [...products];
    
    filteredProducts = filteredProducts.filter((p) => {
      return p.price >= minPrice && p.price <= maxPrice;
    });

    if (sortBy === 'price-low') {
      filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
    }

    setTotalProducts(filteredProducts.length);
    setTotalPages(Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  }, [products, minPrice, maxPrice, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategories]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategories]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const categoryParam = selectedCategories.length > 0 ? selectedCategories.join(',') : '';
      const url = `/api/products?search=${encodeURIComponent(searchQuery)}${categoryParam ? `&category=${categoryParam}` : ''}&page=1&limit=100`;
      const res = await fetch(url);
      const data = await res.json();
      setProducts(data.products || []);
      setTotalProducts(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / ITEMS_PER_PAGE));
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setMinPrice(0);
    setMaxPrice(MAX_PRICE);
  };

  const getFilteredAndSortedProducts = () => {
    let filtered = [...products];
    
    filtered = filtered.filter((p) => {
      return p.price >= minPrice && p.price <= maxPrice;
    });

    if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage - 3);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(
        <button key={1} onClick={() => setCurrentPage(1)} className="px-3 py-2 text-sm">1</button>
      );
      if (startPage > 2) pages.push(<span key="dots1" className="px-2">...</span>);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-2 text-sm ${i === currentPage ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push(<span key="dots2" className="px-2">...</span>);
      pages.push(
        <button key={totalPages} onClick={() => setCurrentPage(totalPages)} className="px-3 py-2 text-sm">
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        <aside className="w-72 flex-shrink-0 hidden lg:block">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-4">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Categories
              </h2>
              {(selectedCategories.length > 0 || minPrice > 0 || maxPrice < MAX_PRICE) && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto space-y-1 custom-scrollbar">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left ${
                    selectedCategories.includes(category)
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="text-sm">{category}</span>
                  {selectedCategories.includes(category) && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Price Range
              </h3>
              
              <DualRangeSlider 
                min={minPrice} 
                max={maxPrice} 
                onMinChange={(val) => { setMinPrice(val); setCurrentPage(1); }}
                onMaxChange={(val) => { setMaxPrice(val); setCurrentPage(1); }}
              />
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              {searchQuery ? (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Results for &quot;<span className="text-indigo-600">{searchQuery}</span>&quot;
                  </h1>
                  <p className="text-gray-500 mt-1">{totalProducts} products found</p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">All Products</h1>
                  <p className="text-gray-500 mt-1">{totalProducts} products available</p>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {(selectedCategories.length > 0 || minPrice > 0 || maxPrice < MAX_PRICE) && (
                  <span className="bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {selectedCategories.length + ((minPrice > 0 || maxPrice < MAX_PRICE) ? 1 : 0)}
                  </span>
                )}
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>

          {showFilters && (
            <div className="lg:hidden mb-6 bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-3">Categories</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      selectedCategories.includes(category)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <h3 className="font-bold text-gray-900 mb-3">Price Range</h3>
              <DualRangeSlider 
                min={minPrice} 
                max={maxPrice} 
                onMinChange={(val) => { setMinPrice(val); setCurrentPage(1); }}
                onMaxChange={(val) => { setMaxPrice(val); setCurrentPage(1); }}
              />
            </div>
          )}

          {(selectedCategories.length > 0 || minPrice > 0 || maxPrice < MAX_PRICE) && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {selectedCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                >
                  {cat}
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </span>
              ))}
              {(minPrice > 0 || maxPrice < MAX_PRICE) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                  ${minPrice} - ${maxPrice === MAX_PRICE ? `${MAX_PRICE}+` : maxPrice}
                  <button
                    onClick={() => { setMinPrice(0); setMaxPrice(MAX_PRICE); }}
                    className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center min-h-[50vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : getFilteredAndSortedProducts().length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-lg">No products found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
              <button
                onClick={clearFilters}
                className="text-indigo-600 hover:underline mt-2"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {getFilteredAndSortedProducts().map((product) => (
                  <div
                    key={product.id}
                    className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-indigo-300 hover:shadow-lg transition-all duration-300"
                  >
                    <Link href={`/product/${product.id}`} className="block">
                      <div className="relative aspect-square overflow-hidden bg-gray-50">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=No+Image';
                          }}
                        />
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-md shadow-sm">
                            {product.category}
                          </span>
                        </div>
                      </div>
                    </Link>
                    
                    <div className="p-4">
                      <Link href={`/product/${product.id}`}>
                        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors min-h-[3rem]">
                          {product.name}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center gap-1 mt-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">(128)</span>
                      </div>
                      
                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <p className="text-xs text-gray-500 line-through">${(product.price * 1.2).toFixed(2)}</p>
                          <p className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</p>
                          {product.stock <= 5 && product.stock > 0 && (
                            <p className="text-xs text-orange-500 font-medium">Only {product.stock} left</p>
                          )}
                          {product.stock === 0 && (
                            <p className="text-xs text-red-500 font-medium">Out of stock</p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleAddToCart(product);
                          }}
                          disabled={product.stock <= 0}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
                        >
                          {product.stock > 0 ? 'Add' : 'Out'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  {renderPagination()}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}

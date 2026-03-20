"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Language = "en" | "ar";

interface LanguageState {
  language: Language;
  _hasHydrated: boolean;
  setLanguage: (lang: Language) => void;
  setHasHydrated: (state: boolean) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  translateCategory: (category: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Navbar
  "nav.search": { en: "Search products...", ar: "البحث عن المنتجات..." },
  "nav.cart": { en: "Cart", ar: "السلة" },
  "nav.login": { en: "Login", ar: "تسجيل الدخول" },
  "nav.wishlist": { en: "Wishlist", ar: "المفضلة" },
  "nav.profile": { en: "My Profile", ar: "ملفي الشخصي" },
  "nav.orders": { en: "Order History", ar: "سجل الطلبات" },
  "nav.signout": { en: "Sign Out", ar: "تسجيل الخروج" },
  "nav.admin": { en: "Admin", ar: "مدير" },
  "nav.switchToLight": { en: "Switch to light mode", ar: "التبديل إلى الوضع الفاتح" },
  "nav.switchToDark": { en: "Switch to dark mode", ar: "التبديل إلى الوضع الداكن" },
  "nav.switchToArabic": { en: "Switch to Arabic", ar: "التبديل إلى العربية" },
  "nav.switchToEnglish": { en: "Switch to English", ar: "التبديل إلى الإنجليزية" },

  // Search
  "search.recent": { en: "Recent", ar: "الأخيرة" },
  "search.clear": { en: "Clear recent searches", ar: "مسح عمليات البحث الأخيرة" },
  "search.seeAll": { en: "See all results for", ar: "عرض جميع النتائج لـ" },

  // Filters
  "filter.title": { en: "Filters", ar: "الفلاتر" },
  "filter.categories": { en: "Categories", ar: "الفئات" },
  "filter.price": { en: "Price Range", ar: "نطاق السعر" },
  "filter.rating": { en: "Rating", ar: "التقييم" },
  "filter.up": { en: "& up", ar: "وأعلى" },
  "filter.inStock": { en: "In Stock Only", ar: "المتوفر فقط" },
  "filter.clearAll": { en: "Clear all", ar: "مسح الكل" },

  // Categories
  "cat.electronics": { en: "Electronics", ar: "إلكترونيات" },
  "cat.computers": { en: "Computers & Laptops", ar: "أجهزة الكمبيوتر المحمولة" },
  "cat.phones": { en: "Phones & Tablets", ar: "الهواتف والأجهزة اللوحية" },
  "cat.cameras": { en: "Cameras & Photography", ar: "الكاميرات والتصوير" },
  "cat.tv": { en: "TV & Home Entertainment", ar: "التلفاز والترفيه المنزلي" },
  "cat.audio": { en: "Audio & Headphones", ar: "الصوتيات والسماعات" },
  "cat.clothing": { en: "Clothing", ar: "الملابس" },
  "cat.shoes": { en: "Shoes & Footwear", ar: "الأحذية" },
  "cat.jewelry": { en: "Jewelry & Watches", ar: "المجوهرات والساعات" },
  "cat.bags": { en: "Bags & Backpacks", ar: "الحقائب والحزم" },
  "cat.home": { en: "Home & Garden", ar: "المنزل والحديقة" },
  "cat.kitchen": { en: "Kitchen & Dining", ar: "المطبخ وتناول الطعام" },
  "cat.furniture": { en: "Furniture", ar: "الأثاث" },
  "cat.lighting": { en: "Lighting", ar: "الإضاءة" },
  "cat.sports": { en: "Sports & Outdoors", ar: "الرياضة في الهواء الطلق" },
  "cat.fitness": { en: "Fitness Equipment", ar: "معدات اللياقة البدنية" },
  "cat.cycling": { en: "Cycling", ar: "ركوب الدراجات" },
  "cat.camping": { en: "Camping & Hiking", ar: "التخييم والمشي" },
  "cat.books": { en: "Books", ar: "الكتب" },
  "cat.toys": { en: "Toys & Games", ar: "الألعاب" },
  "cat.beauty": { en: "Beauty & Personal Care", ar: "الجمال والعناية الشخصية" },
  "cat.automotive": { en: "Automotive", ar: "السيارات" },
  "cat.pets": { en: "Pet Supplies", ar: "مستلزمات الحيوانات الأليفة" },
  "cat.office": { en: "Office Supplies", ar: "لوازم المكتب" },
  "cat.other": { en: "Other", ar: "أخرى" },

  // Products
  "product.addToCart": { en: "Add to Cart", ar: "أضف إلى السلة" },
  "product.outOfStock": { en: "Out of Stock", ar: "غير متوفر" },
  "product.lowStock": { en: "Only {{count}} left", ar: "متبقي {{count}}" },
  "product.add": { en: "Add", ar: "أضف" },

  // Sort
  "sort.newest": { en: "Newest First", ar: "الأحدث أولاً" },
  "sort.priceLow": { en: "Price: Low to High", ar: "السعر: من الأقل للأعلى" },
  "sort.priceHigh": { en: "Price: High to Low", ar: "السعر: من الأعلى للأقل" },
  "sort.name": { en: "Name: A to Z", ar: "الاسم: من أ إلى ي" },
  "sort.rating": { en: "Highest Rated", ar: "الأعلى تقييماً" },

  // Product page
  "product.inStock": { en: "in stock", ar: "متوفر" },
  "product.reviews": { en: "reviews", ar: "تقييم" },
  "product.writeReview": { en: "Write a Review", ar: "كتابة تقييم" },
  "product.related": { en: "Related Products", ar: "منتجات مشابهة" },
  "product.backToProducts": { en: "Back to products", ar: "العودة للمنتجات" },
  "product.editReview": { en: "Edit Your Review", ar: "تعديل تقييمك" },
  "product.noReviews": { en: "No reviews yet.", ar: "لا توجد تقييمات بعد." },
  "product.beFirst": { en: "Be the first to review!", ar: "كن اول من يقيم!" },
  "product.loginToReview": { en: "Login to write a review", ar: "تسجيل الدخول لكتابة تقييم" },
  "product.results": { en: "products found", ar: "منتج" },
  "product.allProducts": { en: "All Products", ar: "جميع المنتجات" },

  // Wishlist
  "wishlist.title": { en: "My Wishlist", ar: "مفضلتي" },
  "wishlist.empty": { en: "Your wishlist is empty", ar: "قائمة أمنياتك فارغة" },
  "wishlist.browse": { en: "Browse Products", ar: "تصفح المنتجات" },
  "wishlist.remove": { en: "Remove from Wishlist", ar: "إزالة من المفضلة" },
  "wishlist.add": { en: "Add to Wishlist", ar: "إضافة للمفضلة" },

  // Cart
  "cart.title": { en: "Shopping Cart", ar: "سلة التسوق" },
  "cart.empty": { en: "Your cart is empty", ar: "سلة التسوق فارغة" },
  "cart.noItems": { en: "Looks like you haven't added any items yet", ar: "يبدو أنك لم تضف أي عناصر بعد" },
  "cart.subtotal": { en: "Subtotal", ar: "المجموع الفرعي" },
  "cart.total": { en: "Total", ar: "الإجمالي" },
  "cart.checkout": { en: "Checkout", ar: "الدفع" },
  "cart.continue": { en: "Continue Shopping", ar: "متابعة التسوق" },
  "cart.remove": { en: "Remove", ar: "إزالة" },

  // Footer
  "footer.home": { en: "Home", ar: "الرئيسية" },
  "footer.about": { en: "About Us", ar: "من نحن" },
  "footer.contact": { en: "Contact", ar: "اتصل بنا" },

  // Common
  "common.loading": { en: "Loading...", ar: "جاري التحميل..." },
  "common.error": { en: "An error occurred", ar: "حدث خطأ" },
  "common.retry": { en: "Retry", ar: "إعادة المحاولة" },
  "common.noProducts": { en: "No products found", ar: "لم يتم العثور على منتجات" },
  "common.clearFilters": { en: "Clear all filters", ar: "مسح جميع الفلاتر" },

  // Auth
  "auth.welcome": { en: "Welcome back", ar: "مرحباً بعودتك" },
  "auth.signInPrompt": { en: "Sign in to your account", ar: "تسجيل الدخول إلى حسابك" },
  "auth.email": { en: "Email", ar: "البريد الإلكتروني" },
  "auth.password": { en: "Password", ar: "كلمة المرور" },
  "auth.passwordPlaceholder": { en: "Your password", ar: "كلمة المرور" },
  "auth.signIn": { en: "Sign in", ar: "تسجيل الدخول" },
  "auth.signingIn": { en: "Signing in...", ar: "جاري تسجيل الدخول..." },
  "auth.noAccount": { en: "Don't have an account?", ar: "ليس لديك حساب؟" },
  "auth.signUp": { en: "Sign up", ar: "التسجيل" },
  "auth.invalidCredentials": { en: "Invalid email or password", ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
  "auth.createAccount": { en: "Create an account", ar: "إنشاء حساب" },
  "auth.name": { en: "Name", ar: "الاسم" },
  "auth.confirmPassword": { en: "Confirm Password", ar: "تأكيد كلمة المرور" },
  "auth.alreadyHaveAccount": { en: "Already have an account?", ar: "لديك حساب بالفعل؟" },
  "auth.signUpPrompt": { en: "Sign up to get started", ar: "سجل للبدء" },
  "auth.namePlaceholder": { en: "Your name", ar: "اسمك" },
  "auth.passwordLength": { en: "At least 6 characters", ar: "6 أحرف على الأقل" },
  "auth.confirmPasswordPlaceholder": { en: "Confirm your password", ar: "أكد كلمة المرور" },
  "auth.creatingAccount": { en: "Creating account...", ar: "جاري إنشاء الحساب..." },
  "auth.passwordsDoNotMatch": { en: "Passwords do not match", ar: "كلمات المرور غير متطابقة" },
  "auth.passwordTooShort": { en: "Password must be at least 6 characters", ar: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
  "auth.registrationFailed": { en: "Registration failed", ar: "فشل التسجيل" },
  "auth.emailPlaceholder": { en: "you@example.com", ar: "example@domain.com" },
  "checkout.cardNumberPlaceholder": { en: "1234 5678 9012 3456", ar: "٤٥٦٧ ٨٩٠١ ٢٣٤٥ ٦٧٨٩" },
  "checkout.expiryDatePlaceholder": { en: "MM/YY", ar: "MM/YY" },
  "checkout.cvvPlaceholder": { en: "123", ar: "١٢٣" },
  "admin.imageUrlPlaceholder": { en: "https://example.com/image.jpg", ar: "https://example.com/image.jpg" },

  // Checkout
  "checkout.title": { en: "Checkout", ar: "الدفع" },
  "checkout.emptyCart": { en: "Your cart is empty", ar: "سلة التسوق فارغة" },
  "checkout.addItems": { en: "Add some items to checkout", ar: "أضف بعض العناصر للدفع" },
  "checkout.continueShopping": { en: "Continue shopping", ar: "متابعة التسوق" },
  "checkout.orderPlaced": { en: "Order Placed!", ar: "تم تأكيد الطلب!" },
  "checkout.thankYou": { en: "Thank you for your purchase. Your order has been confirmed.", ar: "شكراً لك على عملية الشراء. تم تأكيد طلبك." },
  "checkout.confirmationSent": { en: "Order confirmation sent to", ar: "تم إرسال تأكيد الطلب إلى" },
  "checkout.yourEmail": { en: "your email", ar: "بريدك الإلكتروني" },
  "checkout.codMessage": { en: "Cash on Delivery: Please have", ar: "الدفع عند الاستلام: يرجى تجهيز" },
  "checkout.readyWhenArrives": { en: "ready when your order arrives.", ar: "عندما يصل طلبك." },
  "checkout.shippingInfo": { en: "Shipping Information", ar: "معلومات الشحن" },
  "checkout.firstName": { en: "First Name", ar: "الاسم الأول" },
  "checkout.lastName": { en: "Last Name", ar: "اسم العائلة" },
  "checkout.email": { en: "Email", ar: "البريد الإلكتروني" },
  "checkout.address": { en: "Address", ar: "العنوان" },
  "checkout.city": { en: "City", ar: "المدينة" },
  "checkout.state": { en: "State", ar: "المنطقة" },
  "checkout.zipCode": { en: "ZIP Code", ar: "الرمز البريدي" },
  "checkout.paymentMethod": { en: "Payment Method", ar: "طريقة الدفع" },
  "checkout.creditCard": { en: "Credit/Debit Card", ar: "بطاقة ائتمان/خصم" },
  "checkout.payOnline": { en: "Pay securely online", ar: "الدفع بشكل آمن عبر الإنترنت" },
  "checkout.cashOnDelivery": { en: "Cash on Delivery", ar: "الدفع عند الاستلام" },
  "checkout.payWhenReceive": { en: "Pay when you receive", ar: "الدفع عند الاستلام" },
  "checkout.cardNumber": { en: "Card Number", ar: "رقم البطاقة" },
  "checkout.expiryDate": { en: "Expiry Date", ar: "تاريخ الانتهاء" },
  "checkout.cvv": { en: "CVV", ar: "رمز الأمان" },
  "checkout.paymentSecure": { en: "Your payment information is secure and encrypted", ar: "معلومات الدفع الخاصة بك آمنة ومشفرة" },
  "checkout.codInfo": { en: "Pay with cash when your order is delivered to your doorstep. A small COD fee of $3.00 may apply.", ar: "ادفع نقداً عند وصول طلبك إلى باب منزلك. قد يتم تطبيق رسوم COD صغيرة بقيمة 3.00 دولار." },
  "checkout.processingOrder": { en: "Processing Order...", ar: "جاري معالجة الطلب..." },
  "checkout.placeOrder": { en: "Place Order", ar: "تأكيد الطلب" },
  "checkout.placeOrderCod": { en: "Place Order (Pay on Delivery)", ar: "تأكيد الطلب (الدفع عند الاستلام)" },
  "checkout.orderSummary": { en: "Order Summary", ar: "ملخص الطلب" },
  "checkout.qty": { en: "Qty", ar: "الكمية" },
  "checkout.subtotal": { en: "Subtotal", ar: "المجموع الفرعي" },
  "checkout.shipping": { en: "Shipping", ar: "الشحن" },
  "checkout.free": { en: "FREE", ar: "مجاني" },
  "checkout.tax": { en: "Tax (8%)", ar: "الضريبة (8%)" },
  "checkout.codFee": { en: "COD Fee", ar: "رسوم الدفع عند الاستلام" },
  "checkout.total": { en: "Total", ar: "الإجمالي" },
  "checkout.payment": { en: "Payment", ar: "الدفع" },
  "checkout.freeShipping": { en: "Free shipping on orders over $100!", ar: "شحن مجاني للطلبات فوق 100 دولار!" },
  "checkout.placeOrderFailed": { en: "Failed to place order", ar: "فشل في تأكيد الطلب" },
  "checkout.placeOrderFailedRetry": { en: "Failed to place order. Please try again.", ar: "فشل في تأكيد الطلب. يرجى المحاولة مرة أخرى." },

  // Orders
  "orders.title": { en: "My Orders", ar: "طلباتي" },
  "orders.continueShopping": { en: "Continue Shopping", ar: "متابعة التسوق" },
  "orders.noOrders": { en: "No orders yet", ar: "لا توجد طلبات بعد" },
  "orders.startShopping": { en: "Start Shopping", ar: "ابدأ التسوق" },
  "orders.startShoppingDescription": { en: "Start shopping to see your order history here", ar: "ابدأ التسوق لرؤية سجل طلباتك هنا" },
  "orders.orderId": { en: "Order ID", ar: "رقم الطلب" },
  "orders.date": { en: "Date", ar: "التاريخ" },
  "orders.total": { en: "Total", ar: "الإجمالي" },
  "orders.tracking": { en: "Tracking", ar: "التتبع" },
  "orders.shippingAddress": { en: "Shipping Address", ar: "عنوان الشحن" },
  "orders.viewDetails": { en: "View Details", ar: "عرض التفاصيل" },
  "orders.loginRequired": { en: "Please log in to view your orders.", ar: "يرجى تسجيل الدخول لعرض طلباتك." },

  // Order Status
  "status.PENDING": { en: "Pending", ar: "قيد الانتظار" },
  "status.PROCESSING": { en: "Processing", ar: "قيد المعالجة" },
  "status.CONFIRMED": { en: "Confirmed", ar: "تم التأكيد" },
  "status.SHIPPED": { en: "Shipped", ar: "تم الشحن" },
  "status.DELIVERED": { en: "Delivered", ar: "تم التوصيل" },
  "status.CANCELLED": { en: "Cancelled", ar: "ملغي" },
  "status.REFUNDED": { en: "Refunded", ar: "تم استرداد المبلغ" },
  "status.CANCELLED_ORDER": { en: "Order Cancelled", ar: "تم إلغاء الطلب" },
  "status.REFUNDED_ORDER": { en: "Order Refunded", ar: "تم استرداد الطلب" },
  "status.cancelledText": { en: "This order has been cancelled.", ar: "تم إلغاء هذا الطلب." },
  "status.refundedText": { en: "This order has been refunded.", ar: "تم استرداد هذا الطلب." },

  // Order Tracking
  "tracking.orderPlaced": { en: "Order Placed", ar: "تم استلام الطلب" },
  "tracking.processing": { en: "Processing", ar: "قيد المعالجة" },
  "tracking.shipped": { en: "Shipped", ar: "تم الشحن" },
  "tracking.delivered": { en: "Delivered", ar: "تم التوصيل" },
  "tracking.inProgress": { en: "In progress", ar: "قيد التنفيذ" },
  "tracking.orderStatus": { en: "Order Status", ar: "حالة الطلب" },
  "tracking.estimatedDelivery": { en: "Estimated Delivery", ar: "التسليم المتوقع" },
  "tracking.carrier": { en: "Carrier", ar: "الناقل" },
  "tracking.standardShipping": { en: "Standard Shipping", ar: "شحن قياسي" },
  "tracking.trackingNumber": { en: "Tracking Number", ar: "رقم التتبع" },
  "tracking.orderItems": { en: "Order Items", ar: "عناصر الطلب" },
  "tracking.backToOrders": { en: "Back to Orders", ar: "العودة للطلبات" },
  "tracking.placedOn": { en: "Placed on", ar: "تم بتاريخ" },

  // Profile
  "profile.title": { en: "My Profile", ar: "ملفي الشخصي" },
  "profile.administrator": { en: "Administrator", ar: "مدير" },
  "profile.email": { en: "Email", ar: "البريد الإلكتروني" },
  "profile.name": { en: "Name", ar: "الاسم" },
  "profile.notSet": { en: "Not set", ar: "غير محدد" },
  "profile.hideOrderHistory": { en: "Hide Order History", ar: "إخفاء سجل الطلبات" },
  "profile.viewOrderHistory": { en: "View Order History", ar: "عرض سجل الطلبات" },
  "profile.recentOrders": { en: "Recent Orders", ar: "الطلبات الأخيرة" },
  "profile.noOrders": { en: "No orders yet", ar: "لا توجد طلبات بعد" },
  "profile.startShopping": { en: "Start shopping", ar: "ابدأ التسوق" },
  "profile.viewAllOrders": { en: "View all", ar: "عرض الكل" },
  "profile.viewAllOrdersCount": { en: "View all {{count}} orders", ar: "عرض الكل {{count}} طلبات" },
  "profile.orders": { en: "orders", ar: "طلبات" },
  "profile.orderStatus.pending": { en: "Pending", ar: "قيد الانتظار" },
  "profile.orderStatus.processing": { en: "Processing", ar: "قيد المعالجة" },
  "profile.orderStatus.confirmed": { en: "Confirmed", ar: "تم التأكيد" },
  "profile.orderStatus.shipped": { en: "Shipped", ar: "تم الشحن" },
  "profile.orderStatus.delivered": { en: "Delivered", ar: "تم التوصيل" },
  "profile.orderStatus.cancelled": { en: "Cancelled", ar: "ملغي" },
  "profile.orderStatus.refunded": { en: "Refunded", ar: "تم استرداد المبلغ" },

  // Admin
  "admin.title": { en: "Admin Dashboard", ar: "لوحة التحكم" },
  "admin.productsTotal": { en: "products total", ar: "إجمالي المنتجات" },
  "admin.addProduct": { en: "Add Product", ar: "إضافة منتج" },
  "admin.searchProducts": { en: "Search products...", ar: "البحث عن المنتجات..." },
  "admin.showingOf": { en: "Showing", ar: "عرض" },
  "admin.ofProducts": { en: "products", ar: "منتجات" },
  "admin.loading": { en: "Loading...", ar: "جاري التحميل..." },
  "admin.noProductsMatch": { en: "No products match", ar: "لا توجد منتجات تطابق" },
  "admin.noProducts": { en: "No products yet", ar: "لا توجد منتجات بعد" },
  "admin.clearSearch": { en: "Clear search", ar: "مسح البحث" },
  "admin.product": { en: "Product", ar: "المنتج" },
  "admin.category": { en: "Category", ar: "الفئة" },
  "admin.price": { en: "Price", ar: "السعر" },
  "admin.stock": { en: "Stock", ar: "المخزون" },
  "admin.actions": { en: "Actions", ar: "الإجراءات" },
  "admin.inStock": { en: "in stock", ar: "متوفر" },
  "admin.outOfStock": { en: "Out of stock", ar: "غير متوفر" },
  "admin.edit": { en: "Edit", ar: "تعديل" },
  "admin.delete": { en: "Delete", ar: "حذف" },
  "admin.deleting": { en: "Deleting...", ar: "جاري الحذف..." },
  "admin.accessDenied": { en: "Access Denied", ar: "تم رفض الوصول" },
  "admin.mustBeAdmin": { en: "You must be an admin to view this page.", ar: "يجب أن تكون مديراً لعرض هذه الصفحة." },
  "admin.prev": { en: "Prev", ar: "السابق" },
  "admin.next": { en: "Next", ar: "التالي" },
  "admin.backToDashboard": { en: "Back to Dashboard", ar: "العودة للوحة التحكم" },
  "admin.addNewProduct": { en: "Add New Product", ar: "إضافة منتج جديد" },
  "admin.editProduct": { en: "Edit Product", ar: "تعديل المنتج" },
  "admin.productName": { en: "Product Name", ar: "اسم المنتج" },
  "admin.selectCategory": { en: "Select a category", ar: "اختر الفئة" },
  "admin.imageUrl": { en: "Image URL", ar: "رابط الصورة" },
  "admin.stockQuantity": { en: "Stock Quantity", ar: "الكمية في المخزون" },
  "admin.description": { en: "Description", ar: "الوصف" },
  "admin.createProduct": { en: "Create Product", ar: "إنشاء المنتج" },
  "admin.creating": { en: "Creating...", ar: "جاري الإنشاء..." },
  "admin.updateProduct": { en: "Update Product", ar: "تحديث المنتج" },
  "admin.updating": { en: "Updating...", ar: "جاري التحديث..." },
  "admin.deleteConfirm": { en: "Are you sure you want to delete this product?", ar: "هل أنت متأكد من حذف هذا المنتج؟" },
  "admin.deleteFailed": { en: "Failed to delete product", ar: "فشل في حذف المنتج" },
  "admin.productNotFound": { en: "Product not found", ar: "المنتج غير موجود" },
  "admin.createFailed": { en: "Failed to create product", ar: "فشل في إنشاء المنتج" },
  "admin.updateFailed": { en: "Failed to update product", ar: "فشل في تحديث المنتج" },

  // Review
  "review.titlePlaceholder": { en: "Summarize your experience", ar: "لخص تجربتك" },
  "review.contentPlaceholder": { en: "Share your experience with this product...", ar: "شارك تجربتك مع هذا المنتج..." },
};

export const useLanguage = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: "en" as Language,
      _hasHydrated: false,
      setLanguage: (lang) => {
        set({ language: lang });
        if (typeof document !== "undefined") {
          document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
          document.documentElement.lang = lang;
        }
      },
      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },
      t: (key: string, params?: Record<string, string | number>) => {
        const { language, _hasHydrated } = get();
        let text = _hasHydrated 
          ? translations[key]?.[language] || translations[key]?.["en"] || key
          : translations[key]?.["en"] || key;
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
          });
        }
        return text;
      },
      translateCategory: (category: string) => {
        const { language, _hasHydrated } = get();
        const lang = _hasHydrated ? language : "en";
        const catNameToKey: Record<string, string> = {
          "electronics": "cat.electronics",
          "computers & laptops": "cat.computers",
          "phones & tablets": "cat.phones",
          "cameras & photography": "cat.cameras",
          "tv & home entertainment": "cat.tv",
          "audio & headphones": "cat.audio",
          "clothing": "cat.clothing",
          "shoes & footwear": "cat.shoes",
          "jewelry & watches": "cat.jewelry",
          "bags & backpacks": "cat.bags",
          "home & garden": "cat.home",
          "kitchen & dining": "cat.kitchen",
          "furniture": "cat.furniture",
          "lighting": "cat.lighting",
          "sports & outdoors": "cat.sports",
          "fitness equipment": "cat.fitness",
          "cycling": "cat.cycling",
          "camping & hiking": "cat.camping",
          "books": "cat.books",
          "toys & games": "cat.toys",
          "beauty & personal care": "cat.beauty",
          "automotive": "cat.automotive",
          "pet supplies": "cat.pets",
          "office supplies": "cat.office",
        };
        const catKeyToName: Record<string, string> = {
          "cat.electronics": "electronics",
          "cat.computers": "computers & laptops",
          "cat.phones": "phones & tablets",
          "cat.cameras": "cameras & photography",
          "cat.tv": "tv & home entertainment",
          "cat.audio": "audio & headphones",
          "cat.clothing": "clothing",
          "cat.shoes": "shoes & footwear",
          "cat.jewelry": "jewelry & watches",
          "cat.bags": "bags & backpacks",
          "cat.home": "home & garden",
          "cat.kitchen": "kitchen & dining",
          "cat.furniture": "furniture",
          "cat.lighting": "lighting",
          "cat.sports": "sports & outdoors",
          "cat.fitness": "fitness equipment",
          "cat.cycling": "cycling",
          "cat.camping": "camping & hiking",
          "cat.books": "books",
          "cat.toys": "toys & games",
          "cat.beauty": "beauty & personal care",
          "cat.automotive": "automotive",
          "cat.pets": "pet supplies",
          "cat.office": "office supplies",
        };
        let key = category;
        if (catNameToKey[category.toLowerCase()]) {
          key = catNameToKey[category.toLowerCase()];
        } else if (catKeyToName[category]) {
          key = category;
        } else if (category.startsWith("cat.")) {
          key = category;
        } else {
          key = `cat.${category.toLowerCase().replace(/[\s&]/g, '_').replace(/__/g, '_')}`;
        }
        const translation = translations[key]?.[lang];
        if (translation) return translation;
        const fallbackName = catKeyToName[key];
        return fallbackName || category;
      },
    }),
    {
      name: "shop-language",
      partialize: (state) => ({ language: state.language }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (typeof document !== "undefined" && state?.language) {
          document.documentElement.dir = state.language === "ar" ? "rtl" : "ltr";
          document.documentElement.lang = state.language;
        }
      },
    }
  )
);

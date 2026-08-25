import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from "react";
import {
  Search, MapPin, ChevronRight, ChevronLeft, Plus, ShieldCheck, Star, Store,
  User, LayoutDashboard, Phone, Mail, CheckCircle2, Clock,
  Package, Users, DollarSign, X, ArrowLeft, ArrowRight, Wrench, Car, Zap,
  CircleDot, LogOut, Camera, Lightbulb, Wind, Gauge, Armchair,
  RectangleHorizontal, Cog, Settings2, Disc, Sparkles, BadgeCheck, AlertTriangle, Trash2,
  Rocket, Building2, Eye, MessageCircle,
  Languages, ShoppingCart, Truck, AlertOctagon, PackageCheck,
  CircleDollarSign, Flag, ChevronDown, Home, Filter as FilterIcon, Send, Bell, PackageSearch
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar
} from "recharts";

// ---------------------------------------------------------------------
// Storage compatibility shim. `window.storage` is a Claude-artifact-only
// API — it doesn't exist in a normal deployed website. This polyfills the
// exact same shape (get/set/delete/list, with a `shared` flag) using
// localStorage instead, so every one of the ~31 existing window.storage
// calls throughout this file keeps working completely unchanged whether
// this is running as a Claude artifact or as this real deployed site.
//
// Honest limitation: localStorage is per-browser. Data saved under
// shared=true here is NOT actually shared across different visitors the
// way it was inside the Claude artifact's real shared storage — it's
// local to whoever's browser it is. That's fine for testing the real
// auth flow (which now hits the real backend), but the marketplace data
// itself (listings/orders/etc.) is still effectively single-browser demo
// data until those are wired to the backend too, in the next stage.
if (typeof window !== "undefined" && !window.storage) {
  const keyFor = (key, shared) => `ghayarak:${shared ? "shared" : "local"}:${key}`;
  window.storage = {
    async get(key, shared) {
      const raw = localStorage.getItem(keyFor(key, shared));
      if (raw === null) throw new Error("Key not found");
      return { key, value: raw, shared: !!shared };
    },
    async set(key, value, shared) {
      localStorage.setItem(keyFor(key, shared), value);
      return { key, value, shared: !!shared };
    },
    async delete(key, shared) {
      localStorage.removeItem(keyFor(key, shared));
      return { key, deleted: true, shared: !!shared };
    },
    async list(prefix, shared) {
      const fullPrefix = keyFor(prefix || "", shared);
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(fullPrefix)) keys.push(k.slice(keyFor("", shared).length));
      }
      return { keys, prefix, shared: !!shared };
    },
  };
}

/* ---------------------------------------------------------------------
   GHAYARAK (غيارك) — "Your Part"
   A national car-parts marketplace for Libya. Bilingual: EN / AR (RTL).
--------------------------------------------------------------------- */
const C = {
  // Deep ink-navy — near-black but with warmth, not a flat #000
  asphalt: "#12181F", asphalt2: "#1B232E", asphalt3: "#232D3A",
  steel: "#5B6672", steelLight: "#99A2AC",
  // Warm stone neutrals instead of the usual cream/terracotta pairing
  sand: "#E6E0D2", sandLight: "#F0EDE4", paper: "#FAF8F3",
  // Brass — an actual metal, not hazard-tape orange
  amber: "#A2652C", amberDark: "#7E4E22", amberLight: "#F1E2C9",
  // Brick rust — muted, not a bright warning red
  rust: "#9C3D2A", rustLight: "#F1DCD3",
  // Verdigris — oxidized copper-green, used for verified/protected states
  green: "#3E6B62", greenLight: "#DCE9E5",
  ink: "#12181F", line: "#DCD4C0",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Condensed:wght@600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap');
`;

/* ---------------------------------------------------------------------
   i18n
--------------------------------------------------------------------- */
const T = {
  en: {
    brand: "GHAYARAK",
    signIn: "Sign in",
    nav_browse: "Home", nav_post: "Sell", nav_account: "Account",
    searchHeroTitle: "Find a part",
    searchHeroSubtitle: "Search by part name, part number, make, or your car's model",
    searchPlaceholder: "e.g. Land Cruiser bumper, 81210-…",
    searchByPhoto: "Search by photo",
    searchByPhotoComingSoon: "Photo search is coming soon.",
    allCities: "All Libya",
    categoriesLabel: "CATEGORIES",
    showAllCategories: "View all categories",
    showFewerCategories: "Show fewer",
    featuredLabel: "FEATURED",
    allListings: "ALL LISTINGS",
    clear: "Clear",
    noMatchTitle: "No parts match yet",
    noMatchSub: "Try another category, city, or search term.",
    back: "Back",
    descriptionLabel: "DESCRIPTION",
    views: "views", daysAgo: "d ago",
    markAsSold: "Mark as sold",
    protectedDealTitle: "Protected Deal available",
    protectedDealText: "Ghayarak doesn't hold your money — you pay the seller directly. With a Protected Deal, you can report a problem within 48 hours of receiving the part and our team will review it. Protection fee: {fee} LYD, paid by the buyer.",
    protectedDeal: "Protected Deal",
    featured: "Featured",
    individual: "Individual",
    myListings: "MY LISTINGS",
    notPostedYet: "You haven't posted anything yet.",
    setupShop: "Set up a shop / scrapyard page",
    ownerDashboard: "Owner dashboard",
    signOut: "Sign out",
    boost: "Boost", remove: "Remove",
    renewsIn: "Renews in {days} days",
    verificationPending: "Verification pending review",
    loginTitle: "Sign in to Ghayarak",
    phoneTab: "Phone", emailTab: "Email",
    yourName: "Your name",
    mobileNumber: "Mobile number", emailAddress: "Email address",
    ownerLogin: "Owner login",
    backToNormal: "← Back to normal sign in",
    ownerPasscode: "Owner passcode",
    continueBtn: "Continue",
    enterDashboardBtn: "Enter dashboard",
    demoNote: "Demo sign-in — no OTP required in this prototype.",
    otpSentTo: "We sent a code to {contact}.",
    verificationCode: "Verification code",
    verifyBtn: "Verify",
    backBtn: "Back",
    postTitleIndividual: "List a part",
    postTitleShop: "List a part (Shop)",
    titleField: "Title",
    categoryField: "Category",
    conditionField: "Condition",
    makeField: "Make",
    modelField: "Model",
    yearFrom: "Year from", yearTo: "Year to",
    priceField: "Price (LYD)",
    cityField: "City",
    descriptionField: "Description",
    descriptionPlaceholder: "Condition detail, why you're selling, fitment notes…",
    protectedCheckbox: "Offer as a Protected Deal (5% buyer protection fee, funds held until pickup confirmed)",
    publishBtn: "Publish listing",
    shopModalTitle: "Set up your shop page",
    shopNameField: "Shop / scrapyard name",
    shopDescPlaceholder: "What you specialize in, how long you've operated…",
    choosePlan: "CHOOSE A PLAN",
    activatePlanBtn: "Activate plan & create shop",
    boostModalTitle: "Boost this listing",
    boostDesc: "Get featured placement on the homepage and top of your category for {days} days.",
    boostFee: "Boost fee",
    payAndBoost: "Pay & boost now",
    notNow: "Not now",
    statusActive: "active", statusSold: "sold", statusRemoved: "removed", boosted: "Boosted",
    welcomeToast: "Welcome, {name}.",
    callToast: "Call {phone} to reach the seller.",
    boostedToast: "Boosted for {days} days — {fee} LYD charged.",
    publishedToast: "Listing published.",
    planActivatedToast: "{plan} plan activated — {price} LYD/mo charged.",
    shopVerifiedToast: "Shop verified.",
    listingRemovedToast: "Listing removed.",
    markedSoldToast: "Marked as sold.",
    ownerDashTitle: "OWNER DASHBOARD",
    exit: "Exit",
    tabOverview: "Overview", tabModeration: "Moderation", tabRevenue: "Revenue", tabListings: "Listings", tabShops: "Shops",
    approveListingBtn: "Approve", rejectListingBtn: "Reject", flagListingBtn: "Flag",
    listingApprovedToast: "Listing approved — now visible in search.",
    listingRejectedToast: "Listing rejected.",
    listingFlaggedToast: "Listing flagged for review.",
    statActiveListings: "Active listings",
    statShops: "Shops on platform",
    statPending: "{n} pending verification",
    statUsers: "Registered users",
    statRevenue: "Est. revenue to date",
    revenueTrend: "REVENUE TREND (illustrative)",
    awaitingVer: "SHOPS AWAITING VERIFICATION",
    verify: "Verify",
    verifyShop: "Verify shop",
    revenueBySource: "REVENUE BY SOURCE",
    feeStructure: "FEE STRUCTURE",
    feeBullet1: "Individual listings: free to post, {fee} LYD boost / {days} days for featured placement",
    feeBullet2: "Shop subscriptions: {min}–{max} LYD/month by tier",
    feeBullet3: "Protected Deal fee: {pct}% of sale price, paid by buyer, released to seller on confirmed pickup",
    src_subscriptions: "Shop subscriptions", src_boosts: "Boosted listings", src_protection: "Protected deal fees", src_commission: "Order commissions",
    listingsCount: "listings",
    shop: "Shop",
    // Requests ("I Need This Part")
    nav_requests: "Requests",
    requestsTitle: "PART REQUESTS",
    openRequestsLabel: "Open requests",
    myRequestsLabel: "My requests",
    newRequestBtn: "I need this part",
    homeBannerTitle: "Can't find the part? We'll find it for you.",
    homeBannerDesc: "Send your request and get offers from sellers across Libya.",
    homeBannerBtn: "Request a part",
    requestVehicle: "Vehicle",
    requestPartDesc: "What part do you need?",
    requestPartDescPlaceholder: "e.g. \"Front left headlight\" or \"the part that connects the radiator to the engine\"",
    requestCondition: "Condition accepted",
    requestConditionAny: "Any condition is fine",
    requestCity: "City",
    requestUrgency: "How urgent?",
    urgencyAsap: "Need it ASAP", urgencyWeek: "This week", urgencyFlexible: "Flexible",
    submitRequestBtn: "Publish request",
    requestPublishedToast: "Request published — sellers are being notified.",
    offersCount: "{n} offers",
    noOffersYet: "No offers yet — sellers are being notified.",
    submitOfferBtn: "Submit an offer",
    offerPrice: "Your price (LYD)",
    offerCondition: "Condition",
    offerNotes: "Notes (optional)",
    offerNotesPlaceholder: "Fitment detail, warranty, anything the buyer should know…",
    offerDeliveryCheckbox: "Delivery available",
    offerSubmittedToast: "Offer submitted.",
    acceptOfferBtn: "Accept this offer",
    offerAcceptedToast: "Offer accepted — contact the seller to arrange the deal.",
    requestStatusOpen: "open", requestStatusMatched: "matched", requestStatusClosed: "closed",
    requestFrom: "Requested by",
    yourOffer: "Your offer",
    contactToArrange: "Contact",
    noRequestsYet: "No open requests right now.",
    myRequestsEmpty: "You haven't posted a part request yet.",
    backToRequests: "Back to requests",
    // Part number / authenticity
    partNumberField: "Part number (optional)",
    partNumberPlaceholder: "e.g. 81210-60A20",
    authenticityField: "Type",
    auth_oem: "Original / OEM", auth_aftermarket: "Aftermarket", auth_refurbished: "Refurbished", auth_salvage: "Salvage",
    compatWarning: "Confirm exact compatibility with the seller before paying.",
    // Seller tiers / business type
    businessTypeField: "Business type",
    biz_shop: "Parts shop", biz_distributor: "Distributor / Wholesaler", biz_dismantler: "Dismantler / Scrapyard",
    whatsappField: "WhatsApp number",
    addressField: "Street address",
    verifiedIndividual: "Verified individual",
    requestVerification: "Request identity verification",
    verificationRequestedToast: "Verification request sent — we'll review within 48 hours.",
    // Buy / Orders
    buyNow: "Buy",
    buyModalTitle: "Complete your order",
    partPriceLabel: "Part price",
    deliveryFeeLabel: "Delivery",
    protectionFeeLabelShort: "Buyer protection",
    totalToPay: "Total to pay",
    paymentMethodLabel: "Payment method",
    deliveryMethodLabel: "How will you get it?",
    pickupOption: "Pickup", deliveryOption: "Delivery",
    includeProtectionCheckbox: "Add buyer protection ({fee} LYD)",
    sellerCommissionNote: "The seller pays a {pct}% platform commission on this sale — that's how Ghayarak earns, not from you.",
    placeOrderBtn: "Place order",
    orderPlacedToast: "Order placed — the seller has been notified.",
    myOrdersLabel: "My orders", mySalesLabel: "My sales",
    noOrdersYet: "You haven't bought anything yet.",
    noSalesYet: "No orders on your listings yet.",
    orderStatusPending: "awaiting seller", orderStatusAccepted: "accepted", orderStatusPreparing: "preparing",
    orderStatusReady_for_pickup: "ready for pickup", orderStatusOut_for_delivery: "out for delivery",
    orderStatusCollected: "collected", orderStatusDelivered: "delivered", orderStatusCompleted: "completed",
    orderStatusDisputed: "disputed", orderStatusCancelled: "cancelled", orderStatusRefunded: "refunded",
    acceptOrderBtn: "Accept order",
    markDeliveredBtn: "Mark as delivered",
    confirmReceiptBtn: "Confirm I received it",
    reportProblemBtn: "Report a problem",
    orderAcceptedToast: "Order accepted.",
    orderDeliveredToast: "Marked as delivered.",
    orderCompletedToast: "Order completed. Commission invoiced to the seller.",
    disputeTitle: "Report a problem",
    disputeReasonLabel: "What went wrong?",
    disputeDescLabel: "Details",
    disputeDescPlaceholder: "Explain what happened…",
    submitDisputeBtn: "Submit report",
    disputeSubmittedToast: "Reported — our team will review and follow up.",
    orderId: "Order",
    buyerLabel: "Buyer", sellerLabel: "Seller",
    paymentMethodShown: "Payment", deliveryMethodShown: "Delivery method",
    commissionOwedLabel: "Platform commission (seller owes this to Ghayarak)",
    backToOrders: "Back",
    rejectOrderBtn: "Decline order",
    cancelOrderBtn: "Cancel order",
    orderRejectedToast: "Order declined.",
    orderCancelledToast: "Order cancelled.",
    cancelledByBuyer: "Cancelled by buyer",
    cancelledBySeller: "Declined by seller",
    otherPaymentDetailField: "What payment method exactly?",
    otherPaymentDetailPlaceholder: "e.g. a specific wallet app or arrangement",
    alreadyOrderedWarning: "You already have an open order on this listing.",
    listingReservedNote: "This listing is reserved for another buyer.",
    postChoiceTitle: "What would you like to do?",
    postChoiceSell: "Sell a part",
    postChoiceSellDesc: "List a part you have for sale",
    postChoiceRequest: "Request a part",
    postChoiceRequestDesc: "Ask sellers to offer you a part",
    homeLabel: "Home",
    sellWithUsTitle: "Got parts to sell? Reach thousands of buyers.",
    sellWithUsBtn: "Start selling",
    availableNowFilter: "Available now",
    myCarTitle: "Your car",
    myCarSearchBtn: "Find parts for my car",
    addCarTitle: "Add your car",
    addCarDesc: "So we can show you parts that actually fit.",
    addCarBtn: "Add car",
    addCarModalTitle: "Add your car",
    saveCarBtn: "Save",
    recentSearchesLabel: "Recent searches",
    sponsoredLabel: "Sponsored",
    createAdTitle: "Create ad banner",
    advertiserName: "Advertiser name",
    advertiserContact: "Advertiser contact (optional)",
    adHeadline: "Headline",
    adSubtext: "Subtext (optional)",
    adLinkUrl: "Link URL (optional)",
    adAmountPaid: "Amount paid (LYD, optional)",
    adStartsAt: "Starts",
    adEndsAt: "Ends",
    createAdBtn: "Create ad",
    adCreatedToast: "Ad banner created and live.",
    manageAdsBtn: "Advertising",
    verifiedIndividualBadge: "Verified seller",
    verifiedShopBadge: "Verified shop",
    // Search results
    searchResultsTitle: "Results for",
    resultsCount: "{n} results",
    exactMatches: "Exact matches",
    relatedMatches: "You might also like",
    filtersBtn: "Filters",
    sortBtn: "Sort",
    sortRelevance: "Relevance", sortPriceAsc: "Price: low to high", sortPriceDesc: "Price: high to low", sortNewest: "Newest",
    filterSheetTitle: "Filter results",
    priceRangeLabel: "Price range (LYD)",
    priceMinPlaceholder: "Min", priceMaxPlaceholder: "Max",
    anyCondition: "Any condition", anyAuthenticity: "Any type",
    protectedOnlyFilter: "Protected deals only",
    deliveryOnlyFilter: "Delivery available",
    applyFiltersBtn: "Apply filters",
    resetFiltersBtn: "Reset",
    noResultsForQuery: "No results for \"{q}\"",
    tryDifferentSearch: "Try a different term, or post a part request instead.",
    deliveryAvailableLabel: "Delivery",
    pickupOnlyLabel: "Pickup only",
    salesCountLabel: "{n} sales",
    // Shop profile
    visitShopBtn: "Visit shop",
    shopListingsCount: "{n} listings",
    backToResults: "Back",
    // Seller Center
    sellerCenterTitle: "Seller Center",
    dashboardTab: "Dashboard", inventoryTab: "Inventory", matchingTab: "Requests for you",
    statActiveListingsSeller: "Active listings",
    statViews: "Views", statSaves: "Saves", statRevenueSeller: "Revenue (completed)", statCommissionOwed: "Commission owed",
    matchingNotifTitle: "{n} customers are looking for parts you might have",
    matchingNotifBtn: "View requests",
    noMatchingRequests: "No matching requests right now.",
    addPartBtn: "Add a part",
    editShopBtn: "Edit shop",
    inventoryStatusAll: "All", inventoryStatusActive: "Active", inventoryStatusReserved: "Reserved",
    inventoryStatusSold: "Sold", inventoryStatusDraft: "Drafts", inventoryStatusRemoved: "Removed",
    editListingBtn: "Edit",
    markAsDraftBtn: "Move to draft",
    republishBtn: "Publish",
    stockField: "Quantity in stock",
    engineTrimField: "Engine / trim (optional)",
    engineTrimPlaceholder: "e.g. 4.6L V8",
    openingHoursField: "Opening hours",
    openingHoursPlaceholder: "e.g. Sat–Thu 9am–6pm",
    favoriteAddedToast: "Saved.",
    favoriteRemovedToast: "Removed from saved.",
    savedListingsLabel: "Saved listings",
    outOfStockBadge: "Out of stock",
    draftBadge: "Draft",
    editListingModalTitle: "Edit listing",
    updateListingBtn: "Save changes",
    listingUpdatedToast: "Listing updated.",
    listingDraftedToast: "Moved to draft.",
    draftNotSupportedYet: "Drafts aren't supported yet — try removing the listing instead.",
    listingRepublishedToast: "Listing published.",
    goToSellerCenter: "Seller Center",
    photoUploadNote: "Real photo upload needs backend storage — coming in the next phase. For now your listing gets a photo matching its category.",
    myFavoritesEmpty: "You haven't saved any listings yet.",
    // Delivery details
    deliveryAddressField: "Delivery address",
    deliveryAddressPlaceholder: "Street, building, area…",
    deliveryNotesField: "Delivery notes (optional)",
    deliveryNotesPlaceholder: "Landmark, best time to deliver…",
    estimatedDeliveryLabel: "Estimated delivery",
    prepareOrderBtn: "Start preparing",
    dispatchBtnPickup: "Mark ready for pickup",
    dispatchBtnDelivery: "Mark out for delivery",
    fulfilBtnPickup: "Mark collected",
    fulfilBtnDelivery: "Mark delivered",
    orderPreparingToast: "Order marked as preparing.",
    orderDispatchedToast: "Order updated.",
    orderFulfilledToast: "Marked as fulfilled.",
    // Messaging
    messagesTab: "Messages",
    messagePlaceholder: "Type a message…",
    sendBtn: "Send",
    noMessagesYet: "No messages yet. Say hello.",
    messageSentToast: "Sent.",
    // Notifications
    notificationsTitle: "Notifications",
    noNotificationsYet: "No notifications yet.",
    markAllReadBtn: "Mark all read",
    notif_new_order: "New order",
    notif_order_accepted: "Order accepted",
    notif_order_preparing: "Seller is preparing your order",
    notif_order_dispatched: "Order update",
    notif_order_delivered: "Order delivered/collected",
    notif_order_completed: "Order completed",
    notif_order_cancelled: "Order cancelled",
    notif_dispute_update: "Dispute update",
    notif_request_response: "New offer on your request",
    notif_matching_request: "A customer request matches your inventory",
    notif_new_message: "New message",
    // Financials
    financialsTab: "Financials",
    totalSalesLabel: "Total sales",
    commissionOutstandingLabel: "Commission outstanding",
    commissionSettledLabel: "Settled",
    refundsTotalLabel: "Refunds",
    recentTransactionsLabel: "Recent transactions",
    settlementHistoryLabel: "Settlement history",
    markSettledBtn: "Mark settled",
    settledToast: "Marked as settled.",
    settlementStatusOwed: "Outstanding", settlementStatusSettled: "Settled",
    // Refunds
    requestRefundBtn: "Request a refund",
    refundModalTitle: "Request a refund",
    refundAmountField: "Refund amount (LYD)",
    refundReasonField: "Reason",
    refundReasonPlaceholder: "Why is a refund needed?",
    submitRefundBtn: "Submit request",
    refundRequestedToast: "Refund requested.",
    refundStatusRequested: "Refund requested", refundStatusApproved: "Refund approved",
    refundStatusProcessing: "Refund processing", refundStatusRefunded: "Refunded", refundStatusRejected: "Refund rejected",
    approveRefundBtn: "Approve", processRefundBtn: "Mark processing", completeRefundBtn: "Complete refund", rejectRefundBtn: "Reject",
    refundUpdatedToast: "Refund updated.",
    // Bank transfer
    bankTransferNote: "You'll receive Ghayarak's bank transfer instructions after placing this order.",
    submitBankConfirmationTitle: "Submit payment confirmation",
    bankReferenceField: "Transaction reference / sender name",
    bankReferencePlaceholder: "e.g. transfer ref #, or the name on the transfer",
    submitConfirmationBtn: "Submit for review",
    bankConfirmationSubmittedToast: "Submitted — we'll verify and confirm shortly.",
    bankConfirmationPending: "Payment confirmation under review",
    bankConfirmationVerified: "Payment verified",
    bankConfirmationRejected: "Payment confirmation rejected",
    verifyBankTransferBtn: "Verify", rejectBankTransferBtn: "Reject",
    // Reputation
    disputeFreeLabel: "Dispute-free",
    settlementsTab: "Settlements",
    refundsAdminTab: "Refunds",
    bankTransfersAdminTab: "Bank Transfers",
    noPendingItems: "Nothing pending right now.",
  },
  ar: {
    brand: "غيارك",
    signIn: "تسجيل الدخول",
    nav_browse: "الرئيسية", nav_post: "بيع", nav_account: "حسابي",
    searchHeroTitle: "ابحث عن قطعة غيار",
    searchHeroSubtitle: "ابحث باسم القطعة، رقمها، الماركة أو موديل سيارتك",
    searchPlaceholder: "مثال: صدام لاندكروزر 2020، 81210-…",
    searchByPhoto: "ابحث بالصورة",
    searchByPhotoComingSoon: "البحث بالصورة قريبًا.",
    allCities: "كل ليبيا",
    categoriesLabel: "الأقسام",
    showAllCategories: "عرض جميع الأقسام",
    showFewerCategories: "عرض أقل",
    featuredLabel: "مميّز",
    allListings: "كل الإعلانات",
    clear: "مسح",
    noMatchTitle: "لا توجد قطع مطابقة بعد",
    noMatchSub: "جرّب قسمًا آخر، مدينة أخرى، أو كلمة بحث مختلفة.",
    back: "رجوع",
    descriptionLabel: "الوصف",
    views: "مشاهدة", daysAgo: "يوم مضى",
    markAsSold: "تحديد كمُباع",
    protectedDealTitle: "الصفقة المحمية متاحة",
    protectedDealText: "غيارك لا يحتفظ بأموالك — تدفع البائع مباشرة. مع الصفقة المحمية، يمكنك الإبلاغ عن أي مشكلة خلال 48 ساعة من الاستلام وسيراجعها فريقنا. رسوم الحماية: {fee} د.ل، يدفعها المشتري.",
    protectedDeal: "صفقة محمية",
    featured: "مميّز",
    individual: "فرد",
    myListings: "إعلاناتي",
    notPostedYet: "لم تنشر أي إعلان بعد.",
    setupShop: "أنشئ صفحة محل / تشليح",
    ownerDashboard: "لوحة تحكم المالك",
    signOut: "تسجيل الخروج",
    boost: "ترويج", remove: "حذف",
    renewsIn: "يتجدد خلال {days} يوم",
    verificationPending: "التحقق قيد المراجعة",
    loginTitle: "تسجيل الدخول إلى غيارك",
    phoneTab: "الهاتف", emailTab: "البريد الإلكتروني",
    yourName: "اسمك",
    mobileNumber: "رقم الهاتف", emailAddress: "البريد الإلكتروني",
    ownerLogin: "دخول المالك",
    backToNormal: "← رجوع لتسجيل الدخول العادي",
    ownerPasscode: "رمز المالك",
    continueBtn: "متابعة",
    enterDashboardBtn: "الدخول إلى اللوحة",
    demoNote: "تسجيل دخول تجريبي — لا حاجة لرمز تحقق في هذه النسخة.",
    otpSentTo: "أرسلنا رمزًا إلى {contact}.",
    verificationCode: "رمز التحقق",
    verifyBtn: "تحقق",
    backBtn: "رجوع",
    postTitleIndividual: "أضف قطعة للبيع",
    postTitleShop: "أضف قطعة للبيع (محل)",
    titleField: "العنوان",
    categoryField: "القسم",
    conditionField: "الحالة",
    makeField: "الماركة",
    modelField: "الموديل",
    yearFrom: "من سنة", yearTo: "إلى سنة",
    priceField: "السعر (د.ل)",
    cityField: "المدينة",
    descriptionField: "الوصف",
    descriptionPlaceholder: "تفاصيل الحالة، سبب البيع، ملاحظات التوافق…",
    protectedCheckbox: "اعرضها كصفقة محمية (رسوم حماية ٥٪ على المشتري، يُحتفظ بالمبلغ حتى تأكيد الاستلام)",
    publishBtn: "نشر الإعلان",
    shopModalTitle: "أنشئ صفحة محلك",
    shopNameField: "اسم المحل / التشليح",
    shopDescPlaceholder: "مجال تخصصك، منذ متى وأنت تعمل…",
    choosePlan: "اختر باقة",
    activatePlanBtn: "تفعيل الباقة وإنشاء المحل",
    boostModalTitle: "روّج لهذا الإعلان",
    boostDesc: "احصل على ظهور مميز في الصفحة الرئيسية وأعلى القسم لمدة {days} أيام.",
    boostFee: "رسوم الترويج",
    payAndBoost: "ادفع وروّج الآن",
    notNow: "ليس الآن",
    statusActive: "نشط", statusSold: "مباع", statusRemoved: "محذوف", boosted: "مروّج",
    welcomeToast: "أهلاً، {name}.",
    callToast: "اتصل بـ {phone} للتواصل مع البائع.",
    boostedToast: "تم الترويج لمدة {days} أيام — تم خصم {fee} د.ل.",
    publishedToast: "تم نشر الإعلان.",
    planActivatedToast: "تم تفعيل باقة {plan} — تم خصم {price} د.ل/شهريًا.",
    shopVerifiedToast: "تم توثيق المحل.",
    listingRemovedToast: "تم حذف الإعلان.",
    markedSoldToast: "تم تحديده كمُباع.",
    ownerDashTitle: "لوحة تحكم المالك",
    exit: "خروج",
    tabOverview: "نظرة عامة", tabModeration: "المراجعة", tabRevenue: "الإيرادات", tabListings: "الإعلانات", tabShops: "المحلات",
    approveListingBtn: "قبول", rejectListingBtn: "رفض", flagListingBtn: "تمييز للمراجعة",
    listingApprovedToast: "تم قبول الإعلان — أصبح ظاهرًا في نتائج البحث.",
    listingRejectedToast: "تم رفض الإعلان.",
    listingFlaggedToast: "تم تمييز الإعلان للمراجعة.",
    statActiveListings: "إعلانات نشطة",
    statShops: "محلات على المنصة",
    statPending: "{n} بانتظار التوثيق",
    statUsers: "مستخدمون مسجّلون",
    statRevenue: "إجمالي الإيرادات التقديري",
    revenueTrend: "اتجاه الإيرادات (توضيحي)",
    awaitingVer: "محلات بانتظار التوثيق",
    verify: "توثيق",
    verifyShop: "توثيق المحل",
    revenueBySource: "الإيرادات حسب المصدر",
    feeStructure: "هيكل الرسوم",
    feeBullet1: "الإعلانات الفردية: نشر مجاني، ترويج بـ {fee} د.ل / {days} أيام لظهور مميز",
    feeBullet2: "اشتراكات المحلات: من {min} إلى {max} د.ل شهريًا حسب الباقة",
    feeBullet3: "رسوم الصفقة المحمية: {pct}٪ من سعر البيع، يدفعها المشتري، وتُحول للبائع بعد تأكيد الاستلام",
    src_subscriptions: "اشتراكات المحلات", src_boosts: "إعلانات مروّجة", src_protection: "رسوم الصفقات المحمية", src_commission: "عمولات الطلبات",
    listingsCount: "إعلان",
    shop: "محل",
    // الطلبات ("أحتاج قطعة")
    nav_requests: "الطلبات",
    requestsTitle: "طلبات القطع",
    openRequestsLabel: "طلبات مفتوحة",
    myRequestsLabel: "طلباتي",
    newRequestBtn: "أحتاج هذه القطعة",
    homeBannerTitle: "ما لقيت القطعة؟ خلّنا نلقاها لك.",
    homeBannerDesc: "أرسل طلبك واحصل على عروض من البائعين في كل ليبيا.",
    homeBannerBtn: "اطلب قطعة",
    requestVehicle: "السيارة",
    requestPartDesc: "أي قطعة تحتاج؟",
    requestPartDescPlaceholder: "مثال: \"مصباح أمامي يسار\" أو \"القطعة التي تربط الرادياتير بالمحرك\"",
    requestCondition: "الحالة المقبولة",
    requestConditionAny: "أي حالة تناسبني",
    requestCity: "المدينة",
    requestUrgency: "ما مدى الاستعجال؟",
    urgencyAsap: "أحتاجها بأسرع وقت", urgencyWeek: "خلال هذا الأسبوع", urgencyFlexible: "مرن",
    submitRequestBtn: "نشر الطلب",
    requestPublishedToast: "تم نشر الطلب — يتم إشعار البائعين.",
    offersCount: "{n} عروض",
    noOffersYet: "لا توجد عروض بعد — يتم إشعار البائعين.",
    submitOfferBtn: "تقديم عرض",
    offerPrice: "سعرك (د.ل)",
    offerCondition: "الحالة",
    offerNotes: "ملاحظات (اختياري)",
    offerNotesPlaceholder: "تفاصيل التوافق، الضمان، أي شيء يفيد المشتري…",
    offerDeliveryCheckbox: "التوصيل متاح",
    offerSubmittedToast: "تم تقديم العرض.",
    acceptOfferBtn: "قبول هذا العرض",
    offerAcceptedToast: "تم قبول العرض — تواصل مع البائع لإتمام الصفقة.",
    requestStatusOpen: "مفتوح", requestStatusMatched: "تم التوصل", requestStatusClosed: "مغلق",
    requestFrom: "طلب من",
    yourOffer: "عرضك",
    contactToArrange: "تواصل",
    noRequestsYet: "لا توجد طلبات مفتوحة حاليًا.",
    myRequestsEmpty: "لم تنشر أي طلب قطعة بعد.",
    backToRequests: "رجوع للطلبات",
    // رقم القطعة / نوعها
    partNumberField: "رقم القطعة (اختياري)",
    partNumberPlaceholder: "مثال: 81210-60A20",
    authenticityField: "النوع",
    auth_oem: "أصلي (OEM)", auth_aftermarket: "تجاري (بديل)", auth_refurbished: "مجدد", auth_salvage: "سلفدج",
    compatWarning: "تأكد من التوافق الدقيق مع البائع قبل الدفع.",
    // فئات البائعين
    businessTypeField: "نوع النشاط",
    biz_shop: "محل قطع غيار", biz_distributor: "موزع / تاجر جملة", biz_dismantler: "تشليح",
    whatsappField: "رقم الواتساب",
    addressField: "العنوان",
    verifiedIndividual: "فرد موثّق",
    requestVerification: "طلب توثيق الهوية",
    verificationRequestedToast: "تم إرسال طلب التوثيق — سنراجعه خلال 48 ساعة.",
    // شراء / الطلبات
    buyNow: "شراء",
    buyModalTitle: "أكمل طلبك",
    partPriceLabel: "سعر القطعة",
    deliveryFeeLabel: "التوصيل",
    protectionFeeLabelShort: "حماية المشتري",
    totalToPay: "الإجمالي المطلوب دفعه",
    paymentMethodLabel: "طريقة الدفع",
    deliveryMethodLabel: "كيف تريد استلامها؟",
    pickupOption: "استلام شخصي", deliveryOption: "توصيل",
    includeProtectionCheckbox: "إضافة حماية المشتري ({fee} د.ل)",
    sellerCommissionNote: "يدفع البائع عمولة منصة {pct}٪ على هذه الصفقة — من هنا يربح غيارك، وليس منك.",
    placeOrderBtn: "تأكيد الطلب",
    orderPlacedToast: "تم إنشاء الطلب — تم إشعار البائع.",
    myOrdersLabel: "مشترياتي", mySalesLabel: "مبيعاتي",
    noOrdersYet: "لم تشترِ أي شيء بعد.",
    noSalesYet: "لا توجد طلبات على إعلاناتك بعد.",
    orderStatusPending: "بانتظار البائع", orderStatusAccepted: "مقبول", orderStatusPreparing: "قيد التجهيز",
    orderStatusReady_for_pickup: "جاهز للاستلام", orderStatusOut_for_delivery: "في الطريق",
    orderStatusCollected: "تم الاستلام", orderStatusDelivered: "تم التسليم", orderStatusCompleted: "مكتمل",
    orderStatusDisputed: "قيد النزاع", orderStatusCancelled: "ملغي", orderStatusRefunded: "مُسترد",
    acceptOrderBtn: "قبول الطلب",
    markDeliveredBtn: "تحديد كمُسلَّم",
    confirmReceiptBtn: "أؤكد أنني استلمتها",
    reportProblemBtn: "الإبلاغ عن مشكلة",
    orderAcceptedToast: "تم قبول الطلب.",
    orderDeliveredToast: "تم تحديده كمُسلَّم.",
    orderCompletedToast: "اكتمل الطلب. تم إصدار فاتورة العمولة للبائع.",
    disputeTitle: "الإبلاغ عن مشكلة",
    disputeReasonLabel: "ما هي المشكلة؟",
    disputeDescLabel: "التفاصيل",
    disputeDescPlaceholder: "اشرح ما حدث…",
    submitDisputeBtn: "إرسال البلاغ",
    disputeSubmittedToast: "تم الإبلاغ — سيراجعه فريقنا ويتواصل معك.",
    orderId: "الطلب",
    buyerLabel: "المشتري", sellerLabel: "البائع",
    paymentMethodShown: "الدفع", deliveryMethodShown: "طريقة الاستلام",
    commissionOwedLabel: "عمولة المنصة (مستحقة على البائع لصالح غيارك)",
    backToOrders: "رجوع",
    rejectOrderBtn: "رفض الطلب",
    cancelOrderBtn: "إلغاء الطلب",
    orderRejectedToast: "تم رفض الطلب.",
    orderCancelledToast: "تم إلغاء الطلب.",
    cancelledByBuyer: "ألغاه المشتري",
    cancelledBySeller: "رفضه البائع",
    otherPaymentDetailField: "ما هي طريقة الدفع بالتحديد؟",
    otherPaymentDetailPlaceholder: "مثال: محفظة إلكترونية معينة أو ترتيب خاص",
    alreadyOrderedWarning: "لديك بالفعل طلب مفتوح على هذا الإعلان.",
    listingReservedNote: "هذا الإعلان محجوز لمشترٍ آخر.",
    postChoiceTitle: "ماذا تريد أن تفعل؟",
    postChoiceSell: "بيع قطعة",
    postChoiceSellDesc: "أضف قطعة لديك للبيع",
    postChoiceRequest: "طلب قطعة",
    postChoiceRequestDesc: "اطلب من البائعين تقديم عروض لك",
    homeLabel: "الرئيسية",
    sellWithUsTitle: "عندك قطع غيار؟ اعرضها أمام آلاف المشترين.",
    sellWithUsBtn: "ابدأ البيع",
    availableNowFilter: "متوفر الآن",
    myCarTitle: "سيارتك",
    myCarSearchBtn: "ابحث عن قطع لسيارتي",
    addCarTitle: "أضف سيارتك",
    addCarDesc: "لنعرض عليك القطع المتوافقة معها فقط.",
    addCarBtn: "أضف سيارة",
    addCarModalTitle: "أضف سيارتك",
    saveCarBtn: "حفظ",
    recentSearchesLabel: "بحثك الأخير",
    sponsoredLabel: "إعلان",
    createAdTitle: "إنشاء إعلان",
    advertiserName: "اسم المعلن",
    advertiserContact: "بيانات تواصل المعلن (اختياري)",
    adHeadline: "العنوان",
    adSubtext: "نص إضافي (اختياري)",
    adLinkUrl: "رابط (اختياري)",
    adAmountPaid: "المبلغ المدفوع (د.ل، اختياري)",
    adStartsAt: "تاريخ البدء",
    adEndsAt: "تاريخ الانتهاء",
    createAdBtn: "إنشاء الإعلان",
    adCreatedToast: "تم إنشاء الإعلان وهو مفعّل الآن.",
    manageAdsBtn: "الإعلانات",
    verifiedIndividualBadge: "بائع موثّق",
    verifiedShopBadge: "متجر موثّق",
    searchResultsTitle: "نتائج",
    resultsCount: "{n} نتيجة",
    exactMatches: "مطابقة تمامًا",
    relatedMatches: "قد يعجبك أيضًا",
    filtersBtn: "الفلاتر",
    sortBtn: "الترتيب",
    sortRelevance: "الأكثر صلة", sortPriceAsc: "السعر: من الأقل", sortPriceDesc: "السعر: من الأعلى", sortNewest: "الأحدث",
    filterSheetTitle: "تصفية النتائج",
    priceRangeLabel: "نطاق السعر (د.ل)",
    priceMinPlaceholder: "الأدنى", priceMaxPlaceholder: "الأعلى",
    anyCondition: "أي حالة", anyAuthenticity: "أي نوع",
    protectedOnlyFilter: "صفقات محمية فقط",
    deliveryOnlyFilter: "التوصيل متاح",
    applyFiltersBtn: "تطبيق الفلاتر",
    resetFiltersBtn: "إعادة تعيين",
    noResultsForQuery: "لا توجد نتائج لـ \"{q}\"",
    tryDifferentSearch: "جرّب كلمة أخرى، أو انشر طلب قطعة بدلاً من ذلك.",
    deliveryAvailableLabel: "توصيل",
    pickupOnlyLabel: "استلام فقط",
    salesCountLabel: "{n} عملية بيع",
    visitShopBtn: "زيارة المتجر",
    shopListingsCount: "{n} إعلان",
    backToResults: "رجوع",
    sellerCenterTitle: "مركز البائع",
    dashboardTab: "لوحة التحكم", inventoryTab: "المخزون", matchingTab: "طلبات لك",
    statActiveListingsSeller: "إعلانات نشطة",
    statViews: "المشاهدات", statSaves: "الحفظ", statRevenueSeller: "الإيرادات (المكتملة)", statCommissionOwed: "العمولة المستحقة",
    matchingNotifTitle: "{n} مشترين يبحثون عن قطع قد تكون لديك",
    matchingNotifBtn: "عرض الطلبات",
    noMatchingRequests: "لا توجد طلبات مطابقة حاليًا.",
    addPartBtn: "أضف قطعة",
    editShopBtn: "تعديل المحل",
    inventoryStatusAll: "الكل", inventoryStatusActive: "نشط", inventoryStatusReserved: "محجوز",
    inventoryStatusSold: "مباع", inventoryStatusDraft: "مسودات", inventoryStatusRemoved: "محذوف",
    editListingBtn: "تعديل",
    markAsDraftBtn: "نقل إلى المسودات",
    republishBtn: "نشر",
    stockField: "الكمية المتوفرة",
    engineTrimField: "المحرك / الفئة (اختياري)",
    engineTrimPlaceholder: "مثال: 4.6L V8",
    openingHoursField: "ساعات العمل",
    openingHoursPlaceholder: "مثال: سبت–خميس 9ص–6م",
    favoriteAddedToast: "تم الحفظ.",
    favoriteRemovedToast: "تم إزالته من المحفوظات.",
    savedListingsLabel: "الإعلانات المحفوظة",
    outOfStockBadge: "نفدت الكمية",
    draftBadge: "مسودة",
    editListingModalTitle: "تعديل الإعلان",
    updateListingBtn: "حفظ التغييرات",
    listingUpdatedToast: "تم تحديث الإعلان.",
    listingDraftedToast: "تم نقله إلى المسودات.",
    draftNotSupportedYet: "ميزة المسودات غير متاحة بعد — جرّب إزالة الإعلان بدلاً من ذلك.",
    listingRepublishedToast: "تم نشر الإعلان.",
    goToSellerCenter: "مركز البائع",
    photoUploadNote: "رفع صور حقيقية يحتاج تخزين على الخادم — قادم في المرحلة القادمة. حاليًا يحصل إعلانك على صورة مطابقة لقسمه.",
    myFavoritesEmpty: "لم تحفظ أي إعلان بعد.",
    deliveryAddressField: "عنوان التوصيل",
    deliveryAddressPlaceholder: "الشارع، المبنى، المنطقة…",
    deliveryNotesField: "ملاحظات التوصيل (اختياري)",
    deliveryNotesPlaceholder: "علامة مميزة، أفضل وقت للتوصيل…",
    estimatedDeliveryLabel: "موعد التسليم المتوقع",
    prepareOrderBtn: "بدء التجهيز",
    dispatchBtnPickup: "تحديد كجاهز للاستلام",
    dispatchBtnDelivery: "تحديد كخارج للتوصيل",
    fulfilBtnPickup: "تحديد كمُستلَم",
    fulfilBtnDelivery: "تحديد كمُسلَّم",
    orderPreparingToast: "تم تحديد الطلب كقيد التجهيز.",
    orderDispatchedToast: "تم تحديث الطلب.",
    orderFulfilledToast: "تم إتمام التسليم.",
    messagesTab: "الرسائل",
    messagePlaceholder: "اكتب رسالة…",
    sendBtn: "إرسال",
    noMessagesYet: "لا توجد رسائل بعد. ابدأ المحادثة.",
    messageSentToast: "تم الإرسال.",
    notificationsTitle: "الإشعارات",
    noNotificationsYet: "لا توجد إشعارات بعد.",
    markAllReadBtn: "تحديد الكل كمقروء",
    notif_new_order: "طلب جديد",
    notif_order_accepted: "تم قبول الطلب",
    notif_order_preparing: "البائع يجهّز طلبك",
    notif_order_dispatched: "تحديث الطلب",
    notif_order_delivered: "تم تسليم/استلام الطلب",
    notif_order_completed: "اكتمل الطلب",
    notif_order_cancelled: "تم إلغاء الطلب",
    notif_dispute_update: "تحديث النزاع",
    notif_request_response: "عرض جديد على طلبك",
    notif_matching_request: "طلب عميل يطابق مخزونك",
    notif_new_message: "رسالة جديدة",
    financialsTab: "الماليات",
    totalSalesLabel: "إجمالي المبيعات",
    commissionOutstandingLabel: "العمولة المستحقة",
    commissionSettledLabel: "تمت التسوية",
    refundsTotalLabel: "المبالغ المستردة",
    recentTransactionsLabel: "أحدث المعاملات",
    settlementHistoryLabel: "سجل التسويات",
    markSettledBtn: "تحديد كمُسوّى",
    settledToast: "تم تحديدها كمُسوّاة.",
    settlementStatusOwed: "مستحقة", settlementStatusSettled: "مُسوّاة",
    requestRefundBtn: "طلب استرداد",
    refundModalTitle: "طلب استرداد",
    refundAmountField: "مبلغ الاسترداد (د.ل)",
    refundReasonField: "السبب",
    refundReasonPlaceholder: "لماذا تحتاج إلى استرداد؟",
    submitRefundBtn: "إرسال الطلب",
    refundRequestedToast: "تم طلب الاسترداد.",
    refundStatusRequested: "طلب استرداد", refundStatusApproved: "تمت الموافقة على الاسترداد",
    refundStatusProcessing: "الاسترداد قيد المعالجة", refundStatusRefunded: "تم الاسترداد", refundStatusRejected: "تم رفض الاسترداد",
    approveRefundBtn: "موافقة", processRefundBtn: "تحديد كقيد المعالجة", completeRefundBtn: "إتمام الاسترداد", rejectRefundBtn: "رفض",
    refundUpdatedToast: "تم تحديث الاسترداد.",
    bankTransferNote: "ستصلك تعليمات التحويل البنكي من غيارك بعد إتمام الطلب.",
    submitBankConfirmationTitle: "إرسال تأكيد الدفع",
    bankReferenceField: "رقم مرجع التحويل / اسم المُرسل",
    bankReferencePlaceholder: "مثال: رقم مرجع التحويل، أو الاسم في إيصال التحويل",
    submitConfirmationBtn: "إرسال للمراجعة",
    bankConfirmationSubmittedToast: "تم الإرسال — سنتحقق ونؤكد قريبًا.",
    bankConfirmationPending: "تأكيد الدفع قيد المراجعة",
    bankConfirmationVerified: "تم التحقق من الدفع",
    bankConfirmationRejected: "تم رفض تأكيد الدفع",
    verifyBankTransferBtn: "تحقق", rejectBankTransferBtn: "رفض",
    disputeFreeLabel: "خالٍ من النزاعات",
    settlementsTab: "التسويات",
    refundsAdminTab: "المبالغ المستردة",
    bankTransfersAdminTab: "التحويلات البنكية",
    noPendingItems: "لا يوجد شيء معلّق حاليًا.",
  },
};
const display = (lang) => (lang === "ar" ? "'IBM Plex Sans Arabic', sans-serif" : "'IBM Plex Sans Condensed', sans-serif");
const LangCtx = createContext(null);
function useLang() { return useContext(LangCtx); }

/* ---------------------------------------------------------------------
   Reference data (structured for bilingual labels)
--------------------------------------------------------------------- */
const CATEGORIES = [
  { id: "engine", icon: Cog, en: "Engine", ar: "المحرك" },
  { id: "body", icon: Car, en: "Body & Exterior", ar: "الهيكل الخارجي" },
  { id: "electrical", icon: Zap, en: "Electrical & Lights", ar: "الكهرباء والإضاءة" },
  { id: "interior", icon: Armchair, en: "Interior", ar: "الداخلية" },
  { id: "tires", icon: CircleDot, en: "Tires & Wheels", ar: "الإطارات والجنوط" },
  { id: "suspension", icon: Gauge, en: "Suspension", ar: "التعليق" },
  { id: "brakes", icon: Disc, en: "Brakes", ar: "الفرامل" },
  { id: "transmission", icon: Settings2, en: "Transmission & Drivetrain", ar: "ناقل الحركة" },
  { id: "cooling", icon: Wind, en: "AC & Cooling", ar: "التكييف والتبريد" },
  { id: "glass", icon: RectangleHorizontal, en: "Glass & Mirrors", ar: "الزجاج والمرايا" },
  { id: "accessories", icon: Sparkles, en: "Accessories & Tools", ar: "إكسسوارات وأدوات" },
];
const MAKES = ["Toyota", "Hyundai", "Kia", "Chevrolet", "Range Rover", "Land Rover", "Mercedes-Benz", "Nissan", "Suzuki", "Peugeot", "Renault", "Volkswagen", "Ford", "Mitsubishi", "Isuzu", "Jeep", "Other"];
const CITIES = [
  { id: "tripoli", en: "Tripoli", ar: "طرابلس" },
  { id: "benghazi", en: "Benghazi", ar: "بنغازي" },
  { id: "misrata", en: "Misrata", ar: "مصراتة" },
  { id: "zawiya", en: "Zawiya", ar: "الزاوية" },
  { id: "sabha", en: "Sabha", ar: "سبها" },
  { id: "albayda", en: "Al Bayda", ar: "البيضاء" },
  { id: "zliten", en: "Zliten", ar: "زليتن" },
  { id: "ajdabiya", en: "Ajdabiya", ar: "أجدابيا" },
  { id: "tobruk", en: "Tobruk", ar: "طبرق" },
  { id: "khoms", en: "Khoms", ar: "الخمس" },
];
const CONDITIONS = [
  { id: "new", en: "New", ar: "جديد" },
  { id: "used-excellent", en: "Used – Excellent", ar: "مستعمل - ممتاز" },
  { id: "used-good", en: "Used – Good", ar: "مستعمل - جيد" },
  { id: "parts", en: "For Parts / Scrap", ar: "للتشليح" },
];
const AUTHENTICITY = [
  { id: "oem", en: "Original / OEM", ar: "أصلي (OEM)" },
  { id: "aftermarket", en: "Aftermarket", ar: "تجاري (بديل)" },
  { id: "refurbished", en: "Refurbished", ar: "مجدد" },
  { id: "salvage", en: "Salvage", ar: "سلفدج" },
];
const BUSINESS_TYPES = [
  { id: "shop", en: "Parts shop", ar: "محل قطع غيار" },
  { id: "distributor", en: "Distributor / Wholesaler", ar: "موزع / تاجر جملة" },
  { id: "dismantler", en: "Dismantler / Scrapyard", ar: "تشليح" },
];
const URGENCY = [
  { id: "asap", en: "Need it ASAP", ar: "أحتاجها بأسرع وقت" },
  { id: "week", en: "This week", ar: "خلال هذا الأسبوع" },
  { id: "flexible", en: "Flexible", ar: "مرن" },
];
const findAuthenticity = (id) => AUTHENTICITY.find((a) => a.id === id);
const findUrgency = (id) => URGENCY.find((u) => u.id === id) || URGENCY[2];
const findBusinessType = (id) => BUSINESS_TYPES.find((b) => b.id === id) || BUSINESS_TYPES[0];

// ---------------------------------------------------------------------
// Real backend API client. This is the first piece of the app that talks
// to the actual deployed server instead of local demo storage — auth
// specifically, per the staged integration plan (auth first, since every
// other authenticated call needs a real token before it means anything).
// Everything else (listings, orders, etc.) still runs on local demo
// storage for now; that's the next stage, not this one.
// ---------------------------------------------------------------------
const API_BASE = "https://ghayarak-backend-production.up.railway.app";

async function apiRequest(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
  } catch (e) {
    // Network failure (server asleep, no connection, CORS, etc.) — surface
    // a real error rather than letting the caller silently hang.
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  let data = {};
  try { data = await res.json(); } catch { /* empty body is fine for some endpoints */ }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status}).`);
  }
  return data;
}

const authApi = {
  requestOtp: (contact) => apiRequest("/auth/request-otp", { method: "POST", body: JSON.stringify({ contact }) }),
  verifyOtp: (name, contact, code) => apiRequest("/auth/verify-otp", { method: "POST", body: JSON.stringify({ name, contact, code }) }),
  ownerLogin: (name, contact, passcode) => apiRequest("/auth/owner-login", { method: "POST", body: JSON.stringify({ name, contact, passcode }) }),
};

const listingsApi = {
  list: (params) => apiRequest(`/listings${params ? "?" + new URLSearchParams(params) : ""}`),
  create: (body, token) => apiRequest("/listings", { method: "POST", body: JSON.stringify(body), headers: { Authorization: `Bearer ${token}` } }),
  mine: (token) => apiRequest("/listings/mine", { headers: { Authorization: `Bearer ${token}` } }),
  setStatus: (id, status, token) => apiRequest(`/listings/${id}`, { method: "PATCH", body: JSON.stringify({ status }), headers: { Authorization: `Bearer ${token}` } }),
  boost: (id, token) => apiRequest(`/listings/${id}/boost`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }),
};

const adsApi = {
  getActive: (placement) => apiRequest(`/ads/active${placement ? "?placement=" + placement : ""}`),
  create: (body, token) => apiRequest("/ads", { method: "POST", body: JSON.stringify(body), headers: { Authorization: `Bearer ${token}` } }),
};

const adminApi = {
  getPendingListings: (token) => apiRequest("/admin/listings/pending", { headers: { Authorization: `Bearer ${token}` } }),
  moderateListing: (id, decision, note, token) => apiRequest(`/admin/listings/${id}/moderate`, { method: "POST", body: JSON.stringify({ decision, note }), headers: { Authorization: `Bearer ${token}` } }),
  getSellers: (token) => apiRequest("/admin/sellers", { headers: { Authorization: `Bearer ${token}` } }),
  verifyShop: (id, token) => apiRequest(`/admin/shops/${id}/verify`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }),
  updateSellerStatus: (type, id, status, reason, token) => apiRequest(`/admin/sellers/${type}/${id}/status`, { method: "POST", body: JSON.stringify({ status, reason }), headers: { Authorization: `Bearer ${token}` } }),
  getSettlements: (token) => apiRequest("/admin/settlements", { headers: { Authorization: `Bearer ${token}` } }),
  markSettlementPaid: (id, token) => apiRequest(`/admin/settlements/${id}/mark-paid`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }),
  getRefunds: (token) => apiRequest("/admin/refunds", { headers: { Authorization: `Bearer ${token}` } }),
  transitionRefund: (id, action, reason, token) => apiRequest(`/admin/refunds/${id}/${action}`, { method: "POST", body: JSON.stringify(reason ? { reason } : {}), headers: { Authorization: `Bearer ${token}` } }),
  getPendingBankTransfers: (token) => apiRequest("/admin/bank-transfers/pending", { headers: { Authorization: `Bearer ${token}` } }),
  verifyBankTransfer: (id, decision, rejectionReason, token) => apiRequest(`/admin/bank-transfers/${id}/verify`, { method: "POST", body: JSON.stringify({ decision, rejectionReason }), headers: { Authorization: `Bearer ${token}` } }),
};

const ordersApi = {
  list: (role, token) => apiRequest(`/orders?role=${role}`, { headers: { Authorization: `Bearer ${token}` } }),
  get: (id, token) => apiRequest(`/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
  create: (body, token) => apiRequest("/orders", { method: "POST", body: JSON.stringify(body), headers: { Authorization: `Bearer ${token}` } }),
  accept: (id, token) => apiRequest(`/orders/${id}/accept`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }),
  cancel: (id, reason, token) => apiRequest(`/orders/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason }), headers: { Authorization: `Bearer ${token}` } }),
  prepare: (id, token) => apiRequest(`/orders/${id}/prepare`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }),
  dispatch: (id, token) => apiRequest(`/orders/${id}/dispatch`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }),
  fulfil: (id, token) => apiRequest(`/orders/${id}/fulfil`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }),
  confirm: (id, token) => apiRequest(`/orders/${id}/confirm`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }),
  dispute: (id, reason, description, token) => apiRequest(`/orders/${id}/dispute`, { method: "POST", body: JSON.stringify({ reason, description }), headers: { Authorization: `Bearer ${token}` } }),
  submitBankConfirmation: (id, referenceText, token) => apiRequest(`/orders/${id}/bank-transfer-confirmation`, { method: "POST", body: JSON.stringify({ referenceText }), headers: { Authorization: `Bearer ${token}` } }),
  requestRefund: (id, amount, reason, token) => apiRequest(`/orders/${id}/refund-request`, { method: "POST", body: JSON.stringify({ amount, reason }), headers: { Authorization: `Bearer ${token}` } }),
};

const shopsApi = {
  list: () => apiRequest("/shops"),
  getMine: (token) => apiRequest("/shops/mine", { headers: { Authorization: `Bearer ${token}` } }),
  get: (id) => apiRequest(`/shops/${id}`),
  create: (body, token) => apiRequest("/shops", { method: "POST", body: JSON.stringify(body), headers: { Authorization: `Bearer ${token}` } }),
};

const financeApi = {
  getMine: (token) => apiRequest("/me/financials", { headers: { Authorization: `Bearer ${token}` } }),
};

const requestsApi = {
  list: (params) => apiRequest(`/requests${params ? "?" + new URLSearchParams(params) : ""}`),
  get: (id) => apiRequest(`/requests/${id}`),
  create: (body, token) => apiRequest("/requests", { method: "POST", body: JSON.stringify(body), headers: { Authorization: `Bearer ${token}` } }),
  makeOffer: (id, body, token) => apiRequest(`/requests/${id}/offers`, { method: "POST", body: JSON.stringify(body), headers: { Authorization: `Bearer ${token}` } }),
  acceptOffer: (id, offerId, token) => apiRequest(`/requests/${id}/accept-offer`, { method: "POST", body: JSON.stringify({ offerId }), headers: { Authorization: `Bearer ${token}` } }),
};

function mapApiOffer(o) {
  return {
    id: o.id,
    shopId: o.shop_id,
    sellerName: o.shop_name || o.seller_name,
    sellerContact: o.seller_contact,
    price: Number(o.price),
    condition: o.condition,
    notes: o.notes,
    delivery: o.delivery_available,
    createdAt: o.created_at ? new Date(o.created_at).getTime() : Date.now(),
  };
}

// The list endpoint only returns an offer_count (cheap for browsing many
// requests at once); the detail endpoint returns the real offers array.
// This produces a stub array of the right length for list contexts —
// good enough since list views only ever read request.offers.length,
// never the offers themselves — and the real array once a request is
// opened individually.
function mapApiRequest(r, offers) {
  return {
    id: r.id,
    requesterName: r.requester_name,
    requesterContact: r.requester_contact,
    make: r.make,
    model: r.model,
    year: r.year,
    partDescription: r.part_description,
    conditionPreference: r.condition_preference,
    city: r.city,
    urgency: r.urgency,
    status: r.status,
    acceptedOfferId: r.accepted_offer_id,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    offers: offers ? offers.map(mapApiOffer) : new Array(Number(r.offer_count) || 0).fill(null),
  };
}

function mapApiShop(s) {
  return {
    id: s.id,
    ownerId: s.owner_id,
    name: s.name,
    city: s.city,
    description: s.description,
    businessType: s.business_type,
    tier: s.tier,
    verified: s.verified,
    whatsapp: s.whatsapp,
    address: s.address,
    openingHours: s.opening_hours,
    deliveryAvailable: s.delivery_available,
    subscriptionExpiry: s.subscription_expiry ? new Date(s.subscription_expiry).getTime() : null,
    createdAt: s.created_at ? new Date(s.created_at).getTime() : Date.now(),
    // No ratings/reviews or sales-aggregation system exists in the
    // backend yet — these default safely rather than being left
    // undefined, since ShopProfileScreen calls .toLocaleString() on
    // salesCount directly and would crash on undefined.
    rating: null,
    salesCount: 0,
  };
}

// Same snake_case-to-camelCase translation as mapApiListing, plus folding
// the separate refunds/bankTransferConfirmations/disputes arrays the
// detail endpoint returns into the single nested objects the existing
// OrderDetail UI expects (order.refund, order.bankTransferConfirmation,
// order.dispute) — it was built around local demo data shaped that way,
// so this keeps that UI code unchanged rather than rewriting it to walk
// arrays everywhere.
function mapApiOrder(o, extras = {}) {
  const latestRefund = extras.refunds?.[0];
  const latestBankConfirmation = extras.bankTransferConfirmations?.[0];
  const latestDispute = extras.disputes?.[0];
  return {
    id: o.id,
    listingId: o.listing_id,
    listingTitle: o.listing_title,
    buyerId: o.buyer_id,
    sellerId: o.seller_id,
    shopId: o.shop_id,
    buyerName: o.buyer_name,
    buyerContact: o.buyer_contact,
    sellerName: o.seller_name,
    sellerContact: o.seller_contact,
    partPrice: Number(o.part_price),
    deliveryFee: Number(o.delivery_fee),
    protectionFee: Number(o.protection_fee),
    commissionPct: Number(o.commission_pct),
    commissionAmount: Number(o.commission_amount),
    commissionSettled: o.commission_settled,
    paymentMethod: o.payment_method,
    paymentCategory: o.payment_category,
    paymentMethodDetail: o.payment_method_detail,
    deliveryMethod: o.delivery_method,
    deliveryAddress: o.delivery_address,
    deliveryNotes: o.delivery_notes,
    estimatedDeliveryAt: o.estimated_delivery_at,
    status: o.status,
    cancelledBy: o.cancelled_by,
    cancelReason: o.cancel_reason,
    createdAt: o.created_at ? new Date(o.created_at).getTime() : Date.now(),
    completedAt: o.completed_at,
    refund: latestRefund ? { status: latestRefund.status, amount: Number(latestRefund.amount), reason: latestRefund.reason } : null,
    bankTransferConfirmation: latestBankConfirmation ? { status: latestBankConfirmation.status, referenceText: latestBankConfirmation.reference_text } : null,
    dispute: latestDispute ? { reason: latestDispute.reason, description: latestDispute.description, status: latestDispute.status } : null,
  };
}

// The real backend returns snake_case columns straight from Postgres
// (year_from, moderation_status, seller_id, etc.) — the UI throughout
// this file expects camelCase (yearFrom, moderationStatus, ...), matching
// the shape the local demo data has always used. This converts one to the
// other so every existing screen that renders a listing keeps working
// unchanged, regardless of whether the listing came from real API data or
// local demo data.
//
// Note: real listings don't have `phone` (the field local demo data uses
// for "is this my listing?" checks) — they have `sellerId`, a real user
// id. Screens that check listing ownership (Seller Center, edit/remove
// buttons) haven't been updated to check `sellerId` yet, so real listings
// won't correctly show as "mine" there yet. Browsing/search doesn't have
// this problem since it doesn't need an ownership check.
function mapApiListing(l) {
  return {
    id: l.id,
    sellerId: l.seller_id,
    shopId: l.shop_id,
    title: l.title,
    category: l.category,
    make: l.make,
    model: l.model,
    yearFrom: l.year_from,
    yearTo: l.year_to,
    price: Number(l.price),
    currency: l.currency || "LYD",
    condition: l.condition,
    authenticity: l.authenticity,
    partNumber: l.part_number,
    city: l.city,
    description: l.description,
    protectedDeal: l.protected_deal,
    featured: l.featured,
    featuredUntil: l.featured_until,
    status: l.status,
    moderationStatus: l.moderation_status,
    views: l.views || 0,
    saves: 0,
    deliveryAvailable: l.delivery_available,
    sellerName: l.seller_name,
    sellerContact: l.seller_contact,
    createdAt: l.created_at ? new Date(l.created_at).getTime() : Date.now(),
    // Real image upload isn't built yet — fall back to the same
    // category-photo placeholder the local demo data has always used,
    // so cards render identically either way.
    image: unsplash(CATEGORY_PHOTO[l.category] || "engine"),
  };
}

const FEES = {
  boostPrice: 15, boostDays: 7, protectionPct: 0.05, commissionPct: 0.05, deliveryFlat: 50,
  tiers: {
    basic: { name: "Basic", nameAr: "أساسية", price: 50, listings: 20, perksEn: ["Up to 20 live listings", "Shop page", "Standard support"], perksAr: ["حتى ٢٠ إعلانًا نشطًا", "صفحة محل", "دعم عادي"] },
    pro: { name: "Pro", nameAr: "احترافية", price: 150, listings: 100, perksEn: ["Up to 100 live listings", "Verified badge", "Rotating category featured slot", "Priority support"], perksAr: ["حتى ١٠٠ إعلان نشط", "علامة توثيق", "ظهور دوري مميز في القسم", "دعم أولوية"] },
    elite: { name: "Elite", nameAr: "نخبة", price: 350, listings: 999, perksEn: ["Unlimited listings", "Verified badge", "Homepage banner slot", "Top-of-search placement", "Account manager"], perksAr: ["إعلانات غير محدودة", "علامة توثيق", "ظهور بانر بالصفحة الرئيسية", "أعلى نتائج البحث", "مدير حساب مخصص"] },
  },
};
const PAYMENT_METHODS = [
  { id: "cash", en: "Cash on delivery", ar: "الدفع عند الاستلام", icon: "💵" },
  { id: "lypay", en: "LYPAY / ONEPAY", ar: "LYPAY / ONEPAY", icon: "📱" },
  { id: "card", en: "Local card", ar: "بطاقة محلية", icon: "💳" },
  { id: "bank", en: "Bank / instant transfer", ar: "تحويل بنكي / فوري", icon: "🏦" },
  { id: "other", en: "Other electronic payment", ar: "وسيلة إلكترونية أخرى", icon: "💳" },
];
const DISPUTE_REASONS = [
  { id: "wrong_part", en: "Wrong part", ar: "قطعة خاطئة" },
  { id: "not_as_described", en: "Not as described", ar: "غير مطابقة للوصف" },
  { id: "damaged", en: "Damaged", ar: "تالفة" },
  { id: "missing_items", en: "Missing items", ar: "أجزاء ناقصة" },
  { id: "wrong_item_sent", en: "Seller sent the wrong item", ar: "البائع أرسل قطعة خاطئة" },
  { id: "counterfeit", en: "Suspected counterfeit", ar: "يُشتبه أنها مقلّدة" },
  { id: "other", en: "Other", ar: "أخرى" },
];
const findPaymentMethod = (id) => PAYMENT_METHODS.find((p) => p.id === id) || PAYMENT_METHODS[0];

// A modest, honest step toward "smart search": map common Arabic/English part
// words to a category, and pull a model year out of free text. This is
// keyword matching, not real NLP — it widens the net for common terms
// (headlight, bumper, brakes...) without pretending to understand full
// sentences or transliterate Arabic car names to Latin make/model text.
const PART_SYNONYMS = {
  "نور": "electrical", "أنوار": "electrical", "انوار": "electrical", "مصباح": "electrical", "هيدلايت": "electrical", "كشاف": "electrical",
  "headlight": "electrical", "headlights": "electrical", "light": "electrical", "lights": "electrical",
  "صدام": "body", "بمبر": "body", "bumper": "body",
  "فرامل": "brakes", "فرمله": "brakes", "دسك": "brakes", "brake": "brakes", "brakes": "brakes", "pad": "brakes", "pads": "brakes", "rotor": "brakes", "disc": "brakes",
  "اطار": "tires", "اطارات": "tires", "إطار": "tires", "جنط": "tires", "جنوط": "tires", "tire": "tires", "tires": "tires", "wheel": "tires", "wheels": "tires", "rim": "tires",
  "محرك": "engine", "موتور": "engine", "engine": "engine", "motor": "engine",
  "مراية": "glass", "مرايا": "glass", "زجاج": "glass", "mirror": "glass", "mirrors": "glass", "windshield": "glass", "glass": "glass",
  "مقاعد": "interior", "كراسي": "interior", "دكة": "interior", "seat": "interior", "seats": "interior", "interior": "interior",
  "تعليق": "suspension", "مساعد": "suspension", "مساعدات": "suspension", "suspension": "suspension", "shock": "suspension",
  "تكييف": "cooling", "مكيف": "cooling", "كمبروسر": "cooling", "ac": "cooling", "cooling": "cooling", "compressor": "cooling", "radiator": "cooling",
  "قير": "transmission", "ناقل": "transmission", "دفرنس": "transmission", "gearbox": "transmission", "transmission": "transmission", "differential": "transmission",
};
function inferCategoryFromQuery(q) {
  const lower = q.toLowerCase();
  for (const [word, cat] of Object.entries(PART_SYNONYMS)) {
    if (lower.includes(word)) return cat;
  }
  return null;
}
function extractYear(q) {
  const m = q.match(/\b(19|20)\d{2}\b/);
  return m ? Number(m[0]) : null;
}
const CAT_ICON = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.icon]));

// Real photography (Unsplash, free license) — a small curated set reused
// thoughtfully across categories/listings. The icon on top of each is what
// actually differentiates the category; the photo gives it texture and
// warmth instead of a flat gradient.
const PHOTOS = {
  engine: "photo-1593142927747-8c1b758967a6",
  wheel: "photo-1741366175071-3604c86ec475",
  interior: "photo-1652860316277-370ca5b1b1df",
  headlight: "photo-1714745454474-56792f83810c",
};
const unsplash = (key, w = 600) => `https://images.unsplash.com/${PHOTOS[key]}?auto=format&fit=crop&w=${w}&q=65`;
const CATEGORY_PHOTO = {
  engine: "engine", body: "headlight", electrical: "engine", interior: "interior",
  tires: "wheel", suspension: "wheel", brakes: "wheel", transmission: "engine", cooling: "engine",
  glass: "interior", accessories: "headlight",
};
const label = (obj, lang) => (obj ? obj[lang] || obj.en : "");
const findCity = (id) => CITIES.find((c) => c.id === id) || CITIES[0];
const findCondition = (id) => CONDITIONS.find((c) => c.id === id) || CONDITIONS[0];

/* ---------------------------------------------------------------------
   No seed/demo data. Every list below starts empty and reflects only
   what's real — either from the actual backend (listings) or from
   whatever a real signed-in user genuinely does in this browser (shops,
   requests, orders, still to be wired to the backend in a later pass).
   A visible "nothing here yet" is the honest, correct state for a real,
   still-growing marketplace — not a bug to paper over with fake rows.
--------------------------------------------------------------------- */

/* ---------------------------------------------------------------------
   Small UI atoms
--------------------------------------------------------------------- */
function Badge({ children, tone = "neutral", icon: Icon }) {
  const tones = {
    neutral: { bg: C.sand, fg: C.asphalt2 }, amber: { bg: C.amberLight, fg: C.amberDark },
    green: { bg: C.greenLight, fg: C.green }, rust: { bg: C.rustLight, fg: C.rust },
    dark: { bg: C.asphalt, fg: C.sandLight },
  };
  const t = tones[tone];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase" style={{ background: t.bg, color: t.fg, letterSpacing: 0.4 }}>
      {Icon && <Icon size={11} strokeWidth={2.5} />}{children}
    </span>
  );
}
function PriceTag({ amount, currency = "LYD", size = "base" }) {
  const { lang } = useLang();
  return (
    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: C.asphalt, fontSize: size === "lg" ? 20 : 15 }}>
      {amount.toLocaleString()} <span style={{ fontSize: size === "lg" ? 12 : 11, color: C.steel }}>{lang === "ar" ? "د.ل" : currency}</span>
    </span>
  );
}
function PrimaryButton({ children, onClick, style, disabled, full, icon: Icon }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-transform active:scale-95 ${full ? "w-full" : ""}`}
      style={{ background: disabled ? C.steelLight : C.amber, color: "#fff", opacity: disabled ? 0.6 : 1, boxShadow: disabled ? "none" : `0 2px 8px rgba(162,101,44,0.35)`, letterSpacing: 0.2, ...style }}>
      {Icon && <Icon size={16} />}{children}
    </button>
  );
}
function GhostButton({ children, onClick, style, full, icon: Icon }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm border-[1.5px] transition-transform active:scale-95 ${full ? "w-full" : ""}`}
      style={{ borderColor: C.line, color: C.asphalt, background: "#fff", letterSpacing: 0.2, ...style }}>
      {Icon && <Icon size={16} />}{children}
    </button>
  );
}
function Modal({ title, onClose, children, wide }) {
  const { lang } = useLang();
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(18,24,31,0.6)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`w-full ${wide ? "sm:max-w-lg" : "sm:max-w-sm"} bg-white rounded-t-3xl sm:rounded-2xl max-h-[88vh] overflow-y-auto`} style={{ background: C.paper }}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 border-b" style={{ background: C.paper, borderColor: C.line }}>
          <h3 className="font-bold" style={{ fontFamily: display(lang), fontSize: 19, color: C.asphalt, letterSpacing: lang === "ar" ? 0 : 0.2 }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full" style={{ background: C.sand }}><X size={16} /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold mb-1" style={{ color: C.steel, letterSpacing: 0.3 }}>{label}</span>
      {children}
    </label>
  );
}
const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.line}`, background: "#fff", fontSize: 14, color: C.asphalt, outline: "none" };

/* ---------------------------------------------------------------------
   Listing Card
--------------------------------------------------------------------- */
function ListingCard({ listing, shops, onOpen }) {
  const { t, lang } = useLang();
  const Icon = CAT_ICON[listing.category] || Package;
  const shop = listing.shopId ? shops.find((s) => s.id === listing.shopId) : null;
  const isFeatured = listing.featured && listing.featuredUntil > Date.now();
  const cond = findCondition(listing.condition);
  const city = findCity(listing.city);
  const cur = lang === "ar" ? "د.ل" : listing.currency;
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = listing.image && !imgFailed;
  return (
    <button onClick={() => onOpen(listing)} className="relative text-left w-full rounded-2xl border transition-transform active:scale-[0.98]" style={{ borderColor: C.line, background: C.paper, boxShadow: "0 1px 2px rgba(18,24,31,0.06)" }}>
      <div className="relative flex items-center justify-center h-32 rounded-t-2xl overflow-hidden" style={{ background: showImage ? C.asphalt : `linear-gradient(160deg, ${C.sand}, ${C.sandLight})` }}>
        {showImage ? (
          <>
            <img src={listing.image} alt="" onError={() => setImgFailed(true)} className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.88 }} />
            {/* Brass duotone wash ties the photo to the brand palette and keeps badges legible */}
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(18,24,31,0.15) 0%, rgba(18,24,31,0.05) 45%, rgba(18,24,31,0.55) 100%)` }} />
          </>
        ) : (
          <Icon size={38} strokeWidth={1.2} color={C.steel} />
        )}
        {isFeatured && <div style={{ [lang === "ar" ? "right" : "left"]: 8, top: 8, position: "absolute" }}><Badge tone="amber" icon={Star}>{t("featured")}</Badge></div>}
        {listing.protectedDeal && <div style={{ [lang === "ar" ? "left" : "right"]: 8, top: 8, position: "absolute" }}><Badge tone="green" icon={ShieldCheck}>{t("protectedDeal")}</Badge></div>}
        {/* Punched-tag grommet on the perforated seam */}
        <div className="absolute left-1/2 -translate-x-1/2 z-10" style={{ bottom: -7 }}>
          <div className="w-3.5 h-3.5 rounded-full" style={{ background: C.paper, border: `1.5px solid ${C.steelLight}` }} />
        </div>
      </div>
      {/* Price stamp — pinned like a tag corner, sits outside the clipped image area so it isn't cut off */}
      <div className="absolute" style={{ [lang === "ar" ? "left" : "right"]: 10, top: 128, transform: "translateY(-50%)" }}>
        <div className="px-2.5 py-1 rounded-lg" style={{ background: C.asphalt, boxShadow: "0 2px 5px rgba(18,24,31,0.25)" }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: 13, color: "#fff" }}>
            {listing.price.toLocaleString()} <span style={{ fontSize: 10, color: C.steelLight }}>{cur}</span>
          </span>
        </div>
      </div>
      <div className="px-3 pt-4 pb-3 rounded-b-2xl" style={{ borderTop: `1.5px dashed ${C.line}` }}>
        <p dir="auto" className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: C.asphalt, unicodeBidi: "plaintext" }}>{listing.title}</p>
        <p dir="auto" className="text-xs mt-1" style={{ color: C.steel, unicodeBidi: "plaintext" }}>{listing.make} {listing.model} · {listing.yearFrom}–{listing.yearTo}</p>
        <div className="flex items-center justify-between mt-2.5 pt-2.5" style={{ borderTop: `1px solid ${C.line}` }}>
          <span className="text-xs flex items-center gap-1" style={{ color: C.steel }}><MapPin size={11} />{label(city, lang)}</span>
          {listing.availableNow ? (
            <span className="text-xs font-semibold flex items-center gap-1" style={{ color: C.green }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.green }} />{t("availableNowFilter")}
            </span>
          ) : (
            <span className="text-xs" style={{ color: C.steel }}>{label(cond, lang)}</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          {shop ? (
            <span className="text-xs flex items-center gap-1 font-semibold" style={{ color: C.amberDark }}><Store size={11} />{shop.name}{shop.verified && <BadgeCheck size={11} color={C.green} />}</span>
          ) : (
            <span className="text-xs flex items-center gap-1" style={{ color: C.steel }}><User size={11} />{t("individual")}</span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ---------------------------------------------------------------------
   MAIN APP
--------------------------------------------------------------------- */
export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [lang, setLang] = useState("ar");
  const [listings, setListings] = useState([]);
  const [ads, setAds] = useState([]);
  const [shops, setShops] = useState([]);
  const [requests, setRequests] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddCar, setShowAddCar] = useState(false);
  const [showEditShop, setShowEditShop] = useState(false);
  const [orders, setOrders] = useState([]);
  const [pendingListings, setPendingListings] = useState([]);
  const [adminShops, setAdminShops] = useState([]);
  const [adminSettlements, setAdminSettlements] = useState([]);
  const [adminRefunds, setAdminRefunds] = useState([]);
  const [adminBankTransfers, setAdminBankTransfers] = useState([]);
  const [revenue, setRevenue] = useState({ subscriptions: 0, boosts: 0, protection: 0, commission: 0 });
  const [session, setSession] = useState(null);
  const [screen, setScreen] = useState("home");
  const [activeListing, setActiveListing] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [activeShopId, setActiveShopId] = useState(null);
  const [activeShop, setActiveShop] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [category, setCategory] = useState(null);
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [showLogin, setShowLogin] = useState(false);
  const [showCreateAd, setShowCreateAd] = useState(false);
  const [showPost, setShowPost] = useState(false);
  const [showPostChoice, setShowPostChoice] = useState(false);
  const [showBoost, setShowBoost] = useState(null);
  const [showShopCreate, setShowShopCreate] = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showOffer, setShowOffer] = useState(null);
  const [showBuy, setShowBuy] = useState(null);
  const [showDispute, setShowDispute] = useState(null);
  const [showRefundRequest, setShowRefundRequest] = useState(null);
  const [toast, setToast] = useState(null);

  const dir = lang === "ar" ? "rtl" : "ltr";
  const t = useCallback((key, vars) => {
    let str = (T[lang] && T[lang][key]) || T.en[key] || key;
    if (vars) Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v); });
    return str;
  }, [lang]);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  useEffect(() => {
    (async () => {
      try {
        let s, r, lg, rq, ord, notif, msg;
        try { s = (await window.storage.get("shops", true)).value; } catch { s = null; }
        try { r = (await window.storage.get("revenue", true)).value; } catch { r = null; }
        try { rq = (await window.storage.get("requests", true)).value; } catch { rq = null; }
        try { ord = (await window.storage.get("orders", true)).value; } catch { ord = null; }
        try { notif = (await window.storage.get("notifications", true)).value; } catch { notif = null; }
        try { msg = (await window.storage.get("messages", true)).value; } catch { msg = null; }
        try { lg = (await window.storage.get("lang", false)).value; } catch { lg = null; }

        // Listings now come from the real backend, not local demo storage.
        // A fresh/empty database is expected and correct here — it just
        // means no real listings exist yet, not that something's broken.
        let listingsData = [];
        try {
          const { listings: apiListings } = await listingsApi.list();
          listingsData = apiListings.map(mapApiListing);
        } catch (e) {
          console.error("Could not load real listings, showing none.", e);
        }

        try {
          const { ads: apiAds } = await adsApi.getActive("home_banner");
          setAds(apiAds);
        } catch (e) {
          console.error("Could not load ad banners.", e);
        }

        // Same idea for shops — used to show affiliation badges on
        // listing cards throughout the app.
        try {
          const { shops: apiShops } = await shopsApi.list();
          setShops(apiShops.map(mapApiShop));
        } catch (e) {
          console.error("Could not load shops.", e);
        }

        let shopsData = s ? JSON.parse(s) : [];
        let revenueData = r ? JSON.parse(r) : { subscriptions: 0, boosts: 0, protection: 0, commission: 0 };
        let requestsData = rq ? JSON.parse(rq) : [];
        let ordersData = ord ? JSON.parse(ord) : [];
        let notificationsData = notif ? JSON.parse(notif) : [];
        let messagesData = msg ? JSON.parse(msg) : [];

        if (!s) await window.storage.set("shops", JSON.stringify(shopsData), true);
        if (!r) await window.storage.set("revenue", JSON.stringify(revenueData), true);
        if (!rq) await window.storage.set("requests", JSON.stringify(requestsData), true);
        if (!ord) await window.storage.set("orders", JSON.stringify(ordersData), true);
        if (!notif) await window.storage.set("notifications", JSON.stringify(notificationsData), true);
        if (!msg) await window.storage.set("messages", JSON.stringify(messagesData), true);

        setListings(listingsData); setShops(shopsData); setRevenue(revenueData); setRequests(requestsData); setOrders(ordersData);
        setNotifications(notificationsData); setMessages(messagesData);
        if (lg) setLang(lg);

        try {
          const sess = (await window.storage.get("session", false)).value;
          if (sess) setSession(JSON.parse(sess));
        } catch { /* no session yet */ }
        try {
          const rs = (await window.storage.get("recentSearches", false)).value;
          if (rs) setRecentSearches(JSON.parse(rs));
        } catch { /* none yet */ }
        try {
          const fav = (await window.storage.get("favoriteIds", false)).value;
          if (fav) setFavoriteIds(JSON.parse(fav));
        } catch { /* none yet */ }
      } catch (e) {
        console.error("Storage load failed", e);
        setListings([]); setShops([]); setRequests([]); setOrders([]);
      } finally { setLoaded(true); }
    })();
  }, []);

  // Fetch the moderation queue only when actually entering the admin
  // screen (not on every app load) — it's staff-only data, and the token
  // needed to authorize it only matters once someone's actually there.
  useEffect(() => {
    if (screen !== "admin" || !session?.token) return;
    (async () => {
      try {
        const { listings: pending } = await adminApi.getPendingListings(session.token);
        setPendingListings(pending.map(mapApiListing));
      } catch (e) {
        console.error("Could not load pending listings.", e);
      }
      try {
        const { shops: shopRows } = await adminApi.getSellers(session.token);
        setAdminShops(shopRows.map((s) => ({ ...mapApiShop(s), ownerName: s.owner_name, listingCount: Number(s.listing_count) })));
      } catch (e) {
        console.error("Could not load shops.", e);
      }
      try {
        const { settlements } = await adminApi.getSettlements(session.token);
        setAdminSettlements(settlements);
      } catch (e) {
        console.error("Could not load settlements.", e);
      }
      try {
        const { refunds } = await adminApi.getRefunds(session.token);
        setAdminRefunds(refunds);
      } catch (e) {
        console.error("Could not load refunds.", e);
      }
      try {
        const { confirmations } = await adminApi.getPendingBankTransfers(session.token);
        setAdminBankTransfers(confirmations);
      } catch (e) {
        console.error("Could not load bank transfers.", e);
      }
    })();
  }, [screen, session?.token]);

  // Same idea for real orders — fetched when actually entering a screen
  // that shows them (Account, which lists both "my orders" as a buyer and
  // "my sales" as a seller, and Seller Center), not on every app load.
  useEffect(() => {
    if (!["account", "seller"].includes(screen) || !session?.token) return;
    (async () => {
      try {
        const [asBuyer, asSeller] = await Promise.all([
          ordersApi.list("buyer", session.token),
          ordersApi.list("seller", session.token),
        ]);
        const merged = [...asBuyer.orders, ...asSeller.orders].map((o) => mapApiOrder(o));
        // De-duplicate in case someone is somehow both buyer and seller
        // across the two lists (shouldn't normally happen — a listing
        // can't be bought by its own seller — but cheap to guard anyway).
        const byId = new Map(merged.map((o) => [o.id, o]));
        setOrders(Array.from(byId.values()));
      } catch (e) {
        console.error("Could not load orders.", e);
      }
    })();
  }, [screen, session?.token]);

  // Fetch the user's own shop (if any) whenever they're logged in — this
  // used to be derived from a locally-faked session.shopId; now it
  // reflects whatever the real backend actually knows about shop
  // ownership, which is tracked via shops.owner_id, not the user's role.
  useEffect(() => {
    if (!session?.token) { setMyShop(null); return; }
    (async () => {
      try {
        const { shop } = await shopsApi.getMine(session.token);
        setMyShop(shop ? mapApiShop(shop) : null);
      } catch (e) {
        console.error("Could not load my shop.", e);
      }
    })();
  }, [session?.token]);

  // Seller Center needs every listing the user owns, including anything
  // still pending moderation — the public /listings endpoint deliberately
  // excludes those, so this uses the dedicated /listings/mine endpoint
  // instead, fetched when actually entering Seller Center.
  useEffect(() => {
    if (screen !== "seller" || !session?.token) return;
    (async () => {
      try {
        const { listings: mine } = await listingsApi.mine(session.token);
        setMyListingsAll(mine.map(mapApiListing));
      } catch (e) {
        console.error("Could not load my listings.", e);
      }
    })();
  }, [screen, session?.token]);

  // Part requests are public to browse — fetched when actually entering
  // the Requests screen, not on every app load.
  useEffect(() => {
    if (screen !== "requests") return;
    (async () => {
      try {
        const { requests: apiRequests } = await requestsApi.list();
        setRequests(apiRequests.map((r) => mapApiRequest(r)));
      } catch (e) {
        console.error("Could not load requests.", e);
      }
    })();
  }, [screen]);

  // The active shop's public profile — fetched fresh whenever a specific
  // shop is opened, since it's no longer sitting in a locally-populated
  // "browse all shops" array.
  useEffect(() => {
    if (!activeShopId) { setActiveShop(null); return; }
    (async () => {
      try {
        const { shop, listings: shopListings } = await shopsApi.get(activeShopId);
        setActiveShop({ ...mapApiShop(shop), listings: shopListings.map(mapApiListing) });
      } catch (e) {
        console.error("Could not load shop.", e);
        setActiveShop(null);
      }
    })();
  }, [activeShopId]);

  const persistListings = useCallback(async (next) => { setListings(next); try { await window.storage.set("listings", JSON.stringify(next), true); } catch (e) { console.error(e); } }, []);
  const persistRequests = useCallback(async (next) => { setRequests(next); try { await window.storage.set("requests", JSON.stringify(next), true); } catch (e) { console.error(e); } }, []);
  const persistOrders = useCallback(async (next) => { setOrders(next); try { await window.storage.set("orders", JSON.stringify(next), true); } catch (e) { console.error(e); } }, []);
  const persistNotifications = useCallback(async (next) => { setNotifications(next); try { await window.storage.set("notifications", JSON.stringify(next), true); } catch (e) { console.error(e); } }, []);
  const persistMessages = useCallback(async (next) => { setMessages(next); try { await window.storage.set("messages", JSON.stringify(next), true); } catch (e) { console.error(e); } }, []);
  // Fire-and-forget: reads the LATEST shared notifications via storage
  // directly (not the `notifications` state closure) so rapid successive
  // notifications from the same handler don't clobber each other.
  const pushNotification = useCallback(async (userContact, type, title, refId) => {
    try {
      const current = (await window.storage.get("notifications", true)).value;
      const list = current ? JSON.parse(current) : [];
      const next = [{ id: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, userContact, type, title, refId, readAt: null, createdAt: Date.now() }, ...list].slice(0, 300);
      await window.storage.set("notifications", JSON.stringify(next), true);
      setNotifications(next);
    } catch (e) { console.error("Notification push failed", e); }
  }, []);
  const persistShops = useCallback(async (next) => { setShops(next); try { await window.storage.set("shops", JSON.stringify(next), true); } catch (e) { console.error(e); } }, []);
  const commitSearch = useCallback(async (q) => {
    if (!q || !q.trim()) return;
    const trimmed = q.trim();
    const next = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 5);
    setRecentSearches(next);
    try { await window.storage.set("recentSearches", JSON.stringify(next), false); } catch (e) { console.error(e); }
    setQuery(trimmed);
    setScreen("search");
  }, [recentSearches]);

  const toggleFavorite = useCallback(async (listingId) => {
    const isFav = favoriteIds.includes(listingId);
    const nextFav = isFav ? favoriteIds.filter((id) => id !== listingId) : [...favoriteIds, listingId];
    setFavoriteIds(nextFav);
    try { await window.storage.set("favoriteIds", JSON.stringify(nextFav), false); } catch (e) { console.error(e); }
    const nextListings = listings.map((l) => (l.id === listingId ? { ...l, saves: Math.max(0, (l.saves || 0) + (isFav ? -1 : 1)) } : l));
    await persistListings(nextListings);
    flash(t(isFav ? "favoriteRemovedToast" : "favoriteAddedToast"));
  }, [favoriteIds, listings]);
  const handleSaveCar = useCallback(async (car) => {
    const next = { ...session, car };
    await persistSession(next);
    setShowAddCar(false);
  }, [session]);
  const persistRevenue = useCallback(async (next) => { setRevenue(next); try { await window.storage.set("revenue", JSON.stringify(next), true); } catch (e) { console.error(e); } }, []);
  const persistSession = useCallback(async (next) => {
    setSession(next);
    try { if (next) await window.storage.set("session", JSON.stringify(next), false); else await window.storage.delete("session", false); } catch (e) { console.error(e); }
  }, []);
  const changeLang = useCallback(async (next) => {
    setLang(next);
    try { await window.storage.set("lang", next, false); } catch (e) { console.error(e); }
  }, []);

  const [myShop, setMyShop] = useState(null);
  const [myListingsAll, setMyListingsAll] = useState([]);
  const matchingRequests = useMemo(() => {
    if (!session) return [];
    const activeOnes = myListingsAll.filter((l) => l.status === "active");
    const myMakes = new Set(activeOnes.map((l) => l.make.toLowerCase()));
    const myCategories = new Set(activeOnes.map((l) => l.category));
    return requests.filter((r) => r.status === "open" && (myMakes.has(r.make.toLowerCase()) || myCategories.has(inferCategoryFromQuery(r.partDescription))));
  }, [session, myListingsAll, requests]);

  const [availableNowOnly, setAvailableNowOnly] = useState(false);
  const filteredListings = useMemo(() => {
    const inferredCategory = query.trim() ? inferCategoryFromQuery(query) : null;
    const inferredYear = query.trim() ? extractYear(query) : null;
    return listings
      .filter((l) => l.status === "active")
      .filter((l) => (category ? l.category === category : true))
      .filter((l) => (cityFilter === "all" ? true : l.city === cityFilter))
      .filter((l) => (availableNowOnly ? l.availableNow : true))
      .filter((l) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        const directHit = [l.title, l.make, l.model, l.category, l.partNumber || ""].join(" ").toLowerCase().includes(q);
        const categoryHit = inferredCategory && l.category === inferredCategory;
        const yearHit = inferredYear && l.yearFrom && l.yearTo && inferredYear >= l.yearFrom && inferredYear <= l.yearTo;
        // Require the direct text match OR (an inferred category match AND, if a year was
        // mentioned, that year also fits) — so "2020 برامل" doesn't just match any brake listing
        // regardless of year once a year is actually specified.
        if (directHit) return true;
        if (categoryHit && (!inferredYear || yearHit)) return true;
        return false;
      })
      .sort((a, b) => {
        const af = a.featured && a.featuredUntil > Date.now() ? 1 : 0;
        const bf = b.featured && b.featuredUntil > Date.now() ? 1 : 0;
        if (af !== bf) return bf - af;
        return b.createdAt - a.createdAt;
      });
  }, [listings, category, cityFilter, query, availableNowOnly]);

  const featuredListings = useMemo(() => listings.filter((l) => l.status === "active" && l.featured && l.featuredUntil > Date.now()).slice(0, 8), [listings]);

  function requireLogin(next) {
    if (!session) { setShowLogin(true); return false; }
    if (next) next();
    return true;
  }

  // Boost is inherently payment-gated — there's no "create it anyway"
  // fallback the way shop creation has, since the boost genuinely is the
  // payment. This calls the real endpoint honestly; it's expected to
  // fail right now since there's no live DPAY account connected yet.
  async function handleBoost(listingId) {
    try {
      await listingsApi.boost(listingId, session.token);
      setShowBoost(null);
      flash(t("boostedToast", { days: FEES.boostDays, fee: FEES.boostPrice }));
    } catch (e) {
      flash(e.message);
    }
  }
  async function handleCreateShop(form) {
    try {
      const { shop } = await shopsApi.create(
        { name: form.name, city: form.city, description: form.description, tier: form.tier },
        session.token
      );
      setMyShop(mapApiShop(shop));
      setShowShopCreate(false);
      flash(t("planActivatedToast", { plan: lang === "ar" ? FEES.tiers[form.tier].nameAr : FEES.tiers[form.tier].name, price: FEES.tiers[form.tier].price }));
      setScreen("account");
    } catch (e) {
      flash(e.message);
    }
  }
  async function handlePostListing(form) {
    try {
      const { listing: created } = await listingsApi.create(
        {
          title: form.title, category: form.category, make: form.make, model: form.model,
          yearFrom: form.yearFrom, yearTo: form.yearTo, price: Number(form.price),
          condition: form.condition, city: form.city, description: form.description,
          protectedDeal: form.protectedDeal, shopId: myShop ? myShop.id : undefined,
        },
        session.token
      );
      // The new listing is real and saved, but sits in the moderation
      // queue until an admin approves it — it won't show up in search
      // yet. Adding it to local state now still lets the seller see it
      // immediately (as pending), which is honest about its real status.
      setListings([mapApiListing(created), ...listings]);
      setShowPost(false);
      flash(t("publishedToast"));
    } catch (e) {
      flash(e.message);
    }
  }
  async function handleVerifyShop(shopId) {
    try {
      await adminApi.updateSellerStatus("shop", shopId, "approved", null, session.token);
      await adminApi.verifyShop(shopId, session.token);
      flash(t("shopVerifiedToast"));
    } catch (e) {
      flash(e.message);
    }
  }

  async function handleModerateListing(id, decision, note) {
    try {
      await adminApi.moderateListing(id, decision, note, session.token);
      // Remove it from the queue locally rather than refetching — the
      // decision already succeeded on the real server, no need to wait
      // on a second round trip just to confirm what we already know.
      setPendingListings((prev) => prev.filter((l) => l.id !== id));
      flash(t(decision === "approved" ? "listingApprovedToast" : decision === "rejected" ? "listingRejectedToast" : "listingFlaggedToast"));
    } catch (e) {
      flash(e.message);
    }
  }
  async function handleRemoveListing(listingId) {
    try {
      await listingsApi.setStatus(listingId, "removed", session.token);
      setListings(listings.map((l) => (l.id === listingId ? { ...l, status: "removed" } : l)));
      setMyListingsAll(myListingsAll.map((l) => (l.id === listingId ? { ...l, status: "removed" } : l)));
      flash(t("listingRemovedToast"));
    } catch (e) {
      flash(e.message);
    }
  }
  async function handleMarkSold(listingId) {
    try {
      await listingsApi.setStatus(listingId, "sold", session.token);
      setMyListingsAll(myListingsAll.map((l) => (l.id === listingId ? { ...l, status: "sold" } : l)));
      flash(t("markedSoldToast"));
      setActiveListing(null);
      setScreen("account");
    } catch (e) {
      flash(e.message);
    }
  }
  async function handleUpdateListing(listingId, form) {
    await persistListings(listings.map((l) => (l.id === listingId ? { ...l, ...form } : l)));
    flash(t("listingUpdatedToast"));
    setEditingListing(null);
  }
  // 'draft' isn't a real status in the backend schema yet — only
  // active/removed are genuinely wired here. Republishing (removed ->
  // active) is real; drafting is a known, flagged gap, not silently
  // faked.
  async function handleSetListingStatus(listingId, status) {
    if (status === "draft") { flash(t("draftNotSupportedYet")); return; }
    try {
      await listingsApi.setStatus(listingId, status, session.token);
      setMyListingsAll(myListingsAll.map((l) => (l.id === listingId ? { ...l, status } : l)));
      flash(t(status === "active" ? "listingRepublishedToast" : "listingUpdatedToast"));
    } catch (e) {
      flash(e.message);
    }
  }
  async function handleUpdateShop(shopId, form) {
    await persistShops(shops.map((s) => (s.id === shopId ? { ...s, ...form } : s)));
    flash(t("listingUpdatedToast"));
    setShowEditShop(false);
  }

  async function handleCreateRequest(form) {
    try {
      const { request: created } = await requestsApi.create(form, session.token);
      const mapped = mapApiRequest(created, []);
      setRequests([mapped, ...requests]);
      setShowNewRequest(false);
      flash(t("requestPublishedToast"));
      setActiveRequest(mapped);
      setScreen("requestDetail");
    } catch (e) {
      flash(e.message);
    }
  }
  async function handleSubmitOffer(requestId, offerForm) {
    try {
      await requestsApi.makeOffer(requestId, { ...offerForm, shopId: myShop ? myShop.id : undefined }, session.token);
      // Refetch the full detail rather than hand-building the offer
      // locally — the server fills in seller name/contact from the real
      // account, which we don't want to fake client-side.
      const { request, offers } = await requestsApi.get(requestId);
      const mapped = mapApiRequest(request, offers);
      setActiveRequest(mapped);
      setRequests(requests.map((r) => (r.id === requestId ? mapped : r)));
      setShowOffer(null);
      flash(t("offerSubmittedToast"));
    } catch (e) {
      flash(e.message);
    }
  }
  async function handleAcceptOffer(requestId, offerId) {
    try {
      await requestsApi.acceptOffer(requestId, offerId, session.token);
      const { request, offers } = await requestsApi.get(requestId);
      const mapped = mapApiRequest(request, offers);
      setActiveRequest(mapped);
      setRequests(requests.map((r) => (r.id === requestId ? mapped : r)));
      flash(t("offerAcceptedToast"));
    } catch (e) {
      flash(e.message);
    }
  }

  // An order is "open" if it could still turn into a live reservation —
  // used both to block duplicate purchases and to find siblings to cancel.
  const isOpenOrder = (o) => ["pending", "accepted", "preparing", "ready_for_pickup", "out_for_delivery", "collected", "delivered"].includes(o.status);

  // Refetches one order's full detail (including history/disputes/refunds/
  // bank-transfer records the list endpoint doesn't return) and updates
  // both the active order view and its entry in the local orders list —
  // simpler and safer than trying to hand-patch a locally mutated copy
  // after every action, since the server is the actual source of truth
  // for status transitions now.
  async function refreshOrder(orderId) {
    const { order, disputes, refunds, bankTransferConfirmations } = await ordersApi.get(orderId, session.token);
    const mapped = mapApiOrder(order, { disputes, refunds, bankTransferConfirmations });
    setActiveOrder(mapped);
    setOrders((prev) => (prev.some((o) => o.id === mapped.id) ? prev.map((o) => (o.id === mapped.id ? mapped : o)) : [mapped, ...prev]));
    return mapped;
  }

  async function handleCreateOrder(listing, form) {
    try {
      const { order } = await ordersApi.create(
        {
          listingId: listing.id, paymentMethod: form.paymentMethod, paymentMethodDetail: form.otherPaymentDetail,
          deliveryMethod: form.deliveryMethod, includeProtection: form.includeProtection,
          deliveryAddress: form.deliveryAddress, deliveryNotes: form.deliveryNotes,
        },
        session.token
      );
      setShowBuy(null);
      flash(t("orderPlacedToast"));
      await refreshOrder(order.id);
      setScreen("orderDetail");
    } catch (e) {
      flash(e.message);
    }
  }

  // Accepting an order reserves the listing (so nobody else can buy it)
  // and auto-cancels any other still-pending orders on the same listing —
  // the seller picking one offer among several interested buyers. The
  // real backend does all of this atomically; the frontend just reflects
  // the result.
  async function handleAcceptOrder(orderId) {
    try { await ordersApi.accept(orderId, session.token); await refreshOrder(orderId); flash(t("orderAcceptedToast")); }
    catch (e) { flash(e.message); }
  }

  // --- Fulfilment: accepted -> preparing -> (ready_for_pickup | out_for_delivery) -> (collected | delivered) -> completed ---
  async function handlePrepareOrder(orderId) {
    try { await ordersApi.prepare(orderId, session.token); await refreshOrder(orderId); flash(t("orderPreparingToast")); }
    catch (e) { flash(e.message); }
  }
  async function handleDispatchOrder(orderId) {
    try { await ordersApi.dispatch(orderId, session.token); await refreshOrder(orderId); flash(t("orderDispatchedToast")); }
    catch (e) { flash(e.message); }
  }
  async function handleFulfilOrder(orderId) {
    try { await ordersApi.fulfil(orderId, session.token); await refreshOrder(orderId); flash(t("orderFulfilledToast")); }
    catch (e) { flash(e.message); }
  }
  // Buyer confirming receipt is the real financial trigger point on the
  // backend — it snapshots the commission, opens a settlement, and
  // invoices the seller. None of that logic lives here anymore; this just
  // asks the server to do it and reflects what happened.
  async function handleConfirmReceipt(orderId) {
    try { await ordersApi.confirm(orderId, session.token); await refreshOrder(orderId); flash(t("orderCompletedToast")); }
    catch (e) { flash(e.message); }
  }
  // Buyer cancels (only while pending) or seller declines/cancels (while
  // pending, accepted, or preparing). If the order had reserved the
  // listing, the backend releases it back to active automatically.
  async function handleCancelOrder(orderId, actor) {
    try {
      await ordersApi.cancel(orderId, null, session.token);
      await refreshOrder(orderId);
      flash(actor === "seller" ? t("orderRejectedToast") : t("orderCancelledToast"));
    } catch (e) {
      flash(e.message);
    }
  }
  async function handleSubmitDispute(orderId, form) {
    try {
      await ordersApi.dispute(orderId, form.reason, form.description, session.token);
      await refreshOrder(orderId);
      setShowDispute(null);
      flash(t("disputeSubmittedToast"));
    } catch (e) {
      flash(e.message);
    }
  }
  async function handleSendMessage(orderId, body) {
    const order = orders.find((o) => o.id === orderId);
    const recipient = session.contact === order.buyerContact ? order.sellerContact : order.buyerContact;
    const newMessage = { id: `MSG-${Date.now()}`, orderId, senderContact: session.contact, senderName: session.name, recipientContact: recipient, body, createdAt: Date.now() };
    await persistMessages([...messages, newMessage]);
    pushNotification(recipient, "new_message", body.slice(0, 60), orderId);
  }
  async function handleMarkAllNotificationsRead() {
    const next = notifications.map((n) => (n.userContact === session.contact && !n.readAt ? { ...n, readAt: Date.now() } : n));
    await persistNotifications(next);
  }
  function handleOpenNotification(n) {
    setShowNotifications(false);
    const order = orders.find((o) => o.id === n.refId);
    if (order) { setActiveOrder(order); setScreen("orderDetail"); }
  }

  // --- Payments & Settlements -------------------------------------------
  async function handleRequestRefund(orderId, form) {
    try {
      await ordersApi.requestRefund(orderId, form.amount, form.reason, session.token);
      await refreshOrder(orderId);
      setShowRefundRequest(null);
      flash(t("refundRequestedToast"));
    } catch (e) {
      flash(e.message);
    }
  }
  // Admin-side refund state machine (requested -> approved -> processing
  // -> refunded, or -> rejected). Each transition is a real, separate
  // backend call — no faking a whole state jump locally, since the real
  // server enforces exactly which transitions are legal from where.
  async function handleUpdateRefundStatus(refundId, action) {
    try {
      await adminApi.transitionRefund(refundId, action, null, session.token);
      const { refunds } = await adminApi.getRefunds(session.token);
      setAdminRefunds(refunds);
      flash(t("refundUpdatedToast"));
    } catch (e) {
      flash(e.message);
    }
  }
  async function handleMarkCommissionSettled(settlementId) {
    try {
      await adminApi.markSettlementPaid(settlementId, session.token);
      const { settlements } = await adminApi.getSettlements(session.token);
      setAdminSettlements(settlements);
      flash(t("settledToast"));
    } catch (e) {
      flash(e.message);
    }
  }
  async function handleSubmitBankConfirmation(orderId, referenceText) {
    try {
      await ordersApi.submitBankConfirmation(orderId, referenceText, session.token);
      await refreshOrder(orderId);
      flash(t("bankConfirmationSubmittedToast"));
    } catch (e) {
      flash(e.message);
    }
  }
  async function handleVerifyBankConfirmation(confirmationId, decision) {
    try {
      await adminApi.verifyBankTransfer(confirmationId, decision, decision === "rejected" ? "Rejected by admin" : null, session.token);
      const { confirmations } = await adminApi.getPendingBankTransfers(session.token);
      setAdminBankTransfers(confirmations);
      flash(t("settledToast"));
    } catch (e) {
      flash(e.message);
    }
  }

  const ctxValue = { lang, dir, t, setLang: changeLang };

  if (!loaded) {
    return (
      <LangCtx.Provider value={ctxValue}>
        <div className="min-h-screen flex items-center justify-center" style={{ background: C.asphalt }}>
          <style>{FONTS}</style>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: C.amber }}><Wrench size={22} color="#fff" /></div>
            <p style={{ fontFamily: "'IBM Plex Sans Condensed', sans-serif", fontWeight: 700, color: "#fff", fontSize: 20, letterSpacing: 3 }}>GHAYARAK</p>
          </div>
        </div>
      </LangCtx.Provider>
    );
  }

  const bodyFont = lang === "ar" ? "'IBM Plex Sans Arabic', sans-serif" : "'IBM Plex Sans', sans-serif";

  return (
    <LangCtx.Provider value={ctxValue}>
      <div dir={dir} className="min-h-screen" style={{ background: C.sandLight, fontFamily: bodyFont }}>
        <style>{FONTS}</style>
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2" style={{ background: C.asphalt, color: "#fff" }}>
            <CheckCircle2 size={15} color={C.amber} /> {toast}
          </div>
        )}
        {screen !== "admin" && (
          <TopBar session={session} onLogin={() => setShowLogin(true)} onAccount={() => setScreen("account")} onHome={() => { setScreen("home"); setCategory(null); setQuery(""); }} lang={lang} onToggleLang={() => changeLang(lang === "en" ? "ar" : "en")}
            unreadCount={session ? notifications.filter((n) => n.userContact === session.contact && !n.readAt).length : 0}
            onOpenNotifications={() => setShowNotifications(true)} />
        )}
        <main className="max-w-lg mx-auto pb-24" style={{ minHeight: "70vh" }}>
          {screen === "home" && (
            <HomeScreen listings={filteredListings} featured={featuredListings} shops={shops} ads={ads}
              query={query} setQuery={setQuery} category={category} setCategory={setCategory}
              cityFilter={cityFilter} setCityFilter={setCityFilter}
              availableNowOnly={availableNowOnly} setAvailableNowOnly={setAvailableNowOnly}
              onOpen={(l) => { setActiveListing(l); setScreen("listing"); }}
              onNewRequest={() => requireLogin(() => setShowNewRequest(true))}
              onSearchByPhoto={() => flash(t("searchByPhotoComingSoon"))}
              session={session} recentSearches={recentSearches} onCommitSearch={commitSearch}
              onAddCar={() => requireLogin(() => setShowAddCar(true))}
              onSearchMyCar={() => { if (session?.car) commitSearch(`${session.car.make} ${session.car.model} ${session.car.year}`); }}
              onSellWithUs={() => requireLogin(() => setShowPost(true))} />
          )}
          {screen === "search" && (
            <SearchResultsScreen query={query} listings={listings.filter((l) => l.status === "active")} shops={shops}
              onBack={() => setScreen("home")}
              onOpen={(l) => { setActiveListing(l); setScreen("listing"); }}
              onOpenShop={(id) => { setActiveShopId(id); setScreen("shop"); }}
              onNewRequest={() => requireLogin(() => setShowNewRequest(true))} />
          )}
          {screen === "shop" && activeShopId && (
            <ShopProfileScreen shop={activeShop} listings={activeShop?.listings || []}
              orders={[]}
              onBack={() => setScreen(query.trim() ? "search" : "home")}
              onOpen={(l) => { setActiveListing(l); setScreen("listing"); }} />
          )}
          {screen === "seller" && session && (
            <SellerCenterScreen session={session} myShop={myShop} myListings={myListingsAll}
              mySales={orders.filter((o) => o.sellerContact === session.contact)}
              matchingRequests={matchingRequests}
              onAddPart={() => setShowPost(true)}
              onEditShop={() => setShowEditShop(true)}
              onEditListing={(l) => setEditingListing(l)}
              onSetStatus={handleSetListingStatus}
              onRemove={handleRemoveListing}
              onBoost={(id) => setShowBoost(id)}
              onOpenRequest={(r) => { setActiveRequest(r); setScreen("requestDetail"); }}
              onBack={() => setScreen("account")} />
          )}
          {screen === "listing" && activeListing && (
            <ListingDetail listing={activeListing} shops={shops} session={session}
              onBack={() => setScreen("home")}
              onBuy={() => requireLogin(() => setShowBuy(activeListing))}
              onMarkSold={() => handleMarkSold(activeListing.id)}
              isOwner={session && activeListing.phone === session.contact}
              onOpenShop={(id) => { setActiveShopId(id); setScreen("shop"); }}
              isFavorite={favoriteIds.includes(activeListing.id)}
              onToggleFavorite={() => requireLogin(() => toggleFavorite(activeListing.id))} />
          )}
          {screen === "requests" && (
            <RequestsScreen requests={requests} session={session}
              onOpen={(r) => { setActiveRequest(r); setScreen("requestDetail"); }}
              onNewRequest={() => requireLogin(() => setShowNewRequest(true))} />
          )}
          {screen === "requestDetail" && activeRequest && (
            <RequestDetail request={activeRequest} session={session} myShop={myShop}
              onBack={() => setScreen("requests")}
              onOffer={() => requireLogin(() => setShowOffer(activeRequest.id))}
              onAccept={(offerId) => handleAcceptOffer(activeRequest.id, offerId)}
              onContact={(contact) => flash(t("callToast", { phone: contact }))} />
          )}
          {screen === "orderDetail" && activeOrder && (
            <OrderDetail order={activeOrder} session={session}
              messages={messages.filter((m) => m.orderId === activeOrder.id)}
              onBack={() => setScreen("account")}
              onAccept={() => handleAcceptOrder(activeOrder.id)}
              onPrepare={() => handlePrepareOrder(activeOrder.id)}
              onDispatch={() => handleDispatchOrder(activeOrder.id)}
              onFulfil={() => handleFulfilOrder(activeOrder.id)}
              onConfirmReceipt={() => handleConfirmReceipt(activeOrder.id)}
              onDispute={() => setShowDispute(activeOrder.id)}
              onCancel={(actor) => handleCancelOrder(activeOrder.id, actor)}
              onSendMessage={(body) => handleSendMessage(activeOrder.id, body)}
              onRequestRefund={() => setShowRefundRequest(activeOrder.id)}
              onSubmitBankConfirmation={(ref) => handleSubmitBankConfirmation(activeOrder.id, ref)} />
          )}
          {screen === "account" && (
            <AccountScreen session={session} myShop={myShop} listings={listings.filter((l) => l.phone === session?.contact)}
              myRequests={requests.filter((r) => r.requesterContact === session?.contact)}
              myOrders={orders.filter((o) => o.buyerContact === session?.contact)}
              mySales={orders.filter((o) => o.sellerContact === session?.contact)}
              onLogout={async () => { await persistSession(null); setScreen("home"); }}
              onCreateShop={() => setShowShopCreate(true)}
              onOpenListing={(l) => { setActiveListing(l); setScreen("listing"); }}
              onOpenRequest={(r) => { setActiveRequest(r); setScreen("requestDetail"); }}
              onOpenOrder={(o) => { setActiveOrder(o); setScreen("orderDetail"); }}
              onGoAdmin={() => setScreen("admin")}
              onManageAds={() => setShowCreateAd(true)}
              onRemove={handleRemoveListing} onBoost={(id) => setShowBoost(id)}
              onRequestVerification={() => flash(t("verificationRequestedToast"))}
              onGoSellerCenter={() => setScreen("seller")} />
          )}
          {screen === "admin" && ["admin", "owner", "moderator"].includes(session?.role) && (
            <AdminScreen listings={listings} revenue={revenue}
              pendingListings={pendingListings} onModerate={handleModerateListing}
              adminShops={adminShops} adminSettlements={adminSettlements} adminRefunds={adminRefunds} adminBankTransfers={adminBankTransfers}
              onVerify={handleVerifyShop} onRemove={handleRemoveListing} onExit={() => setScreen("home")}
              onMarkCommissionSettled={handleMarkCommissionSettled}
              onUpdateRefundStatus={handleUpdateRefundStatus}
              onVerifyBankConfirmation={handleVerifyBankConfirmation} />
          )}
        </main>
        {screen !== "admin" && (
          <BottomNav screen={screen} onHome={() => { setScreen("home"); setCategory(null); setQuery(""); }} onRequests={() => setScreen("requests")} onPost={() => requireLogin(() => setShowPostChoice(true))} onAccount={() => requireLogin(() => setScreen("account"))} />
        )}
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={async (s) => { await persistSession(s); setShowLogin(false); flash(t("welcomeToast", { name: s.name })); if (["admin", "owner"].includes(s.role)) setScreen("admin"); }} />}
        {showCreateAd && <CreateAdModal token={session?.token} onClose={() => setShowCreateAd(false)} onSubmit={async () => {
          setShowCreateAd(false);
          flash(t("adCreatedToast"));
          try { const { ads: apiAds } = await adsApi.getActive("home_banner"); setAds(apiAds); } catch (e) { console.error(e); }
        }} />}
        {showPost && session && <PostListingModal onClose={() => setShowPost(false)} onSubmit={handlePostListing} isShop={!!myShop} />}
        {editingListing && <EditListingModal listing={editingListing} onClose={() => setEditingListing(null)} onSubmit={(form) => handleUpdateListing(editingListing.id, form)} />}
        {showEditShop && myShop && <EditShopModal shop={myShop} onClose={() => setShowEditShop(false)} onSubmit={(form) => handleUpdateShop(myShop.id, form)} />}
        {showPostChoice && (
          <PostChoiceModal onClose={() => setShowPostChoice(false)}
            onSell={() => { setShowPostChoice(false); setShowPost(true); }}
            onRequest={() => { setShowPostChoice(false); setShowNewRequest(true); }} />
        )}
        {showAddCar && session && <AddCarModal onClose={() => setShowAddCar(false)} onSave={handleSaveCar} />}
        {showShopCreate && session && <CreateShopModal onClose={() => setShowShopCreate(false)} onSubmit={handleCreateShop} />}
        {showBoost && <BoostModal onClose={() => setShowBoost(null)} onBoost={() => handleBoost(showBoost)} />}
        {showNewRequest && session && <NewRequestModal onClose={() => setShowNewRequest(false)} onSubmit={handleCreateRequest} />}
        {showOffer && session && <OfferModal onClose={() => setShowOffer(null)} onSubmit={(form) => handleSubmitOffer(showOffer, form)} />}
        {showBuy && session && <BuyModal listing={showBuy} onClose={() => setShowBuy(null)} onSubmit={(form) => handleCreateOrder(showBuy, form)} />}
        {showDispute && session && <DisputeModal onClose={() => setShowDispute(null)} onSubmit={(form) => handleSubmitDispute(showDispute, form)} />}
        {showRefundRequest && session && <RefundRequestModal order={orders.find((o) => o.id === showRefundRequest)} onClose={() => setShowRefundRequest(null)} onSubmit={(form) => handleRequestRefund(showRefundRequest, form)} />}
        {showNotifications && session && (
          <NotificationsPanel
            items={notifications.filter((n) => n.userContact === session.contact)}
            onClose={() => setShowNotifications(false)}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onOpen={handleOpenNotification} />
        )}
      </div>
    </LangCtx.Provider>
  );
}

/* ---------------------------------------------------------------------
   Top bar & bottom nav
--------------------------------------------------------------------- */
function TopBar({ session, onLogin, onAccount, onHome, lang, onToggleLang, unreadCount, onOpenNotifications }) {
  const { t } = useLang();
  return (
    <header className="sticky top-0 z-40" style={{ background: C.asphalt, borderBottom: `1px solid ${C.asphalt3}` }}>
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <button onClick={onHome} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(155deg, ${C.amber}, ${C.amberDark})`, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}><Wrench size={15} color="#fff" /></div>
          <span className="font-bold" style={{ fontFamily: display(lang), color: "#fff", fontSize: 20, letterSpacing: lang === "ar" ? 0 : 1.5 }}>{t("brand")}</span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={onToggleLang} className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full" style={{ background: C.asphalt3, color: "#fff", border: `1px solid #2E3A48` }}>
            <Languages size={13} color={C.amber} /> {lang === "en" ? "العربية" : "EN"}
          </button>
          {session && (
            <button onClick={onOpenNotifications} className="relative w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.asphalt3, border: `1px solid #2E3A48` }}>
              <Bell size={15} color="#fff" />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" style={{ background: C.rust, border: `1.5px solid ${C.asphalt}` }} />}
            </button>
          )}
          {session ? (
            <button onClick={onAccount} className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: `linear-gradient(155deg, ${C.amber}, ${C.amberDark})`, color: "#fff" }}>{session.name.charAt(0).toUpperCase()}</button>
          ) : (
            <button onClick={onLogin} className="text-xs font-bold px-3.5 py-2 rounded-full border" style={{ borderColor: "rgba(255,255,255,0.3)", color: "#fff", background: "transparent" }}>{t("signIn")}</button>
          )}
        </div>
      </div>
    </header>
  );
}
function BottomNav({ screen, onHome, onRequests, onPost, onAccount }) {
  const { t } = useLang();
  const Item = ({ icon: Icon, label, onClick, active }) => (
    <button onClick={onClick} className="flex-1 flex flex-col items-center gap-1 py-2.5 relative">
      {active && <span className="absolute top-0 w-8 h-0.5 rounded-full" style={{ background: C.amber }} />}
      <Icon size={20} color={active ? C.amber : C.steelLight} strokeWidth={active ? 2.3 : 1.8} />
      <span className="text-[10px] font-bold" style={{ color: active ? C.amber : C.steel }}>{label}</span>
    </button>
  );
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40" style={{ background: C.paper, borderTop: `1px solid ${C.line}`, boxShadow: "0 -2px 10px rgba(18,24,31,0.05)" }}>
      <div className="max-w-lg mx-auto flex items-stretch">
        <Item icon={Home} label={t("nav_browse")} onClick={onHome} active={screen === "home" || screen === "listing"} />
        <Item icon={PackageSearch} label={t("nav_requests")} onClick={onRequests} active={screen === "requests" || screen === "requestDetail"} />
        <button onClick={onPost} className="flex-1 flex flex-col items-center gap-1 py-2.5">
          <span className="w-11 h-11 rounded-full flex items-center justify-center -mt-4" style={{ background: `linear-gradient(155deg, ${C.amber}, ${C.amberDark})`, boxShadow: `0 3px 10px rgba(162,101,44,0.45)`, border: `3px solid ${C.paper}` }}><Plus size={20} color="#fff" strokeWidth={2.5} /></span>
          <span className="text-[10px] font-bold" style={{ color: C.amberDark }}>{t("nav_post")}</span>
        </button>
        <Item icon={User} label={t("nav_account")} onClick={onAccount} active={screen === "account"} />
      </div>
    </nav>
  );
}

/* ---------------------------------------------------------------------
   Home / Browse
--------------------------------------------------------------------- */
function CategoryTile({ c, onClick }) {
  const { lang } = useLang();
  const [imgFailed, setImgFailed] = useState(false);
  const Icon = c.icon;
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-transform active:scale-95 overflow-hidden relative" style={{ borderColor: C.line, background: C.paper }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center relative overflow-hidden" style={{ background: imgFailed ? C.amberLight : C.asphalt }}>
        {!imgFailed && <img src={unsplash(CATEGORY_PHOTO[c.id], 100)} alt="" onError={() => setImgFailed(true)} className="absolute inset-0 w-full h-full object-cover" />}
        {!imgFailed && <div className="absolute inset-0" style={{ background: "rgba(162,101,44,0.42)" }} />}
        <Icon size={16} color={imgFailed ? C.amberDark : "#fff"} strokeWidth={2.2} className="relative" />
      </div>
      <span className="text-[9.5px] font-semibold text-center leading-tight" style={{ color: C.asphalt }}>{label(c, lang)}</span>
    </button>
  );
}

function HomeScreen({ listings, featured, shops, ads, query, setQuery, category, setCategory, cityFilter, setCityFilter, availableNowOnly, setAvailableNowOnly, onOpen, onNewRequest, onSearchByPhoto, session, recentSearches, onCommitSearch, onAddCar, onSearchMyCar, onSellWithUs }) {
  const { t, lang, dir } = useLang();
  const [showAllCats, setShowAllCats] = useState(false);
  const visibleCats = showAllCats ? CATEGORIES : CATEGORIES.slice(0, 7);
  return (
    <div>
      <div className="px-4 pt-4 pb-1">
        <h1 className="font-bold" style={{ fontFamily: display(lang), fontSize: 24, color: C.asphalt }}>{t("searchHeroTitle")}</h1>
        <p className="text-xs mt-0.5 mb-3" style={{ color: C.steel }}>{t("searchHeroSubtitle")}</p>
        <div className="relative">
          <Search size={17} className="absolute top-1/2 -translate-y-1/2" style={{ [lang === "ar" ? "right" : "left"]: 13 }} color={C.steel} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") onCommitSearch(query); }} placeholder={t("searchPlaceholder")}
            style={{ ...inputStyle, [lang === "ar" ? "paddingRight" : "paddingLeft"]: 38, padding: "13px 12px", fontSize: 15, borderRadius: 14, borderWidth: 1.5, boxShadow: "0 1px 3px rgba(18,24,31,0.06)" }} />
        </div>
        {!query && recentSearches.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto mt-2 pb-0.5">
            <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: C.steel }}>{t("recentSearchesLabel")}:</span>
            {recentSearches.map((rq) => (
              <button key={rq} onClick={() => onCommitSearch(rq)} className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: C.sand, color: C.asphalt }}>{rq}</button>
            ))}
          </div>
        )}
        {ads && ads.length > 0 && (
          <div className="mt-3 space-y-2">
            {ads.map((ad) => {
              const Wrapper = ad.link_url ? "a" : "div";
              const wrapperProps = ad.link_url ? { href: ad.link_url, target: "_blank", rel: "noopener noreferrer" } : {};
              return (
                <Wrapper key={ad.id} {...wrapperProps} className="relative block rounded-xl px-4 py-3" style={{ background: `linear-gradient(155deg, ${C.amber}, ${C.amberDark})` }}>
                  {/* Small rivet mark — the same stamped-metal signature detail used on listing cards */}
                  <span className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.55)" }} />
                  <span className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.18)", color: "#fff" }}>{t("sponsoredLabel")}</span>
                  <p className="text-sm font-bold" style={{ color: "#fff" }}>{ad.headline}</p>
                  {ad.subtext && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>{ad.subtext}</p>}
                </Wrapper>
              );
            })}
          </div>
        )}
        <div className="flex items-center justify-between mt-2.5">
          <div className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border" style={{ borderColor: C.line, background: C.paper }}>
            <MapPin size={13} color={C.amberDark} />
            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="text-xs font-bold rounded appearance-none pr-1" style={{ color: C.asphalt, background: "transparent" }}>
              <option value="all">{t("allCities")}</option>
              {CITIES.map((c) => <option key={c.id} value={c.id}>{label(c, lang)}</option>)}
            </select>
            <ChevronDown size={11} color={C.steel} />
          </div>
          <button onClick={onSearchByPhoto} className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full" style={{ background: C.amberLight, color: C.amberDark }}>
            <Camera size={13} />{t("searchByPhoto")}
          </button>
        </div>
        <button onClick={() => setAvailableNowOnly(!availableNowOnly)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mt-2 border" style={{ borderColor: availableNowOnly ? C.green : C.line, background: availableNowOnly ? C.greenLight : "#fff", color: availableNowOnly ? C.green : C.steel }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: availableNowOnly ? C.green : C.steelLight }} />
          {t("availableNowFilter")}
        </button>
      </div>

      <button onClick={onNewRequest} className="mx-4 mt-3 mb-1 flex items-center gap-3 p-4 rounded-2xl text-left w-[calc(100%-2rem)]" style={{ background: `linear-gradient(135deg, ${C.asphalt}, ${C.asphalt2})`, boxShadow: "0 4px 14px rgba(18,24,31,0.18)" }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(155deg, ${C.amber}, ${C.amberDark})` }}>
          <PackageSearch size={20} color="#fff" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold leading-snug" style={{ color: "#fff" }}>{t("homeBannerTitle")}</p>
          <p className="text-xs mt-1" style={{ color: C.steelLight }}>{t("homeBannerDesc")}</p>
          <span className="inline-flex items-center gap-1 text-xs font-bold mt-2.5 px-3 py-1.5 rounded-full" style={{ background: C.amber, color: "#fff" }}>
            {t("homeBannerBtn")} {dir === "rtl" ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
          </span>
        </div>
      </button>

      {session && (
        <div className="mx-4 mt-3">
          {session.car ? (
            <button onClick={onSearchMyCar} className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-left border" style={{ borderColor: C.line, background: C.paper }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.amberLight }}><Car size={18} color={C.amberDark} /></div>
              <div className="flex-1">
                <p className="text-xs font-semibold" style={{ color: C.steel }}>{t("myCarTitle")}</p>
                <p className="text-sm font-bold" style={{ color: C.asphalt }}>{session.car.make} {session.car.model} {session.car.year}</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1.5 rounded-full flex-shrink-0" style={{ background: C.amber, color: "#fff" }}>{t("myCarSearchBtn")}</span>
            </button>
          ) : (
            <button onClick={onAddCar} className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-left border-2" style={{ borderColor: C.line, borderStyle: "dashed", background: "#fff" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.sand }}><Car size={18} color={C.asphalt} /></div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: C.asphalt }}>{t("addCarTitle")}</p>
                <p className="text-xs mt-0.5" style={{ color: C.steel }}>{t("addCarDesc")}</p>
              </div>
            </button>
          )}
        </div>
      )}

      {!session && (
        <button onClick={onSellWithUs} className="mx-4 mt-3 w-[calc(100%-2rem)] flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border" style={{ borderColor: C.amber, background: C.amberLight }}>
          <span className="text-xs font-bold" style={{ color: C.amberDark }}>{t("sellWithUsTitle")}</span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: C.amber, color: "#fff" }}>{t("sellWithUsBtn")}</span>
        </button>
      )}

      {!category && !query && (
        <div className="px-4 mb-1 mt-4">
          <p className="text-xs font-bold mb-2 uppercase" style={{ color: C.steel, letterSpacing: 0.6 }}>{t("categoriesLabel")}</p>
          <div className="grid grid-cols-4 gap-2">
            {visibleCats.map((c) => {
              const Icon = c.icon;
              return (
                <CategoryTile key={c.id} c={c} onClick={() => setCategory(c.id)} />
              );
            })}
            <button onClick={() => setShowAllCats(!showAllCats)} className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border transition-transform active:scale-95" style={{ borderColor: C.amber, borderStyle: "dashed", background: C.amberLight }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#fff" }}>
                {showAllCats ? <ChevronDown size={16} color={C.amberDark} style={{ transform: "rotate(180deg)" }} /> : <ChevronDown size={16} color={C.amberDark} />}
              </div>
              <span className="text-[9.5px] font-bold text-center leading-tight" style={{ color: C.amberDark }}>{showAllCats ? t("showFewerCategories") : t("showAllCategories")}</span>
            </button>
          </div>
        </div>
      )}

      {!category && !query && featured.length > 0 && (
        <div className="mt-4">
          <div className="px-4 flex items-center justify-between mb-2">
            <p className="text-xs font-semibold flex items-center gap-1" style={{ color: C.steel, letterSpacing: 0.4 }}><Star size={12} color={C.amber} /> {t("featuredLabel")}</p>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollSnapType: "x mandatory" }}>
            {featured.map((l) => <div key={l.id} className="min-w-[62%]" style={{ scrollSnapAlign: "start" }}><ListingCard listing={l} shops={shops} onOpen={onOpen} /></div>)}
          </div>
        </div>
      )}

      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold" style={{ color: C.steel, letterSpacing: 0.4 }}>
            {category ? label(CATEGORIES.find((c) => c.id === category), lang) : t("allListings")} · {listings.length}
          </p>
          {category && <button onClick={() => setCategory(null)} className="text-xs font-semibold flex items-center gap-0.5" style={{ color: C.amberDark }}>{t("clear")} <X size={11} /></button>}
        </div>
        {listings.length === 0 ? (
          <div className="text-center py-14">
            <Package size={30} color={C.steelLight} className="mx-auto mb-2" />
            <p className="text-sm font-semibold" style={{ color: C.asphalt }}>{t("noMatchTitle")}</p>
            <p className="text-xs mt-1" style={{ color: C.steel }}>{t("noMatchSub")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">{listings.map((l) => <ListingCard key={l.id} listing={l} shops={shops} onOpen={onOpen} />)}</div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Listing detail
--------------------------------------------------------------------- */
/* ---------------------------------------------------------------------
   Search results
--------------------------------------------------------------------- */
const SORT_OPTIONS = ["relevance", "price_asc", "price_desc", "newest"];

function FilterSheet({ initial, onClose, onApply }) {
  const { t, lang } = useLang();
  const [f, setF] = useState(initial);
  const set = (k, v) => setF((prev) => ({ ...prev, [k]: v }));
  return (
    <Modal title={t("filterSheetTitle")} onClose={onClose} wide>
      <Field label={t("categoryField")}>
        <select style={inputStyle} value={f.category} onChange={(e) => set("category", e.target.value)}>
          <option value="all">{t("allListings")}</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{label(c, lang)}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("cityField")}>
          <select style={inputStyle} value={f.city} onChange={(e) => set("city", e.target.value)}>
            <option value="all">{t("allCities")}</option>
            {CITIES.map((c) => <option key={c.id} value={c.id}>{label(c, lang)}</option>)}
          </select>
        </Field>
        <Field label={t("conditionField")}>
          <select style={inputStyle} value={f.condition} onChange={(e) => set("condition", e.target.value)}>
            <option value="all">{t("anyCondition")}</option>
            {CONDITIONS.map((c) => <option key={c.id} value={c.id}>{label(c, lang)}</option>)}
          </select>
        </Field>
      </div>
      <Field label={t("authenticityField")}>
        <select style={inputStyle} value={f.authenticity} onChange={(e) => set("authenticity", e.target.value)}>
          <option value="all">{t("anyAuthenticity")}</option>
          {AUTHENTICITY.map((a) => <option key={a.id} value={a.id}>{label(a, lang)}</option>)}
        </select>
      </Field>
      <Field label={t("priceRangeLabel")}>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" style={inputStyle} value={f.priceMin} onChange={(e) => set("priceMin", e.target.value)} placeholder={t("priceMinPlaceholder")} />
          <input type="number" style={inputStyle} value={f.priceMax} onChange={(e) => set("priceMax", e.target.value)} placeholder={t("priceMaxPlaceholder")} />
        </div>
      </Field>
      <label className="flex items-center gap-2 mb-2.5 text-sm" style={{ color: C.asphalt }}>
        <input type="checkbox" checked={f.availableOnly} onChange={(e) => set("availableOnly", e.target.checked)} /> {t("availableNowFilter")}
      </label>
      <label className="flex items-center gap-2 mb-2.5 text-sm" style={{ color: C.asphalt }}>
        <input type="checkbox" checked={f.protectedOnly} onChange={(e) => set("protectedOnly", e.target.checked)} /> {t("protectedOnlyFilter")}
      </label>
      <label className="flex items-center gap-2 mb-4 text-sm" style={{ color: C.asphalt }}>
        <input type="checkbox" checked={f.deliveryOnly} onChange={(e) => set("deliveryOnly", e.target.checked)} /> {t("deliveryOnlyFilter")}
      </label>
      <div className="flex gap-2">
        <GhostButton full onClick={() => { const reset = { category: "all", city: "all", condition: "all", authenticity: "all", priceMin: "", priceMax: "", availableOnly: false, protectedOnly: false, deliveryOnly: false }; setF(reset); onApply(reset); }}>{t("resetFiltersBtn")}</GhostButton>
        <PrimaryButton full onClick={() => onApply(f)}>{t("applyFiltersBtn")}</PrimaryButton>
      </div>
    </Modal>
  );
}

function SearchResultsScreen({ query, listings, shops, onBack, onOpen, onOpenShop, onNewRequest }) {
  const { t, lang, dir } = useLang();
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const [sortBy, setSortBy] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ category: "all", city: "all", condition: "all", authenticity: "all", priceMin: "", priceMax: "", availableOnly: false, protectedOnly: false, deliveryOnly: false });

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => (typeof v === "boolean" ? v : v && v !== "all")).length;

  const { exact, related } = useMemo(() => {
    const q = query.toLowerCase().trim();
    const inferredCategory = q ? inferCategoryFromQuery(q) : null;
    const inferredYear = q ? extractYear(q) : null;

    const passesFilters = (l) => {
      if (filters.category !== "all" && l.category !== filters.category) return false;
      if (filters.city !== "all" && l.city !== filters.city) return false;
      if (filters.condition !== "all" && l.condition !== filters.condition) return false;
      if (filters.authenticity !== "all" && l.authenticity !== filters.authenticity) return false;
      if (filters.availableOnly && !l.availableNow) return false;
      if (filters.protectedOnly && !l.protectedDeal) return false;
      if (filters.deliveryOnly && !l.deliveryAvailable) return false;
      if (filters.priceMin && l.price < Number(filters.priceMin)) return false;
      if (filters.priceMax && l.price > Number(filters.priceMax)) return false;
      return true;
    };

    const exactList = [];
    const relatedList = [];
    listings.filter(passesFilters).forEach((l) => {
      const directHit = !q || [l.title, l.make, l.model, l.category, l.partNumber || ""].join(" ").toLowerCase().includes(q);
      const categoryHit = inferredCategory && l.category === inferredCategory;
      const yearHit = inferredYear && l.yearFrom && l.yearTo && inferredYear >= l.yearFrom && inferredYear <= l.yearTo;
      if (directHit) exactList.push(l);
      else if (categoryHit && (!inferredYear || yearHit)) relatedList.push(l);
    });

    const sorter = (a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "newest") return b.createdAt - a.createdAt;
      const af = a.featured && a.featuredUntil > Date.now() ? 1 : 0;
      const bf = b.featured && b.featuredUntil > Date.now() ? 1 : 0;
      if (af !== bf) return bf - af;
      return b.createdAt - a.createdAt;
    };
    return { exact: exactList.sort(sorter), related: relatedList.sort(sorter) };
  }, [query, listings, filters, sortBy]);

  const totalCount = exact.length + related.length;

  return (
    <div>
      <div className="px-4 pt-3 pb-2">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold mb-2" style={{ color: C.steel }}><BackIcon size={15} /> {t("back")}</button>
        <h1 dir="auto" className="font-bold" style={{ fontFamily: display(lang), fontSize: 20, color: C.asphalt, unicodeBidi: "plaintext" }}>{t("searchResultsTitle")} "{query}"</h1>
        <p className="text-xs mt-0.5" style={{ color: C.steel }}>{t("resultsCount", { n: totalCount })}</p>
        <div className="flex items-center gap-2 mt-3">
          <button onClick={() => setShowFilters(true)} className="relative flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full border" style={{ borderColor: activeFilterCount ? C.amber : C.line, background: activeFilterCount ? C.amberLight : "#fff", color: activeFilterCount ? C.amberDark : C.asphalt }}>
            <FilterIcon size={13} />{t("filtersBtn")}{activeFilterCount > 0 && ` (${activeFilterCount})`}
          </button>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-xs font-bold px-3 py-2 rounded-full border" style={{ borderColor: C.line, color: C.asphalt, background: "#fff" }}>
            {SORT_OPTIONS.map((s) => <option key={s} value={s}>{t("sort" + s.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(""))}</option>)}
          </select>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="text-center py-16 px-4">
          <Package size={30} color={C.steelLight} className="mx-auto mb-2" />
          <p dir="auto" className="text-sm font-semibold" style={{ color: C.asphalt, unicodeBidi: "plaintext" }}>{t("noResultsForQuery", { q: query })}</p>
          <p className="text-xs mt-1 mb-4" style={{ color: C.steel }}>{t("tryDifferentSearch")}</p>
          <PrimaryButton icon={PackageSearch} onClick={onNewRequest}>{t("homeBannerBtn")}</PrimaryButton>
        </div>
      ) : (
        <div className="px-4">
          {exact.length > 0 && (
            <div className="mb-1">
              {related.length > 0 && <p className="text-xs font-bold uppercase mb-2" style={{ color: C.steel, letterSpacing: 0.5 }}>{t("exactMatches")}</p>}
              <div className="grid grid-cols-2 gap-3">{exact.map((l) => <ListingCard key={l.id} listing={l} shops={shops} onOpen={onOpen} />)}</div>
            </div>
          )}
          {related.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-bold uppercase mb-2" style={{ color: C.steel, letterSpacing: 0.5 }}>{t("relatedMatches")}</p>
              <div className="grid grid-cols-2 gap-3">{related.map((l) => <ListingCard key={l.id} listing={l} shops={shops} onOpen={onOpen} />)}</div>
            </div>
          )}
        </div>
      )}

      {showFilters && <FilterSheet initial={filters} onClose={() => setShowFilters(false)} onApply={(f) => { setFilters(f); setShowFilters(false); }} />}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Shop profile
--------------------------------------------------------------------- */
function ShopProfileScreen({ shop, listings, orders, onBack, onOpen }) {
  const { t, lang, dir } = useLang();
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  if (!shop) return null;
  const city = findCity(shop.city);
  const biz = findBusinessType(shop.businessType);
  // Real, not decorative: computed from this shop's own order history.
  // With no orders yet there's nothing to claim, so the badge just doesn't render.
  const relevantOrders = (orders || []).filter((o) => ["completed", "disputed", "refunded"].includes(o.status));
  const disputedCount = relevantOrders.filter((o) => o.status === "disputed" || o.dispute).length;
  const disputeFreeRate = relevantOrders.length > 0 ? Math.round(((relevantOrders.length - disputedCount) / relevantOrders.length) * 100) : null;
  return (
    <div>
      <div className="px-4 pt-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold mb-3" style={{ color: C.steel }}><BackIcon size={15} /> {t("back")}</button>
      </div>
      <div className="mx-4 rounded-2xl p-5" style={{ background: `linear-gradient(135deg, ${C.asphalt}, ${C.asphalt2})` }}>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(155deg, ${C.amber}, ${C.amberDark})` }}>
            <Store size={26} color="#fff" />
          </div>
          <div className="flex-1 min-w-0">
            <p dir="auto" className="text-lg font-bold flex items-center gap-1.5" style={{ color: "#fff", unicodeBidi: "plaintext" }}>{shop.name}{shop.verified && <BadgeCheck size={16} color={C.green} />}</p>
            <p className="text-xs mt-0.5" style={{ color: C.steelLight }}>{label(biz, lang)} · {label(city, lang)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 flex-wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          <span className="text-sm font-bold flex items-center gap-1" style={{ color: "#fff" }}><Star size={13} color={C.amber} fill={C.amber} />{shop.rating}</span>
          <span className="text-xs" style={{ color: C.steelLight }}>{t("salesCountLabel", { n: shop.salesCount.toLocaleString() })}</span>
          <span className="text-xs" style={{ color: C.steelLight }}>{t("shopListingsCount", { n: listings.length })}</span>
          {disputeFreeRate !== null && (
            <span className="text-xs flex items-center gap-1" style={{ color: C.steelLight }}><ShieldCheck size={11} />{disputeFreeRate}% {t("disputeFreeLabel")}</span>
          )}
        </div>
      </div>
      <div className="mx-4 mt-3 flex items-center gap-3">
        {shop.verified && <Badge tone="green" icon={BadgeCheck}>{t("verifiedShopBadge")}</Badge>}
        {shop.deliveryAvailable ? <Badge tone="amber" icon={Truck}>{t("deliveryAvailableLabel")}</Badge> : <Badge>{t("pickupOnlyLabel")}</Badge>}
      </div>
      {shop.description && <p dir="auto" className="mx-4 mt-3 text-sm" style={{ color: C.steel, unicodeBidi: "plaintext" }}>{shop.description}</p>}
      <p className="px-4 mt-5 mb-2 text-xs font-bold uppercase" style={{ color: C.steel, letterSpacing: 0.5 }}>{t("shopListingsCount", { n: listings.length })}</p>
      <div className="px-4">
        {listings.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: C.steel }}>{t("noMatchTitle")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">{listings.map((l) => <ListingCard key={l.id} listing={l} shops={[shop]} onOpen={onOpen} />)}</div>
        )}
      </div>
    </div>
  );
}

function ListingDetail({ listing, shops, session, onBack, onBuy, onMarkSold, isOwner, onOpenShop, isFavorite, onToggleFavorite }) {
  const { t, lang, dir } = useLang();
  const Icon = CAT_ICON[listing.category] || Package;
  const shop = listing.shopId ? shops.find((s) => s.id === listing.shopId) : null;
  const protectionAmount = Math.round(listing.price * FEES.protectionPct);
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const cond = findCondition(listing.condition);
  const city = findCity(listing.city);
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = listing.image && !imgFailed;

  return (
    <div>
      <div className="px-4 pt-3 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold mb-3" style={{ color: C.steel }}><BackIcon size={15} /> {t("back")}</button>
        <button onClick={() => onToggleFavorite(listing.id)} className="w-8 h-8 rounded-full flex items-center justify-center mb-3" style={{ background: isFavorite ? C.rustLight : C.sand }}>
          <Star size={15} color={isFavorite ? C.rust : C.steel} fill={isFavorite ? C.rust : "none"} />
        </button>
      </div>
      <div className="mx-4 h-52 rounded-2xl flex items-center justify-center relative overflow-hidden" style={{ background: showImage ? C.asphalt : `linear-gradient(135deg, ${C.sand}, ${C.sandLight})` }}>
        {showImage ? (
          <>
            <img src={listing.image} alt="" onError={() => setImgFailed(true)} className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.9 }} />
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(18,24,31,0.1) 0%, rgba(18,24,31,0.05) 40%, rgba(18,24,31,0.5) 100%)` }} />
          </>
        ) : (
          <Icon size={64} strokeWidth={1.2} color={C.steel} />
        )}
        {listing.protectedDeal && <div className="absolute top-3" style={{ [lang === "ar" ? "left" : "right"]: 12 }}><Badge tone="green" icon={ShieldCheck}>{t("protectedDeal")}</Badge></div>}
      </div>
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 mb-1">
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.steel }}>{listing.id}</span>
          <Badge>{label(cond, lang)}</Badge>
          {listing.status === "sold" && <Badge tone="rust">{t("statusSold")}</Badge>}
          {listing.status === "reserved" && <Badge tone="amber">{t("orderStatusAccepted")}</Badge>}
        </div>
        <h1 dir="auto" className="font-bold text-lg leading-snug" style={{ color: C.asphalt, unicodeBidi: "plaintext" }}>{listing.title}</h1>
        <p dir="auto" className="text-sm mt-1" style={{ color: C.steel, unicodeBidi: "plaintext" }}>{listing.make} {listing.model} · {listing.yearFrom}–{listing.yearTo}</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {listing.authenticity && <Badge tone="dark">{label(findAuthenticity(listing.authenticity), lang)}</Badge>}
          {listing.partNumber && <Badge icon={Package}><span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{listing.partNumber}</span></Badge>}
        </div>
        <div className="mt-3"><PriceTag amount={listing.price} currency={listing.currency} size="lg" /></div>
        <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: C.steel }}>
          <span className="flex items-center gap-1"><MapPin size={12} />{label(city, lang)}</span>
          <span className="flex items-center gap-1"><Eye size={12} />{listing.views} {t("views")}</span>
          <span className="flex items-center gap-1"><Clock size={12} />{Math.max(1, Math.round((Date.now() - listing.createdAt) / 86400000))}{t("daysAgo")}</span>
        </div>
        <div className="mt-3 p-2.5 rounded-lg flex items-start gap-2" style={{ background: C.amberLight }}>
          <AlertTriangle size={13} color={C.amberDark} className="mt-0.5 flex-shrink-0" />
          <p className="text-xs" style={{ color: C.amberDark }}>{t("compatWarning")}</p>
        </div>
        <div className="mt-4 p-3 rounded-xl border" style={{ borderColor: C.line, background: "#fff" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: C.steel, letterSpacing: 0.3 }}>{t("descriptionLabel")}</p>
          <p className="text-sm" style={{ color: C.asphalt }}>{listing.description}</p>
        </div>
        <button onClick={() => shop && onOpenShop(shop.id)} disabled={!shop} className="mt-3 p-3 rounded-xl border flex items-center gap-3 w-full text-left" style={{ borderColor: C.line, background: "#fff" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: shop ? C.amberLight : C.sand }}>
            {shop ? <Store size={18} color={C.amberDark} /> : <User size={18} color={C.steel} />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold flex items-center gap-1" style={{ color: C.asphalt }}>{shop ? shop.name : listing.sellerName}{shop?.verified && <BadgeCheck size={14} color={C.green} />}</p>
            <p className="text-xs" style={{ color: C.steel }}>
              {shop ? (
                <span className="flex items-center gap-1"><Star size={11} color={C.amber} fill={C.amber} />{shop.rating} · {label(findCity(shop.city), lang)}</span>
              ) : t("individual")}
            </p>
          </div>
          {shop && <ChevronRight size={16} color={C.steel} style={{ transform: dir === "rtl" ? "rotate(180deg)" : "none" }} />}
        </button>
        {listing.protectedDeal && (
          <div className="mt-3 p-3 rounded-xl" style={{ background: C.greenLight }}>
            <p className="text-xs font-semibold flex items-center gap-1" style={{ color: C.green }}><ShieldCheck size={13} /> {t("protectedDealTitle")}</p>
            <p className="text-xs mt-1" style={{ color: C.asphalt }}>{t("protectedDealText", { fee: protectionAmount })}</p>
          </div>
        )}
        <div className="mt-5 flex gap-2 sticky bottom-20">
          {isOwner ? (
            listing.status === "active" && <PrimaryButton full onClick={onMarkSold}>{t("markAsSold")}</PrimaryButton>
          ) : listing.status === "active" ? (
            <PrimaryButton full icon={ShoppingCart} onClick={onBuy}>
              {t("buyNow")} · {listing.price.toLocaleString()} {lang === "ar" ? "د.ل" : listing.currency}
            </PrimaryButton>
          ) : listing.status === "reserved" ? (
            <div className="w-full text-center p-3 rounded-lg text-sm font-semibold" style={{ background: C.sand, color: C.steel }}>{t("listingReservedNote")}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Requests — "I Need This Part"
--------------------------------------------------------------------- */
function RequestCard({ request, onOpen }) {
  const { t, lang } = useLang();
  const city = findCity(request.city);
  const urgency = findUrgency(request.urgency);
  return (
    <button onClick={() => onOpen(request)} className="w-full text-left p-3.5 rounded-xl border" style={{ borderColor: C.line, background: "#fff" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold" style={{ color: C.asphalt }}>{request.make} {request.model} {request.year ? `· ${request.year}` : ""}</p>
          <p dir="auto" className="text-xs mt-1 line-clamp-2" style={{ color: C.steel, unicodeBidi: "plaintext" }}>{request.partDescription}</p>
        </div>
        {request.urgency === "asap" && <Badge tone="rust">{label(urgency, lang)}</Badge>}
      </div>
      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t" style={{ borderColor: C.line }}>
        <span className="text-xs flex items-center gap-1" style={{ color: C.steel }}><MapPin size={11} />{label(city, lang)}</span>
        <span className="text-xs font-semibold flex items-center gap-1" style={{ color: request.offers.length ? C.amberDark : C.steel }}>
          <MessageCircle size={11} />{t("offersCount", { n: request.offers.length })}
        </span>
      </div>
    </button>
  );
}

function RequestsScreen({ requests, session, onOpen, onNewRequest }) {
  const { t, lang } = useLang();
  const [tab, setTab] = useState("open");
  const open = requests.filter((r) => r.status === "open");
  const mine = requests.filter((r) => r.requesterContact === session?.contact);
  const list = tab === "open" ? open : mine;

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-bold" style={{ fontFamily: display(lang), fontSize: 22, color: C.asphalt }}>{t("requestsTitle")}</h1>
        <PrimaryButton icon={Plus} onClick={onNewRequest} style={{ padding: "8px 14px", fontSize: 13 }}>{t("newRequestBtn")}</PrimaryButton>
      </div>
      <div className="flex rounded-lg overflow-hidden border mb-4" style={{ borderColor: C.line }}>
        {["open", "mine"].map((tb) => (
          <button key={tb} onClick={() => setTab(tb)} className="flex-1 py-2 text-xs font-semibold" style={{ background: tab === tb ? C.amber : "#fff", color: tab === tb ? "#fff" : C.asphalt }}>
            {tb === "open" ? t("openRequestsLabel") : t("myRequestsLabel")}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="text-center py-14">
          <PackageSearch size={30} color={C.steelLight} className="mx-auto mb-2" />
          <p className="text-sm font-semibold" style={{ color: C.asphalt }}>{tab === "open" ? t("noRequestsYet") : t("myRequestsEmpty")}</p>
        </div>
      ) : (
        <div className="space-y-2">{list.map((r) => <RequestCard key={r.id} request={r} onOpen={onOpen} />)}</div>
      )}
    </div>
  );
}

function RequestDetail({ request, session, myShop, onBack, onOffer, onAccept, onContact }) {
  const { t, lang, dir } = useLang();
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const city = findCity(request.city);
  const urgency = findUrgency(request.urgency);
  const cond = request.conditionPreference === "any" ? null : findCondition(request.conditionPreference);
  const isRequester = session && session.contact === request.requesterContact;
  const canOffer = session && !isRequester;

  return (
    <div className="px-4 pt-3">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold mb-3" style={{ color: C.steel }}><BackIcon size={15} /> {t("backToRequests")}</button>

      <div className="p-4 rounded-xl border" style={{ borderColor: C.line, background: "#fff" }}>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Badge tone={request.status === "open" ? "green" : request.status === "matched" ? "amber" : "neutral"}>{t("requestStatus" + request.status.charAt(0).toUpperCase() + request.status.slice(1))}</Badge>
          {request.urgency === "asap" && <Badge tone="rust">{label(urgency, lang)}</Badge>}
          {cond && <Badge>{label(cond, lang)}</Badge>}
        </div>
        <p className="text-lg font-bold mt-1" style={{ color: C.asphalt }}>{request.make} {request.model} {request.year ? `· ${request.year}` : ""}</p>
        <p dir="auto" className="text-sm mt-2" style={{ color: C.asphalt, unicodeBidi: "plaintext" }}>{request.partDescription}</p>
        <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: C.steel }}>
          <span className="flex items-center gap-1"><MapPin size={12} />{label(city, lang)}</span>
          <span className="flex items-center gap-1"><User size={12} />{t("requestFrom")}: {request.requesterName}</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: C.steel, letterSpacing: 0.4 }}>{t("offersCount", { n: request.offers.length })}</p>
        {canOffer && request.status === "open" && <button onClick={onOffer} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: C.amberLight, color: C.amberDark }}>{t("submitOfferBtn")}</button>}
      </div>

      {request.offers.length === 0 ? (
        <p className="text-sm mt-3" style={{ color: C.steel }}>{t("noOffersYet")}</p>
      ) : (
        <div className="space-y-2 mt-3">
          {request.offers.map((o) => (
            <div key={o.id} className="p-3 rounded-xl border" style={{ borderColor: request.acceptedOfferId === o.id ? C.green : C.line, background: "#fff" }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold flex items-center gap-1" style={{ color: C.asphalt }}>
                  {o.shopId ? <Store size={13} color={C.amberDark} /> : <User size={13} color={C.steel} />} {o.sellerName}
                </p>
                <PriceTag amount={o.price} />
              </div>
              <p className="text-xs mt-1" style={{ color: C.steel }}>{o.condition}{o.delivery ? ` · ${t("offerDeliveryCheckbox")}` : ""}</p>
              {o.notes && <p dir="auto" className="text-xs mt-1" style={{ color: C.asphalt, unicodeBidi: "plaintext" }}>{o.notes}</p>}
              <div className="flex gap-2 mt-2">
                {isRequester && request.status === "open" && (
                  <button onClick={() => onAccept(o.id)} className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1" style={{ background: C.greenLight, color: C.green }}><CheckCircle2 size={12} />{t("acceptOfferBtn")}</button>
                )}
                {isRequester && request.acceptedOfferId === o.id && (
                  <button onClick={() => onContact(o.sellerContact)} className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1" style={{ background: C.amberLight, color: C.amberDark }}><Phone size={12} />{t("contactToArrange")}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewRequestModal({ onClose, onSubmit }) {
  const { t, lang } = useLang();
  const [form, setForm] = useState({ make: MAKES[0], model: "", year: "", partDescription: "", conditionPreference: "any", city: CITIES[0].id, urgency: "flexible" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.partDescription.trim() && form.model.trim();

  return (
    <Modal title={t("newRequestBtn")} onClose={onClose} wide>
      <p className="text-xs mb-3" style={{ color: C.steel, letterSpacing: 0.3 }}>{t("requestVehicle")}</p>
      <div className="grid grid-cols-3 gap-2">
        <Field label={t("makeField")}><select style={inputStyle} value={form.make} onChange={(e) => set("make", e.target.value)}>{MAKES.map((m) => <option key={m}>{m}</option>)}</select></Field>
        <Field label={t("modelField")}><input style={inputStyle} value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="e.g. Sportage" /></Field>
        <Field label={t("yearFrom")}><input type="number" style={inputStyle} value={form.year} onChange={(e) => set("year", e.target.value)} placeholder="2020" /></Field>
      </div>
      <Field label={t("requestPartDesc")}><textarea dir="auto" style={{ ...inputStyle, minHeight: 80 }} value={form.partDescription} onChange={(e) => set("partDescription", e.target.value)} placeholder={t("requestPartDescPlaceholder")} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("requestCondition")}>
          <select style={inputStyle} value={form.conditionPreference} onChange={(e) => set("conditionPreference", e.target.value)}>
            <option value="any">{t("requestConditionAny")}</option>
            {CONDITIONS.map((c) => <option key={c.id} value={c.id}>{label(c, lang)}</option>)}
          </select>
        </Field>
        <Field label={t("requestCity")}><select style={inputStyle} value={form.city} onChange={(e) => set("city", e.target.value)}>{CITIES.map((c) => <option key={c.id} value={c.id}>{label(c, lang)}</option>)}</select></Field>
      </div>
      <Field label={t("requestUrgency")}>
        <div className="grid grid-cols-3 gap-2">
          {URGENCY.map((u) => (
            <button key={u.id} type="button" onClick={() => set("urgency", u.id)} className="py-2 rounded-lg border text-xs font-semibold" style={{ borderColor: form.urgency === u.id ? C.amber : C.line, background: form.urgency === u.id ? C.amberLight : "#fff", color: form.urgency === u.id ? C.amberDark : C.asphalt }}>
              {label(u, lang)}
            </button>
          ))}
        </div>
      </Field>
      <PrimaryButton full disabled={!valid} onClick={() => onSubmit({ ...form, year: form.year ? Number(form.year) : null })}>{t("submitRequestBtn")}</PrimaryButton>
    </Modal>
  );
}

function OfferModal({ onClose, onSubmit }) {
  const { t } = useLang();
  const [form, setForm] = useState({ price: "", condition: "", notes: "", delivery: false });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.price && form.condition.trim();

  return (
    <Modal title={t("submitOfferBtn")} onClose={onClose}>
      <Field label={t("offerPrice")}><input type="number" style={inputStyle} value={form.price} onChange={(e) => set("price", +e.target.value)} placeholder="0" /></Field>
      <Field label={t("offerCondition")}><input style={inputStyle} value={form.condition} onChange={(e) => set("condition", e.target.value)} placeholder="e.g. New, OEM" /></Field>
      <Field label={t("offerNotes")}><textarea dir="auto" style={{ ...inputStyle, minHeight: 60 }} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder={t("offerNotesPlaceholder")} /></Field>
      <label className="flex items-center gap-2 mb-4 text-sm" style={{ color: C.asphalt }}>
        <input type="checkbox" checked={form.delivery} onChange={(e) => set("delivery", e.target.checked)} /> {t("offerDeliveryCheckbox")}
      </label>
      <PrimaryButton full disabled={!valid} onClick={() => onSubmit({ ...form, price: Number(form.price) })}>{t("submitOfferBtn")}</PrimaryButton>
    </Modal>
  );
}

/* ---------------------------------------------------------------------
   Buy / Orders
--------------------------------------------------------------------- */
function BuyModal({ listing, onClose, onSubmit }) {
  const { t, lang } = useLang();
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [otherPaymentDetail, setOtherPaymentDetail] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [includeProtection, setIncludeProtection] = useState(!!listing.protectedDeal);

  const paymentCategory = paymentMethod === "cash" ? "cash" : "electronic";
  const canSubmit = (paymentMethod !== "other" || otherPaymentDetail.trim().length > 0) && (deliveryMethod !== "delivery" || deliveryAddress.trim().length > 0);
  const deliveryFee = deliveryMethod === "delivery" ? FEES.deliveryFlat : 0;
  const protectionFee = includeProtection ? Math.round(listing.price * FEES.protectionPct) : 0;
  const commission = Math.round(listing.price * FEES.commissionPct);
  const total = listing.price + deliveryFee + protectionFee;
  const cur = lang === "ar" ? "د.ل" : listing.currency;

  return (
    <Modal title={t("buyModalTitle")} onClose={onClose} wide>
      <p dir="auto" className="text-sm font-semibold mb-3" style={{ color: C.asphalt, unicodeBidi: "plaintext" }}>{listing.title}</p>

      <Field label={t("deliveryMethodLabel")}>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setDeliveryMethod("pickup")} className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-sm font-semibold" style={{ borderColor: deliveryMethod === "pickup" ? C.amber : C.line, background: deliveryMethod === "pickup" ? C.amberLight : "#fff", color: deliveryMethod === "pickup" ? C.amberDark : C.asphalt }}>
            <User size={14} />{t("pickupOption")}
          </button>
          <button type="button" onClick={() => setDeliveryMethod("delivery")} className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-sm font-semibold" style={{ borderColor: deliveryMethod === "delivery" ? C.amber : C.line, background: deliveryMethod === "delivery" ? C.amberLight : "#fff", color: deliveryMethod === "delivery" ? C.amberDark : C.asphalt }}>
            <Truck size={14} />{t("deliveryOption")}
          </button>
        </div>
      </Field>

      {deliveryMethod === "delivery" && (
        <>
          <Field label={t("deliveryAddressField")}><input style={inputStyle} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder={t("deliveryAddressPlaceholder")} /></Field>
          <Field label={t("deliveryNotesField")}><input style={inputStyle} value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} placeholder={t("deliveryNotesPlaceholder")} /></Field>
        </>
      )}

      <Field label={t("paymentMethodLabel")}>
        <div className="space-y-2">
          {PAYMENT_METHODS.map((p) => (
            <button key={p.id} type="button" onClick={() => setPaymentMethod(p.id)} className="w-full flex items-center gap-2 p-2.5 rounded-lg border text-sm font-semibold" style={{ borderColor: paymentMethod === p.id ? C.amber : C.line, background: paymentMethod === p.id ? C.amberLight : "#fff", color: paymentMethod === p.id ? C.amberDark : C.asphalt }}>
              <span>{p.icon}</span>{label(p, lang)}
            </button>
          ))}
        </div>
      </Field>

      {paymentMethod === "other" && (
        <Field label={t("otherPaymentDetailField")}>
          <input style={inputStyle} value={otherPaymentDetail} onChange={(e) => setOtherPaymentDetail(e.target.value)} placeholder={t("otherPaymentDetailPlaceholder")} />
        </Field>
      )}

      {listing.protectedDeal && (
        <label className="flex items-center gap-2 mb-4 text-sm p-2.5 rounded-lg" style={{ background: C.greenLight, color: C.asphalt }}>
          <input type="checkbox" checked={includeProtection} onChange={(e) => setIncludeProtection(e.target.checked)} />
          <ShieldCheck size={14} color={C.green} /> {t("includeProtectionCheckbox", { fee: Math.round(listing.price * FEES.protectionPct) })}
        </label>
      )}

      <div className="p-3 rounded-xl mb-3" style={{ background: C.sand }}>
        <div className="flex items-center justify-between text-sm mb-1"><span style={{ color: C.steel }}>{t("partPriceLabel")}</span><span style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.asphalt }}>{listing.price.toLocaleString()} {cur}</span></div>
        {deliveryFee > 0 && <div className="flex items-center justify-between text-sm mb-1"><span style={{ color: C.steel }}>{t("deliveryFeeLabel")}</span><span style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.asphalt }}>{deliveryFee.toLocaleString()} {cur}</span></div>}
        {protectionFee > 0 && <div className="flex items-center justify-between text-sm mb-1"><span style={{ color: C.steel }}>{t("protectionFeeLabelShort")}</span><span style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.asphalt }}>{protectionFee.toLocaleString()} {cur}</span></div>}
        <div className="flex items-center justify-between text-sm pt-2 mt-1 border-t font-bold" style={{ borderColor: C.line }}><span style={{ color: C.asphalt }}>{t("totalToPay")}</span><span style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.asphalt }}>{total.toLocaleString()} {cur}</span></div>
      </div>

      <p className="text-xs mb-4 flex items-start gap-1.5" style={{ color: C.steel }}>
        <CircleDollarSign size={13} className="mt-0.5 flex-shrink-0" />
        {t("sellerCommissionNote", { pct: Math.round(FEES.commissionPct * 100) })} ({commission.toLocaleString()} {cur})
      </p>

      <PrimaryButton full disabled={!canSubmit} icon={ShoppingCart} onClick={() => onSubmit({ paymentMethod, paymentCategory, otherPaymentDetail: paymentMethod === "other" ? otherPaymentDetail.trim() : null, deliveryMethod, deliveryAddress: deliveryMethod === "delivery" ? deliveryAddress.trim() : null, deliveryNotes: deliveryMethod === "delivery" ? deliveryNotes.trim() : null, includeProtection })}>{t("placeOrderBtn")}</PrimaryButton>
    </Modal>
  );
}

function OrderCard({ order, session, onOpen }) {
  const { t, lang } = useLang();
  const isBuyer = session?.contact === order.buyerContact;
  const total = order.partPrice + order.deliveryFee + order.protectionFee;
  const cur = lang === "ar" ? "د.ل" : "LYD";
  const statusTone = order.status === "completed" ? "green" : order.status === "disputed" ? "rust" : order.status === "cancelled" ? "neutral" : "amber";
  return (
    <button onClick={() => onOpen(order)} className="w-full text-left p-3 rounded-xl border" style={{ borderColor: C.line, background: "#fff" }}>
      <div className="flex items-start justify-between gap-2">
        <p dir="auto" className="text-sm font-semibold line-clamp-1" style={{ color: C.asphalt, unicodeBidi: "plaintext" }}>{order.listingTitle}</p>
        <Badge tone={statusTone}>{t("orderStatus" + order.status.charAt(0).toUpperCase() + order.status.slice(1))}</Badge>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs" style={{ color: C.steel }}>{isBuyer ? order.sellerName : order.buyerName}</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: 13, color: C.asphalt }}>{total.toLocaleString()} {cur}</span>
      </div>
    </button>
  );
}

function OrderDetail({ order, session, messages, onBack, onAccept, onPrepare, onDispatch, onFulfil, onConfirmReceipt, onDispute, onCancel, onSendMessage, onRequestRefund, onSubmitBankConfirmation }) {
  const { t, lang, dir } = useLang();
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const isBuyer = session?.id === order.buyerId;
  const isSeller = session?.id === order.sellerId;
  const isPickup = order.deliveryMethod === "pickup";
  const total = order.partPrice + order.deliveryFee + order.protectionFee;
  const cur = lang === "ar" ? "د.ل" : "LYD";
  const pm = findPaymentMethod(order.paymentMethod);
  const [msgText, setMsgText] = useState("");
  const [bankRef, setBankRef] = useState("");
  const readyStatus = isPickup ? "ready_for_pickup" : "out_for_delivery";
  const fulfilledStatus = isPickup ? "collected" : "delivered";
  const statusTone = order.status === "completed" ? "green" : ["disputed", "cancelled"].includes(order.status) ? "rust" : "amber";

  return (
    <div className="px-4 pt-3">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold mb-3" style={{ color: C.steel }}><BackIcon size={15} /> {t("back")}</button>

      <div className="p-4 rounded-xl border" style={{ borderColor: C.line, background: "#fff" }}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.steel }}>{order.id}</span>
          <Badge tone={statusTone}>{t("orderStatus" + order.status.charAt(0).toUpperCase() + order.status.slice(1))}</Badge>
        </div>
        <p dir="auto" className="text-base font-bold" style={{ color: C.asphalt, unicodeBidi: "plaintext" }}>{order.listingTitle}</p>

        <div className="mt-3 pt-3 border-t space-y-1" style={{ borderColor: C.line }}>
          <div className="flex items-center justify-between text-sm"><span style={{ color: C.steel }}>{t("buyerLabel")}</span><span style={{ color: C.asphalt }}>{order.buyerName}</span></div>
          <div className="flex items-center justify-between text-sm"><span style={{ color: C.steel }}>{t("sellerLabel")}</span><span style={{ color: C.asphalt }}>{order.sellerName}</span></div>
          <div className="flex items-center justify-between text-sm"><span style={{ color: C.steel }}>{t("paymentMethodShown")}</span><span style={{ color: C.asphalt }}>{pm.icon} {label(pm, lang)}</span></div>
          <div className="flex items-center justify-between text-sm"><span style={{ color: C.steel }}>{t("deliveryMethodShown")}</span><span style={{ color: C.asphalt }}>{order.deliveryMethod === "delivery" ? t("deliveryOption") : t("pickupOption")}</span></div>
        </div>

        {order.deliveryMethod === "delivery" && order.deliveryAddress && (
          <div className="mt-3 p-3 rounded-xl" style={{ background: C.sand }}>
            <p className="text-xs font-semibold flex items-center gap-1 mb-1" style={{ color: C.steel }}><Truck size={12} />{t("deliveryAddressField")}</p>
            <p dir="auto" className="text-sm" style={{ color: C.asphalt, unicodeBidi: "plaintext" }}>{order.deliveryAddress}</p>
            {order.deliveryNotes && <p dir="auto" className="text-xs mt-1" style={{ color: C.steel, unicodeBidi: "plaintext" }}>{order.deliveryNotes}</p>}
            {order.estimatedDeliveryAt && ["preparing", "out_for_delivery"].includes(order.status) && (
              <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: C.amberDark }}><Clock size={11} />{t("estimatedDeliveryLabel")}: {new Date(order.estimatedDeliveryAt).toLocaleDateString(lang === "ar" ? "ar-LY" : "en-GB")}</p>
            )}
          </div>
        )}

        <div className="mt-3 p-3 rounded-xl" style={{ background: C.sand }}>
          <div className="flex items-center justify-between text-sm mb-1"><span style={{ color: C.steel }}>{t("partPriceLabel")}</span><span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{order.partPrice.toLocaleString()} {cur}</span></div>
          {order.deliveryFee > 0 && <div className="flex items-center justify-between text-sm mb-1"><span style={{ color: C.steel }}>{t("deliveryFeeLabel")}</span><span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{order.deliveryFee.toLocaleString()} {cur}</span></div>}
          {order.protectionFee > 0 && <div className="flex items-center justify-between text-sm mb-1"><span style={{ color: C.steel }}>{t("protectionFeeLabelShort")}</span><span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{order.protectionFee.toLocaleString()} {cur}</span></div>}
          <div className="flex items-center justify-between text-sm pt-2 mt-1 border-t font-bold" style={{ borderColor: C.line }}><span>{t("totalToPay")}</span><span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{total.toLocaleString()} {cur}</span></div>
        </div>

        {isSeller && (
          <div className="mt-2 p-2.5 rounded-lg flex items-center justify-between" style={{ background: C.amberLight }}>
            <span className="text-xs font-semibold flex items-center gap-1" style={{ color: C.amberDark }}><CircleDollarSign size={12} />{t("commissionOwedLabel")}</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: C.amberDark }}>{order.commissionAmount.toLocaleString()} {cur}</span>
          </div>
        )}
      </div>

      {(order.cancelledBy || order.status === "cancelled") && (
        <div className="mt-3 p-2.5 rounded-lg" style={{ background: C.sand }}>
          <p className="text-xs font-semibold" style={{ color: C.steel }}>{order.cancelledBy === "seller" ? t("cancelledBySeller") : t("cancelledByBuyer")}</p>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {isSeller && order.status === "pending" && <PrimaryButton full icon={CheckCircle2} onClick={onAccept}>{t("acceptOrderBtn")}</PrimaryButton>}
        {isSeller && order.status === "pending" && <GhostButton full icon={X} onClick={() => onCancel("seller")} style={{ color: C.rust, borderColor: C.rustLight }}>{t("rejectOrderBtn")}</GhostButton>}
        {isBuyer && order.status === "pending" && <GhostButton full icon={X} onClick={() => onCancel("buyer")} style={{ color: C.rust, borderColor: C.rustLight }}>{t("cancelOrderBtn")}</GhostButton>}

        {isSeller && order.status === "accepted" && <PrimaryButton full icon={PackageCheck} onClick={onPrepare}>{t("prepareOrderBtn")}</PrimaryButton>}
        {isSeller && ["accepted", "preparing"].includes(order.status) && <GhostButton full icon={X} onClick={() => onCancel("seller")} style={{ color: C.rust, borderColor: C.rustLight }}>{t("cancelOrderBtn")}</GhostButton>}

        {isSeller && order.status === "preparing" && <PrimaryButton full icon={Truck} onClick={onDispatch}>{t(isPickup ? "dispatchBtnPickup" : "dispatchBtnDelivery")}</PrimaryButton>}

        {isSeller && order.status === readyStatus && <PrimaryButton full icon={PackageCheck} onClick={onFulfil}>{t(isPickup ? "fulfilBtnPickup" : "fulfilBtnDelivery")}</PrimaryButton>}

        {isBuyer && order.status === fulfilledStatus && (
          <>
            <PrimaryButton full icon={CheckCircle2} onClick={onConfirmReceipt}>{t("confirmReceiptBtn")}</PrimaryButton>
            <GhostButton full icon={Flag} onClick={onDispute} style={{ color: C.rust, borderColor: C.rustLight }}>{t("reportProblemBtn")}</GhostButton>
          </>
        )}
        {order.dispute && (
          <div className="p-3 rounded-xl" style={{ background: C.rustLight }}>
            <p className="text-xs font-semibold flex items-center gap-1" style={{ color: C.rust }}><AlertOctagon size={13} />{label(DISPUTE_REASONS.find((d) => d.id === order.dispute.reason), lang)}</p>
            <p dir="auto" className="text-xs mt-1" style={{ color: C.asphalt, unicodeBidi: "plaintext" }}>{order.dispute.description}</p>
          </div>
        )}
      </div>

      {order.paymentMethod === "bank" && isBuyer && !order.bankTransferConfirmation && ["pending", "accepted", "preparing"].includes(order.status) && (
        <div className="mt-3 p-3.5 rounded-xl border" style={{ borderColor: C.line, background: "#fff" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: C.steel }}>{t("submitBankConfirmationTitle")}</p>
          <input dir="auto" value={bankRef} onChange={(e) => setBankRef(e.target.value)} placeholder={t("bankReferencePlaceholder")} style={{ ...inputStyle, marginBottom: 8 }} />
          <PrimaryButton full disabled={!bankRef.trim()} onClick={() => { onSubmitBankConfirmation(bankRef.trim()); setBankRef(""); }}>{t("submitConfirmationBtn")}</PrimaryButton>
        </div>
      )}
      {order.bankTransferConfirmation && (
        <div className="mt-3 p-3 rounded-xl" style={{ background: order.bankTransferConfirmation.status === "verified" ? C.greenLight : order.bankTransferConfirmation.status === "rejected" ? C.rustLight : C.amberLight }}>
          <p className="text-xs font-semibold" style={{ color: order.bankTransferConfirmation.status === "verified" ? C.green : order.bankTransferConfirmation.status === "rejected" ? C.rust : C.amberDark }}>
            {t(order.bankTransferConfirmation.status === "verified" ? "bankConfirmationVerified" : order.bankTransferConfirmation.status === "rejected" ? "bankConfirmationRejected" : "bankConfirmationPending")}
          </p>
        </div>
      )}

      {order.refund ? (
        <div className="mt-3 p-3 rounded-xl" style={{ background: order.refund.status === "refunded" ? C.greenLight : order.refund.status === "rejected" ? C.rustLight : C.amberLight }}>
          <p className="text-xs font-semibold" style={{ color: order.refund.status === "refunded" ? C.green : order.refund.status === "rejected" ? C.rust : C.amberDark }}>
            {t("refundStatus" + order.refund.status.charAt(0).toUpperCase() + order.refund.status.slice(1))} · {order.refund.amount.toLocaleString()} {cur}
          </p>
        </div>
      ) : (
        (isBuyer || isSeller) && ["completed", "delivered", "collected"].includes(order.status) && (
          <button onClick={onRequestRefund} className="mt-3 text-xs font-semibold flex items-center gap-1" style={{ color: C.rust }}><CircleDollarSign size={13} />{t("requestRefundBtn")}</button>
        )
      )}

      {(isBuyer || isSeller) && (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase mb-2" style={{ color: C.steel, letterSpacing: 0.5 }}>{t("messagesTab")}</p>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: C.line }}>
            <div className="p-3 space-y-2 max-h-64 overflow-y-auto" style={{ background: C.sandLight }}>
              {messages.length === 0 ? (
                <p className="text-xs text-center py-3" style={{ color: C.steel }}>{t("noMessagesYet")}</p>
              ) : (
                messages.map((m) => {
                  const mine = m.senderContact === session.contact;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div dir="auto" className="max-w-[75%] px-3 py-2 rounded-2xl text-sm" style={{ background: mine ? C.amber : "#fff", color: mine ? "#fff" : C.asphalt, unicodeBidi: "plaintext", border: mine ? "none" : `1px solid ${C.line}` }}>
                        {m.body}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex items-center gap-2 p-2 border-t" style={{ borderColor: C.line, background: "#fff" }}>
              <input dir="auto" value={msgText} onChange={(e) => setMsgText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && msgText.trim()) { onSendMessage(msgText.trim()); setMsgText(""); } }} placeholder={t("messagePlaceholder")} className="flex-1 text-sm outline-none px-2" style={{ color: C.asphalt }} />
              <button onClick={() => { if (msgText.trim()) { onSendMessage(msgText.trim()); setMsgText(""); } }} className="p-2 rounded-full flex-shrink-0" style={{ background: C.amber }}><Send size={14} color="#fff" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DisputeModal({ onClose, onSubmit }) {
  const { t, lang } = useLang();
  const [reason, setReason] = useState(DISPUTE_REASONS[0].id);
  const [description, setDescription] = useState("");

  return (
    <Modal title={t("disputeTitle")} onClose={onClose}>
      <Field label={t("disputeReasonLabel")}>
        <select style={inputStyle} value={reason} onChange={(e) => setReason(e.target.value)}>
          {DISPUTE_REASONS.map((r) => <option key={r.id} value={r.id}>{label(r, lang)}</option>)}
        </select>
      </Field>
      <Field label={t("disputeDescLabel")}>
        <textarea dir="auto" style={{ ...inputStyle, minHeight: 80 }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("disputeDescPlaceholder")} />
      </Field>
      <PrimaryButton full disabled={!description.trim()} icon={Flag} onClick={() => onSubmit({ reason, description })}>{t("submitDisputeBtn")}</PrimaryButton>
    </Modal>
  );
}

function RefundRequestModal({ order, onClose, onSubmit }) {
  const { t, lang } = useLang();
  const [amount, setAmount] = useState(order?.partPrice || 0);
  const [reason, setReason] = useState("");
  const cur = lang === "ar" ? "د.ل" : "LYD";

  return (
    <Modal title={t("refundModalTitle")} onClose={onClose}>
      <Field label={`${t("refundAmountField")} (${t("totalToPay")}: ${(order?.partPrice || 0).toLocaleString()} ${cur})`}>
        <input type="number" style={inputStyle} value={amount} onChange={(e) => setAmount(+e.target.value)} />
      </Field>
      <Field label={t("refundReasonField")}>
        <textarea dir="auto" style={{ ...inputStyle, minHeight: 70 }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("refundReasonPlaceholder")} />
      </Field>
      <PrimaryButton full disabled={!reason.trim() || amount <= 0} icon={CircleDollarSign} onClick={() => onSubmit({ amount, reason: reason.trim() })}>{t("submitRefundBtn")}</PrimaryButton>
    </Modal>
  );
}

function NotificationsPanel({ items, onClose, onMarkAllRead, onOpen }) {
  const { t, lang } = useLang();
  const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt);
  return (
    <Modal title={t("notificationsTitle")} onClose={onClose} wide>
      {sorted.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: C.steel }}>{t("noNotificationsYet")}</p>
      ) : (
        <>
          <button onClick={onMarkAllRead} className="text-xs font-semibold mb-3" style={{ color: C.amberDark }}>{t("markAllReadBtn")}</button>
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {sorted.map((n) => (
              <button key={n.id} onClick={() => onOpen(n)} className="w-full text-left p-3 rounded-xl flex items-start gap-2.5" style={{ background: n.readAt ? "#fff" : C.amberLight, border: `1px solid ${C.line}` }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: n.readAt ? "transparent" : C.amber }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold" style={{ color: C.asphalt }}>{t("notif_" + n.type)}</p>
                  <p dir="auto" className="text-xs mt-0.5 line-clamp-1" style={{ color: C.steel, unicodeBidi: "plaintext" }}>{n.title}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}

/* ---------------------------------------------------------------------
   Account screen
--------------------------------------------------------------------- */
/* ---------------------------------------------------------------------
   Seller Center
--------------------------------------------------------------------- */
function SellerCenterScreen({ session, myShop, myListings, mySales, matchingRequests, onAddPart, onEditShop, onEditListing, onSetStatus, onRemove, onBoost, onOpenRequest, onBack }) {
  const { t, lang, dir } = useLang();
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const [tab, setTab] = useState("dashboard");

  const activeListings = myListings.filter((l) => l.status === "active");
  const totalViews = myListings.reduce((sum, l) => sum + (l.views || 0), 0);
  const totalSaves = myListings.reduce((sum, l) => sum + (l.saves || 0), 0);
  const completedSales = mySales.filter((o) => o.status === "completed");
  const revenue = completedSales.reduce((sum, o) => sum + o.partPrice, 0);
  const commissionOwed = completedSales.reduce((sum, o) => sum + o.commissionAmount, 0);
  const cur = lang === "ar" ? "د.ل" : "LYD";

  const statusTabs = ["all", "active", "reserved", "sold", "draft", "removed"];
  const [invFilter, setInvFilter] = useState("all");
  const filteredInventory = invFilter === "all" ? myListings : myListings.filter((l) => l.status === invFilter);

  return (
    <div>
      <div className="px-4 pt-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold mb-2" style={{ color: C.steel }}><BackIcon size={15} /> {t("back")}</button>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(155deg, ${C.amber}, ${C.amberDark})` }}>
            <Store size={18} color="#fff" />
          </div>
          <div>
            <p dir="auto" className="font-bold" style={{ fontFamily: display(lang), fontSize: 19, color: C.asphalt, unicodeBidi: "plaintext" }}>{myShop ? myShop.name : session.name}</p>
            <p className="text-xs" style={{ color: C.steel }}>{t("sellerCenterTitle")}</p>
          </div>
        </div>
      </div>

      {matchingRequests.length > 0 && (
        <button onClick={() => setTab("matching")} className="mx-4 mb-3 w-[calc(100%-2rem)] flex items-center gap-3 p-3.5 rounded-2xl text-left" style={{ background: `linear-gradient(135deg, ${C.asphalt}, ${C.asphalt2})` }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.amber }}><MessageCircle size={16} color="#fff" /></div>
          <div className="flex-1">
            <p className="text-xs font-bold" style={{ color: "#fff" }}>{t("matchingNotifTitle", { n: matchingRequests.length })}</p>
          </div>
          {dir === "rtl" ? <ChevronLeft size={16} color={C.steelLight} /> : <ChevronRight size={16} color={C.steelLight} />}
        </button>
      )}

      <div className="flex px-4 gap-1 border-b" style={{ borderColor: C.line }}>
        {[{ id: "dashboard", label: t("dashboardTab") }, { id: "inventory", label: t("inventoryTab") }, { id: "financials", label: t("financialsTab") }, { id: "matching", label: t("matchingTab") }].map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)} className="px-3 py-2 text-xs font-semibold whitespace-nowrap" style={{ color: tab === tb.id ? C.amberDark : C.steel, borderBottom: tab === tb.id ? `2px solid ${C.amber}` : "2px solid transparent" }}>
            {tb.label}{tb.id === "matching" && matchingRequests.length > 0 ? ` (${matchingRequests.length})` : ""}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Package} label={t("statActiveListingsSeller")} value={activeListings.length} />
            <StatCard icon={Eye} label={t("statViews")} value={totalViews} />
            <StatCard icon={Star} label={t("statSaves")} value={totalSaves} />
            <StatCard icon={CircleDollarSign} label={t("statRevenueSeller")} value={`${revenue.toLocaleString()} ${cur}`} highlight />
          </div>
          <div className="mt-3 p-3.5 rounded-xl flex items-center justify-between" style={{ background: C.amberLight }}>
            <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: C.amberDark }}><CircleDollarSign size={14} />{t("statCommissionOwed")}</span>
            <PriceTag amount={commissionOwed} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <PrimaryButton icon={Plus} onClick={onAddPart}>{t("addPartBtn")}</PrimaryButton>
            {myShop && <GhostButton icon={Building2} onClick={onEditShop}>{t("editShopBtn")}</GhostButton>}
          </div>
        </div>
      )}

      {tab === "financials" && (
        <div className="p-4">
          {(() => {
            const settledSales = completedSales.filter((o) => o.commissionSettled);
            const outstandingSales = completedSales.filter((o) => !o.commissionSettled);
            const settledAmount = settledSales.reduce((sum, o) => sum + o.commissionAmount, 0);
            const outstandingAmount = outstandingSales.reduce((sum, o) => sum + o.commissionAmount, 0);
            const refundedSales = mySales.filter((o) => o.refund?.status === "refunded");
            const refundsAmount = refundedSales.reduce((sum, o) => sum + (o.refund?.amount || 0), 0);
            return (
              <>
                <div className="p-3.5 rounded-xl" style={{ background: C.asphalt }}>
                  <p className="text-xs" style={{ color: C.steelLight }}>{t("totalSalesLabel")}</p>
                  <p className="text-2xl font-bold mt-1" style={{ fontFamily: "'IBM Plex Sans Condensed', sans-serif", color: "#fff" }}>{revenue.toLocaleString()} <span className="text-sm" style={{ color: C.steelLight }}>{cur}</span></p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <StatCard icon={CircleDollarSign} label={t("commissionOutstandingLabel")} value={`${outstandingAmount.toLocaleString()} ${cur}`} />
                  <StatCard icon={CheckCircle2} label={t("commissionSettledLabel")} value={`${settledAmount.toLocaleString()} ${cur}`} />
                </div>
                {refundsAmount > 0 && (
                  <div className="mt-3 p-3 rounded-xl flex items-center justify-between" style={{ background: C.rustLight }}>
                    <span className="text-xs font-semibold" style={{ color: C.rust }}>{t("refundsTotalLabel")}</span>
                    <PriceTag amount={refundsAmount} />
                  </div>
                )}
                <p className="text-xs font-bold uppercase mt-5 mb-2" style={{ color: C.steel, letterSpacing: 0.5 }}>{t("recentTransactionsLabel")}</p>
                {mySales.length === 0 ? (
                  <p className="text-sm py-6 text-center" style={{ color: C.steel }}>{t("notPostedYet")}</p>
                ) : (
                  <div className="space-y-2">
                    {mySales.slice(0, 20).map((o) => (
                      <div key={o.id} className="p-3 rounded-xl border flex items-center justify-between" style={{ borderColor: C.line, background: "#fff" }}>
                        <div className="min-w-0">
                          <p dir="auto" className="text-sm font-semibold line-clamp-1" style={{ color: C.asphalt, unicodeBidi: "plaintext" }}>{o.listingTitle}</p>
                          <p className="text-xs mt-0.5" style={{ color: C.steel }}>{o.status === "completed" ? (o.commissionSettled ? t("settlementStatusSettled") : t("settlementStatusOwed")) : t("orderStatus" + o.status.charAt(0).toUpperCase() + o.status.slice(1))}</p>
                        </div>
                        <PriceTag amount={o.partPrice} currency={o.currency} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {tab === "inventory" && (
        <div className="px-4 pt-3">
          <div className="flex gap-1.5 overflow-x-auto pb-2">
            {statusTabs.map((s) => (
              <button key={s} onClick={() => setInvFilter(s)} className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 border" style={{ borderColor: invFilter === s ? C.amber : C.line, background: invFilter === s ? C.amberLight : "#fff", color: invFilter === s ? C.amberDark : C.asphalt }}>
                {t("inventoryStatus" + s.charAt(0).toUpperCase() + s.slice(1))}
              </button>
            ))}
          </div>
          {filteredInventory.length === 0 ? (
            <p className="text-sm py-10 text-center" style={{ color: C.steel }}>{t("notPostedYet")}</p>
          ) : (
            <div className="space-y-2 mt-1">
              {filteredInventory.map((l) => (
                <div key={l.id} className="p-3 rounded-xl border" style={{ borderColor: C.line, background: "#fff" }}>
                  <div className="flex items-center justify-between gap-2">
                    <p dir="auto" className="text-sm font-semibold line-clamp-1 flex-1" style={{ color: C.asphalt, unicodeBidi: "plaintext" }}>{l.title}</p>
                    <Badge tone={l.status === "sold" ? "rust" : l.status === "removed" ? "neutral" : l.status === "draft" ? "neutral" : "green"}>
                      {l.status === "draft" ? t("draftBadge") : t("status" + l.status.charAt(0).toUpperCase() + l.status.slice(1))}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <PriceTag amount={l.price} currency={l.currency} />
                    {l.stock === 0 && l.status === "active" && <Badge tone="rust">{t("outOfStockBadge")}</Badge>}
                    <span className="text-xs flex items-center gap-0.5" style={{ color: C.steel }}><Eye size={11} />{l.views || 0}</span>
                    <span className="text-xs flex items-center gap-0.5" style={{ color: C.steel }}><Star size={11} />{l.saves || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    <button onClick={() => onEditListing(l)} className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: C.sand, color: C.asphalt }}>{t("editListingBtn")}</button>
                    {l.status === "active" && !l.featured && <button onClick={() => onBoost(l.id)} className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: C.amberLight, color: C.amberDark }}>{t("boost")}</button>}
                    {l.status === "active" && <button onClick={() => onSetStatus(l.id, "draft")} className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: C.sand, color: C.asphalt }}>{t("markAsDraftBtn")}</button>}
                    {l.status === "draft" && <button onClick={() => onSetStatus(l.id, "active")} className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: C.greenLight, color: C.green }}>{t("republishBtn")}</button>}
                    {(l.status === "active" || l.status === "draft") && <button onClick={() => onRemove(l.id)} className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: C.rustLight, color: C.rust }}>{t("remove")}</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "matching" && (
        <div className="px-4 pt-3">
          {matchingRequests.length === 0 ? (
            <p className="text-sm py-10 text-center" style={{ color: C.steel }}>{t("noMatchingRequests")}</p>
          ) : (
            <div className="space-y-2">{matchingRequests.map((r) => <RequestCard key={r.id} request={r} onOpen={onOpenRequest} />)}</div>
          )}
        </div>
      )}
    </div>
  );
}

function AccountScreen({ session, myShop, listings, myRequests, myOrders, mySales, onLogout, onCreateShop, onOpenListing, onOpenRequest, onOpenOrder, onGoAdmin, onManageAds, onRemove, onBoost, onRequestVerification, onGoSellerCenter }) {
  const { t, lang, dir } = useLang();
  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;
  if (!session) return null;
  return (
    <div className="px-4 pt-4">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: C.amber, color: "#fff" }}>{session.name.charAt(0).toUpperCase()}</div>
        <div>
          <p className="font-bold text-base flex items-center gap-1" style={{ color: C.asphalt }}>{session.name}{session.verified && <BadgeCheck size={14} color={C.green} />}</p>
          <p className="text-xs" style={{ color: C.steel }}>{session.contact}</p>
        </div>
      </div>

      {["admin", "owner", "moderator"].includes(session.role) && (
        <button onClick={onGoAdmin} className="mt-4 w-full flex items-center justify-between p-3 rounded-xl" style={{ background: C.asphalt }}>
          <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#fff" }}><LayoutDashboard size={16} color={C.amber} /> {t("ownerDashboard")}</span>
          <NextIcon size={16} color="#fff" />
        </button>
      )}
      {["admin", "owner", "finance"].includes(session.role) && (
        <button onClick={onManageAds} className="mt-2.5 w-full flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: C.line, background: "#fff" }}>
          <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.asphalt }}><Flag size={16} color={C.amberDark} /> {t("manageAdsBtn")}</span>
          <NextIcon size={16} color={C.steel} />
        </button>
      )}

      {myShop ? (
        <div className="mt-4 p-3 rounded-xl border" style={{ borderColor: C.line, background: "#fff" }}>
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm flex items-center gap-1" style={{ color: C.asphalt }}><Store size={14} color={C.amberDark} /> {myShop.name} {myShop.verified && <BadgeCheck size={13} color={C.green} />}</p>
            <Badge tone="amber">{lang === "ar" ? FEES.tiers[myShop.tier].nameAr : FEES.tiers[myShop.tier].name}</Badge>
          </div>
          <p className="text-xs mt-1" style={{ color: C.steel }}>{label(findBusinessType(myShop.businessType), lang)} · {label(findCity(myShop.city), lang)} · {t("renewsIn", { days: Math.max(0, Math.round((myShop.subscriptionExpiry - Date.now()) / 86400000)) })}</p>
          {!myShop.verified && <p className="text-xs mt-2 flex items-center gap-1" style={{ color: C.rust }}><Clock size={11} /> {t("verificationPending")}</p>}
        </div>
      ) : null}

      {(myShop || listings.length > 0) && onGoSellerCenter && (
        <button onClick={onGoSellerCenter} className="mt-3 w-full flex items-center justify-between p-3 rounded-xl" style={{ background: `linear-gradient(135deg, ${C.asphalt}, ${C.asphalt2})` }}>
          <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#fff" }}><LayoutDashboard size={16} color={C.amber} /> {t("goToSellerCenter")}</span>
          <NextIcon size={16} color="#fff" />
        </button>
      )}

      {!myShop && (
        <>
          <button onClick={onCreateShop} className="mt-4 w-full flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: C.line, background: "#fff" }}>
            <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.asphalt }}><Building2 size={16} color={C.amberDark} /> {t("setupShop")}</span>
            <NextIcon size={16} color={C.steel} />
          </button>
          {!session.verified && (
            <button onClick={onRequestVerification} className="mt-2 w-full flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: C.line, background: "#fff" }}>
              <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.asphalt }}><BadgeCheck size={16} color={C.green} /> {t("requestVerification")}</span>
              <NextIcon size={16} color={C.steel} />
            </button>
          )}
        </>
      )}

      <p className="text-xs font-semibold mt-6 mb-2" style={{ color: C.steel, letterSpacing: 0.4 }}>{t("myListings")} ({listings.length})</p>
      {listings.length === 0 ? <p className="text-sm" style={{ color: C.steel }}>{t("notPostedYet")}</p> : (
        <div className="space-y-2">
          {listings.map((l) => (
            <div key={l.id} className="p-3 rounded-xl border flex items-center gap-3" style={{ borderColor: C.line, background: "#fff" }}>
              <button onClick={() => onOpenListing(l)} className="flex-1 text-left">
                <p dir="auto" className="text-sm font-semibold line-clamp-1" style={{ color: C.asphalt, unicodeBidi: "plaintext" }}>{l.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <PriceTag amount={l.price} currency={l.currency} />
                  <Badge tone={l.status === "sold" ? "rust" : l.status === "removed" ? "neutral" : "green"}>{t("status" + l.status.charAt(0).toUpperCase() + l.status.slice(1))}</Badge>
                  {l.featured && l.featuredUntil > Date.now() && <Badge tone="amber" icon={Star}>{t("boosted")}</Badge>}
                </div>
              </button>
              {l.status === "active" && (
                <div className="flex flex-col gap-1">
                  {!l.featured && <button onClick={() => onBoost(l.id)} className="text-xs font-semibold px-2 py-1 rounded" style={{ background: C.amberLight, color: C.amberDark }}>{t("boost")}</button>}
                  <button onClick={() => onRemove(l.id)} className="text-xs font-semibold px-2 py-1 rounded" style={{ background: C.rustLight, color: C.rust }}>{t("remove")}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs font-semibold mt-6 mb-2" style={{ color: C.steel, letterSpacing: 0.4 }}>{t("myOrdersLabel")} ({myOrders.length})</p>
      {myOrders.length === 0 ? <p className="text-sm" style={{ color: C.steel }}>{t("noOrdersYet")}</p> : (
        <div className="space-y-2">{myOrders.map((o) => <OrderCard key={o.id} order={o} session={session} onOpen={onOpenOrder} />)}</div>
      )}

      <p className="text-xs font-semibold mt-6 mb-2" style={{ color: C.steel, letterSpacing: 0.4 }}>{t("myRequestsLabel")} ({myRequests.length})</p>
      {myRequests.length === 0 ? <p className="text-sm" style={{ color: C.steel }}>{t("myRequestsEmpty")}</p> : (
        <div className="space-y-2">{myRequests.map((r) => <RequestCard key={r.id} request={r} onOpen={onOpenRequest} />)}</div>
      )}

      {mySales.length > 0 && (
        <>
          <p className="text-xs font-semibold mt-6 mb-2" style={{ color: C.steel, letterSpacing: 0.4 }}>{t("mySalesLabel")} ({mySales.length})</p>
          <div className="space-y-2">{mySales.map((o) => <OrderCard key={o.id} order={o} session={session} onOpen={onOpenOrder} />)}</div>
        </>
      )}

      <button onClick={onLogout} className="mt-8 flex items-center gap-2 text-sm font-semibold" style={{ color: C.rust }}><LogOut size={15} /> {t("signOut")}</button>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Login modal
--------------------------------------------------------------------- */
function CreateAdModal({ onClose, onSubmit, token }) {
  const { t } = useLang();
  const today = new Date().toISOString().slice(0, 10);
  const inTwoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const [form, setForm] = useState({ advertiserName: "", advertiserContact: "", headline: "", subtext: "", linkUrl: "", amountPaid: "", startsAt: today, endsAt: inTwoWeeks });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setError("");
    if (!form.advertiserName.trim() || !form.headline.trim()) return;
    setBusy(true);
    try {
      await adsApi.create(
        { ...form, amountPaid: form.amountPaid ? Number(form.amountPaid) : undefined,
          startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString() },
        token
      );
      onSubmit();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={t("createAdTitle")} onClose={onClose}>
      <Field label={t("advertiserName")}><input style={inputStyle} value={form.advertiserName} onChange={(e) => set("advertiserName", e.target.value)} /></Field>
      <Field label={t("advertiserContact")}><input style={inputStyle} value={form.advertiserContact} onChange={(e) => set("advertiserContact", e.target.value)} /></Field>
      <Field label={t("adHeadline")}><input style={inputStyle} value={form.headline} onChange={(e) => set("headline", e.target.value)} /></Field>
      <Field label={t("adSubtext")}><input style={inputStyle} value={form.subtext} onChange={(e) => set("subtext", e.target.value)} /></Field>
      <Field label={t("adLinkUrl")}><input style={inputStyle} value={form.linkUrl} onChange={(e) => set("linkUrl", e.target.value)} placeholder="https://" /></Field>
      <Field label={t("adAmountPaid")}><input style={inputStyle} type="number" value={form.amountPaid} onChange={(e) => set("amountPaid", e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("adStartsAt")}><input style={inputStyle} type="date" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} /></Field>
        <Field label={t("adEndsAt")}><input style={inputStyle} type="date" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} /></Field>
      </div>
      {error && <p className="text-xs mb-2" style={{ color: C.rust }}>{error}</p>}
      <PrimaryButton full disabled={busy} onClick={submit}>{busy ? "…" : t("createAdBtn")}</PrimaryButton>
    </Modal>
  );
}

function LoginModal({ onClose, onLogin }) {
  const { t } = useLang();
  const [mode, setMode] = useState("phone");
  const [step, setStep] = useState("details"); // 'details' | 'code'
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [ownerMode, setOwnerMode] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function sendCode() {
    setError("");
    if (!name.trim() || !contact.trim()) return;
    setBusy(true);
    try {
      await authApi.requestOtp(contact.trim());
      setStep("code");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function verifyAndLogin() {
    setError("");
    if (!code.trim()) return;
    setBusy(true);
    try {
      const { token, user } = await authApi.verifyOtp(name.trim(), contact.trim(), code.trim());
      onLogin({ ...user, token });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function ownerSubmit() {
    setError("");
    if (!name.trim() || !contact.trim() || !passcode.trim()) return;
    setBusy(true);
    try {
      const { token, user } = await authApi.ownerLogin(name.trim(), contact.trim(), passcode.trim());
      onLogin({ ...user, token });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={t("loginTitle")} onClose={onClose}>
      {step === "details" && (
        <>
          <div className="flex rounded-lg overflow-hidden border mb-4" style={{ borderColor: C.line }}>
            {["phone", "email"].map((m) => (
              <button key={m} onClick={() => setMode(m)} className="flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-1" style={{ background: mode === m ? C.amber : "#fff", color: mode === m ? "#fff" : C.asphalt }}>
                {m === "phone" ? <Phone size={13} /> : <Mail size={13} />} {m === "phone" ? t("phoneTab") : t("emailTab")}
              </button>
            ))}
          </div>
          <Field label={t("yourName")}><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Obie" /></Field>
          <Field label={mode === "phone" ? t("mobileNumber") : t("emailAddress")}><input style={inputStyle} value={contact} onChange={(e) => setContact(e.target.value)} placeholder={mode === "phone" ? "091-234-5678" : "you@example.com"} /></Field>
          <button onClick={() => { setOwnerMode(!ownerMode); setError(""); }} className="w-full text-xs font-bold mb-3 py-2 rounded-lg border flex items-center justify-center gap-1.5" style={{ color: C.amberDark, borderColor: C.line, background: C.sandLight }}>
            <ShieldCheck size={13} color={C.amberDark} /> {ownerMode ? t("backToNormal") : t("ownerLogin")}
          </button>
          {ownerMode && <Field label={t("ownerPasscode")}><input style={inputStyle} type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="••••••••" /></Field>}
          {error && <p className="text-xs mb-2" style={{ color: C.rust }}>{error}</p>}
          <PrimaryButton full disabled={busy} onClick={ownerMode ? ownerSubmit : sendCode}>
            {busy ? "…" : ownerMode ? t("enterDashboardBtn") : t("continueBtn")}
          </PrimaryButton>
        </>
      )}
      {step === "code" && (
        <>
          <p className="text-sm mb-3" style={{ color: C.steel }}>{t("otpSentTo", { contact })}</p>
          <Field label={t("verificationCode")}><input style={{ ...inputStyle, letterSpacing: 4, fontSize: 20, textAlign: "center" }} value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" maxLength={6} /></Field>
          {error && <p className="text-xs mb-2" style={{ color: C.rust }}>{error}</p>}
          <PrimaryButton full disabled={busy} onClick={verifyAndLogin}>{busy ? "…" : t("verifyBtn")}</PrimaryButton>
          <button onClick={() => { setStep("details"); setCode(""); setError(""); }} className="text-xs font-semibold mt-3 w-full text-center" style={{ color: C.steel }}>{t("backBtn")}</button>
        </>
      )}
    </Modal>
  );
}

/* ---------------------------------------------------------------------
   Post listing modal
--------------------------------------------------------------------- */
function AddCarModal({ onClose, onSave }) {
  const { t } = useLang();
  const [make, setMake] = useState(MAKES[0]);
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const valid = model.trim() && year;
  return (
    <Modal title={t("addCarModalTitle")} onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("makeField")}><select style={inputStyle} value={make} onChange={(e) => setMake(e.target.value)}>{MAKES.map((m) => <option key={m}>{m}</option>)}</select></Field>
        <Field label={t("modelField")}><input style={inputStyle} value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. Sport" /></Field>
      </div>
      <Field label={t("yearFrom")}><input type="number" style={inputStyle} value={year} onChange={(e) => setYear(e.target.value)} placeholder="2018" /></Field>
      <PrimaryButton full disabled={!valid} onClick={() => onSave({ make, model: model.trim(), year: Number(year) })}>{t("saveCarBtn")}</PrimaryButton>
    </Modal>
  );
}

function PostChoiceModal({ onClose, onSell, onRequest }) {
  const { t } = useLang();
  return (
    <Modal title={t("postChoiceTitle")} onClose={onClose}>
      <button onClick={onSell} className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 mb-3 text-left transition-transform active:scale-[0.98]" style={{ borderColor: C.amber, background: C.amberLight }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.amber }}><Package size={20} color="#fff" /></div>
        <div>
          <p className="text-sm font-bold" style={{ color: C.asphalt }}>{t("postChoiceSell")}</p>
          <p className="text-xs mt-0.5" style={{ color: C.steel }}>{t("postChoiceSellDesc")}</p>
        </div>
      </button>
      <button onClick={onRequest} className="w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-transform active:scale-[0.98]" style={{ borderColor: C.line, background: "#fff" }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.sand }}><MessageCircle size={20} color={C.asphalt} /></div>
        <div>
          <p className="text-sm font-bold" style={{ color: C.asphalt }}>{t("postChoiceRequest")}</p>
          <p className="text-xs mt-0.5" style={{ color: C.steel }}>{t("postChoiceRequestDesc")}</p>
        </div>
      </button>
    </Modal>
  );
}

function PostListingModal({ onClose, onSubmit, isShop }) {
  const { t, lang } = useLang();
  const [form, setForm] = useState({ title: "", category: CATEGORIES[0].id, make: MAKES[0], model: "", yearFrom: 2015, yearTo: 2020, engineTrim: "", price: "", stock: 1, condition: CONDITIONS[0].id, authenticity: "aftermarket", partNumber: "", city: CITIES[0].id, description: "", protectedDeal: true, deliveryAvailable: false });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.title.trim() && form.model.trim() && form.price;

  return (
    <Modal title={isShop ? t("postTitleShop") : t("postTitleIndividual")} onClose={onClose} wide>
      <Field label={t("titleField")}><input style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Range Rover Sport LED Headlight" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("categoryField")}><select style={inputStyle} value={form.category} onChange={(e) => set("category", e.target.value)}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{label(c, lang)}</option>)}</select></Field>
        <Field label={t("conditionField")}><select style={inputStyle} value={form.condition} onChange={(e) => set("condition", e.target.value)}>{CONDITIONS.map((c) => <option key={c.id} value={c.id}>{label(c, lang)}</option>)}</select></Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("makeField")}><select style={inputStyle} value={form.make} onChange={(e) => set("make", e.target.value)}>{MAKES.map((m) => <option key={m}>{m}</option>)}</select></Field>
        <Field label={t("modelField")}><input style={inputStyle} value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="e.g. Sport" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("yearFrom")}><input type="number" style={inputStyle} value={form.yearFrom} onChange={(e) => set("yearFrom", +e.target.value)} /></Field>
        <Field label={t("yearTo")}><input type="number" style={inputStyle} value={form.yearTo} onChange={(e) => set("yearTo", +e.target.value)} /></Field>
      </div>
      <Field label={t("engineTrimField")}><input style={inputStyle} value={form.engineTrim} onChange={(e) => set("engineTrim", e.target.value)} placeholder={t("engineTrimPlaceholder")} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("authenticityField")}><select style={inputStyle} value={form.authenticity} onChange={(e) => set("authenticity", e.target.value)}>{AUTHENTICITY.map((a) => <option key={a.id} value={a.id}>{label(a, lang)}</option>)}</select></Field>
        <Field label={t("partNumberField")}><input style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }} value={form.partNumber} onChange={(e) => set("partNumber", e.target.value)} placeholder={t("partNumberPlaceholder")} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Field label={t("priceField")}><input type="number" style={inputStyle} value={form.price} onChange={(e) => set("price", +e.target.value)} placeholder="0" /></Field>
        <Field label={t("stockField")}><input type="number" min="1" style={inputStyle} value={form.stock} onChange={(e) => set("stock", +e.target.value)} /></Field>
        <Field label={t("cityField")}><select style={inputStyle} value={form.city} onChange={(e) => set("city", e.target.value)}>{CITIES.map((c) => <option key={c.id} value={c.id}>{label(c, lang)}</option>)}</select></Field>
      </div>
      <Field label={t("descriptionField")}><textarea dir="auto" style={{ ...inputStyle, minHeight: 80 }} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder={t("descriptionPlaceholder")} /></Field>
      <label className="flex items-center gap-2 mb-2.5 text-sm" style={{ color: C.asphalt }}>
        <input type="checkbox" checked={form.protectedDeal} onChange={(e) => set("protectedDeal", e.target.checked)} /> {t("protectedCheckbox")}
      </label>
      <label className="flex items-center gap-2 mb-4 text-sm" style={{ color: C.asphalt }}>
        <input type="checkbox" checked={form.deliveryAvailable} onChange={(e) => set("deliveryAvailable", e.target.checked)} /> {t("deliveryOnlyFilter")}
      </label>
      <div className="grid grid-cols-3 gap-2 mb-2">{[1, 2, 3].map((i) => <div key={i} className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center" style={{ borderColor: C.line }}><Camera size={18} color={C.steelLight} /></div>)}</div>
      <p className="text-[11px] mb-4" style={{ color: C.steel }}>{t("photoUploadNote")}</p>
      <PrimaryButton full disabled={!valid} onClick={() => onSubmit({ ...form, price: Number(form.price), stock: Number(form.stock) })}>{t("publishBtn")}</PrimaryButton>
    </Modal>
  );
}

/* ---------------------------------------------------------------------
   Edit listing modal
--------------------------------------------------------------------- */
function EditListingModal({ listing, onClose, onSubmit }) {
  const { t, lang } = useLang();
  const [form, setForm] = useState({
    title: listing.title, category: listing.category, make: listing.make, model: listing.model,
    yearFrom: listing.yearFrom, yearTo: listing.yearTo, engineTrim: listing.engineTrim || "",
    price: listing.price, stock: listing.stock ?? 1, condition: listing.condition,
    authenticity: listing.authenticity || "aftermarket", partNumber: listing.partNumber || "",
    city: listing.city, description: listing.description, protectedDeal: !!listing.protectedDeal,
    deliveryAvailable: !!listing.deliveryAvailable,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.title.trim() && form.model.trim() && form.price;

  return (
    <Modal title={t("editListingModalTitle")} onClose={onClose} wide>
      <Field label={t("titleField")}><input style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("categoryField")}><select style={inputStyle} value={form.category} onChange={(e) => set("category", e.target.value)}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{label(c, lang)}</option>)}</select></Field>
        <Field label={t("conditionField")}><select style={inputStyle} value={form.condition} onChange={(e) => set("condition", e.target.value)}>{CONDITIONS.map((c) => <option key={c.id} value={c.id}>{label(c, lang)}</option>)}</select></Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("makeField")}><select style={inputStyle} value={form.make} onChange={(e) => set("make", e.target.value)}>{MAKES.map((m) => <option key={m}>{m}</option>)}</select></Field>
        <Field label={t("modelField")}><input style={inputStyle} value={form.model} onChange={(e) => set("model", e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("yearFrom")}><input type="number" style={inputStyle} value={form.yearFrom} onChange={(e) => set("yearFrom", +e.target.value)} /></Field>
        <Field label={t("yearTo")}><input type="number" style={inputStyle} value={form.yearTo} onChange={(e) => set("yearTo", +e.target.value)} /></Field>
      </div>
      <Field label={t("engineTrimField")}><input style={inputStyle} value={form.engineTrim} onChange={(e) => set("engineTrim", e.target.value)} placeholder={t("engineTrimPlaceholder")} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("authenticityField")}><select style={inputStyle} value={form.authenticity} onChange={(e) => set("authenticity", e.target.value)}>{AUTHENTICITY.map((a) => <option key={a.id} value={a.id}>{label(a, lang)}</option>)}</select></Field>
        <Field label={t("partNumberField")}><input style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }} value={form.partNumber} onChange={(e) => set("partNumber", e.target.value)} placeholder={t("partNumberPlaceholder")} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Field label={t("priceField")}><input type="number" style={inputStyle} value={form.price} onChange={(e) => set("price", +e.target.value)} /></Field>
        <Field label={t("stockField")}><input type="number" min="0" style={inputStyle} value={form.stock} onChange={(e) => set("stock", +e.target.value)} /></Field>
        <Field label={t("cityField")}><select style={inputStyle} value={form.city} onChange={(e) => set("city", e.target.value)}>{CITIES.map((c) => <option key={c.id} value={c.id}>{label(c, lang)}</option>)}</select></Field>
      </div>
      <Field label={t("descriptionField")}><textarea dir="auto" style={{ ...inputStyle, minHeight: 80 }} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
      <label className="flex items-center gap-2 mb-2.5 text-sm" style={{ color: C.asphalt }}>
        <input type="checkbox" checked={form.protectedDeal} onChange={(e) => set("protectedDeal", e.target.checked)} /> {t("protectedCheckbox")}
      </label>
      <label className="flex items-center gap-2 mb-4 text-sm" style={{ color: C.asphalt }}>
        <input type="checkbox" checked={form.deliveryAvailable} onChange={(e) => set("deliveryAvailable", e.target.checked)} /> {t("deliveryOnlyFilter")}
      </label>
      <PrimaryButton full disabled={!valid} onClick={() => onSubmit({ ...form, price: Number(form.price), stock: Number(form.stock) })}>{t("updateListingBtn")}</PrimaryButton>
    </Modal>
  );
}

/* ---------------------------------------------------------------------
   Create shop modal
--------------------------------------------------------------------- */
/* ---------------------------------------------------------------------
   Edit shop modal — profile-only edits, never touches subscription/tier
--------------------------------------------------------------------- */
function EditShopModal({ shop, onClose, onSubmit }) {
  const { t, lang } = useLang();
  const [form, setForm] = useState({
    name: shop.name, city: shop.city, description: shop.description || "",
    whatsapp: shop.whatsapp || "", address: shop.address || "",
    openingHours: shop.openingHours || "", deliveryAvailable: !!shop.deliveryAvailable,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name.trim();

  return (
    <Modal title={t("editShopBtn")} onClose={onClose} wide>
      <Field label={t("shopNameField")}><input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("cityField")}><select style={inputStyle} value={form.city} onChange={(e) => set("city", e.target.value)}>{CITIES.map((c) => <option key={c.id} value={c.id}>{label(c, lang)}</option>)}</select></Field>
        <Field label={t("whatsappField")}><input style={inputStyle} value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></Field>
      </div>
      <Field label={t("addressField")}><input style={inputStyle} value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
      <Field label={t("openingHoursField")}><input style={inputStyle} value={form.openingHours} onChange={(e) => set("openingHours", e.target.value)} placeholder={t("openingHoursPlaceholder")} /></Field>
      <Field label={t("descriptionField")}><textarea dir="auto" style={{ ...inputStyle, minHeight: 70 }} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
      <label className="flex items-center gap-2 mb-4 text-sm" style={{ color: C.asphalt }}>
        <input type="checkbox" checked={form.deliveryAvailable} onChange={(e) => set("deliveryAvailable", e.target.checked)} /> {t("deliveryOnlyFilter")}
      </label>
      <PrimaryButton full disabled={!valid} onClick={() => onSubmit(form)}>{t("updateListingBtn")}</PrimaryButton>
    </Modal>
  );
}

function CreateShopModal({ onClose, onSubmit }) {
  const { t, lang } = useLang();
  const [form, setForm] = useState({ name: "", city: CITIES[0].id, description: "", tier: "basic", businessType: "shop", whatsapp: "", address: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name.trim();

  return (
    <Modal title={t("shopModalTitle")} onClose={onClose} wide>
      <Field label={t("businessTypeField")}>
        <div className="grid grid-cols-3 gap-2">
          {BUSINESS_TYPES.map((b) => (
            <button key={b.id} type="button" onClick={() => set("businessType", b.id)} className="py-2 px-1 rounded-lg border text-xs font-semibold" style={{ borderColor: form.businessType === b.id ? C.amber : C.line, background: form.businessType === b.id ? C.amberLight : "#fff", color: form.businessType === b.id ? C.amberDark : C.asphalt }}>
              {label(b, lang)}
            </button>
          ))}
        </div>
      </Field>
      <Field label={t("shopNameField")}><input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Al-Wahda Auto Parts" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("cityField")}><select style={inputStyle} value={form.city} onChange={(e) => set("city", e.target.value)}>{CITIES.map((c) => <option key={c.id} value={c.id}>{label(c, lang)}</option>)}</select></Field>
        <Field label={t("whatsappField")}><input style={inputStyle} value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="091-234-5678" /></Field>
      </div>
      <Field label={t("addressField")}><input style={inputStyle} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="e.g. Souq Al-Jumaa Auto Market" /></Field>
      <Field label={t("descriptionField")}><textarea dir="auto" style={{ ...inputStyle, minHeight: 70 }} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder={t("shopDescPlaceholder")} /></Field>
      <p className="text-xs font-semibold mb-2" style={{ color: C.steel, letterSpacing: 0.3 }}>{t("choosePlan")}</p>
      <div className="space-y-2 mb-4">
        {Object.entries(FEES.tiers).map(([key, tier]) => (
          <button key={key} onClick={() => set("tier", key)} className="w-full text-left p-3 rounded-xl border-2" style={{ borderColor: form.tier === key ? C.amber : C.line, background: form.tier === key ? C.amberLight : "#fff" }}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm" style={{ color: C.asphalt }}>{lang === "ar" ? tier.nameAr : tier.name}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: C.asphalt }}>{tier.price} <span style={{ fontSize: 10, color: C.steel }}>{lang === "ar" ? "د.ل/شهريًا" : "LYD/mo"}</span></span>
            </div>
            <ul className="mt-1 space-y-0.5">{(lang === "ar" ? tier.perksAr : tier.perksEn).map((p) => <li key={p} className="text-xs flex items-start gap-1" style={{ color: C.steel }}><CheckCircle2 size={11} color={C.green} className="mt-0.5 flex-shrink-0" />{p}</li>)}</ul>
          </button>
        ))}
      </div>
      <PrimaryButton full disabled={!valid} onClick={() => onSubmit(form)}>{t("activatePlanBtn")}</PrimaryButton>
    </Modal>
  );
}

/* ---------------------------------------------------------------------
   Boost modal
--------------------------------------------------------------------- */
function BoostModal({ onClose, onBoost }) {
  const { t } = useLang();
  return (
    <Modal title={t("boostModalTitle")} onClose={onClose}>
      <div className="flex items-center gap-2 mb-3"><Rocket size={20} color={C.amberDark} /><p className="text-sm" style={{ color: C.asphalt }}>{t("boostDesc", { days: FEES.boostDays })}</p></div>
      <div className="p-3 rounded-xl mb-4" style={{ background: C.amberLight }}><div className="flex items-center justify-between"><span className="text-sm font-semibold" style={{ color: C.asphalt }}>{t("boostFee")}</span><PriceTag amount={FEES.boostPrice} /></div></div>
      <PrimaryButton full icon={Rocket} onClick={onBoost}>{t("payAndBoost")}</PrimaryButton>
      <button onClick={onClose} className="w-full text-center text-xs font-semibold mt-3" style={{ color: C.steel }}>{t("notNow")}</button>
    </Modal>
  );
}

/* ---------------------------------------------------------------------
   ADMIN / OWNER DASHBOARD
--------------------------------------------------------------------- */
function AdminScreen({ listings, revenue, pendingListings, adminShops, adminSettlements, adminRefunds, adminBankTransfers, onModerate, onVerify, onRemove, onExit, onMarkCommissionSettled, onUpdateRefundStatus, onVerifyBankConfirmation }) {
  const { t, lang } = useLang();
  const [tab, setTab] = useState("overview");
  const activeListings = listings.filter((l) => l.status === "active");
  const pendingShops = adminShops.filter((s) => s.status !== "approved");
  const totalRevenue = revenue.subscriptions + revenue.boosts + revenue.protection + (revenue.commission || 0);

  const trend = useMemo(() => {
    const months = lang === "ar" ? ["مار", "أبر", "ماي", "يون", "يول", "أغس"] : ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
    const finalVal = Math.max(totalRevenue, 400);
    return months.map((m, i) => ({ month: m, revenue: Math.round(finalVal * (0.35 + i * 0.13) * (0.85 + Math.random() * 0.3)) }));
  }, [totalRevenue, lang]);

  const revenueBars = [
    { name: t("src_subscriptions"), value: revenue.subscriptions, color: C.amber },
    { name: t("src_boosts"), value: revenue.boosts, color: C.rust },
    { name: t("src_protection"), value: revenue.protection, color: C.green },
    { name: t("src_commission"), value: revenue.commission || 0, color: C.asphalt3 },
  ];

  return (
    <div style={{ background: C.sandLight, minHeight: "100vh" }}>
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between" style={{ background: C.asphalt }}>
        <div className="flex items-center gap-2"><LayoutDashboard size={18} color={C.amber} /><span className="font-bold" style={{ fontFamily: display(lang), color: "#fff", fontSize: 18 }}>{t("ownerDashTitle")}</span></div>
        <button onClick={onExit} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: C.asphalt3, color: "#fff" }}>{t("exit")}</button>
      </div>
      <div className="flex overflow-x-auto px-4 pt-3 gap-1 border-b" style={{ borderColor: C.line }}>
        {[{ id: "overview", label: t("tabOverview") }, { id: "moderation", label: t("tabModeration"), badge: pendingListings.length }, { id: "revenue", label: t("tabRevenue") }, { id: "listings", label: t("tabListings") }, { id: "shops", label: t("tabShops"), badge: pendingShops.length }, { id: "settlements", label: t("settlementsTab"), badge: adminSettlements.length }, { id: "refunds", label: t("refundsAdminTab"), badge: adminRefunds.length }, { id: "bankTransfers", label: t("bankTransfersAdminTab"), badge: adminBankTransfers.length }].map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)} className="px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-t-lg flex items-center gap-1.5" style={{ color: tab === tb.id ? C.amberDark : C.steel, borderBottom: tab === tb.id ? `2px solid ${C.amber}` : "2px solid transparent" }}>
            {tb.label}
            {!!tb.badge && <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5" style={{ background: C.rust, color: "#fff" }}>{tb.badge}</span>}
          </button>
        ))}
      </div>
      <div className="p-4 max-w-3xl mx-auto">
        {tab === "moderation" && (
          pendingListings.length === 0 ? (
            <p className="text-sm py-10 text-center" style={{ color: C.steel }}>{t("noPendingItems")}</p>
          ) : (
            <div className="space-y-2">
              {pendingListings.map((l) => (
                <div key={l.id} className="p-3 rounded-xl border" style={{ background: "#fff", borderColor: C.line }}>
                  <p dir="auto" className="text-sm font-semibold" style={{ color: C.asphalt, unicodeBidi: "plaintext" }}>{l.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.steel }}>{l.sellerName || l.sellerContact} · {label(findCity(l.city), lang)} · <PriceTag amount={l.price} /></p>
                  {l.description && <p dir="auto" className="text-xs mt-1.5" style={{ color: C.steel, unicodeBidi: "plaintext" }}>{l.description}</p>}
                  <div className="flex gap-1.5 mt-2.5">
                    <button onClick={() => onModerate(l.id, "approved")} className="text-xs font-semibold px-2.5 py-1.5 rounded-full" style={{ background: C.greenLight, color: C.green }}>{t("approveListingBtn")}</button>
                    <button onClick={() => onModerate(l.id, "rejected")} className="text-xs font-semibold px-2.5 py-1.5 rounded-full" style={{ background: C.rustLight, color: C.rust }}>{t("rejectListingBtn")}</button>
                    <button onClick={() => onModerate(l.id, "flagged")} className="text-xs font-semibold px-2.5 py-1.5 rounded-full" style={{ background: C.amberLight, color: C.amberDark }}>{t("flagListingBtn")}</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        {tab === "overview" && (
          <>
            {/* Known gap, flagged rather than hidden: these stat cards and
                the trend line below are still not wired to real numbers
                (GET /admin/overview and /admin/money exist and are ready
                for this — it just wasn't done in this pass, to keep focus
                on the tabs that move real money and real approvals). */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Package} label={t("statActiveListings")} value={activeListings.length} />
              <StatCard icon={Store} label={t("statShops")} value={adminShops.length} sub={t("statPending", { n: pendingShops.length })} />
              <StatCard icon={Users} label={t("statUsers")} value={new Set(listings.map((l) => l.sellerId)).size + adminShops.length} />
              <StatCard icon={DollarSign} label={t("statRevenue")} value={`${totalRevenue.toLocaleString()} ${lang === "ar" ? "د.ل" : "LYD"}`} highlight />
            </div>
            <div className="mt-4 p-4 rounded-xl border" style={{ background: "#fff", borderColor: C.line }}>
              <p className="text-xs font-semibold mb-3" style={{ color: C.steel, letterSpacing: 0.3 }}>{t("revenueTrend")}</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trend}>
                  <CartesianGrid stroke={C.line} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.steel }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.steel }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }} />
                  <Line type="monotone" dataKey="revenue" stroke={C.amber} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {pendingShops.length > 0 && (
              <div className="mt-4 p-4 rounded-xl border" style={{ background: "#fff", borderColor: C.line }}>
                <p className="text-xs font-semibold mb-3 flex items-center gap-1" style={{ color: C.rust }}><AlertTriangle size={13} /> {t("awaitingVer")}</p>
                {pendingShops.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-t first:border-0" style={{ borderColor: C.line }}>
                    <div><p className="text-sm font-semibold" style={{ color: C.asphalt }}>{s.name}</p><p className="text-xs" style={{ color: C.steel }}>{label(findCity(s.city), lang)} · {lang === "ar" ? FEES.tiers[s.tier].nameAr : FEES.tiers[s.tier].name}</p></div>
                    <button onClick={() => onVerify(s.id)} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: C.greenLight, color: C.green }}>{t("verify")}</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {tab === "revenue" && (
          <>
            <div className="p-4 rounded-xl border mb-4" style={{ background: "#fff", borderColor: C.line }}>
              <p className="text-xs font-semibold mb-3" style={{ color: C.steel, letterSpacing: 0.3 }}>{t("revenueBySource")}</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={revenueBars} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: C.steel }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: C.asphalt }} axisLine={false} tickLine={false} width={130} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} fill={C.amber} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {revenueBars.map((b) => (
                <div key={b.name} className="flex items-center justify-between p-3 rounded-xl border" style={{ background: "#fff", borderColor: C.line }}>
                  <span className="text-sm font-semibold flex items-center gap-2" style={{ color: C.asphalt }}><span className="w-2.5 h-2.5 rounded-full" style={{ background: b.color }} />{b.name}</span>
                  <PriceTag amount={b.value} />
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 rounded-xl" style={{ background: C.asphalt }}>
              <p className="text-xs font-semibold mb-1" style={{ color: C.steelLight }}>{t("feeStructure")}</p>
              <ul className="text-xs space-y-1 mt-2" style={{ color: "#fff" }}>
                <li>• {t("feeBullet1", { fee: FEES.boostPrice, days: FEES.boostDays })}</li>
                <li>• {t("feeBullet2", { min: FEES.tiers.basic.price, max: FEES.tiers.elite.price })}</li>
                <li>• {t("feeBullet3", { pct: Math.round(FEES.protectionPct * 100) })}</li>
              </ul>
            </div>
          </>
        )}
        {tab === "listings" && (
          <div className="space-y-2">
            {listings.map((l) => (
              <div key={l.id} className="p-3 rounded-xl border flex items-center justify-between" style={{ background: "#fff", borderColor: C.line }}>
                <div className="min-w-0">
                  <p dir="auto" className="text-sm font-semibold truncate" style={{ color: C.asphalt, unicodeBidi: "plaintext" }}>{l.title}</p>
                  <p className="text-xs flex items-center gap-2 mt-0.5" style={{ color: C.steel }}><span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{l.id}</span> · {label(findCity(l.city), lang)} · <Badge tone={l.status === "active" ? "green" : l.status === "sold" ? "rust" : "neutral"}>{t("status" + l.status.charAt(0).toUpperCase() + l.status.slice(1))}</Badge></p>
                </div>
                {l.status === "active" && <button onClick={() => onRemove(l.id)} className="p-2 rounded-lg flex-shrink-0" style={{ background: C.rustLight }}><Trash2 size={14} color={C.rust} /></button>}
              </div>
            ))}
          </div>
        )}
        {tab === "shops" && (
          adminShops.length === 0 ? (
            <p className="text-sm py-10 text-center" style={{ color: C.steel }}>{t("noPendingItems")}</p>
          ) : (
            <div className="space-y-2">
              {adminShops.map((s) => (
                <div key={s.id} className="p-3 rounded-xl border" style={{ background: "#fff", borderColor: C.line }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold flex items-center gap-1" style={{ color: C.asphalt }}>{s.name} {s.verified && <BadgeCheck size={13} color={C.green} />}</p>
                    <Badge tone="amber">{lang === "ar" ? FEES.tiers[s.tier].nameAr : FEES.tiers[s.tier].name}</Badge>
                  </div>
                  <p className="text-xs mt-1" style={{ color: C.steel }}>{s.ownerName} · {label(findCity(s.city), lang)} · {s.listingCount} {t("listingsCount")} · <Badge tone={s.status === "approved" ? "green" : "amber"}>{s.status}</Badge></p>
                  {s.status !== "approved" && <button onClick={() => onVerify(s.id)} className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: C.greenLight, color: C.green }}>{t("verifyShop")}</button>}
                </div>
              ))}
            </div>
          )
        )}

        {tab === "settlements" && (
          adminSettlements.length === 0 ? (
            <p className="text-sm py-10 text-center" style={{ color: C.steel }}>{t("noPendingItems")}</p>
          ) : (
            <div className="space-y-2">
              {adminSettlements.map((se) => (
                <div key={se.id} className="p-3 rounded-xl border flex items-center justify-between" style={{ background: "#fff", borderColor: C.line }}>
                  <div className="min-w-0">
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.steel }}>{se.order_id}</span>
                    <p className="text-xs mt-0.5" style={{ color: C.steel }}><Badge tone={se.status === "paid" ? "green" : "amber"}>{se.status}</Badge></p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PriceTag amount={Number(se.commission_amount)} />
                    {se.status !== "paid" && <button onClick={() => onMarkCommissionSettled(se.id)} className="text-xs font-semibold px-2.5 py-1.5 rounded-full" style={{ background: C.greenLight, color: C.green }}>{t("markSettledBtn")}</button>}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "refunds" && (
          adminRefunds.length === 0 ? (
            <p className="text-sm py-10 text-center" style={{ color: C.steel }}>{t("noPendingItems")}</p>
          ) : (
            <div className="space-y-2">
              {adminRefunds.map((r) => (
                <div key={r.id} className="p-3 rounded-xl border" style={{ background: "#fff", borderColor: C.line }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.steel }}>{r.order_id}</span>
                    <Badge tone="amber">{t("refundStatus" + r.status.charAt(0).toUpperCase() + r.status.slice(1))}</Badge>
                  </div>
                  <p dir="auto" className="text-xs mt-1" style={{ color: C.steel, unicodeBidi: "plaintext" }}>{r.reason}</p>
                  <div className="flex items-center justify-between mt-2">
                    <PriceTag amount={Number(r.amount)} />
                    <div className="flex gap-1.5">
                      {r.status === "requested" && <button onClick={() => onUpdateRefundStatus(r.id, "approve")} className="text-xs font-semibold px-2.5 py-1.5 rounded-full" style={{ background: C.greenLight, color: C.green }}>{t("approveRefundBtn")}</button>}
                      {r.status === "approved" && <button onClick={() => onUpdateRefundStatus(r.id, "process")} className="text-xs font-semibold px-2.5 py-1.5 rounded-full" style={{ background: C.amberLight, color: C.amberDark }}>{t("processRefundBtn")}</button>}
                      {r.status === "processing" && <button onClick={() => onUpdateRefundStatus(r.id, "complete")} className="text-xs font-semibold px-2.5 py-1.5 rounded-full" style={{ background: C.greenLight, color: C.green }}>{t("completeRefundBtn")}</button>}
                      {["requested", "approved"].includes(r.status) && <button onClick={() => onUpdateRefundStatus(r.id, "reject")} className="text-xs font-semibold px-2.5 py-1.5 rounded-full" style={{ background: C.rustLight, color: C.rust }}>{t("rejectRefundBtn")}</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "bankTransfers" && (
          adminBankTransfers.length === 0 ? (
            <p className="text-sm py-10 text-center" style={{ color: C.steel }}>{t("noPendingItems")}</p>
          ) : (
            <div className="space-y-2">
              {adminBankTransfers.map((bc) => (
                <div key={bc.id} className="p-3 rounded-xl border" style={{ background: "#fff", borderColor: C.line }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.steel }}>{bc.order_id}</span>
                  <p dir="auto" className="text-xs mt-1.5 p-2 rounded-lg" style={{ background: C.sand, color: C.asphalt, unicodeBidi: "plaintext", fontFamily: "'IBM Plex Mono', monospace" }}>{bc.reference_text}</p>
                  <div className="flex gap-1.5 mt-2">
                    <button onClick={() => onVerifyBankConfirmation(bc.id, "verified")} className="text-xs font-semibold px-2.5 py-1.5 rounded-full" style={{ background: C.greenLight, color: C.green }}>{t("verifyBankTransferBtn")}</button>
                    <button onClick={() => onVerifyBankConfirmation(bc.id, "rejected")} className="text-xs font-semibold px-2.5 py-1.5 rounded-full" style={{ background: C.rustLight, color: C.rust }}>{t("rejectBankTransferBtn")}</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
function StatCard({ icon: Icon, label, value, sub, highlight }) {
  return (
    <div className="p-3.5 rounded-xl border" style={{ background: highlight ? C.asphalt : "#fff", borderColor: C.line }}>
      <Icon size={16} color={highlight ? C.amber : C.amberDark} />
      <p className="text-xl font-bold mt-2" style={{ fontFamily: "'IBM Plex Sans Condensed', sans-serif", color: highlight ? "#fff" : C.asphalt }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: highlight ? C.steelLight : C.steel }}>{label}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: C.rust }}>{sub}</p>}
    </div>
  );
}

import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import * as cartService from '../services/cartService';
import * as wishlistService from '../services/wishlistService';

const translations = {
  EN: {
    deliver_to: "Deliver to",
    search_placeholder: "Search products, brands, categories...",
    shopping_cart: "Shopping Cart",
    cartCount: "Shopping Cart ({count})",
    subtotal: "Subtotal",
    shipping: "Shipping",
    free: "Free",
    duties_tax: "Duties & Tax",
    included: "Included",
    total_price: "Total Price",
    proceed_to_checkout: "Proceed to Checkout",
    continue_shopping: "Continue Shopping",
    free_shipping_disclaimer: "Free shipping included on all orders.",
    my_wishlist: "My Wishlist",
    wishlist_empty: "Your wishlist is empty",
    wishlist_empty_desc: "Save products you like to buy them later.",
    start_shopping: "Start Shopping",
    view_details: "View Details",
    cart_empty: "Your cart is empty",
    cart_empty_desc: "Discover products waiting to become yours.",
    qty: "QTY",
    item_total: "Item Total",
    remove_item: "Remove Item",
    order_summary: "Order Summary",
    save_percent: "Save {percent}%",
    add_to_cart: "Add to Cart",
    added_to_cart: "Added to Cart",
    remove_from_cart: "Remove from Cart",
    add_to_wishlist: "Add to Wishlist",
    remove_from_wishlist: "Remove from Wishlist",
    quick_view: "Quick View",
    for_recipient: "For {recipient}",
    free_delivery: "Free Delivery",
    secure_checkout: "Secure Checkout",
    secure_payment: "Secure Payment",
    boutique_return: "Boutique Return",
    delivery_desc: "Premium studio handling",
    payment_desc: "Fully encrypted gateways",
    return_desc: "7-day select exchange",
    product_specifications: "Product Specifications",
    collection: "Collection",
    boutique: "Boutique",
    net_weight: "Net Weight",
    dimensions: "Dimensions",
    best_for: "Best For",
    occasion: "Occasion",
    availability: "Availability",
    in_stock: "In Stock",
    out_of_stock: "Out of Stock",
    recommended_for_you: "Recommended for you",
    you_may_also_like: "YOU MAY ALSO LIKE",
    make_an_offer: "Make an Offer",
    buy_now: "Buy Now",
    offer_accepted: "Offer Accepted!",
    offer_accepted_desc: "Your offer of {price} is ready for checkout.",
    checkout_bargain_price: "Checkout Bargain Price",
    make_reasonable_offer: "Make a Reasonable Offer",
    retail_price: "Retail price",
    min_acceptable: "Min Acceptable (50%)",
    adjust_your_offer: "Adjust Your Offer",
    or_type_custom_amount: "Or type custom amount ({symbol})",
    enter_offer_price: "Enter offer price",
    dynamic_savings: "Dynamic Savings",
    save: "Save",
    cancel: "Cancel",
    submit_proposal: "Submit Proposal",
    submitting: "Submitting...",
    offer_sent: "Offer Sent to Merchant!",
    done: "Done",
    all: "All",
    sale: "Sale",
    wow_deals: "Wow Deals",
    flea_market: "Flea Market",
    whats_new: "What's new",
    best_sellers: "Best Sellers",
    electronics: "Electronics",
    fashion: "Fashion",
    home_living: "Home & Living",
    books: "Books",
    beauty: "Beauty",
    sports_fitness: "Sports & Fitness",
    explore_products: "Explore Products",
    back: "Back",
    home_menu: "Home",
    menu: "Menu",
    categories: "Categories",
    explore_store: "Explore Store",
    featured_deals: "Featured Deals",
    explore_all_products: "Explore All Products",
    account: "Account",
    admin_dashboard: "Admin Dashboard",
    returns_orders: "Returns & Orders",
    wishlist: "Wishlist",
    shipping_country: "Shipping Country",
    interface_language: "Interface Language",
    hello_sign_in: "Hello, Sign In",
    account_lists: "Account & Lists",
    welcome: "Welcome",
    my_profile: "My Profile",
    logout: "Logout",
    updates: "Updates",
    mark_all_read: "Mark all read",
    view_all_notifications: "View All Notifications",
    all_caught_up: "All caught up!",
    no_updates: "No new updates right now.",
    new_notif: "new",
    trending: "Trending",
    departments: "Departments",
    gender: "Gender",
    recipient_filter: "Recipient",
    color_family: "Color Family",
    size_bracket: "Size Bracket",
    price_budget: "Price Budget",
    min_rating: "Minimum Rating",
    min_discount: "Minimum Discount",
    all_genders: "All Genders",
    men: "Men",
    women: "Women",
    all_recipients: "All Recipients",
    for_him: "For Him",
    for_her: "For Her",
    couples_both: "Couples & Both",
    for_kids_teens: "For Kids & Teens",
    for_friends_coworkers: "For Friends & Coworkers",
    self_care: "Self-Care & Treat Yourself",
    all_occasions: "All Occasions",
    birthdays: "Birthdays",
    anniversaries: "Anniversaries",
    housewarming: "Housewarming",
    graduation: "Graduation",
    weddings_bridal: "Weddings & Bridal",
    festivals_holidays: "Festivals & Holidays",
    corporate_milestones: "Corporate & Milestones",
    all_colors: "All Colors",
    color_black: "Dark / Black",
    color_white: "Light / White",
    color_brown: "Tones / Brown",
    color_green: "Sage / Green",
    color_blue: "Navy / Blue",
    all_sizes: "All Sizes",
    size_standard: "Standard / One-Size",
    size_small: "Small / Travel",
    size_medium: "Medium",
    size_large: "Large / Luxury",
    any_price: "Any Price",
    under_price: "Under {price}",
    price_range: "{min} - {max}",
    over_price: "Over {price}",
    show_all_listings: "Show All Listings",
    all_reviews: "All Reviews",
    stars_and_up: "{rating}+ Stars",
    stars_only: "{rating} Stars Only",
    all_items_no_min: "All Items (No Min)",
    off_or_more: "{percent}% Off or More",
    discover_premium_selection: "Discover our premium selection across standard departments. From cutting-edge electronics to high fashion, we have got you covered.",
    all_brands: "All Brands",
    active_filters: "Active Filters",
    reset_filters: "Reset Filters",
    filter_by: "Filter by",
    sort_by: "Sort by",
    featured: "Featured",
    price_low_high: "Price: Low to High",
    price_high_low: "Price: High to Low",
    gomo_smart_assistant: "GoMo Smart Assistant",
    smart_assistant_desc: "Find your ideal matching products through personalized suggestions.",
    question_step: "Question {current} of {total}",
    which_department: "Which department are you shopping in?",
    electronics_tech: "Electronics & Tech",
    fashion_apparel: "Fashion & Apparel",
    home_kitchen: "Home & Kitchen",
    books_stationery: "Books & Stationery",
    beauty_grooming: "Beauty & Grooming",
    primary_preference: "What is your primary preference?",
    premium_quality_design: "Premium Quality & Design",
    utility_high_value: "Utility & High Value",
    new_arrivals_trending: "New Arrivals & Trending",
    top_rated_best_sellers: "Top Rated & Best Sellers",
    budget_tier: "What is your budget tier?",
    budget_value: "Value (Under {price})",
    budget_mid: "Mid-range ({min} - {max})",
    budget_premium: "Premium ({price} +)",
    recommended_for_you_finder: "Recommended for You",
    based_on_preferences: "Based on your preferences, we suggest these exceptional products.",
    no_products_finder: "No products matching current selection.",
    footer_brand_desc: "Curating the best deals, products, and tech. We believe that shopping should be smart, seamless, and delightful.",
    collections_title: "Collections",
    support_title: "Support",
    newsletter_title: "Newsletter",
    newsletter_desc: "Join our list for exclusive updates and best deal notifications.",
    shipping_policy: "Shipping Policy",
    return_refunds: "Return & Refunds",
    privacy_policy: "Privacy Policy",
    faqs: "FAQs",
    email_address: "Email Address",
    all_rights_reserved: "ALL RIGHTS RESERVED.",
    terms_of_service: "Terms of Service",
    cookies: "Cookies",
    selection: "Selection",
    review: "Review",
    reviews: "Reviews",
    highly_rated_product: "Highly Rated Product",
    sign_in: "Sign In",
    sign_in_desc: "Enter your credentials to access your private collection.",
    email_required: "Email is required",
    email_invalid: "Please enter a valid email",
    password_required: "Password is required",
    password_length_error: "Password must be at least 8 characters",
    password_complexity_error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
    security_alert: "Security Alert",
    access_restricted: "Account Access Restricted",
    auth_failed: "Authentication Failed",
    login_failed_desc: "Login failed. Please check your credentials.",
    password: "Password",
    forgot_password: "Forgot?",
    signing_in: "Signing In...",
    back_to_home: "← Back to Home",
    no_account: "Don't have an account?",
    already_have_account: "Already have an account?",
    create_one: "Create One",
    join_title: "Join GoMo Deals",
    join_desc: "Experience premium quality products and dynamic deals.",
    full_name: "Full Name",
    full_name_required: "Full Name is required",
    phone_number: "Phone Number",
    phone_required: "Phone number is required",
    phone_invalid: "Phone number must be 10 digits",
    date_of_birth: "Date of Birth",
    profile_picture: "Profile Picture",
    confirm_password: "Confirm Password",
    passwords_dont_match: "Passwords do not match",
    create_account: "Create Account",
    sending_code: "Sending Code...",
    failed_send_verification: "Failed to send verification code. Please try again.",
    verify_email_title: "Verify Your Email",
    verification_code_sent: "We've sent a 6-digit verification code to",
    enter_full_code: "Please enter the full 6-digit code",
    verify_email_btn: "Verify Email",
    verifying: "Verifying...",
    resend_code_in: "Resend Code in {timer}s",
    resend_code: "Resend Code",
    failed_resend: "Failed to resend code"
  },
  HI: {
    deliver_to: "वितरण स्थान",
    search_placeholder: "उत्पाद, ब्रांड, श्रेणियां खोजें...",
    shopping_cart: "शॉपिंग कार्ट",
    cartCount: "शॉपिंग कार्ट ({count})",
    subtotal: "उप-योग",
    shipping: "शिपिंग",
    free: "मुफ़्त",
    duties_tax: "शुल्क और कर",
    included: "शामिल",
    total_price: "कुल मूल्य",
    proceed_to_checkout: "चेकआउट पर जाएं",
    continue_shopping: "खरीदारी जारी रखें",
    free_shipping_disclaimer: "सभी ऑर्डर पर मुफ़्त शिपिंग शामिल है।",
    my_wishlist: "मेरी विशलिस्ट",
    wishlist_empty: "आपकी विशलिस्ट खाली है",
    wishlist_empty_desc: "बाद में खरीदने के लिए अपने पसंदीदा उत्पादों को सहेजें।",
    start_shopping: "खरीदारी शुरू करें",
    view_details: "विवरण देखें",
    cart_empty: "आपकी कार्ट खाली है",
    cart_empty_desc: "उन उत्पादों की खोज करें जो आपके होने की प्रतीक्षा कर रहे हैं।",
    qty: "मात्रा",
    item_total: "आइटम कुल",
    remove_item: "आइटम निकालें",
    order_summary: "ऑर्डर सारांश",
    save_percent: "{percent}% बचाएं",
    add_to_cart: "कार्ट में जोड़ें",
    added_to_cart: "कार्ट में जोड़ा गया",
    remove_from_cart: "कार्ट से निकालें",
    add_to_wishlist: "विशलिस्ट में जोड़ें",
    remove_from_wishlist: "विशलिस्ट से हटाएं",
    quick_view: "त्वरित दृश्य",
    for_recipient: "{recipient} के लिए",
    free_delivery: "मुफ़्त डिलीवरी",
    secure_checkout: "सुरक्षित चेकआउट",
    secure_payment: "सुरक्षित भुगतान",
    boutique_return: "बुटीक वापसी",
    delivery_desc: "प्रीमियम स्टूडियो हैंडलिंग",
    payment_desc: "पूरी तरह से एन्क्रिप्टेड गेटवे",
    return_desc: "7-दिवसीय विनिमय",
    product_specifications: "उत्पाद विनिर्देश",
    collection: "संग्रह",
    boutique: "बुटीक",
    net_weight: "शुद्ध वजन",
    dimensions: "आयाम",
    best_for: "सर्वश्रेष्ठ",
    occasion: "अवसर",
    availability: "उपलब्धता",
    in_stock: "स्टॉक में है",
    out_of_stock: "स्टॉक में नहीं है",
    recommended_for_you: "आपके लिए अनुशंसित",
    you_may_also_like: "आपको यह भी पसंद आ सकता है",
    make_an_offer: "एक प्रस्ताव दें",
    buy_now: "अभी खरीदें",
    offer_accepted: "प्रस्ताव स्वीकार कर लिया गया!",
    offer_accepted_desc: "आपका {price} का प्रस्ताव चेकआउट के लिए तैयार है।",
    checkout_bargain_price: "सौदे की कीमत पर चेकआउट करें",
    make_reasonable_offer: "एक उचित प्रस्ताव दें",
    retail_price: "खुदra मूल्य",
    min_acceptable: "न्यूनतम स्वीकार्य (50%)",
    adjust_your_offer: "अपना प्रस्ताव समायोजित करें",
    or_type_custom_amount: "या कस्टम राशि टाइप करें ({symbol})",
    enter_offer_price: "प्रस्ताव मूल्य दर्ज करें",
    dynamic_savings: "गतिशील बचत",
    save: "सहेजें",
    cancel: "रद्द करें",
    submit_proposal: "प्रस्ताव जमा करें",
    submitting: "जमा किया जा रहा है...",
    offer_sent: "व्यापारी को प्रस्ताव भेजा गया!",
    done: "पूर्ण",
    all: "सभी",
    sale: "सेल",
    wow_deals: "शानदार डील्स",
    flea_market: "कबाड़ी बाजार",
    whats_new: "नया क्या है",
    best_sellers: "बेस्ट सेलर्स",
    electronics: "इलेक्ट्रॉनिक्स",
    fashion: "फैशन",
    home_living: "घर और रहन-सहन",
    books: "पुस्तकें",
    beauty: "सौंदर्य",
    sports_fitness: "खेल और फिटनेस",
    explore_products: "उत्पाद खोजें",
    back: "पीछे",
    home_menu: "होम",
    menu: "मेनू",
    categories: "श्रेणियां",
    explore_store: "स्टोर का अन्वेषण करें",
    featured_deals: "विशेष रुप से प्रदर्शित सौदे",
    explore_all_products: "सभी उत्पाद खोजें",
    account: "खाता",
    admin_dashboard: "एडमिन डैशबोर्ड",
    returns_orders: "रिटर्न और ऑर्डर",
    wishlist: "विशलिस्ट",
    shipping_country: "शिपिंग देश",
    interface_language: "इंटरफ़ेस भाषा",
    hello_sign_in: "नमस्ते, साइन इन करें",
    account_lists: "खाता और सूचियाँ",
    welcome: "स्वागत हे",
    my_profile: "मेरी प्रोफाइल",
    logout: "लॉगआउट",
    updates: "अपडेट",
    mark_all_read: "सभी पढ़े हुए चिह्नित करें",
    view_all_notifications: "सभी सूचनाएं देखें",
    all_caught_up: "सब कुछ पढ़ लिया गया है!",
    no_updates: "अभी कोई नया अपडेट नहीं है।",
    new_notif: "नया",
    trending: "प्रचलन में",
    departments: "विभागों",
    gender: "लिंग",
    recipient_filter: "प्राप्तकर्ता",
    color_family: "रंग",
    size_bracket: "आकार",
    price_budget: "बजट",
    min_rating: "न्यूनतम रेटिंग",
    min_discount: "न्यूनतम छूट",
    all_genders: "सभी लिंग",
    men: "पुरुष",
    women: "महिला",
    all_recipients: "सभी प्राप्तकर्ता",
    for_him: "उनके लिए (पुरुष)",
    for_her: "उनके लिए (महिला)",
    couples_both: "जोड़े और दोनों",
    for_kids_teens: "बच्चों और किशोरों के लिए",
    for_friends_coworkers: "दोस्तों और सहकर्मियों के लिए",
    self_care: "स्वयं की देखभाल",
    all_occasions: "सभी अवसर",
    birthdays: "जन्मदिन",
    anniversaries: "वर्षगांठ",
    housewarming: "गृहप्रवेश",
    graduation: "समारोह",
    weddings_bridal: "शादी और दुल्हन",
    festivals_holidays: "त्यौहार और छुट्टियाँ",
    corporate_milestones: "कॉर्पोरेट और मील के पत्थर",
    all_colors: "सभी रंग",
    color_black: "डार्क / काला",
    color_white: "लाइट / सफेद",
    color_brown: "ब्राउन / टोन",
    color_green: "हरा / सेज",
    color_blue: "नेवी / नीला",
    all_sizes: "सभी आकार",
    size_standard: "मानक / एक-आकार",
    size_small: "छोटा / यात्रा",
    size_medium: "मध्यम",
    size_large: "बड़ा / लक्जरी",
    any_price: "कोई भी कीमत",
    under_price: "{price} से कम",
    price_range: "{min} - {max}",
    over_price: "{price} से अधिक",
    show_all_listings: "सभी लिस्टिंग दिखाएं",
    all_reviews: "सभी समीक्षाएं",
    stars_and_up: "{rating}+ स्टार",
    stars_only: "{rating} स्टार केवल",
    all_items_no_min: "सभी आइटम (कोई न्यूनतम नहीं)",
    off_or_more: "{percent}% या अधिक छूट",
    discover_premium_selection: "मानक विभागों में हमारे प्रीमियम चयन की खोज करें। अत्याधुनिक इलेक्ट्रॉनिक्स से लेकर उच्च फैशन तक, हमारे पास सब कुछ है।",
    all_brands: "सभी ब्रांड",
    active_filters: "सक्रिय फ़िल्टर",
    reset_filters: "फ़िल्टर रीसेट करें",
    filter_by: "फ़िल्टर करें",
    sort_by: "क्रमबद्ध करें",
    featured: "विशेष रुप से प्रदर्शित",
    price_low_high: "कीमत: कम से अधिक",
    price_high_low: "कीमत: अधिक से कम",
    gomo_smart_assistant: "गोमो स्मार्ट सहायक",
    smart_assistant_desc: "व्यक्तिगत सुझावों के माध्यम से अपने आदर्श मिलान वाले उत्पाद खोजें।",
    question_step: "प्रश्न {current} का {total}",
    which_department: "आप किस विभाग में खरीदारी कर रहे हैं?",
    electronics_tech: "इलेक्ट्रॉनिक्स और टेक",
    fashion_apparel: "फैशन और परिधान",
    home_kitchen: "घर और रसोई",
    books_stationery: "पुस्तकें और स्टेशनरी",
    beauty_grooming: "सौंदर्य और ग्रूमिंग",
    primary_preference: "आपकी प्राथमिक प्राथमिकता क्या है?",
    premium_quality_design: "प्रीमियम गुणवत्ता और डिज़ाइन",
    utility_high_value: "उपयोगिता और उच्च मूल्य",
    new_arrivals_trending: "नए आगमन और ट्रेंडिंग",
    top_rated_best_sellers: "टॉप रेटेड और बेस्ट सेलर्स",
    budget_tier: "आपका बजट स्तर क्या है?",
    budget_value: "मूल्य ({price} से कम)",
    budget_mid: "मध्यम श्रेणी ({min} - {max})",
    budget_premium: "प्रीमियम ({price} +)",
    recommended_for_you_finder: "आपके लिए अनुशंसित",
    based_on_preferences: "आपकी प्राथमिकताओं के आधार पर, हम इन असाधारण उत्पादों का सुझाव देते हैं।",
    no_products_finder: "वर्तमान चयन से मेल खाने वाले कोई उत्पाद नहीं हैं।",
    footer_brand_desc: "सर्वश्रेष्ठ सौदों, उत्पादों और तकनीक की क्युरेटिंग। हमारा मानना है कि खरीदारी स्मार्ट, सहज और आनंददायक होनी चाहिए।",
    collections_title: "संग्रह",
    support_title: "सहायता",
    newsletter_title: "न्यूज़लेटर",
    newsletter_desc: "विशेष अपडेट और सर्वोत्तम सौदों की सूचनाओं के लिए हमारी सूची में शामिल हों।",
    shipping_policy: "शिपिंग नीति",
    return_refunds: "वापसी और धनवापसी",
    privacy_policy: "गोपनीयता नीति",
    faqs: "अक्सर पूछे जाने वाले प्रश्न",
    email_address: "ईमेल पता",
    all_rights_reserved: "सर्वाधिकार सुरक्षित।",
    terms_of_service: "सेवा की शर्तें",
    cookies: "कुकीज़",
    selection: "चयन",
    review: "समीक्षा",
    reviews: "समीक्षाएं",
    highly_rated_product: "अत्यधिक प्रशंसित उत्पाद",
    sign_in: "साइन इन करें",
    sign_in_desc: "अपने निजी संग्रह तक पहुँचने के लिए अपने क्रेडेंशियल दर्ज करें।",
    email_required: "ईमेल आवश्यक है",
    email_invalid: "कृपया एक मान्य ईमेल दर्ज करें",
    password_required: "पासवर्ड आवश्यक है",
    password_length_error: "पासवर्ड कम से कम 8 वर्णों का होना चाहिए",
    password_complexity_error: "पासवर्ड कम से कम 8 वर्ण लंबा होना चाहिए और इसमें कम से कम एक बड़ा अक्षर, एक छोटा अक्षर, एक संख्या और एक विशेष वर्ण (@$!%*?&) होना चाहिए",
    security_alert: "सुरक्षा चेतावनी",
    access_restricted: "खाता पहुंच प्रतिबंधित",
    auth_failed: "प्रमाणीकरण विफल",
    login_failed_desc: "लॉगिन विफल। कृपया अपने क्रेडेंशियल्स की जांच करें।",
    password: "पासवर्ड",
    forgot_password: "भूल गए?",
    signing_in: "साइन इन किया जा रहा है...",
    back_to_home: "← होम पर वापस जाएं",
    no_account: "क्या आपके पास खाता नहीं है?",
    already_have_account: "पहले से ही एक खाता है?",
    create_one: "एक बनाएं",
    join_title: "GoMo Deals से जुड़ें",
    join_desc: "प्रीमियम गुणवत्ता वाले उत्पादों और गतिशील सौदों का अनुभव करें।",
    full_name: "पूरा नाम",
    full_name_required: "पूरा नाम आवश्यक है",
    phone_number: "फ़ोन नंबर",
    phone_required: "फ़ोन नंबर आवश्यक है",
    phone_invalid: "फ़ोन नंबर 10 अंकों का होना चाहिए",
    date_of_birth: "जन्म तिथि",
    profile_picture: "प्रोफ़ाइल चित्र",
    confirm_password: "पासवर्ड की पुष्टि करें",
    passwords_dont_match: "पासवर्ड मेल नहीं खाते",
    create_account: "खाता बनाएं",
    sending_code: "कोड भेजा जा रहा है...",
    failed_send_verification: "सत्यापन कोड भेजने में विफल। कृपया पुन: प्रयास करें।",
    verify_email_title: "अपना ईमेल सत्यापित करें",
    verification_code_sent: "हमने 6-अंकीय सत्यापन कोड भेजा है",
    enter_full_code: "कृपया पूरा 6-अंकीय कोड दर्ज करें",
    verify_email_btn: "ईमेल सत्यापित करें",
    verifying: "सत्यापित किया जा रहा है...",
    resend_code_in: "{timer}s में कोड पुनः भेजें",
    resend_code: "कोड पुनः भेजें",
    failed_resend: "कोड पुनः भेजने में विफल"
  },
  ES: {
    deliver_to: "Entregar a",
    search_placeholder: "Buscar productos, marcas, categorías...",
    shopping_cart: "Carrito de Compras",
    cartCount: "Carrito ({count})",
    subtotal: "Subtotal",
    shipping: "Envío",
    free: "Gratis",
    duties_tax: "Impuestos y Aranceles",
    included: "Incluido",
    total_price: "Precio Total",
    proceed_to_checkout: "Proceder al Pago",
    continue_shopping: "Continuar Comprando",
    free_shipping_disclaimer: "Envío gratuito incluido en todos los pedidos.",
    my_wishlist: "Mi Lista de Deseos",
    wishlist_empty: "Tu lista de deseos está vacía",
    wishlist_empty_desc: "Guarda los productos que te gustan para comprarlos más tarde.",
    start_shopping: "Comenzar a Comprar",
    view_details: "Ver Detalles",
    cart_empty: "Tu carrito está vacío",
    cart_empty_desc: "Descubre productos esperando ser tuyos.",
    qty: "Cant",
    item_total: "Total del Artículo",
    remove_item: "Eliminar Artículo",
    order_summary: "Resumen del Pedido",
    save_percent: "Ahorra {percent}%",
    add_to_cart: "Añadir al Carrito",
    added_to_cart: "Añadido",
    remove_from_cart: "Quitar del Carrito",
    add_to_wishlist: "Añadir a Lista de Deseos",
    remove_from_wishlist: "Quitar de Lista de Deseos",
    quick_view: "Vista Rápida",
    for_recipient: "Para {recipient}",
    free_delivery: "Envío Gratis",
    secure_checkout: "Pago Seguro",
    secure_payment: "Pago Seguro",
    boutique_return: "Devolución Boutique",
    delivery_desc: "Manejo de estudio premium",
    payment_desc: "Pasarelas totalmente cifradas",
    return_desc: "Cambio selecto de 7 días",
    product_specifications: "Especificaciones del Producto",
    collection: "Colección",
    boutique: "Boutique",
    net_weight: "Peso Neto",
    dimensions: "Dimensiones",
    best_for: "Ideal Para",
    occasion: "Ocasión",
    availability: "Disponibilidad",
    in_stock: "En Stock",
    out_of_stock: "Agotado",
    recommended_for_you: "Recomendado para ti",
    you_may_also_like: "TAMBIÉN TE PUEDE GUSTAR",
    make_an_offer: "Hacer una Oferta",
    buy_now: "Comprar Ahora",
    offer_accepted: "¡Oferta Aceptada!",
    offer_accepted_desc: "Tu oferta de {price} está lista para el pago.",
    checkout_bargain_price: "Pagar Precio de Oferta",
    make_reasonable_offer: "Hacer una Oferta Razonable",
    retail_price: "Precio minorista",
    min_acceptable: "Mínimo aceptable (50%)",
    adjust_your_offer: "Ajusta tu Oferta",
    or_type_custom_amount: "O escribe un monto personalizado ({symbol})",
    enter_offer_price: "Introduce el precio de oferta",
    dynamic_savings: "Ahorro Dinámico",
    save: "Guardar",
    cancel: "Cancelar",
    submit_proposal: "Enviar Propuesta",
    submitting: "Enviando...",
    offer_sent: "¡Oferta Envíada al Vendedor!",
    done: "Hecho",
    all: "Todo",
    sale: "Rebajas",
    wow_deals: "Ofertas Wow",
    flea_market: "Mercadillo",
    whats_new: "Novedades",
    best_sellers: "Más Vendidos",
    electronics: "Electrónica",
    fashion: "Moda",
    home_living: "Hogar y Decoración",
    books: "Libros",
    beauty: "Belleza",
    sports_fitness: "Deportes",
    explore_products: "Explorar Productos",
    back: "Atrás",
    home_menu: "Inicio",
    menu: "Menú",
    categories: "Categorías",
    explore_store: "Explorar Tienda",
    featured_deals: "Ofertas Destacadas",
    explore_all_products: "Ver Todos los Productos",
    account: "Cuenta",
    admin_dashboard: "Tablero de Admin",
    returns_orders: "Devoluciones y Pedidos",
    wishlist: "Lista de Deseos",
    shipping_country: "País de Envío",
    interface_language: "Idioma del Sitio",
    hello_sign_in: "Hola, Inicia Sesión",
    account_lists: "Cuenta y Listas",
    welcome: "Bienvenido",
    my_profile: "Mi Perfil",
    logout: "Cerrar Sesión",
    updates: "Notificaciones",
    mark_all_read: "Marcar todo como leído",
    view_all_notifications: "Ver Todas las Notificaciones",
    all_caught_up: "¡Todo al día!",
    no_updates: "No hay nuevas notificaciones.",
    new_notif: "nuevo",
    trending: "Tendencias",
    departments: "Departamentos",
    gender: "Género",
    recipient_filter: "Destinatario",
    color_family: "Color",
    size_bracket: "Talla",
    price_budget: "Presupuesto",
    min_rating: "Calificación Mínima",
    min_discount: "Descuento Mínimo",
    all_genders: "Todos los Géneros",
    men: "Hombres",
    women: "Mujeres",
    all_recipients: "Todos los Destinatarios",
    for_him: "Para Él",
    for_her: "Para Ella",
    couples_both: "Parejas y Ambos",
    for_kids_teens: "Para Niños y Adolescentes",
    for_friends_coworkers: "Para Amigos y Compañeros",
    self_care: "Cuidado Personal",
    all_occasions: "Todas las Ocasiones",
    birthdays: "Cumpleaños",
    anniversaries: "Aniversarios",
    housewarming: "Inauguración de Casa",
    graduation: "Graduación",
    weddings_bridal: "Bodas y Novias",
    festivals_holidays: "Festivales y Fiestas",
    corporate_milestones: "Corporativo y Logros",
    all_colors: "Todos los Colores",
    color_black: "Oscuro / Negro",
    color_white: "Claro / Blanco",
    color_brown: "Marrón / Tonos",
    color_green: "Verde / Sage",
    color_blue: "Azul / Marino",
    all_sizes: "Todas las Tallas",
    size_standard: "Estándar / Única",
    size_small: "Pequeña / Viaje",
    size_medium: "Mediana",
    size_large: "Grande / Lujo",
    any_price: "Cualquier Precio",
    under_price: "Menos de {price}",
    price_range: "{min} - {max}",
    over_price: "Más de {price}",
    show_all_listings: "Ver Todos los Productos",
    all_reviews: "Todas las Opiniones",
    stars_and_up: "{rating}+ Estrellas",
    stars_only: "{rating} Estrellas Solamente",
    all_items_no_min: "Todo (Sin Mínimo)",
    off_or_more: "{percent}% de Descuento o Más",
    discover_premium_selection: "Descubra nuestra selección premium en todos los departamentos. Desde electrónica de vanguardia hasta alta moda, lo tenemos cubierto.",
    all_brands: "Todas las Marcas",
    active_filters: "Filtros Activos",
    reset_filters: "Restablecer Filtros",
    filter_by: "Filtrar por",
    sort_by: "Ordenar por",
    featured: "Destacados",
    price_low_high: "Precio: de Menor a Mayor",
    price_high_low: "Precio: de Mayor a Menor",
    gomo_smart_assistant: "Asistente Inteligente GoMo",
    smart_assistant_desc: "Encuentre sus productos ideales a través de sugerencias personalizadas.",
    question_step: "Pregunta {current} de {total}",
    which_department: "¿En qué departamento está comprando?",
    electronics_tech: "Electrónica y Tecnología",
    fashion_apparel: "Moda y Ropa",
    home_kitchen: "Hogar y Cocina",
    books_stationery: "Libros y Papelería",
    beauty_grooming: "Belleza y Cuidado",
    primary_preference: "¿Cuál es su preferencia principal?",
    premium_quality_design: "Calidad y Diseño Premium",
    utility_high_value: "Utilidad y Alto Valor",
    new_arrivals_trending: "Novedades y Tendencias",
    top_rated_best_sellers: "Más Valorados y Vendidos",
    budget_tier: "¿Cuál es su rango de presupuesto?",
    budget_value: "Económico (Menos de {price})",
    budget_mid: "Gama Media ({min} - {max})",
    budget_premium: "Premium ({price} +)",
    recommended_for_you_finder: "Recomendado para Usted",
    based_on_preferences: "Según sus preferencias, le sugerimos estos productos excepcionales.",
    no_products_finder: "No hay productos que coincidan con la selección actual.",
    footer_brand_desc: "Curaduría de las mejores ofertas, productos y tecnología. Creemos que comprar debe ser inteligente, fluido y encantador.",
    collections_title: "Colecciones",
    support_title: "Soporte",
    newsletter_title: "Boletín Informativo",
    newsletter_desc: "Únete a nuestra lista para recibir actualizaciones exclusivas y notificaciones de las mejores ofertas.",
    shipping_policy: "Política de Envío",
    return_refunds: "Devoluciones y Reembolsos",
    privacy_policy: "Política de Privacidad",
    faqs: "Preguntas Frecuentes",
    email_address: "Dirección de Correo",
    all_rights_reserved: "TODOS LOS DERECHOS RESERVADOS.",
    terms_of_service: "Términos de Servicio",
    cookies: "Cookies",
    selection: "Selección",
    review: "Opinión",
    reviews: "Opiniones",
    highly_rated_product: "Producto Altamente Calificado",
    sign_in: "Iniciar Sesión",
    sign_in_desc: "Introduce tus credenciales para acceder a tu colección privada.",
    email_required: "El correo es obligatorio",
    email_invalid: "Por favor, introduce un correo válido",
    password_required: "La contraseña es obligatoria",
    password_length_error: "La contraseña debe tener al menos 8 caracteres",
    password_complexity_error: "La contraseña debe tener al menos 8 caracteres e incluir al menos una letra mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)",
    security_alert: "Alerta de Seguridad",
    access_restricted: "Acceso a la Cuenta Restringido",
    auth_failed: "Autenticación Fallida",
    login_failed_desc: "Fallo en el inicio de sesión. Por favor, comprueba tus credenciales.",
    password: "Contraseña",
    forgot_password: "¿Olvidaste?",
    signing_in: "Iniciando Sesión...",
    back_to_home: "← Volver al Inicio",
    no_account: "¿No tienes una cuenta?",
    already_have_account: "¿Ya tienes una cuenta?",
    create_one: "Crear Una",
    join_title: "Únete a GoMo Deals",
    join_desc: "Experimenta productos de calidad premium y ofertas dinámicas.",
    full_name: "Nombre Completo",
    full_name_required: "El nombre completo es obligatorio",
    phone_number: "Número de Teléfono",
    phone_required: "El número de teléfono es obligatorio",
    phone_invalid: "El número de teléfono debe tener 10 dígitos",
    date_of_birth: "Fecha de Nacimiento",
    profile_picture: "Foto de Perfil",
    confirm_password: "Confirmar Contraseña",
    passwords_dont_match: "Las contraseñas no coinciden",
    create_account: "Crear Cuenta",
    sending_code: "Enviando Código...",
    failed_send_verification: "No se pudo enviar el código de verificación. Por favor, inténtalo de nuevo.",
    verify_email_title: "Verifica tu Correo",
    verification_code_sent: "Hemos enviado un código de verificación de 6 dígitos a",
    enter_full_code: "Por favor, introduce el código completo de 6 dígitos",
    verify_email_btn: "Verificar Correo",
    verifying: "Verificando...",
    resend_code_in: "Reenviar código en {timer}s",
    resend_code: "Reenviar Código",
    failed_resend: "No se pudo reenviar el código"
  },
  FR: {
    deliver_to: "Livrer à",
    search_placeholder: "Rechercher des produits, marques, catégories...",
    shopping_cart: "Panier",
    cartCount: "Panier ({count})",
    subtotal: "Sous-total",
    shipping: "Livraison",
    free: "Gratuite",
    duties_tax: "Droits & Taxes",
    included: "Inclus",
    total_price: "Prix Total",
    proceed_to_checkout: "Passer à la Caisse",
    continue_shopping: "Continuer mes Achats",
    free_shipping_disclaimer: "Livraison gratuite incluse sur toutes les commandes.",
    my_wishlist: "Ma Liste d'Envies",
    wishlist_empty: "Votre liste d'envies est vide",
    wishlist_empty_desc: "Enregistrez les produits que vous aimez pour les acheter plus tard.",
    start_shopping: "Commencer les Achats",
    view_details: "Voir les Détails",
    cart_empty: "Votre panier est vide",
    cart_empty_desc: "Découvrez des produits qui n'attendent que vous.",
    qty: "Qté",
    item_total: "Total de l'Article",
    remove_item: "Supprimer l'Article",
    order_summary: "Résumé de la Commande",
    save_percent: "Économisez {percent}%",
    add_to_cart: "Ajouter au Panier",
    added_to_cart: "Ajouté",
    remove_from_cart: "Retirer du Panier",
    add_to_wishlist: "Ajouter aux Envies",
    remove_from_wishlist: "Retirer des Envies",
    quick_view: "Aperçu Rapide",
    for_recipient: "Pour {recipient}",
    free_delivery: "Livraison Gratuite",
    secure_checkout: "Paiement Sécurisé",
    secure_payment: "Paiement Sécurisé",
    boutique_return: "Retour Boutique",
    delivery_desc: "Traitement studio premium",
    payment_desc: "Passerelles entièrement cryptées",
    return_desc: "Échange sélectif de 7 jours",
    product_specifications: "Spécifications du Produit",
    collection: "Collection",
    boutique: "Boutique",
    net_weight: "Poids Net",
    dimensions: "Dimensions",
    best_for: "Idéal Pour",
    occasion: "Occasion",
    availability: "Disponibilité",
    in_stock: "En Stock",
    out_of_stock: "Rupture de Stock",
    recommended_for_you: "Recommandé pour vous",
    you_may_also_like: "VOUS POUVEZ AUSSI AIMER",
    make_an_offer: "Faire une Offre",
    buy_now: "Acheter Maintenant",
    offer_accepted: "Offre Acceptée !",
    offer_accepted_desc: "Votre offre de {price} est prête pour la caisse.",
    checkout_bargain_price: "Payer le Prix Négocié",
    make_reasonable_offer: "Faire une Offre Raisonnable",
    retail_price: "Prix de détail",
    min_acceptable: "Minimum acceptable (50%)",
    adjust_your_offer: "Ajuster Votre Offre",
    or_type_custom_amount: "Ou saisir un montant personnalisé ({symbol})",
    enter_offer_price: "Entrer le prix proposé",
    dynamic_savings: "Économies Dynamiques",
    save: "Enregistrer",
    cancel: "Annuler",
    submit_proposal: "Soumettre la Proposition",
    submitting: "Soumission...",
    offer_sent: "Offre Envoyée au Marchand !",
    done: "Terminé",
    all: "Tout",
    sale: "Soldes",
    wow_deals: "Super Offres",
    flea_market: "Brocante",
    whats_new: "Nouveautés",
    best_sellers: "Meilleures Ventes",
    electronics: "Électronique",
    fashion: "Mode",
    home_living: "Maison & Déco",
    books: "Livres",
    beauty: "Beauté",
    sports_fitness: "Sports & Loisirs",
    explore_products: "Explorer les Produits",
    back: "Retour",
    home_menu: "Accueil",
    menu: "Menu",
    categories: "Catégories",
    explore_store: "Explorer la Boutique",
    featured_deals: "Offres Vedettes",
    explore_all_products: "Voir Tous les Produits",
    account: "Compte",
    admin_dashboard: "Tableau de Bord Admin",
    returns_orders: "Retours & Commandes",
    wishlist: "Liste d'Envies",
    shipping_country: "Pays de Livraison",
    interface_language: "Langue du Site",
    hello_sign_in: "Bonjour, Identifiez-vous",
    account_lists: "Compte et Listes",
    welcome: "Bienvenue",
    my_profile: "Mon Profil",
    logout: "Se Déconnecter",
    updates: "Notifications",
    mark_all_read: "Tout marquer comme lu",
    view_all_notifications: "Voir Toutes les Notifications",
    all_caught_up: "Vous êtes à jour !",
    no_updates: "Aucune nouvelle notification.",
    new_notif: "nouveau",
    trending: "Tendances",
    departments: "Départements",
    gender: "Genre",
    recipient_filter: "Destinataire",
    color_family: "Couleur",
    size_bracket: "Taille",
    price_budget: "Budget",
    min_rating: "Note Minimale",
    min_discount: "Remise Minimale",
    all_genders: "Tous les Genres",
    men: "Hommes",
    women: "Femmes",
    all_recipients: "Tous les Destinataires",
    for_him: "Pour Lui",
    for_her: "Pour Elle",
    couples_both: "Couples & Les Deux",
    for_kids_teens: "Pour Enfants & Ados",
    for_friends_coworkers: "Pour Amis & Collègues",
    self_care: "Soin de Soi",
    all_occasions: "Toutes les Occasions",
    birthdays: "Anniversaires",
    anniversaries: "Anniversaires de Mariage",
    housewarming: "Crémaillère",
    graduation: "Remise de Diplôme",
    weddings_bridal: "Mariages & Mariées",
    festivals_holidays: "Festivals & Fêtes",
    corporate_milestones: "Entreprise & Jalons",
    all_colors: "Toutes les Couleurs",
    color_black: "Sombre / Noir",
    color_white: "Clair / Blanc",
    color_brown: "Brun / Tons Chauds",
    color_green: "Sauge / Vert",
    color_blue: "Bleu / Marine",
    all_sizes: "Toutes les Tailles",
    size_standard: "Standard / Unique",
    size_small: "Petit / Voyage",
    size_medium: "Moyen",
    size_large: "Grand / Luxe",
    any_price: "Tout Prix",
    under_price: "Moins de {price}",
    price_range: "{min} - {max}",
    over_price: "Plus de {price}",
    show_all_listings: "Voir Tous les Produits",
    all_reviews: "Tous les Avis",
    stars_and_up: "{rating}+ Étoiles",
    stars_only: "{rating} Étoiles Uniquement",
    all_items_no_min: "Tout (Sans Minimum)",
    off_or_more: "{percent}% de Réduction ou Plus",
    discover_premium_selection: "Découvrez notre sélection premium dans tous les départements. De l'électronique de pointe à la haute couture, nous avons ce qu'il vous faut.",
    all_brands: "Toutes les Marques",
    active_filters: "Filtres Actifs",
    reset_filters: "Réinitialiser",
    filter_by: "Filtrer par",
    sort_by: "Trier par",
    featured: "En Vedette",
    price_low_high: "Prix : Ordre Croissant",
    price_high_low: "Prix : Ordre Décroissant",
    gomo_smart_assistant: "Assistant Intelligent GoMo",
    smart_assistant_desc: "Trouvez vos produits idéaux grâce à des suggestions personnalisées.",
    question_step: "Question {current} sur {total}",
    which_department: "Dans quel département achetez-vous ?",
    electronics_tech: "Électronique & Technologie",
    fashion_apparel: "Mode & Vêtements",
    home_kitchen: "Maison & Cuisine",
    books_stationery: "Livres & Papeterie",
    beauty_grooming: "Beauté & Soins",
    primary_preference: "Quelle est votre préférence principale ?",
    premium_quality_design: "Qualité & Design Premium",
    utility_high_value: "Utilité & Haute Valeur",
    new_arrivals_trending: "Nouveautés & Tendances",
    top_rated_best_sellers: "Mieux Notés & Ventes",
    budget_tier: "Quel est votre budget ?",
    budget_value: "Économique (Moins de {price})",
    budget_mid: "Milieu de Gamme ({min} - {max})",
    budget_premium: "Premium ({price} +)",
    recommended_for_you_finder: "Recommandé pour Vous",
    based_on_preferences: "Selon vos préférences, nous vous suggérons ces produits exceptionnels.",
    no_products_finder: "Aucun produit ne correspond à la sélection actuelle.",
    footer_brand_desc: "Sélection des meilleures offres, produits et technologies. Nous pensons que le shopping doit être intelligent, fluide et agréable.",
    collections_title: "Collections",
    support_title: "Support",
    newsletter_title: "Newsletter",
    newsletter_desc: "Rejoignez notre liste pour des mises à jour exclusives et des notifications de meilleures offres.",
    shipping_policy: "Politique d'Expédition",
    return_refunds: "Retours & Remboursements",
    privacy_policy: "Politique de Confidentialité",
    faqs: "FAQ",
    email_address: "Adresse E-mail",
    all_rights_reserved: "TOUS DROITS RÉSERVÉS.",
    terms_of_service: "Conditions d'Utilisation",
    cookies: "Cookies",
    selection: "Sélection",
    review: "Avis",
    reviews: "Avis",
    highly_rated_product: "Produit Très Apprécié",
    sign_in: "Se Connecter",
    sign_in_desc: "Saisissez vos identifiants pour accéder à votre collection privée.",
    email_required: "L'e-mail est requis",
    email_invalid: "Veuillez entrer un e-mail valide",
    password_required: "Le mot de passe est requis",
    password_length_error: "Le mot de passe doit contenir au moins 8 caractères",
    password_complexity_error: "Le mot de passe doit comporter au moins 8 caractères et contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial (@$!%*?&)",
    security_alert: "Alerte de Sécurité",
    access_restricted: "Accès au Compte Restreint",
    auth_failed: "Échec de l'Authentification",
    login_failed_desc: "Échec de la connexion. Veuillez vérifier vos identifiants.",
    password: "Mot de passe",
    forgot_password: "Oublié ?",
    signing_in: "Connexion en cours...",
    back_to_home: "← Retour à l'Accueil",
    no_account: "Vous n'avez pas de compte ?",
    already_have_account: "Vous avez déjà un compte ?",
    create_one: "Créer un compte",
    join_title: "Rejoindre GoMo Deals",
    join_desc: "Découvrez des produits de qualité supérieure et des offres dynamiques.",
    full_name: "Nom Complet",
    full_name_required: "Le nom complet est requis",
    phone_number: "Numéro de Téléphone",
    phone_required: "Le numéro de téléphone est requis",
    phone_invalid: "Le numéro de téléphone doit comporter 10 chiffres",
    date_of_birth: "Date de Naissance",
    profile_picture: "Photo de Profil",
    confirm_password: "Confirmer le mot de passe",
    passwords_dont_match: "Les mots de passe ne correspondent pas",
    create_account: "Créer un compte",
    sending_code: "Envoi du code...",
    failed_send_verification: "Échec de l'envoi du code de vérification. Veuillez réessayer.",
    verify_email_title: "Vérifier votre e-mail",
    verification_code_sent: "Nous avons envoyé un code de vérification à 6 chiffres à",
    enter_full_code: "Veuillez saisir le code complet à 6 chiffres",
    verify_email_btn: "Vérifier l'e-mail",
    verifying: "Vérification...",
    resend_code_in: "Renvoyer le code dans {timer}s",
    resend_code: "Renvoyer le code",
    failed_resend: "Échec du renvoi du code"
  },
  DE: {
    deliver_to: "Liefern an",
    search_placeholder: "Suche nach Produkten, Marken, Kategorien...",
    shopping_cart: "Warenkorb",
    cartCount: "Warenkorb ({count})",
    subtotal: "Zwischensumme",
    shipping: "Versand",
    free: "Kostenlos",
    duties_tax: "Zölle & Steuern",
    included: "Inklusive",
    total_price: "Gesamtpreis",
    proceed_to_checkout: "Zur Kasse",
    continue_shopping: "Weiter Einkaufen",
    free_shipping_disclaimer: "Kostenloser Versand für alle Bestellungen.",
    my_wishlist: "Mein Wunschzettel",
    wishlist_empty: "Ihr Wunschzettel ist leer",
    wishlist_empty_desc: "Speichern Sie Produkte, die Sie mögen, um sie später zu kaufen.",
    start_shopping: "Einkauf Starten",
    view_details: "Details Anzeigen",
    cart_empty: "Ihr Warenkorb ist leer",
    cart_empty_desc: "Entdecken Sie Produkte, die auf Sie warten.",
    qty: "Menge",
    item_total: "Artikelsumme",
    remove_item: "Artikel Entfernen",
    order_summary: "Bestellübersicht",
    save_percent: "Spare {percent}%",
    add_to_cart: "In den Warenkorb",
    added_to_cart: "Hinzugefügt",
    remove_from_cart: "Aus dem Warenkorb",
    add_to_wishlist: "Auf den Wunschzettel",
    remove_from_wishlist: "Vom Wunschzettel entfernen",
    quick_view: "Schnellansicht",
    for_recipient: "Für {recipient}",
    free_delivery: "Kostenlose Lieferung",
    secure_checkout: "Sichere Kasse",
    secure_payment: "Sichere Zahlung",
    boutique_return: "Boutique-Rückgabe",
    delivery_desc: "Premium-Studio-Abwicklung",
    payment_desc: "Vollständig verschlüsselte Gateways",
    return_desc: "7 Tage Umtauschrecht",
    product_specifications: "Produktspezifikationen",
    collection: "Kollektion",
    boutique: "Boutique",
    net_weight: "Nettogewicht",
    dimensions: "Abmessungen",
    best_for: "Ideal Für",
    occasion: "Anlass",
    availability: "Verfügbarkeit",
    in_stock: "Auf Lager",
    out_of_stock: "Ausverkauft",
    recommended_for_you: "Für Sie empfohlen",
    you_may_also_like: "DAS KÖNNTE IHNEN AUCH GEFALLEN",
    make_an_offer: "Angebot Machen",
    buy_now: "Jetzt Kaufen",
    offer_accepted: "Angebot Angenommen!",
    offer_accepted_desc: "Ihr Angebot über {price} ist bereit zur Zahlung.",
    checkout_bargain_price: "Schnäppchenpreis Zahlen",
    make_reasonable_offer: "Machen Sie ein faires Angebot",
    retail_price: "Einzelhandelspreis",
    min_acceptable: "Mindestens akzeptabel (50%)",
    adjust_your_offer: "Passen Sie Ihr Angebot an",
    or_type_custom_amount: "Oder geben Sie einen Betrag ein ({symbol})",
    enter_offer_price: "Angebotspreis eingeben",
    dynamic_savings: "Dynamische Ersparnis",
    save: "Speichern",
    cancel: "Abbrechen",
    submit_proposal: "Vorschlag Senden",
    submitting: "Wird gesendet...",
    offer_sent: "Angebot an Händler gesendet!",
    done: "Fertig",
    all: "Alle",
    sale: "Sale",
    wow_deals: "Wow-Deals",
    flea_market: "Flohmarkt",
    whats_new: "Neuheiten",
    best_sellers: "Bestseller",
    electronics: "Elektronik",
    fashion: "Moda",
    home_living: "Wohnen & Deko",
    books: "Bücher",
    beauty: "Schönheit",
    sports_fitness: "Sport & Fitness",
    explore_products: "Produkte Entdecken",
    back: "Zurück",
    home_menu: "Startseite",
    menu: "Menü",
    categories: "Kategorien",
    explore_store: "Shop Entdecken",
    featured_deals: "Top-Angebote",
    explore_all_products: "Alle Produkte Anzeigen",
    account: "Konto",
    admin_dashboard: "Admin-Dashboard",
    returns_orders: "Retouren & Bestellungen",
    wishlist: "Wunschzettel",
    shipping_country: "Lieferland",
    interface_language: "Sprache des Shops",
    hello_sign_in: "Hallo, Anmelden",
    account_lists: "Konto & Listen",
    welcome: "Willkommen",
    my_profile: "Mein Profil",
    logout: "Abmelden",
    updates: "Benachrichtigungen",
    mark_all_read: "Alle als gelesen markieren",
    view_all_notifications: "Alle Benachrichtigungen anzeigen",
    all_caught_up: "Alles erledigt!",
    no_updates: "Keine neuen Benachrichtigungen.",
    new_notif: "neu",
    trending: "Trends",
    departments: "Kategorien",
    gender: "Geschlecht",
    recipient_filter: "Empfänger",
    color_family: "Farbe",
    size_bracket: "Größe",
    price_budget: "Budget",
    min_rating: "Mindestbewertung",
    min_discount: "Mindestrabatt",
    all_genders: "Alle Geschlechter",
    men: "Herren",
    women: "Damen",
    all_recipients: "Alle Empfänger",
    for_him: "Für Ihn",
    for_her: "Für Sie (Damen)",
    couples_both: "Paare & Beide",
    for_kids_teens: "Für Kinder & Jugendliche",
    for_friends_coworkers: "Für Freunde & Kollegen",
    self_care: "Selbstpflege",
    all_occasions: "Alle Anlässe",
    birthdays: "Geburtstage",
    anniversaries: "Jahrestage",
    housewarming: "Einweihungsfeier",
    graduation: "Abschlussfeier",
    weddings_bridal: "Hochzeiten & Brautmoden",
    festivals_holidays: "Feste & Feiertage",
    corporate_milestones: "Firmen- & Meilensteine",
    all_colors: "Alle Farben",
    color_black: "Dunkel / Schwarz",
    color_white: "Hell / Weiß",
    color_brown: "Brauntöne / Braun",
    color_green: "Salbei / Grün",
    color_blue: "Marine / Blau",
    all_sizes: "Alle Größen",
    size_standard: "Standard / Einheitsgröße",
    size_small: "Klein / Reise",
    size_medium: "Mittel",
    size_large: "Groß / Luxus",
    any_price: "Jeder Preis",
    under_price: "Unter {price}",
    price_range: "{min} - {max}",
    over_price: "Über {price}",
    show_all_listings: "Alle Artikel anzeigen",
    all_reviews: "Alle Bewertungen",
    stars_and_up: "{rating}+ Sterne & Mehr",
    stars_only: "Nur {rating} Sterne",
    all_items_no_min: "Alle (Kein Minimum)",
    off_or_more: "{percent}% Rabatt oder mehr",
    discover_premium_selection: "Entdecken Sie unsere Premium-Auswahl in allen Kategorien. Von modernster Elektronik bis hin zu High Fashion – wir haben alles für Sie.",
    all_brands: "Alle Marken",
    active_filters: "Aktive Filter",
    reset_filters: "Zurücksetzen",
    filter_by: "Filtern nach",
    sort_by: "Sortieren nach",
    featured: "Empfohlen",
    price_low_high: "Preis: Aufsteigend",
    price_high_low: "Preis: Absteigend",
    gomo_smart_assistant: "GoMo Intelligenter Assistent",
    smart_assistant_desc: "Finden Sie Ihre idealen Produkte durch personalisierte Vorschläge.",
    question_step: "Frage {current} von {total}",
    which_department: "In welcher Kategorie suchen Sie?",
    electronics_tech: "Elektronik & Technik",
    fashion_apparel: "Mode & Bekleidung",
    home_kitchen: "Wohnen & Küche",
    books_stationery: "Bücher & Schreibwaren",
    beauty_grooming: "Schönheit & Pflege",
    primary_preference: "Was ist Ihre Hauptpräferenz?",
    premium_quality_design: "Premium-Qualität & Design",
    utility_high_value: "Nützlichkeit & Hoher Wert",
    new_arrivals_trending: "Neuheiten & Trends",
    top_rated_best_sellers: "Top-Bewertet & Bestseller",
    budget_tier: "Wie hoch ist Ihr Budget?",
    budget_value: "Günstig (Unter {price})",
    budget_mid: "Mittleres Segment ({min} - {max})",
    budget_premium: "Premium ({price} +)",
    recommended_for_you_finder: "Für Sie empfohlen",
    based_on_preferences: "Basierend auf Ihren Wünschen empfehlen wir diese außergewöhnlichen Produkte.",
    no_products_finder: "Keine Produkte entsprechen der aktuellen Auswahl.",
    footer_brand_desc: "Die besten Angebote, Produkte und Technologien kuratieren. Wir glauben, dass Einkaufen intelligent, nahtlos und erfreulich sein sollte.",
    collections_title: "Kollektionen",
    support_title: "Support",
    newsletter_title: "Newsletter",
    newsletter_desc: "Melden Sie sich für exklusive Updates und Benachrichtigungen über die besten Angebote an.",
    shipping_policy: "Versandrichtlinien",
    return_refunds: "Rückgabe & Erstattung",
    privacy_policy: "Datenschutzerklärung",
    faqs: "Häufig gestellte Fragen (FAQs)",
    email_address: "E-Mail-Adresse",
    all_rights_reserved: "ALLE RECHTE VORBEHALTEN.",
    terms_of_service: "Nutzungsbedingungen",
    cookies: "Cookies",
    selection: "Auswahl",
    review: "Bewertung",
    reviews: "Bewertungen",
    highly_rated_product: "Sehr gut bewertetes Produkt",
    sign_in: "Einloggen",
    sign_in_desc: "Geben Sie Ihre Zugangsdaten ein, um auf Ihre private Sammlung zuzugreifen.",
    email_required: "E-Mail ist erforderlich",
    email_invalid: "Bitte geben Sie eine gültige E-Mail-Adresse ein",
    password_required: "Passwort ist erforderlich",
    password_length_error: "Das Passwort muss mindestens 8 Zeichen lang sein",
    password_complexity_error: "Das Passwort muss mindestens 8 Zeichen lang sein und mindestens einen Großbuchstaben, einen Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten (@$!%*?&)",
    security_alert: "Sicherheitswarnung",
    access_restricted: "Kontozugriff eingeschränkt",
    auth_failed: "Authentifizierung fehlgeschlagen",
    login_failed_desc: "Login fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.",
    password: "Passwort",
    forgot_password: "Vergessen?",
    signing_in: "Einloggen...",
    back_to_home: "← Zurück zur Startseite",
    no_account: "Haben Sie kein Konto?",
    already_have_account: "Haben Sie bereits ein Konto?",
    create_one: "Konto erstellen",
    join_title: "Treten Sie GoMo Deals bei",
    join_desc: "Erleben Sie erstklassige Qualitätsprodukte und dynamische Angebote.",
    full_name: "Vollständiger Name",
    full_name_required: "Vollständiger Name ist erforderlich",
    phone_number: "Telefonnummer",
    phone_required: "Telefonnummer ist erforderlich",
    phone_invalid: "Die Telefonnummer muss 10 Stellen haben",
    date_of_birth: "Geburtsdatum",
    profile_picture: "Profilbild",
    confirm_password: "Passwort bestätigen",
    passwords_dont_match: "Passwörter stimmen nicht überein",
    create_account: "Konto erstellen",
    sending_code: "Code wird gesendet...",
    failed_send_verification: "Fehler beim Senden des Bestätigungscodes. Bitte versuchen Sie es erneut.",
    verify_email_title: "E-Mail-Adresse verifizieren",
    verification_code_sent: "Wir haben einen 6-stelligen Bestätigungscode gesendet an",
    enter_full_code: "Bitte geben Sie den vollständigen 6-stelligen Code ein",
    verify_email_btn: "E-Mail verifizieren",
    verifying: "Verifizierung...",
    resend_code_in: "Code erneut senden in {timer}s",
    resend_code: "Code erneut senden",
    failed_resend: "Fehler beim erneuten Senden des Codes"
  },
  JA: {
    deliver_to: "お届け先",
    search_placeholder: "商品、ブランド、カテゴリを検索...",
    shopping_cart: "ショッピングカート",
    cartCount: "カート ({count})",
    subtotal: "小計",
    shipping: "配送料",
    free: "無料",
    duties_tax: "関税・消費税",
    included: "込み",
    total_price: "合計金額",
    proceed_to_checkout: "レジに進む",
    continue_shopping: "お買い物を続ける",
    free_shipping_disclaimer: "全商品送料無料です。",
    my_wishlist: "お気に入りリスト",
    wishlist_empty: "お気に入りリストは空です",
    wishlist_empty_desc: "気になる商品を保存して、後で購入できます。",
    start_shopping: "お買い物を始める",
    view_details: "詳細を見る",
    cart_empty: "カートは空です",
    cart_empty_desc: "あなたにぴったりの商品を見つけましょう。",
    qty: "数量",
    item_total: "小計",
    remove_item: "削除",
    order_summary: "注文内容の概要",
    save_percent: "{percent}%お得",
    add_to_cart: "カートに入れる",
    added_to_cart: "追加済み",
    remove_from_cart: "カートから削除",
    add_to_wishlist: "お気に入りに追加",
    remove_from_wishlist: "お気に入りから削除",
    quick_view: "クイックビュー",
    for_recipient: "{recipient} 向け",
    free_delivery: "送料無料",
    secure_checkout: "安全な決済",
    secure_payment: "安全な決済",
    boutique_return: "ブティック返品対応",
    delivery_desc: "プレミアム個別梱包対応",
    payment_desc: "完全暗号化されたゲートウェイ",
    return_desc: "安心の7日間交換保証",
    product_specifications: "商品の仕様",
    collection: "コレクション",
    boutique: "ブティック",
    net_weight: "重量",
    dimensions: "寸法",
    best_for: "おすすめの対象",
    occasion: "オケージョン",
    availability: "在庫状況",
    in_stock: "在庫あり",
    out_of_stock: "在庫切れ",
    recommended_for_you: "おすすめの商品",
    you_may_also_like: "こちらの商品もおすすめ",
    make_an_offer: "価格交渉をする",
    buy_now: "今すぐ購入",
    offer_accepted: "交渉成立！",
    offer_accepted_desc: "ご提示の価格 {price} が承認されました。購入可能です。",
    checkout_bargain_price: "交渉成立価格でレジに進む",
    make_reasonable_offer: "妥当な価格を提案する",
    retail_price: "通常価格",
    min_acceptable: "最低価格 (50%)",
    adjust_your_offer: "提案価格を調整する",
    or_type_custom_amount: "または直接入力してください ({symbol})",
    enter_offer_price: "提案価格を入力",
    dynamic_savings: "お得な割引額",
    save: "保存",
    cancel: "キャンセル",
    submit_proposal: "提案を送信する",
    submitting: "送信中...",
    offer_sent: "出品者に提案を送信しました！",
    done: "完了",
    all: "すべて",
    sale: "セール",
    wow_deals: "注目ディール",
    flea_market: "フリーマーケット",
    whats_new: "新着情報",
    best_sellers: "ベストセラー",
    electronics: "家電・PC",
    fashion: "ファッション",
    home_living: "インテリア・生活雑貨",
    books: "本・書籍",
    beauty: "ビューティー・コスメ",
    sports_fitness: "スポーツ・アウトドア",
    explore_products: "商品を見る",
    back: "戻る",
    home_menu: "ホーム",
    menu: "メニュー",
    categories: "カテゴリ",
    explore_store: "ストアを探索",
    featured_deals: "おすすめのディール",
    explore_all_products: "すべての商品を見る",
    account: "アカウント",
    admin_dashboard: "管理者ダッシュボード",
    returns_orders: "返品と注文履歴",
    wishlist: "お気に入り",
    shipping_country: "お届け先の国",
    interface_language: "表示言語の設定",
    hello_sign_in: "こんにちは、ログイン",
    account_lists: "アカウント＆リスト",
    welcome: "ようこそ",
    my_profile: "プロフィール設定",
    logout: "ログアウト",
    updates: "お知らせ",
    mark_all_read: "すべて既読にする",
    view_all_notifications: "すべてのお知らせを見る",
    all_caught_up: "新しいお知らせはありません！",
    no_updates: "現在、新着情報はありません。",
    new_notif: "新規",
    trending: "トレンド",
    departments: "部門カテゴリ",
    gender: "性別",
    recipient_filter: "ギフトの対象",
    color_family: "カラー系統",
    size_bracket: "サイズ区分",
    price_budget: "予算帯",
    min_rating: "最低評価",
    min_discount: "最低割引率",
    all_genders: "すべての性別",
    men: "メンズ",
    women: "レディース",
    all_recipients: "すべての対象者",
    for_him: "彼向け・メンズ",
    for_her: "彼女向け・レディース",
    couples_both: "カップル・両者向け",
    for_kids_teens: "キッズ＆ティーン向け",
    for_friends_coworkers: "友人＆同僚向け",
    self_care: "セルフケア・自分へのご褒美",
    all_occasions: "すべてのイベント",
    birthdays: "誕生日",
    anniversaries: "記念日",
    housewarming: "新築祝い",
    graduation: "卒業・昇進祝い",
    weddings_bridal: "結婚式＆ブライダル",
    festivals_holidays: "季節の祝祭＆休日",
    corporate_milestones: "企業イベント＆目標達成",
    all_colors: "すべてのカラー",
    color_black: "ダーク・ブラック系統",
    color_white: "ライト・ホワイト系統",
    color_brown: "ブラウン・アース系統",
    color_green: "セージ・グリーン系統",
    color_blue: "ネイビー・ブルー系統",
    all_sizes: "すべてのサイズ",
    size_standard: "標準・フリーサイズ",
    size_small: "スモール・旅行用",
    size_medium: "ミディアムサイズ",
    size_large: "ラージ・ラグジュアリー",
    any_price: "すべての価格帯",
    under_price: "{price} 以下",
    price_range: "{min} - {max}",
    over_price: "{price} 以上",
    show_all_listings: "すべての出品を表示",
    all_reviews: "すべてのレビュー",
    stars_and_up: "星 {rating} つ以上",
    stars_only: "星 {rating} つのみ",
    all_items_no_min: "すべての商品（下限なし）",
    off_or_more: "{percent}% 以上オフ",
    discover_premium_selection: "主要部門から厳選されたプレミアムな商品をご紹介します。最先端の家電からハイファッションまで幅広く取り揃えています。",
    all_brands: "すべてのブランド",
    active_filters: "適用中のフィルター",
    reset_filters: "クリアする",
    filter_by: "絞り込み",
    sort_by: "並べ替え",
    featured: "おすすめ順",
    price_low_high: "価格の安い順",
    price_high_low: "価格の高い順",
    gomo_smart_assistant: "GoMo スマートアシスタント",
    smart_assistant_desc: "いくつかの質問に答えるだけで、あなたにぴったりの商品をご提案します。",
    question_step: "質問 {current} / {total}",
    which_department: "どの部門の商品をお探しですか？",
    electronics_tech: "家電・ガジェット・PC",
    fashion_apparel: "ファッション・衣類",
    home_kitchen: "ホーム・キッチン・生活雑貨",
    books_stationery: "本・書籍・ステーショナリー",
    beauty_grooming: "ビューティー・コスメ・ヘルスケア",
    primary_preference: "重視するポイントはどれですか？",
    premium_quality_design: "最高品質のこだわりデザイン",
    utility_high_value: "実用性・コスパ重視",
    new_arrivals_trending: "最新トレンド・新着アイテム",
    top_rated_best_sellers: "高評価レビュー・ベストセラー",
    budget_tier: "ご予算はどのくらいですか？",
    budget_value: "お手頃価格 ({price} 未満)",
    budget_mid: "ミドルレンジ ({min} - {max})",
    budget_premium: "プレミアム・高級ライン ({price} 以上)",
    recommended_for_you_finder: "あなたへのおすすめ商品",
    based_on_preferences: "ご提案いただいた条件に基づき、こちらの最適な商品をご提案します。",
    no_products_finder: "選択した条件に一致する商品は見つかりませんでした。",
    footer_brand_desc: "最高のセール、製品、技術を厳選。私たちは、ショッピングはスマートでシームレス、そして楽しいものであるべきだと信じています。",
    collections_title: "コレクション",
    support_title: "サポート",
    newsletter_title: "ニュースレター",
    newsletter_desc: "独占アップデートや最高のセール通知を受け取るために、リストにご登録ください。",
    shipping_policy: "配送ポリシー",
    return_refunds: "返品とお支払い戻し",
    privacy_policy: "プライバシーポリシー",
    faqs: "よくある質問",
    email_address: "メールアドレス",
    all_rights_reserved: "無断転載を禁じます。",
    terms_of_service: "利用規約",
    cookies: "クッキー",
    selection: "セレクション",
    review: "レビュー",
    reviews: "レビュー",
    highly_rated_product: "高評価の商品",
    sign_in: "サインイン",
    sign_in_desc: "資格情報を入力して、プライベートコレクションにアクセスしてください。",
    email_required: "メールアドレスは必須です",
    email_invalid: "有効なメールアドレスを入力してください",
    password_required: "パスワードは必須です",
    password_length_error: "パスワードは8文字以上である必要があります",
    password_complexity_error: "パスワードは8文字以上で、大文字、小文字、数字、および特殊文字（@$!%*?&）をそれぞれ1つ以上含む必要があります",
    security_alert: "セキュリティ警告",
    access_restricted: "アカウントアクセス制限",
    auth_failed: "認証に失敗しました",
    login_failed_desc: "ログインに失敗しました。資格情報をご確認ください。",
    password: "パスワード",
    forgot_password: "お忘れですか？",
    signing_in: "サインイン中...",
    back_to_home: "← ホームに戻る",
    no_account: "アカウントをお持ちでないですか？",
    already_have_account: "すでにアカウントをお持ちですか？",
    create_one: "アカウント作成",
    join_title: "GoMo Dealsに参加",
    join_desc: "プレミアム品質の製品とダイナミックなセールをご体験ください。",
    full_name: "フルネーム",
    full_name_required: "フルネームは必須です",
    phone_number: "電話番号",
    phone_required: "電話番号は必須です",
    phone_invalid: "電話番号は10桁である必要があります",
    date_of_birth: "生年月日",
    profile_picture: "プロフィール画像",
    confirm_password: "パスワード再入力",
    passwords_dont_match: "パスワードが一致しません",
    create_account: "アカウントを作成する",
    sending_code: "コード送信中...",
    failed_send_verification: "検証コードの送信に失敗しました。もう一度お試しください。",
    verify_email_title: "メールアドレスの検証",
    verification_code_sent: "6桁の検証コードを以下に送信しました：",
    enter_full_code: "6桁 of コードをすべて入力してください",
    verify_email_btn: "メールを検証",
    verifying: "検証中...",
    resend_code_in: "{timer}秒後にコードを再送",
    resend_code: "コードを再送",
    failed_resend: "コードの再送に失敗しました"
  },
  AR: {
    deliver_to: "الشحن إلى",
    search_placeholder: "البحث عن المنتجات، العلامات التجارية، الفئات...",
    shopping_cart: "عربة التسوق",
    cartCount: "عربة التسوق ({count})",
    subtotal: "المجموع الفرعي",
    shipping: "الشحن",
    free: "مجاني",
    duties_tax: "الرسوم والضرائب",
    included: "مشمولة",
    total_price: "السعر الإجمالي",
    proceed_to_checkout: "المتابعة لإتمام الشراء",
    continue_shopping: "مواصلة التسوق",
    free_shipping_disclaimer: "شحن مجاني مشمول في جميع الطلبات.",
    my_wishlist: "قائمة أمنياتي",
    wishlist_empty: "قائمة أمنياتك فارغة",
    wishlist_empty_desc: "احفظ المنتجات التي تعجبك لشرائها لاحقًا.",
    start_shopping: "ابدأ التسوق",
    view_details: "عرض التفاصيل",
    cart_empty: "عربة التسوق فارغة",
    cart_empty_desc: "اكتشف المنتجات التي تنتظر أن تكون لك.",
    qty: "الكمية",
    item_total: "إجمالي العنصر",
    remove_item: "إزالة العنصر",
    order_summary: "ملخص الطلب",
    save_percent: "وفر {percent}%",
    add_to_cart: "إضافة إلى العربة",
    added_to_cart: "تمت الإضافة",
    remove_from_cart: "إزالة من العربة",
    add_to_wishlist: "إضافة لقائمة الأمنيات",
    remove_from_wishlist: "إزالة من قائمة الأمنيات",
    quick_view: "عرض سريع",
    for_recipient: "مناسب لـ {recipient}",
    free_delivery: "توصيل مجاني",
    secure_checkout: "دفع آمن",
    secure_payment: "دفع آمن",
    boutique_return: "إرجاع سهل",
    delivery_desc: "توصيل استوديو فاخر",
    payment_desc: "بوابات دفع مشفرة بالكامل",
    return_desc: "استبدال خلال 7 أيام",
    product_specifications: "مواصفات المنتج",
    collection: "المجموعة",
    boutique: "المتجر",
    net_weight: "الوزن الصافي",
    dimensions: "الأبعاد",
    best_for: "أفضل لـ",
    occasion: "المناسبة",
    availability: "حالة التوفر",
    in_stock: "متوفر في المخزون",
    out_of_stock: "غير متوفر",
    recommended_for_you: "موصى به لك",
    you_may_also_like: "قد يعجبك أيضاً",
    make_an_offer: "قدم عرض سعر",
    buy_now: "اشترِ الآن",
    offer_accepted: "تم قبول العرض!",
    offer_accepted_desc: "عرضك لشراء المنتج بسعر {price} جاهز للدفع الآن.",
    checkout_bargain_price: "إتمام الشراء بالسعر المعروض",
    make_reasonable_offer: "قدم عرض سعر معقول",
    retail_price: "سعر التجزئة",
    min_acceptable: "الحد الأدنى المقبول (50%)",
    adjust_your_offer: "عدل عرض السعر الخاص بك",
    or_type_custom_amount: "أو اكتب مبلغًا مخصصًا ({symbol})",
    enter_offer_price: "أدخل السعر المقترح",
    dynamic_savings: "التوفير الفعلي",
    save: "حفظ",
    cancel: "إلغاء",
    submit_proposal: "تقديم الاقتراح",
    submitting: "جاري التقديم...",
    offer_sent: "تم إرسال العرض للتاجر!",
    done: "تم",
    all: "الكل",
    sale: "تخفيضات",
    wow_deals: "عروض مذهلة",
    flea_market: "سوق المقايضة",
    whats_new: "ما الجديد",
    best_sellers: "الأكثر مبيعاً",
    electronics: "الإلكترونيات",
    fashion: "الأزياء",
    home_living: "المنزل والديكور",
    books: "الكتب",
    beauty: "الجمال والعناية",
    sports_fitness: "الرياضة واللياقة",
    explore_products: "استكشف المنتجات",
    back: "رجوع",
    home_menu: "الرئيسية",
    menu: "القائمة",
    categories: "الفئات",
    explore_store: "استكشف المتجر",
    featured_deals: "العروض المميزة",
    explore_all_products: "عرض جميع المنتجات",
    account: "الحساب",
    admin_dashboard: "لوحة التحكم للمشرف",
    returns_orders: "المرتجعات والطلبات",
    wishlist: "قائمة الأمنيات",
    shipping_country: "بلد الشحن",
    interface_language: "لغة الموقع",
    hello_sign_in: "مرحباً، تسجيل الدخول",
    account_lists: "الحساب والقوائم",
    welcome: "مرحباً بك",
    my_profile: "ملفي الشخصي",
    logout: "تسجيل الخروج",
    updates: "التحديثات",
    mark_all_read: "تحديد الكل كمقروء",
    view_all_notifications: "عرض جميع الإشعارات",
    all_caught_up: "لقد قرأت كل شيء!",
    no_updates: "لا توجد إشعارات جديدة حالياً.",
    new_notif: "جديد",
    trending: "رائج الآن",
    departments: "الأقسام",
    gender: "الجنس",
    recipient_filter: "المستلم",
    color_family: "مجموعة الألوان",
    size_bracket: "فئة المقاس",
    price_budget: "ميزانية السعر",
    min_rating: "الحد الأدنى للتقييم",
    min_discount: "الحد الأدنى للخصم",
    all_genders: "جميع الجنسين",
    men: "رجالي",
    women: "نسائي",
    all_recipients: "جميع المستلمين",
    for_him: "له (رجالي)",
    for_her: "لها (نسائي)",
    couples_both: "للأزواج وكلا الطرفين",
    for_kids_teens: "للأطفال والمراهقين",
    for_friends_coworkers: "للأصدقاء والزملاء",
    self_care: "عناية شخصية وإهداء ذاتي",
    all_occasions: "جميع المناسبات",
    birthdays: "أعياد ميلاد",
    anniversaries: "ذكرى سنوية",
    housewarming: "منزل جديد",
    graduation: "تخرج",
    weddings_bridal: "حفلات زفاف وعرائس",
    festivals_holidays: "مهرجانات وأعياد",
    corporate_milestones: "إنجازات شركات وأعمال",
    all_colors: "جميع الألوان",
    color_black: "داكن / أسود",
    color_white: "فاتح / أبيض",
    color_brown: "بني / درجات خشبية",
    color_green: "أخضر / زيتوني",
    color_blue: "أزرق / كحلي",
    all_sizes: "جميع المقاسات",
    size_standard: "مقاس موحد / قياسي",
    size_small: "صغير / حجم السفر",
    size_medium: "متوسط",
    size_large: "كبير / فاخر",
    any_price: "أي سعر",
    under_price: "أقل من {price}",
    price_range: "{min} - {max}",
    over_price: "أكثر من {price}",
    show_all_listings: "عرض كافة المنتجات",
    all_reviews: "كافة التقييمات",
    stars_and_up: "{rating}+ نجوم وأعلى",
    stars_only: "{rating} نجوم فقط",
    all_items_no_min: "كافة المنتجات (بدون حد أدنى)",
    off_or_more: "خصم {percent}% أو أكثر",
    discover_premium_selection: "اكتشف تشكيلتنا المتميزة عبر الأقسام المختلفة. نوفر لك كل ما تحتاجه من الإلكترونيات الحديثة إلى أرقى صيحات الموضة.",
    all_brands: "كافة العلامات التجارية",
    active_filters: "الفلاتر النشطة",
    reset_filters: "إعادة ضبط",
    filter_by: "تصفية حسب",
    sort_by: "ترتيب حسب",
    featured: "المميز",
    price_low_high: "السعر: من الأقل للأعلى",
    price_high_low: "السعر: من الأعلى للأقل",
    gomo_smart_assistant: "مساعد GoMo الذكي",
    smart_assistant_desc: "ابحث عن منتجاتك المثالية بناءً على تفضيلاتك الفردية.",
    question_step: "السؤال {current} من {total}",
    which_department: "ما القسم الذي تتسوق فيه؟",
    electronics_tech: "الإلكترونيات والتقنية",
    fashion_apparel: "الأزياء والملابس",
    home_kitchen: "المنزل والمطبخ",
    books_stationery: "الكتب والأدوات المكتبية",
    beauty_grooming: "الجمال والعناية الشخصية",
    primary_preference: "ما هي أولويتك المفضلة؟",
    premium_quality_design: "جودة وتصميم فاخر",
    utility_high_value: "عملي وقيمة عالية",
    new_arrivals_trending: "وصول جديد وأحدث الصيحات",
    top_rated_best_sellers: "الأعلى تقييماً والأكثر مبيعاً",
    budget_tier: "ما فئة الميزانية الخاصة بك؟",
    budget_value: "اقتصادي (تحت {price})",
    budget_mid: "فئة متوسطة ({min} - {max})",
    budget_premium: "فاخر ({price} +)",
    recommended_for_you_finder: "موصى به لك",
    based_on_preferences: "بناءً على اختياراتك، نقترح عليك هذه المنتجات الاستثنائية.",
    no_products_finder: "لم يتم العثور على منتجات تطابق الاختيارات الحالية.",
    footer_brand_desc: "تنسيق أفضل الصفقات والمنتجات والتكنولوجيا. نحن نؤمن بأن التسوق يجب أن يكون ذكياً، سلساً، وممتعاً.",
    collections_title: "المجموعات",
    support_title: "الدعم",
    newsletter_title: "النشرة الإخبارية",
    newsletter_desc: "انضم إلى قائمتنا للحصول على تحديثات حصرية وإشعارات بأفضل الصفقات.",
    shipping_policy: "سياسة الشحن",
    return_refunds: "المرتجعات والمبالغ المستردة",
    privacy_policy: "سياسة الخصوصية",
    faqs: "الأسئلة الشائعة",
    email_address: "البريد الإلكتروني",
    all_rights_reserved: "جميع الحقوق محفوظة.",
    terms_of_service: "شروط الخدمة",
    cookies: "ملفات تعريف الارتباط",
    selection: "تشكيلة",
    review: "مراجعة",
    reviews: "مراجعات",
    highly_rated_product: "منتج ذو تقييم عالٍ",
    sign_in: "تسجيل الدخول",
    sign_in_desc: "أدخل بيانات الاعتماد الخاصة بك للوصول إلى مجموعتك الخاصة.",
    email_required: "البريد الإلكتروني مطلوب",
    email_invalid: "يرجى إدخال بريد إلكتروني صحيح",
    password_required: "كلمة المرور مطلوبة",
    password_length_error: "يجب أن تتكون كلمة المرور من 8 رموز على الأقل",
    password_complexity_error: "يجب أن تتكون كلمة المرور من 8 رموز على الأقل وتحتوي على حرف كبير واحد على الأقل، وحرف صغير واحد على الأقل، ورقم واحد، ورمز خاص واحد (@$!%*?&)",
    security_alert: "تنبيه أمني",
    access_restricted: "تم تقييد الوصول إلى الحساب",
    auth_failed: "فشلت عملية المصادقة",
    login_failed_desc: "فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.",
    password: "كلمة المرور",
    forgot_password: "نسيت؟",
    signing_in: "جاري تسجيل الدخول...",
    back_to_home: "← العودة إلى الرئيسية",
    no_account: "ليس لديك حساب؟",
    already_have_account: "هل لديك حساب بالفعل؟",
    create_one: "إنشاء حساب",
    join_title: "انضم إلى GoMo Deals",
    join_desc: "اختبر منتجات ذات جودة متميزة وصفقات ديناميكية.",
    full_name: "الاسم الكامل",
    full_name_required: "الاسم الكامل مطلوب",
    phone_number: "رقم الهاتف",
    phone_required: "رقم الهاتف مطلوب",
    phone_invalid: "يجب أن يتكون رقم الهاتف من 10 أرقام",
    date_of_birth: "تاريخ الميلاد",
    profile_picture: "الصورة الشخصية",
    confirm_password: "تأكيد كلمة المرور",
    passwords_dont_match: "كلمات المرور غير متطابقة",
    create_account: "إنشاء حساب",
    sending_code: "جاري إرسال الرمز...",
    failed_send_verification: "فشل إرسال رمز التحقق. يرجى المحاولة مرة أخرى.",
    verify_email_title: "تأكيد بريدك الإلكتروني",
    verification_code_sent: "لقد أرسلنا رمز تحقق مكون من 6 أرقام إلى",
    enter_full_code: "يرجى إدخال الرمز المكون من 6 أرقام كاملاً",
    verify_email_btn: "تأكيد البريد",
    verifying: "جاري التأكيد...",
    resend_code_in: "إعادة إرسال الرمز خلال {timer} ثانية",
    resend_code: "إعادة إرسال الرمز",
    failed_resend: "فشل إعادة إرسال الرمز"
  }
};

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [wishlistDrawerOpen, setWishlistDrawerOpen] = useState(false);

  // Dynamic on-the-fly translations caching
  const [translationsCache, setTranslationsCache] = useState(() => {
    try {
      const saved = localStorage.getItem('gmd_translations_cache');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [cacheVersion, setCacheVersion] = useState(0);

  const updateCache = (lang, original, translated) => {
    setTranslationsCache(prev => {
      const updated = {
        ...prev,
        [lang]: {
          ...(prev[lang] || {}),
          [original]: translated
        }
      };
      try {
        localStorage.setItem('gmd_translations_cache', JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save translation cache:", err);
      }
      return updated;
    });
    setCacheVersion(v => v + 1);
  };

  const activeRequests = useRef(new Set());

  const triggerBackgroundTranslation = (text, targetLang) => {
    const requestKey = `${targetLang}:${text}`;
    if (activeRequests.current.has(requestKey)) return;
    activeRequests.current.add(requestKey);

    const translate = async () => {
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json && json[0]) {
          const translated = json[0].map(s => s[0]).join('');
          updateCache(targetLang, text, translated);
        }
      } catch (err) {
        console.error("Dynamic translation error for key:", text, err);
      } finally {
        activeRequests.current.delete(requestKey);
      }
    };
    translate();
  };

  const [countriesList, setCountriesList] = useState([
    { name: 'India', code: 'IN', flag: '🇮🇳', currency: 'INR', symbol: '₹', rate: 1.0 },
    { name: 'America', code: 'US', flag: '🇺🇸', currency: 'USD', symbol: '$', rate: 0.012 },
    { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', currency: 'GBP', symbol: '£', rate: 0.0095 },
    { name: 'Europe', code: 'EU', flag: '🇪🇺', currency: 'EUR', symbol: '€', rate: 0.011 },
    { name: 'Canada', code: 'CA', flag: '🇨🇦', currency: 'CAD', symbol: 'C$', rate: 0.016 },
    { name: 'Australia', code: 'AU', flag: '🇦🇺', currency: 'AUD', symbol: 'A$', rate: 0.018 },
    { name: 'Japan', code: 'JP', flag: '🇯🇵', currency: 'JPY', symbol: '¥', rate: 1.85 },
    { name: 'UAE', code: 'AE', flag: '🇦🇪', currency: 'AED', symbol: 'د.إ', rate: 0.044 }
  ]);

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        let rates = null;
        const cachedStr = localStorage.getItem('gmd_exchange_rates');
        const cachedTime = localStorage.getItem('gmd_exchange_rates_time');
        const isFresh = cachedStr && cachedTime && (Date.now() - Number(cachedTime) < 24 * 60 * 60 * 1000);

        if (isFresh) {
          rates = JSON.parse(cachedStr);
        } else {
          const res = await fetch('https://open.er-api.com/v6/latest/INR');
          const json = await res.json();
          if (json && json.result === 'success' && json.rates) {
            rates = json.rates;
            localStorage.setItem('gmd_exchange_rates', JSON.stringify(rates));
            localStorage.setItem('gmd_exchange_rates_time', Date.now().toString());
          }
        }

        if (rates) {
          setCountriesList(prevList => {
            const updated = prevList.map(c => {
              const fetchedRate = rates[c.currency];
              return fetchedRate !== undefined ? { ...c, rate: fetchedRate } : c;
            });
            // Update selectedCountry to use the new rate
            setSelectedCountry(prev => {
              const matched = updated.find(c => c.code === prev.code);
              return matched || prev;
            });
            return updated;
          });
        }
      } catch (err) {
        console.error("Failed to fetch up-to-date exchange rates:", err);
      }
    };

    fetchExchangeRates();
  }, []);

  const languagesList = [
    { code: 'EN', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'HI', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ES', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'FR', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'DE', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'JA', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'AR', name: 'Arabic', nativeName: 'العربية', flag: '🇦🇪' }
  ];

  const [selectedCountry, setSelectedCountry] = useState(() => {
    const saved = localStorage.getItem('gmd_country');
    if (saved) {
      const found = countriesList.find(c => c.name.toLowerCase() === saved.toLowerCase());
      if (found) return found;
    }
    return countriesList[0];
  });

  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('gmd_language');
    if (saved && ['EN', 'HI', 'ES', 'FR', 'DE', 'JA', 'AR'].includes(saved.toUpperCase())) {
      return saved.toUpperCase();
    }
    return 'EN';
  });

  const changeLanguage = (langCode) => {
    const upper = langCode.toUpperCase();
    if (['EN', 'HI', 'ES', 'FR', 'DE', 'JA', 'AR'].includes(upper)) {
      setLanguage(upper);
      localStorage.setItem('gmd_language', upper);
    }
  };

  const changeCountry = (countryName) => {
    const found = countriesList.find(c => c.name.toLowerCase() === countryName.toLowerCase());
    if (found) {
      setSelectedCountry(found);
      localStorage.setItem('gmd_country', found.name);
    }
  };

  const t = (key, params = {}) => {
    if (!key) return '';
    const lang = language.toUpperCase();
    const langDict = translations[lang] || translations.EN;
    
    let translation = langDict[key] || translations.EN[key];
    
    if (!translation) {
      // Key not found in static dictionary, treat key itself as the source text to translate dynamically!
      const targetLang = language.toLowerCase();
      if (targetLang === 'en') {
        translation = key;
      } else {
        const cached = translationsCache[targetLang]?.[key];
        if (cached) {
          translation = cached;
        } else {
          // Trigger asynchronous background fetch
          triggerBackgroundTranslation(key, targetLang);
          translation = key; // Fallback to English temporarily
        }
      }
    }
    
    // Replace placeholder params (e.g., {count}, {price}, {recipient}, {percent})
    Object.entries(params).forEach(([k, v]) => {
      translation = translation.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
    
    return translation;
  };


  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return '';
    const converted = Number(price) * selectedCountry.rate;
    const hasDecimals = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'].includes(selectedCountry.currency);
    if (hasDecimals) {
      return `${selectedCountry.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${selectedCountry.symbol}${Math.round(converted).toLocaleString()}`;
  };

  const convertPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return 0;
    return Number(price) * selectedCountry.rate;
  };

  // Load from localStorage on init (for guests)
  useEffect(() => {
    if (!user) {
      const savedCart = localStorage.getItem('cart');
      const savedWishlist = localStorage.getItem('wishlist');
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    }
  }, [user]);

  // Sync with backend on login
  useEffect(() => {
    const syncWithBackend = async () => {
      if (user?.id && (user?.role === 'customer' || user?.role === 'admin' || user?.role === 'super_admin')) {
        setLoading(true);
        try {
          const [remoteCart, remoteWishlist] = await Promise.all([
            cartService.getCart(user.id),
            wishlistService.getWishlist(user.id)
          ]);
          
          if (remoteCart?.success && Array.isArray(remoteCart.data)) {
            setCart(remoteCart.data.map(item => ({
              id: item.product_id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.thumbnail,
              variant_id: item.variant_id,
              selectedColor: item.variant_value || null,
              variant_value: item.variant_value || null,
              cart_item_id: item.cart_item_id,
              category_name: item.category_name || null,
              tags: item.tags || null
            })));
          }

          if (remoteWishlist?.success && Array.isArray(remoteWishlist.data)) {
            setWishlist(remoteWishlist.data.map(item => ({
              id: item.product_id,
              name: item.name,
              price: item.price,
              image: item.thumbnail,
              wishlist_item_id: item.wishlist_item_id
            })));
          }
        } catch (error) {
          console.error("Backend sync failed:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    syncWithBackend();
  }, [user]);

  // Save to localStorage for guests only
  useEffect(() => {
    if (!user) {
      localStorage.setItem('cart', JSON.stringify(cart));
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  }, [cart, wishlist, user]);



  const forceAddToWishlist = (product) => {
    const productId = product.product_id || product.id;
    setWishlist(prevWishlist => {
      const isWishlisted = prevWishlist.find(item => item.id === productId || item.product_id === productId);
      if (isWishlisted) return prevWishlist;
      return [...prevWishlist, { ...product, id: productId }];
    });
  };

  const removeFromCart = async (productId, selectedColor = null) => {
    if (user?.id) {
      try {
        const item = cart.find(i => 
          (i.id === productId || i.product_id === productId) && 
          ((!selectedColor && !i.selectedColor) || i.selectedColor === selectedColor || i.variant_value === selectedColor)
        );
        if (item?.cart_item_id) {
          await cartService.removeItem(item.cart_item_id);
          const remoteCart = await cartService.getCart(user.id);
          setCart(remoteCart.data.map(item => ({
            id: item.product_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.thumbnail,
            variant_id: item.variant_id,
            selectedColor: item.variant_value || null,
            variant_value: item.variant_value || null,
            cart_item_id: item.cart_item_id
          })));
        }
      } catch (error) {
        console.error("Remove from cart failed:", error);
      }
    } else {
      setCart(prevCart => prevCart.filter(
        item => !((item.id === productId || item.product_id === productId) && item.selectedColor === selectedColor)
      ));
    }
  };

  // Add product to cart with authentication check
  const addToCart = async (product, quantity = 1) => {
    if (!user?.id) {
      toast('Please log in to add items to the cart.', { type: 'error' });
      return;
    }
    const productId = product.product_id || product.id;
    try {
      const res = await cartService.addToCart({
        customer_id: user.id,
        product_id: productId,
        variant_id: product.variant_id || null,
        quantity,
        price: product.price,
      });
      if (res.success !== false) {
        // Refresh cart from backend
        const remoteCart = await cartService.getCart(user.id);
        setCart(remoteCart.data.map(item => ({
          id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.thumbnail,
          variant_id: item.variant_id,
          selectedColor: item.variant_value || null,
          variant_value: item.variant_value || null,
          cart_item_id: item.cart_item_id,
          category_name: item.category_name || null,
          tags: item.tags || null
        })));
        toast('Added to cart.', { type: 'success' });
      } else {
        toast(res.error || 'Failed to add to cart.', { type: 'error' });
      }
    } catch (error) {
      console.error('Add to cart failed:', error);
      toast('Failed to add to cart.', { type: 'error' });
    }
  };

  // Toggle wishlist item with authentication check
  const toggleWishlist = async (product) => {
    if (!user?.id) {
      toast('Please log in to manage your wishlist.', { type: 'error' });
      return;
    }
    const productId = product.product_id || product.id;
    const existingItem = wishlist.find(item => item.id === productId || item.product_id === productId);
    try {
      if (existingItem) {
        // Remove from wishlist
        await wishlistService.removeItem(existingItem.wishlist_item_id);
        toast('Removed from wishlist.', { type: 'info' });
      } else {
        // Add to wishlist
        await wishlistService.addToWishlist({
          customer_id: user.id,
          product_id: productId,
          variant_id: product.variant_id || null,
        });
        toast('Added to wishlist.', { type: 'success' });
      }
      // Refresh wishlist
      const remoteWishlist = await wishlistService.getWishlist(user.id);
      if (remoteWishlist.success !== false) {
        setWishlist(remoteWishlist.data.map(item => ({
          id: item.product_id,
          name: item.name,
          price: item.price,
          image: item.thumbnail,
          wishlist_item_id: item.wishlist_item_id,
        })));
      }
    } catch (error) {
      console.error('Toggle wishlist failed:', error);
      toast('Failed to update wishlist.', { type: 'error' });
    }
  };
  const updateQuantity = async (productId, quantity, selectedColor = null) => {
    if (user?.id) {
      try {
        const item = cart.find(i => 
          (i.id === productId || i.product_id === productId) && 
          ((!selectedColor && !i.selectedColor) || i.selectedColor === selectedColor || i.variant_value === selectedColor)
        );
        if (item?.cart_item_id) {
          const res = await cartService.updateQuantity(item.cart_item_id, quantity);
          if (res.success !== false) {
            const remoteCart = await cartService.getCart(user.id);
            setCart(remoteCart.data.map(item => ({
              id: item.product_id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.thumbnail,
              variant_id: item.variant_id,
              selectedColor: item.variant_value || null,
              variant_value: item.variant_value || null,
              cart_item_id: item.cart_item_id,
              category_name: item.category_name || null,
              tags: item.tags || null
            })));
          } else {
            toast(res.error || 'Failed to update quantity.', { type: 'error' });
          }
        }
      } catch (error) {
        console.error("Update quantity failed:", error);
        toast('Failed to update quantity.', { type: 'error' });
      }
    } else {
      if (quantity <= 0) {
        removeFromCart(productId, selectedColor);
        return;
      }
      setCart(prevCart => prevCart.map(item => 
        ((item.id === productId || item.product_id === productId) && item.selectedColor === selectedColor) 
          ? { ...item, quantity } 
          : item
      ));
    }
  };

  const removeFromWishlist = (productId) => {
    setWishlist(prevWishlist => prevWishlist.filter(item => item.id !== productId && item.product_id !== productId));
  }

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId || item.product_id === productId);
  };

  const isInCart = (productId, selectedColor = undefined) => {
    return cart.some(item => {
      const isSameProduct = item.id === productId || item.product_id === productId;
      if (!isSameProduct) return false;
      if (selectedColor === undefined) return true;
      const itemColor = item.selectedColor || item.variant_value || null;
      const targetColor = selectedColor || null;
      return itemColor === targetColor;
    });
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const translateRecipient = (rec) => {
    if (!rec) return '';
    const clean = rec.toLowerCase().trim();
    if (clean === 'him' || clean === 'for him') return t('for_him');
    if (clean === 'her' || clean === 'for her') return t('for_her');
    if (clean === 'couples' || clean === 'couples & both') return t('couples_both');
    if (clean === 'kids' || clean === 'for kids & teens') return t('for_kids_teens');
    if (clean === 'friends' || clean === 'for friends & coworkers') return t('for_friends_coworkers');
    if (clean === 'self' || clean === 'self-care & treat yourself') return t('self_care');
    return rec;
  };

  const translateOccasion = (occ) => {
    if (!occ) return '';
    const clean = occ.toLowerCase().trim();
    if (clean === 'birthday' || clean === 'birthdays') return t('birthdays');
    if (clean === 'anniversary' || clean === 'anniversaries') return t('anniversaries');
    if (clean === 'housewarming') return t('housewarming');
    if (clean === 'graduation') return t('graduation');
    if (clean === 'wedding' || clean === 'weddings & bridal') return t('weddings_bridal');
    if (clean === 'festival' || clean === 'festivals & holidays') return t('festivals_holidays');
    if (clean === 'corporate' || clean === 'corporate & milestones') return t('corporate_milestones');
    return occ;
  };

  return (
    <ShopContext.Provider value={{
      cart,
      wishlist,
      addToCart,
      removeFromCart,
      updateQuantity,
      toggleWishlist,
      removeFromWishlist,
      isInWishlist,
      isInCart,
      cartCount,
      cartTotal,
      cartDrawerOpen,
      setCartDrawerOpen,
      wishlistDrawerOpen,
      setWishlistDrawerOpen,
      countriesList,
      selectedCountry,
      changeCountry,
      formatPrice,
      convertPrice,
      language,
      languagesList,
      changeLanguage,
      t,
      translateRecipient,
      translateOccasion
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within a ShopProvider');
  return context;
};

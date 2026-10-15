import type { CategoryIcon } from "@/lib/menus/category-icons";
import type { DietaryLabel, MenuFilter, MenuMessageCode } from "@/lib/menus/schema";
import type { CurrencyCode } from "@/lib/menus/money";

export type MenuCopy = {
  title: string;
  description: string;
  statCategories: string;
  statProducts: string;
  statPublished: string;
  statUnpublished: string;
  publicMenu: string;
  themeLabel: string;
  customizeAppearance: string;
  categoriesTitle: string;
  categoriesSubtitle: string;
  productsTitle: string;
  productsSubtitle: string;
  oneProduct: string;
  manyProducts: string;
  viewGrid: string;
  viewList: string;
  moreActions: string;
  copyUrl: string;
  copied: string;
  noCategoryMatches: string;
  noStatusMatches: string;
  open: string;
  addCategory: string;
  addProduct: string;
  edit: string;
  back: string;
  search: string;
  searchLabel: string;
  searchCategories: string;
  sort: string;
  sortManual: string;
  sortName: string;
  viewItem: string;
  filterLabel: string;
  categoryLabel: string;
  allCategories: string;
  filters: Record<MenuFilter, string>;
  emptyCategoriesTitle: string;
  emptyCategoriesDescription: string;
  emptyProductsTitle: string;
  emptyProductsDescription: string;
  noMatches: string;
  categoryTitle: string;
  categoryIntro: string;
  categoryEditTitle: string;
  categoryEditIntro: string;
  createCategory: string;
  namePlaceholder: string;
  nameArPlaceholder: string;
  descriptionPlaceholder: string;
  descriptionArPlaceholder: string;
  availableHint: string;
  publishedHint: string;
  categoryPicture: string;
  categoryPictureHint: string;
  categoryNoPicture: string;
  categoryImport: string;
  categoryIcons: Record<CategoryIcon, string>;
  productTitle: string;
  productIntro: string;
  productEditTitle: string;
  productEditIntro: string;
  createProduct: string;
  productNamePlaceholder: string;
  productNameArPlaceholder: string;
  productDescriptionPlaceholder: string;
  productDescriptionArPlaceholder: string;
  compareHint: string;
  productAvailableHint: string;
  productStockHint: string;
  productPublishedHint: string;
  productFeaturedHint: string;
  variantsHint: string;
  addonsHint: string;
  changeImage: string;
  uploadImage: string;
  productImageHint: string;
  fields: {
    name: string;
    nameAr: string;
    description: string;
    descriptionAr: string;
    price: string;
    compareAt: string;
    currency: string;
    published: string;
    available: string;
    outOfStock: string;
    featured: string;
    labels: string;
    variants: string;
    addons: string;
    images: string;
    activeOption: string;
  };
  currencies: Record<CurrencyCode, string>;
  labels: Record<DietaryLabel, string>;
  priceHint: string;
  imageHint: string;
  addRow: string;
  removeRow: string;
  moveUp: string;
  moveDown: string;
  publish: string;
  unpublish: string;
  deleteCategory: string;
  deleteProduct: string;
  confirmCategory: string;
  confirmProduct: string;
  confirm: string;
  cancel: string;
  save: string;
  create: string;
  pending: string;
  displayStyle: string;
  themeRestaurant: string;
  themeCafe: string;
  themeMinimal: string;
  themeRestaurantHint: string;
  themeCafeHint: string;
  themeMinimalHint: string;
  publicAddress: string;
  publicHidden: string;
  openPublic: string;
  previous: string;
  next: string;
  draft: string;
  published: string;
  messages: Record<MenuMessageCode, string>;
};

const currencies = {
  USD: "US dollar",
  EUR: "Euro",
  GBP: "Pound sterling",
  SAR: "Saudi riyal",
  AED: "UAE dirham",
  EGP: "Egyptian pound",
  QAR: "Qatari riyal",
  JOD: "Jordanian dinar",
  KWD: "Kuwaiti dinar",
  BHD: "Bahraini dinar",
  OMR: "Omani rial",
  JPY: "Japanese yen",
} as const;

const currenciesAr = {
  USD: "دولار أمريكي",
  EUR: "يورو",
  GBP: "جنيه إسترليني",
  SAR: "ريال سعودي",
  AED: "درهم إماراتي",
  EGP: "جنيه مصري",
  QAR: "ريال قطري",
  JOD: "دينار أردني",
  KWD: "دينار كويتي",
  BHD: "دينار بحريني",
  OMR: "ريال عماني",
  JPY: "ين ياباني",
} as const;

const labels = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  spicy: "Spicy",
  gluten: "Gluten",
  dairy: "Dairy",
  nuts: "Nuts",
  shellfish: "Shellfish",
  sesame: "Sesame",
} as const;

const labelsAr = {
  vegetarian: "نباتي",
  vegan: "نباتي صرف",
  spicy: "حار",
  gluten: "جلوتين",
  dairy: "ألبان",
  nuts: "مكسرات",
  shellfish: "محار",
  sesame: "سمسم",
} as const;

const messages: Record<MenuMessageCode, string> = {
  name_required: "Enter the English name.",
  name_too_long: "Use a shorter English name.",
  name_ar_required: "Enter the Arabic name.",
  name_ar_too_long: "Use a shorter Arabic name.",
  description_too_long: "Use a shorter description.",
  price_invalid: "Enter a price with the allowed decimal places.",
  compare_invalid: "The compare-at price must be higher than the selling price.",
  category_invalid: "Choose a category from this business.",
  labels_invalid: "Choose dietary labels from the list.",
  variant_invalid: "Check the sizes. Each one needs a name and a price.",
  addon_invalid: "Check the add-ons. Each one needs a name and a price.",
  currency_invalid: "Choose a currency from the list.",
  theme_invalid: "Choose a menu layout from the list.",
  appearance_invalid: "Check the colors and layout choices, then try again.",
  image_type: "Upload a JPG, PNG, or WebP image.",
  image_too_large: "Use an image of 1.5 MB or smaller.",
  image_failed: "The item was saved, but an image could not be stored.",
  image_limit: "A product can have at most 8 images.",
  forbidden: "You do not have permission to change this menu.",
  not_found: "That menu item is not available on this business.",
  save_failed: "We could not save that change. Try again.",
  name_taken: "That name is already used in this category.",
  saved: "The menu change was saved.",
  created: "The menu item was created.",
  deleted: "The menu item was deleted.",
  rate_limited: "Too many menu changes. Wait a few minutes and try again.",
  unconfigured: "Menu storage is not configured in this environment yet.",
  plan_limit: "This plan has reached its product limit. Choose a higher plan to add another.",
  theme_locked: "This layout is not included in the current plan.",
};

const messagesAr: Record<MenuMessageCode, string> = {
  name_required: "أدخل الاسم بالإنجليزية.",
  name_too_long: "استخدم اسمًا إنجليزيًا أقصر.",
  name_ar_required: "أدخل الاسم بالعربية.",
  name_ar_too_long: "استخدم اسمًا عربيًا أقصر.",
  description_too_long: "استخدم وصفًا أقصر.",
  price_invalid: "أدخل سعرًا بعدد المنازل العشرية المسموح.",
  compare_invalid: "يجب أن يكون سعر المقارنة أعلى من سعر البيع.",
  category_invalid: "اختر تصنيفًا من هذا العمل.",
  labels_invalid: "اختر تصنيفات غذائية من القائمة.",
  variant_invalid: "راجع الأحجام. كل حجم يحتاج إلى اسم وسعر.",
  addon_invalid: "راجع الإضافات. كل إضافة تحتاج إلى اسم وسعر.",
  currency_invalid: "اختر عملة من القائمة.",
  theme_invalid: "اختر تخطيط القائمة من الخيارات.",
  appearance_invalid: "راجع الألوان وخيارات التخطيط ثم حاول مرة أخرى.",
  image_type: "ارفع صورة JPG أو PNG أو WebP.",
  image_too_large: "استخدم صورة بحجم 1.5 ميغابايت أو أقل.",
  image_failed: "حُفظ العنصر، لكن تعذر تخزين صورة.",
  image_limit: "يمكن أن يحتوي المنتج على 8 صور كحد أقصى.",
  forbidden: "ليست لديك صلاحية لتعديل هذه القائمة.",
  not_found: "عنصر القائمة هذا غير متاح في هذا العمل.",
  save_failed: "تعذر حفظ هذا التغيير. حاول مرة أخرى.",
  name_taken: "هذا الاسم مستخدم بالفعل في هذا التصنيف.",
  saved: "تم حفظ تغيير القائمة.",
  created: "تم إنشاء عنصر القائمة.",
  deleted: "تم حذف عنصر القائمة.",
  rate_limited: "تغييرات كثيرة في القائمة. انتظر بضع دقائق ثم أعد المحاولة.",
  unconfigured: "تخزين القائمة غير مُعد في هذه البيئة بعد.",
  plan_limit: "وصلت هذه الخطة إلى حد المنتجات. اختر خطة أعلى لإضافة منتج آخر.",
  theme_locked: "هذا التخطيط غير مشمول في الخطة الحالية.",
};

export const menuCopyEn: MenuCopy = {
  title: "Menu",
  description: "Manage your categories and products in one place.",
  statCategories: "Categories",
  statProducts: "Products",
  statPublished: "Published",
  statUnpublished: "Unpublished",
  publicMenu: "Public menu",
  themeLabel: "Theme",
  customizeAppearance: "Customize appearance",
  categoriesTitle: "Categories",
  categoriesSubtitle: "Organize your products into menu sections.",
  productsTitle: "Products",
  productsSubtitle: "Manage product names, descriptions, prices, photos, and availability.",
  oneProduct: "1 product",
  manyProducts: "{count} products",
  viewGrid: "Grid",
  viewList: "List",
  moreActions: "More actions",
  copyUrl: "Copy",
  copied: "Copied",
  noCategoryMatches: "No products in this category.",
  noStatusMatches: "No products with this status.",
  open: "Menu",
  addCategory: "Add category",
  addProduct: "Add product",
  edit: "Edit",
  back: "Back to menu",
  search: "Search",
  searchLabel: "Search products...",
  searchCategories: "Search categories...",
  sort: "Sort",
  sortManual: "Current order",
  sortName: "Name",
  viewItem: "View",
  filterLabel: "Show",
  categoryLabel: "Category",
  allCategories: "All categories",
  filters: {
    all: "All products",
    published: "Published",
    draft: "Drafts",
    out_of_stock: "Out of stock",
    featured: "Featured",
  },
  emptyCategoriesTitle: "No categories yet",
  emptyCategoriesDescription: "Create a category before you add products.",
  emptyProductsTitle: "No products yet",
  emptyProductsDescription: "Add a product to this menu. Prices use the business currency.",
  noMatches: "No products match this search.",
  categoryTitle: "Create category",
  categoryIntro: "Add a new category to organize your menu items. You can add names and descriptions in both languages.",
  categoryEditTitle: "Edit category",
  categoryEditIntro: "Update the names, descriptions, and visibility for this category.",
  createCategory: "Create category",
  namePlaceholder: "Enter category name in English",
  nameArPlaceholder: "أدخل اسم الفئة بالعربية",
  descriptionPlaceholder: "Enter a short description for this category in English...",
  descriptionArPlaceholder: "أدخل وصفًا مختصرًا لهذه الفئة بالعربية...",
  availableHint: "Show this category in your menu.",
  publishedHint: "Make this category visible to customers.",
  categoryPicture: "Picture",
  categoryPictureHint: "Optional. Choose a food or drink icon, or import an image. Leave both empty to add the category without a picture.",
  categoryNoPicture: "No picture",
  categoryImport: "Import image",
  categoryIcons: {
    meal: "Meal",
    drink: "Drink",
    juice: "Juice",
    coffee: "Coffee",
    water: "Water",
    wine: "Wine",
    beer: "Beer",
    cocktail: "Cocktail",
    milk: "Milk",
    fish: "Fish",
    vegetable: "Vegetable",
    salad: "Salad",
    fruit: "Fruit",
    dessert: "Dessert",
    "ice-cream": "Ice cream",
    cake: "Cake",
    bakery: "Bakery",
    burger: "Burger",
    pizza: "Pizza",
    chicken: "Chicken",
    meat: "Meat",
    soup: "Soup",
    breakfast: "Breakfast",
    sandwich: "Sandwich",
    grill: "Grill",
    snack: "Snack",
  },
  productTitle: "Create product",
  productIntro: "Add a new product to your menu. You can add names, descriptions, prices, and more details in both languages.",
  productEditTitle: "Edit product",
  productEditIntro: "Update this product's names, price, image, and menu details.",
  createProduct: "Create product",
  productNamePlaceholder: "Enter product name in English",
  productNameArPlaceholder: "أدخل اسم المنتج بالعربية",
  productDescriptionPlaceholder: "Enter a description for this product in English...",
  productDescriptionArPlaceholder: "أدخل وصفًا للمنتج بالعربية...",
  compareHint: "Optional. Show the original price for discounts.",
  productAvailableHint: "Show this product in your menu.",
  productStockHint: "Mark as out of stock.",
  productPublishedHint: "Make this product visible to customers.",
  productFeaturedHint: "Highlight this product in your menu.",
  variantsHint: "Add different sizes, options, or variations for this product.",
  addonsHint: "Add optional items that customers can choose with this product.",
  changeImage: "Change image",
  uploadImage: "Upload image",
  productImageHint: "JPG, PNG, or WebP. Up to 1.5 MB.",
  fields: {
    name: "English name",
    nameAr: "Arabic name",
    description: "English description",
    descriptionAr: "Arabic description",
    price: "Price",
    compareAt: "Compare-at price",
    currency: "Currency",
    published: "Published",
    available: "Available",
    outOfStock: "Out of stock",
    featured: "Featured",
    labels: "Dietary labels",
    variants: "Sizes and variants",
    addons: "Add-ons",
    images: "Product image",
    activeOption: "Offered",
  },
  currencies,
  labels,
  priceHint: "Enter the amount in the business currency. It is stored as an exact minor-unit integer.",
  imageHint: "JPG, PNG, or WebP. Up to 8 photos, 1.5 MB each. Large photos are reduced before upload.",
  addRow: "Add another",
  removeRow: "Remove",
  moveUp: "Move up",
  moveDown: "Move down",
  publish: "Publish",
  unpublish: "Unpublish",
  deleteCategory: "Delete category",
  deleteProduct: "Delete product",
  confirmCategory: "Delete this category and every product inside it?",
  confirmProduct: "Delete this product, its sizes, add-ons, and photos?",
  confirm: "Delete",
  cancel: "Cancel",
  save: "Save",
  create: "Create",
  pending: "Please wait",
  displayStyle: "Public menu layout",
  themeRestaurant: "Modern Restaurant",
  themeCafe: "Premium Cafe",
  themeMinimal: "Minimal Food Menu",
  themeRestaurantHint: "A cover, a sticky category bar, and a card grid.",
  themeCafeHint: "A dark sidebar with a classic list and dotted prices.",
  themeMinimalHint: "A single column of type, with almost no chrome.",
  publicAddress: "Public address",
  publicHidden: "The public page stays hidden until this business is active and published.",
  openPublic: "Open public menu",
  previous: "Previous",
  next: "Next",
  draft: "Draft",
  published: "Published",
  messages,
};

export const menuCopyAr: MenuCopy = {
  title: "القائمة",
  description: "أدر التصنيفات والمنتجات في مكان واحد.",
  statCategories: "التصنيفات",
  statProducts: "المنتجات",
  statPublished: "المنشور",
  statUnpublished: "غير المنشور",
  publicMenu: "القائمة العامة",
  themeLabel: "المظهر",
  customizeAppearance: "تخصيص المظهر",
  categoriesTitle: "التصنيفات",
  categoriesSubtitle: "نظّم المنتجات في أقسام القائمة.",
  productsTitle: "المنتجات",
  productsSubtitle: "أدر أسماء المنتجات والأوصاف والأسعار والصور والتوفر.",
  oneProduct: "منتج واحد",
  manyProducts: "{count} منتجات",
  viewGrid: "شبكة",
  viewList: "قائمة",
  moreActions: "المزيد",
  copyUrl: "نسخ",
  copied: "تم النسخ",
  noCategoryMatches: "لا توجد منتجات في هذا التصنيف.",
  noStatusMatches: "لا توجد منتجات بهذه الحالة.",
  open: "القائمة",
  addCategory: "إضافة تصنيف",
  addProduct: "إضافة منتج",
  edit: "تعديل",
  back: "العودة إلى القائمة",
  search: "بحث",
  searchLabel: "ابحث في المنتجات...",
  searchCategories: "ابحث في التصنيفات...",
  sort: "ترتيب",
  sortManual: "الترتيب الحالي",
  sortName: "الاسم",
  viewItem: "عرض",
  filterLabel: "عرض",
  categoryLabel: "التصنيف",
  allCategories: "كل التصنيفات",
  filters: {
    all: "كل المنتجات",
    published: "المنشور",
    draft: "المسودات",
    out_of_stock: "غير متوفر",
    featured: "المميز",
  },
  emptyCategoriesTitle: "لا توجد تصنيفات بعد",
  emptyCategoriesDescription: "أنشئ تصنيفًا قبل إضافة المنتجات.",
  emptyProductsTitle: "لا توجد منتجات بعد",
  emptyProductsDescription: "أضف منتجًا إلى هذه القائمة. تستخدم الأسعار عملة العمل.",
  noMatches: "لا توجد منتجات مطابقة لهذا البحث.",
  categoryTitle: "إنشاء تصنيف",
  categoryIntro: "أضف تصنيفًا جديدًا لتنظيم أصناف قائمتك. يمكنك إضافة الأسماء والأوصاف باللغتين.",
  categoryEditTitle: "تعديل التصنيف",
  categoryEditIntro: "حدّث الأسماء والأوصاف وظهور هذا التصنيف.",
  createCategory: "إنشاء تصنيف",
  namePlaceholder: "Enter category name in English",
  nameArPlaceholder: "أدخل اسم الفئة بالعربية",
  descriptionPlaceholder: "Enter a short description for this category in English...",
  descriptionArPlaceholder: "أدخل وصفًا مختصرًا لهذه الفئة بالعربية...",
  availableHint: "أظهر هذا التصنيف في قائمتك.",
  publishedHint: "اجعل هذا التصنيف ظاهرًا للزبائن.",
  categoryPicture: "الصورة",
  categoryPictureHint: "اختياري. اختر أيقونة طعام أو شراب، أو استورد صورة. اتركهما فارغين لإضافة التصنيف بدون صورة.",
  categoryNoPicture: "بدون صورة",
  categoryImport: "استيراد صورة",
  categoryIcons: {
    meal: "وجبة",
    drink: "مشروب",
    juice: "عصير",
    coffee: "قهوة",
    water: "ماء",
    wine: "نبيذ",
    beer: "بيرة",
    cocktail: "كوكتيل",
    milk: "حليب",
    fish: "سمك",
    vegetable: "خضار",
    salad: "سلطة",
    fruit: "فاكهة",
    dessert: "حلويات",
    "ice-cream": "آيس كريم",
    cake: "كيك",
    bakery: "مخبوزات",
    burger: "برغر",
    pizza: "بيتزا",
    chicken: "دجاج",
    meat: "لحم",
    soup: "شوربة",
    breakfast: "فطور",
    sandwich: "ساندويتش",
    grill: "مشاوي",
    snack: "وجبة خفيفة",
  },
  productTitle: "إنشاء منتج",
  productIntro: "أضف منتجًا جديدًا إلى قائمتك. يمكنك إضافة الأسماء والأوصاف والأسعار وتفاصيل أخرى باللغتين.",
  productEditTitle: "تعديل المنتج",
  productEditIntro: "حدّث أسماء هذا المنتج وسعره وصورته وتفاصيل القائمة.",
  createProduct: "إنشاء منتج",
  productNamePlaceholder: "Enter product name in English",
  productNameArPlaceholder: "أدخل اسم المنتج بالعربية",
  productDescriptionPlaceholder: "Enter a description for this product in English...",
  productDescriptionArPlaceholder: "أدخل وصفًا للمنتج بالعربية...",
  compareHint: "اختياري. أظهر السعر الأصلي للتخفيضات.",
  productAvailableHint: "أظهر هذا المنتج في قائمتك.",
  productStockHint: "علّمه كغير متوفر.",
  productPublishedHint: "اجعل هذا المنتج ظاهرًا للزبائن.",
  productFeaturedHint: "أبرز هذا المنتج في قائمتك.",
  variantsHint: "أضف أحجامًا أو خيارات أو تنويعات لهذا المنتج.",
  addonsHint: "أضف أصنافًا اختيارية يمكن للزبائن اختيارها مع هذا المنتج.",
  changeImage: "تغيير الصورة",
  uploadImage: "رفع صورة",
  productImageHint: "JPG أو PNG أو WebP. حتى 1.5 ميغابايت.",
  fields: {
    name: "الاسم بالإنجليزية",
    nameAr: "الاسم بالعربية",
    description: "الوصف بالإنجليزية",
    descriptionAr: "الوصف بالعربية",
    price: "السعر",
    compareAt: "سعر المقارنة",
    currency: "العملة",
    published: "منشور",
    available: "متاح",
    outOfStock: "غير متوفر",
    featured: "مميز",
    labels: "التصنيفات الغذائية",
    variants: "الأحجام والأنواع",
    addons: "الإضافات",
    images: "صورة المنتج",
    activeOption: "معروض",
  },
  currencies: currenciesAr,
  labels: labelsAr,
  priceHint: "أدخل المبلغ بعملة العمل. يُحفظ كعدد صحيح لوحدة العملة الصغرى.",
  imageHint: "JPG أو PNG أو WebP. حتى 8 صور، 1.5 ميغابايت لكل صورة. تُصغّر الصور الكبيرة قبل الرفع.",
  addRow: "إضافة أخرى",
  removeRow: "إزالة",
  moveUp: "تحريك لأعلى",
  moveDown: "تحريك لأسفل",
  publish: "نشر",
  unpublish: "إلغاء النشر",
  deleteCategory: "حذف التصنيف",
  deleteProduct: "حذف المنتج",
  confirmCategory: "حذف هذا التصنيف وكل منتج بداخله؟",
  confirmProduct: "حذف هذا المنتج وأحجامه وإضافاته وصوره؟",
  confirm: "حذف",
  cancel: "إلغاء",
  save: "حفظ",
  create: "إنشاء",
  pending: "يرجى الانتظار",
  displayStyle: "تخطيط القائمة العامة",
  themeRestaurant: "مطعم حديث",
  themeCafe: "مقهى فاخر",
  themeMinimal: "قائمة طعام بسيطة",
  themeRestaurantHint: "غلاف، شريط تصنيفات ثابت، وشبكة بطاقات.",
  themeCafeHint: "شريط جانبي داكن مع قائمة كلاسيكية وأسعار منقّطة.",
  themeMinimalHint: "عمود واحد من النص، بأقل قدر من الزخرفة.",
  publicAddress: "العنوان العام",
  publicHidden: "تبقى الصفحة العامة مخفية إلى أن يصبح هذا العمل نشطًا ومنشورًا.",
  openPublic: "فتح القائمة العامة",
  previous: "السابق",
  next: "التالي",
  draft: "مسودة",
  published: "منشور",
  messages: messagesAr,
};

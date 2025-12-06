let currentLanguage = localStorage.getItem('language') || 'en';
let currentDirection = localStorage.getItem('direction') || 'ltr';

// Translations
const translations = {
  en: {
    // Navigation
    'Stock & Sales Management': 'Stock & Sales Management',
    'Dashboard': 'Dashboard',
    'Products': 'Products',
    'Sales': 'Sales',
    'Customers': 'Customers',
    'Expenses': 'Expenses',
    'Import': 'Import',
    'History': 'History',
    'عربي': 'عربي',
    
    // Dashboard
    'Total Profit': 'Total Profit',
    'From sales': 'From sales',
    'Total Expenses': 'Total Expenses',
    'Recorded expenses': 'Recorded expenses',
    'Net Profit': 'Net Profit',
    'Profit - Expenses': 'Profit - Expenses',
    'Capital': 'Capital',
    'Stock value': 'Stock value',
    'Sold Value': 'Sold Value',
    'Total products sold': 'Total products sold',
    'Total Sales': 'Total Sales',
    'Today': 'Today',
    'This week': 'This week',
    'This month': 'This month',
    'This year': 'This year',
    'All time': 'All time',
    'Period:': 'Period:',
    'Reset All Data': 'Reset All Data',
    'Latest Sales': 'Latest Sales',
    'Low Stock Alert': 'Low Stock Alert',
    'Top Selling Products (Last 30 Days)': 'Top Selling Products (Last 30 Days)',
    'Date': 'Date',
    'Product': 'Product',
    'Quantity': 'Quantity',
    'Sale Price': 'Sale Price',
    'Sold Value': 'Sold Value',
    'Profit': 'Profit',
    'Actions': 'Actions',
    'Delete': 'Delete',
    'All products have sufficient stock': 'All products have sufficient stock',
    'No sales in the last 30 days': 'No sales in the last 30 days',
    'No sales yet': 'No sales yet',
    'Loading...': 'Loading...',
    
    // Customers
    'Customers': 'Customers',
    'Customer': 'Customer',
    'Add New Customer': 'Add New Customer',
    'Customer Name': 'Customer Name',
    'Phone': 'Phone',
    'Phone (Optional)': 'Phone (Optional)',
    'Notes': 'Notes',
    'Notes (Optional)': 'Notes (Optional)',
    'Save Customer': 'Save Customer',
    'All Customers': 'All Customers',
    'No customers found': 'No customers found',
    'Search customers by name or phone...': 'Search customers by name or phone...',
    'View Details': 'View Details',
    'Customer created successfully': 'Customer created successfully',
    'Error creating customer': 'Error creating customer',
    'Customer Information': 'Customer Information',
    'Total Sales': 'Total Sales',
    'Total Profit': 'Total Profit',
    'Sales History': 'Sales History',
    'No sales found': 'No sales found',
    'Totals:': 'Totals:',
    'Filter': 'Filter',
    'Clear': 'Clear',
    'Walk-in': 'Walk-in',
    'No Customer': 'No Customer',
    'Walk-in / No Customer': 'Walk-in / No Customer',
    'Search customer or select Walk-in...': 'Search customer or select Walk-in...',
    '← Back to Customers': '← Back to Customers',
    'Customer Details': 'Customer Details',
    'to': 'to',
    'Debt': 'Debt',
    'Remaining Debt': 'Remaining Debt',
    'Total Sales Amount': 'Total Sales Amount',
    'Total Payments': 'Total Payments',
    'Add Payment': 'Add Payment',
    'Payments History': 'Payments History',
    'Payment Date': 'Payment Date',
    'Save Payment': 'Save Payment',
    'No payments found': 'No payments found',
    'Payment added successfully': 'Payment added successfully',
    'Error creating payment': 'Error creating payment',
    'Error deleting payment': 'Error deleting payment',
    'Are you sure you want to delete this payment?': 'Are you sure you want to delete this payment?',
    'Payment deleted successfully': 'Payment deleted successfully',
    '(credit)': '(credit)',
    'Sell on Credit': 'Sell on Credit',
    'Customer must be selected for credit sales': 'Customer must be selected for credit sales',
    'Credit Sales': 'Credit Sales',
    'Credit': 'Credit',
    
    // Sales
    'Sales (Excel Style)': 'Sales',
    'Submit All Sales': 'Submit All Sales',
    'Add Row': 'Add Row',
    'Sales Table': 'Sales Table',
    'Product Name': 'Product Name',
    'Total Rows:': 'Total Rows:',
    'Valid Rows:': 'Valid Rows:',
    'Total Profit:': 'Total Profit:',
    'Search product...': 'Search product...',
    'No products found': 'No products found',
    'Stock:': 'Stock:',
    'Price:': 'Price:',
    'Not set': 'Not set',
    'Confirm sale of': 'Confirm sale of',
    'product(s)? This will update stock and create sales records.': 'product(s)? This will update stock and create sales records.',
    'Are you sure you want to delete this sale?': 'Are you sure you want to delete this sale?',
    'This will restore the stock quantity.': 'This will restore the stock quantity.',
    'Sale deleted successfully. Stock has been restored.': 'Sale deleted successfully. Stock has been restored.',
    'Successfully created': 'Successfully created',
    'sale(s)! Total profit:': 'sale(s)! Total profit:',
    'Error creating sales': 'Error creating sales',
    'Error deleting sale': 'Error deleting sale',
    
    // Expenses
    'Add Expense': 'Add Expense',
    'Expense Log': 'Expense Log',
    'Total:': 'Total:',
    'Description': 'Description',
    'Category': 'Category',
    'Amount': 'Amount',
    'Edit': 'Edit',
    'Category:': 'Category:',
    'All Categories': 'All Categories',
    'Start Date:': 'Start Date:',
    'End Date:': 'End Date:',
    'Apply Filters': 'Apply Filters',
    'Clear': 'Clear',
    'No description': 'No description',
    'No expenses found': 'No expenses found',
    'Expenses (Excel Style)': 'Expenses',
    'Submit All Expenses': 'Submit All Expenses',
    'Expenses Table': 'Expenses Table',
    'Expense Description': 'Expense Description',
    'Expense Amount': 'Expense Amount',
    'Expense Date': 'Expense Date',
    'Expense Category': 'Expense Category',
    'Add New Expense Row': 'Add New Expense Row',
    'Confirm expense of': 'Confirm expense of',
    'expense(s)?': 'expense(s)?',
    'Expense added successfully': 'Expense added successfully',
    'Expense updated successfully': 'Expense updated successfully',
    'Expense deleted successfully': 'Expense deleted successfully',
    'Are you sure you want to delete this expense?': 'Are you sure you want to delete this expense?',
    'Error saving expense': 'Error saving expense',
    'Error deleting expense': 'Error deleting expense',
    'Amount must be greater than 0': 'Amount must be greater than 0',
    'Date is required': 'Date is required',
    
    // Import
    'Import Products': 'Import Products',
    'Upload Excel File': 'Upload Excel File',
    'Choose file': 'Choose file',
    'Upload': 'Upload',
    'Column Mapping': 'Column Mapping',
    'Map columns from your Excel file to the product fields:': 'Map columns from your Excel file to the product fields:',
    'Product Name:': 'Product Name:',
    'Purchase Price:': 'Purchase Price:',
    'Sale Price:': 'Sale Price:',
    'Stock Quantity:': 'Stock Quantity:',
    'Preview': 'Preview',
    'Confirm Import': 'Confirm Import',
    'Reset': 'Reset',
    'Please select a file': 'Please select a file',
    'Uploading file...': 'Uploading file...',
    'File uploaded successfully.': 'File uploaded successfully.',
    'Please map the columns below.': 'Please map the columns below.',
    'Processing import...': 'Processing import...',
    'Import completed successfully!': 'Import completed successfully!',
    'Error uploading file': 'Error uploading file',
    'Error processing import': 'Error processing import',
    'Please map all required columns (Name, Purchase Price, Quantity)': 'Please map all required columns (Name, Purchase Price, Quantity)',
    'Created:': 'Created:',
    'products': 'products',
    'Updated:': 'Updated:',
    'Errors:': 'Errors:',
    'Showing first': 'Showing first',
    'of': 'of',
    'rows': 'rows',
    'Showing all': 'Showing all',
    
    // Products
    'Product Name': 'Product Name',
    'Purchase Price': 'Purchase Price',
    'Sale Price': 'Sale Price',
    'Stock Quantity': 'Stock Quantity',
    'Add Product': 'Add Product',
    'Edit Product': 'Edit Product',
    'Save': 'Save',
    'Cancel': 'Cancel',
    'Search products...': 'Search products...',
    'No products found': 'No products found',
    
    // History
    'Import History': 'Import History',
    'Deletion Log': 'Deletion Log',
    'Filename': 'Filename',
    'Total Rows': 'Total Rows',
    'Created': 'Created',
    'Updated': 'Updated',
    'Errors': 'Errors',
    'Date': 'Date',
    'Entity Type': 'Entity Type',
    'Entity ID': 'Entity ID',
    'Entity Name': 'Entity Name',
    'Details': 'Details',
    
    // Reset Modal
    'Reset All Data': 'Reset All Data',
    'Warning!': 'Warning!',
    'This will permanently delete all products, sales, expenses, and history. This action cannot be undone.': 'This will permanently delete all products, sales, expenses, and history. This action cannot be undone.',
    'Enter Password:': 'Enter Password:',
    'Password': 'Password',
    'All data has been reset successfully': 'All data has been reset successfully',
    'Incorrect password': 'Incorrect password',
    'Error resetting data': 'Error resetting data',
    'Please enter the password': 'Please enter the password'
  },
  ar: {
    // Navigation
    'Stock & Sales Management': 'إدارة المخزون والمبيعات',
    'Dashboard': 'لوحة التحكم',
    'Products': 'المنتجات',
    'Sales': 'المبيعات',
    'Customers': 'العملاء',
    'Expenses': 'المصروفات',
    'Import': 'استيراد',
    'History': 'السجل',
    'عربي': 'English',
    
    // Dashboard
    'Total Profit': 'إجمالي الربح',
    'From sales': 'من المبيعات',
    'Total Expenses': 'إجمالي المصروفات',
    'Recorded expenses': 'المصروفات المسجلة',
    'Net Profit': 'صافي الربح',
    'Profit - Expenses': 'الربح - المصروفات',
    'Capital': 'رأس المال',
    'Stock value': 'قيمة المخزون',
    'Sold Value': 'قيمة المنتجات المباعة',
    'Total products sold': 'إجمالي المنتجات المباعة',
    'Total Sales': 'إجمالي المبيعات',
    'Today': 'اليوم',
    'This week': 'هذا الأسبوع',
    'This month': 'هذا الشهر',
    'This year': 'هذا العام',
    'All time': 'كل الوقت',
    'Period:': 'الفترة:',
    'Reset All Data': 'إعادة تعيين جميع البيانات',
    'Latest Sales': 'أحدث المبيعات',
    'Low Stock Alert': 'تنبيه المخزون المنخفض',
    'Top Selling Products (Last 30 Days)': 'أفضل المنتجات مبيعاً (آخر 30 يوم)',
    'Date': 'التاريخ',
    'Product': 'المنتج',
    'Quantity': 'الكمية',
    'Sale Price': 'سعر البيع',
    'Sold Value': 'قيمة المنتجات المباعة',
    'Profit': 'الربح',
    'Actions': 'الإجراءات',
    'Delete': 'حذف',
    'All products have sufficient stock': 'جميع المنتجات لديها مخزون كافٍ',
    'No sales in the last 30 days': 'لا توجد مبيعات في آخر 30 يوم',
    'No sales yet': 'لا توجد مبيعات بعد',
    'Loading...': 'جاري التحميل...',
    
    // Customers
    'Customers': 'العملاء',
    'Customer': 'العميل',
    'Add New Customer': 'إضافة عميل جديد',
    'Customer Name': 'اسم العميل',
    'Phone': 'الهاتف',
    'Phone (Optional)': 'الهاتف (اختياري)',
    'Notes': 'ملاحظات',
    'Notes (Optional)': 'ملاحظات (اختياري)',
    'Save Customer': 'حفظ العميل',
    'All Customers': 'جميع العملاء',
    'No customers found': 'لم يتم العثور على عملاء',
    'Search customers by name or phone...': 'البحث عن العملاء بالاسم أو الهاتف...',
    'View Details': 'عرض التفاصيل',
    'Customer created successfully': 'تم إنشاء العميل بنجاح',
    'Error creating customer': 'خطأ في إنشاء العميل',
    'Customer Information': 'معلومات العميل',
    'Total Sales': 'إجمالي المبيعات',
    'Total Profit': 'إجمالي الربح',
    'Sales History': 'سجل المبيعات',
    'No sales found': 'لم يتم العثور على مبيعات',
    'Totals:': 'الإجماليات:',
    'Filter': 'تصفية',
    'Clear': 'مسح',
    'Walk-in': 'بدون عميل',
    'No Customer': 'بدون عميل',
    'Walk-in / No Customer': 'بدون عميل / بدون عميل',
    'Search customer or select Walk-in...': 'البحث عن عميل أو اختر بدون عميل...',
    '← Back to Customers': '← العودة إلى العملاء',
    'Customer Details': 'تفاصيل العميل',
    'to': 'إلى',
    'Debt': 'الدين',
    'Remaining Debt': 'الدين المتبقي',
    'Total Sales Amount': 'إجمالي مبلغ المبيعات',
    'Total Payments': 'إجمالي الدفعات',
    'Add Payment': 'إضافة دفعة',
    'Payments History': 'سجل الدفعات',
    'Payment Date': 'تاريخ الدفعة',
    'Save Payment': 'حفظ الدفعة',
    'No payments found': 'لم يتم العثور على دفعات',
    'Payment added successfully': 'تم إضافة الدفعة بنجاح',
    'Error creating payment': 'خطأ في إنشاء الدفعة',
    'Error deleting payment': 'خطأ في حذف الدفعة',
    'Are you sure you want to delete this payment?': 'هل أنت متأكد من حذف هذه الدفعة؟',
    'Payment deleted successfully': 'تم حذف الدفعة بنجاح',
    '(credit)': '(رصيد)',
    'Sell on Credit': 'بيع بالدين',
    'Customer must be selected for credit sales': 'يجب اختيار العميل للبيع بالدين',
    'Credit Sales': 'مبيعات بالدين',
    'Credit': 'دين',
    
    // Sales
    'Sales (Excel Style)': 'المبيعات',
    'Submit All Sales': 'تأكيد جميع المبيعات',
    'Add Row': 'إضافة صف',
    'Sales Table': 'جدول المبيعات',
    'Product Name': 'اسم المنتج',
    'Total Rows:': 'إجمالي الصفوف:',
    'Valid Rows:': 'الصفوف الصحيحة:',
    'Total Profit:': 'إجمالي الربح:',
    'Search product...': 'البحث عن منتج...',
    'No products found': 'لم يتم العثور على منتجات',
    'Stock:': 'المخزون:',
    'Price:': 'السعر:',
    'Not set': 'غير محدد',
    'Confirm sale of': 'تأكيد بيع',
    'product(s)? This will update stock and create sales records.': 'منتج(ات)؟ سيتم تحديث المخزون وإنشاء سجلات المبيعات.',
    'Are you sure you want to delete this sale?': 'هل أنت متأكد من حذف هذه المبيعة؟',
    'This will restore the stock quantity.': 'سيتم استعادة كمية المخزون.',
    'Sale deleted successfully. Stock has been restored.': 'تم حذف المبيعة بنجاح. تم استعادة المخزون.',
    'Successfully created': 'تم الإنشاء بنجاح',
    'sale(s)! Total profit:': 'مبيعة(ات)! إجمالي الربح:',
    'Error creating sales': 'خطأ في إنشاء المبيعات',
    'Error deleting sale': 'خطأ في حذف المبيعة',
    
    // Expenses
    'Add Expense': 'إضافة مصروف',
    'Expense Log': 'سجل المصروفات',
    'Total:': 'الإجمالي:',
    'Description': 'الوصف',
    'Category': 'الفئة',
    'Amount': 'المبلغ',
    'Edit': 'تعديل',
    'Category:': 'الفئة:',
    'All Categories': 'جميع الفئات',
    'Start Date:': 'تاريخ البداية:',
    'End Date:': 'تاريخ النهاية:',
    'Apply Filters': 'تطبيق الفلاتر',
    'Clear': 'مسح',
    'No description': 'لا يوجد وصف',
    'No expenses found': 'لم يتم العثور على مصروفات',
    'Expenses (Excel Style)': 'المصروفات',
    'Submit All Expenses': 'تأكيد جميع المصروفات',
    'Expenses Table': 'جدول المصروفات',
    'Expense Description': 'وصف المصروف',
    'Expense Amount': 'مبلغ المصروف',
    'Expense Date': 'تاريخ المصروف',
    'Expense Category': 'فئة المصروف',
    'Add New Expense Row': 'إضافة صف مصروف جديد',
    'Confirm expense of': 'تأكيد',
    'expense(s)?': 'مصروف(ات)؟',
    'Expense added successfully': 'تم إضافة المصروف بنجاح',
    'Expense updated successfully': 'تم تحديث المصروف بنجاح',
    'Expense deleted successfully': 'تم حذف المصروف بنجاح',
    'Are you sure you want to delete this expense?': 'هل أنت متأكد من حذف هذا المصروف؟',
    'Error saving expense': 'خطأ في حفظ المصروف',
    'Error deleting expense': 'خطأ في حذف المصروف',
    'Amount must be greater than 0': 'يجب أن يكون المبلغ أكبر من 0',
    'Date is required': 'التاريخ مطلوب',
    
    // Import
    'Import Products': 'استيراد المنتجات',
    'Upload Excel File': 'رفع ملف Excel',
    'Choose file': 'اختر ملف',
    'Upload': 'رفع',
    'Column Mapping': 'تعيين الأعمدة',
    'Map columns from your Excel file to the product fields:': 'قم بتعيين الأعمدة من ملف Excel إلى حقول المنتج:',
    'Product Name:': 'اسم المنتج:',
    'Purchase Price:': 'سعر الشراء:',
    'Sale Price:': 'سعر البيع:',
    'Stock Quantity:': 'كمية المخزون:',
    'Preview': 'معاينة',
    'Confirm Import': 'تأكيد الاستيراد',
    'Reset': 'إعادة تعيين',
    'Please select a file': 'يرجى اختيار ملف',
    'Uploading file...': 'جاري رفع الملف...',
    'File uploaded successfully.': 'تم رفع الملف بنجاح.',
    'Please map the columns below.': 'يرجى تعيين الأعمدة أدناه.',
    'Processing import...': 'جاري معالجة الاستيراد...',
    'Import completed successfully!': 'تم الاستيراد بنجاح!',
    'Error uploading file': 'خطأ في رفع الملف',
    'Error processing import': 'خطأ في معالجة الاستيراد',
    'Please map all required columns (Name, Purchase Price, Quantity)': 'يرجى تعيين جميع الأعمدة المطلوبة (الاسم، سعر الشراء، الكمية)',
    'Created:': 'تم الإنشاء:',
    'products': 'منتجات',
    'Updated:': 'تم التحديث:',
    'Errors:': 'الأخطاء:',
    'Showing first': 'عرض أول',
    'of': 'من',
    'rows': 'صفوف',
    'Showing all': 'عرض الكل',
    
    // Products
    'Product Name': 'اسم المنتج',
    'Purchase Price': 'سعر الشراء',
    'Sale Price': 'سعر البيع',
    'Stock Quantity': 'كمية المخزون',
    'Add Product': 'إضافة منتج',
    'Edit Product': 'تعديل منتج',
    'Save': 'حفظ',
    'Cancel': 'إلغاء',
    'Search products...': 'البحث عن منتجات...',
    'No products found': 'لم يتم العثور على منتجات',
    
    // History
    'Import History': 'سجل الاستيراد',
    'Deletion Log': 'سجل الحذف',
    'Filename': 'اسم الملف',
    'Total Rows': 'إجمالي الصفوف',
    'Created': 'تم الإنشاء',
    'Updated': 'تم التحديث',
    'Errors': 'الأخطاء',
    'Date': 'التاريخ',
    'Entity Type': 'نوع الكيان',
    'Entity ID': 'معرف الكيان',
    'Entity Name': 'اسم الكيان',
    'Details': 'التفاصيل',
    
    // Reset Modal
    'Reset All Data': 'إعادة تعيين جميع البيانات',
    'Warning!': 'تحذير!',
    'This will permanently delete all products, sales, expenses, and history. This action cannot be undone.': 'سيتم حذف جميع المنتجات والمبيعات والمصروفات والسجل بشكل دائم. لا يمكن التراجع عن هذا الإجراء.',
    'Enter Password:': 'أدخل كلمة المرور:',
    'Password': 'كلمة المرور',
    'All data has been reset successfully': 'تم إعادة تعيين جميع البيانات بنجاح',
    'Incorrect password': 'كلمة مرور غير صحيحة',
    'Error resetting data': 'خطأ في إعادة تعيين البيانات',
    'Please enter the password': 'يرجى إدخال كلمة المرور'
  }
};

// Helper function to get translation
function t(key) {
  return translations[currentLanguage][key] || key;
}

// Initialize language
function initLanguage() {
  applyLanguage(currentLanguage, currentDirection);
}

// Toggle language
function toggleLanguage() {
  if (currentLanguage === 'en') {
    currentLanguage = 'ar';
    currentDirection = 'rtl';
  } else {
    currentLanguage = 'en';
    currentDirection = 'ltr';
  }
  
  localStorage.setItem('language', currentLanguage);
  localStorage.setItem('direction', currentDirection);
  
  applyLanguage(currentLanguage, currentDirection);
}

// Apply language and direction
function applyLanguage(lang, dir) {
  // Set HTML direction
  const html = document.getElementById('html-root') || document.documentElement;
  html.setAttribute('dir', dir);
  html.setAttribute('lang', lang);
  
  // Update all elements with data-en and data-ar attributes
  document.querySelectorAll('[data-en][data-ar]').forEach(el => {
    const text = lang === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-en');
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = text;
    } else if (el.tagName === 'OPTION') {
      el.textContent = text;
    } else {
      el.textContent = text;
    }
  });
  
  // Update title
  const title = document.querySelector('title');
  if (title) {
    title.textContent = lang === 'ar' ? title.getAttribute('data-ar') : title.getAttribute('data-en');
  }
  
  // Update Bootstrap classes for RTL
  if (dir === 'rtl') {
    document.body.classList.add('rtl');
    // Adjust margin/padding classes
    document.querySelectorAll('.me-2').forEach(el => {
      el.classList.remove('me-2');
      el.classList.add('ms-2');
    });
    document.querySelectorAll('.ms-2').forEach(el => {
      el.classList.remove('ms-2');
      el.classList.add('me-2');
    });
  } else {
    document.body.classList.remove('rtl');
    // Restore original classes
    document.querySelectorAll('.ms-2').forEach(el => {
      if (!el.classList.contains('rtl-ms-2')) {
        el.classList.remove('ms-2');
        el.classList.add('me-2');
      }
    });
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLanguage);
} else {
  initLanguage();
}


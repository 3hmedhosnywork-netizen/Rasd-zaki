# مرسال المواقع — نسخة إعادة البناء 1


- مشاركة رابط Google Maps إلى التطبيق أو لصقه يدويًا.
- تحديد بادئة الكود والرقم الأول يدويًا؛ يظل الحقلان فارغين عند أول تشغيل.
- إضافة المواقع بترقيم متتابع، مع حفظها على الجهاز.
- إرسال الكل إلى واتساب في رسالة واحدة، وكل موقع بتنسيق: الرابط ثم عدة أسطر فارغة ثم الكود.
- إعادة إرسال موقع منفرد دون تغيير ترتيبه أو حالة إرساله.
- زر مسح المكتمل يحذف العناصر التي تم تأكيد إرسالها فقط.
- قائمة مواقع صغيرة ومختصرة.

## النشر
ارفع كل ملفات هذا المجلد إلى جذر مستودع GitHub Pages (بدون رفع المجلد نفسه كطبقة إضافية). ثم Settings > Pages > Deploy from branch > main > /(root).

## ملاحظة مشاركة Maps
Share Target على Android/Chrome يعتمد على دعم النظام والمتصفح وكون التطبيق مثبتًا من Pages. إذا لم يظهر التطبيق ضمن قائمة مشاركة Google Maps، يمكن لصق الرابط داخل التطبيق يدويًا.


## V2 changes (Nov 19, 2026)
- Send-all now opens WhatsApp with one pending site per message, in list order.
- The send-all button label shows the next pending site code; after confirming a site sent, it points to the next pending site.
- Clear button is now “مسح الكل” and removes all saved sites, pending and sent, after confirmation.
- This version was checked for archive/file integrity; WhatsApp and Android share-target behavior still needs a real-device test.


## V5: pin-code extraction from Google Maps shares

The share handler now searches the human-readable share title/text (before any URL) for a code such as A111 or M68. If it finds one, it saves the shared Maps link under that exact code and blocks duplicate codes. If the share payload contains only a URL, the app leaves the link ready and asks the user to enter the pin code manually instead of inventing a sequential code. The share payload format varies by source app/Android; this extraction must be tested on the user device to confirm Google Maps includes the pin label.


## V6: Import whole Google My Maps export
- Added KML import, reading placemark names and coordinates.
- Creates Google Maps coordinate links and uses pin labels as codes.
- Skips duplicate codes/links and prompts before importing.
- KMZ support included for common stored/deflate ZIP entries, subject to browser DecompressionStream support.
- This import requires the user to export their map from Google My Maps to KML/KMZ first; it does not fetch private map contents directly from Google Maps.


## V7 update
- Adds JSON import support for Android-friendly site data files.
- Retains existing KML and KMZ import and all V6 app features.
- V7 adds a JSON import path for Android-friendly file picking while preserving V6 KML/KMZ import.


## V9 Android file picker fix (Nov 22, 2026)
- Broadened file picker MIME/extension acceptance for Android document providers.
- Added immediate visible confirmation after file selection.
- Added FileReader fallback when File.text() is unavailable.
- Detect JSON by filename extension or MIME type.
- Cache version bumped to v9 so installed PWA can refresh assets.

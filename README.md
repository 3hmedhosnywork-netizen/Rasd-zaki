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

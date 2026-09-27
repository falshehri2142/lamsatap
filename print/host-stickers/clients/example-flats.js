// مثال: ملصقات وحدة «شقق المثال» (مضيف وهمي). لكل وحدة: انسخ الملف باسمها، وافتح print/host-stickers/index.html?client=<الاسم>
// ممنوع على الملصق (GM-003): رقم الوحدة، والدور، ورمز الباب، ورقم المضيف أو العاملة.
window.HOST_DATA = {
  url: "https://example.com/t/EXAMPLE789/",   // نفس رابط شريحة الوحدة (/t/<code>/). مؤقت لين يجي الدومين
  brand: {
    name: "شقق المثال",                                   // بدون شعار: الاسم يطلع على لوح رملي (GM-027)
    logo: "../../website/demo/_brands/apartments.svg",    // ملف محلي، مساره من print/host-stickers/
    color: "#1F3B57",
    print: ""
  }
};

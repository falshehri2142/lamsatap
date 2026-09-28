// مثال ثاني: مضيف بدون شعار ولا لون (GM-027 بند 2): اسم العقار يطلع نص بالحبر، ونقطة اللمس سوداء (الثيم المحايد).
// ووافق على سطر «بواسطة لمسة تاب» (poweredBy: true): على لوحة الباب يطلع آخر البطاقة، وعلى الستاندات في الخلف.
// افتح: print/host-signs/index.html?client=example-studio
window.HOST_SIGNS = {
  brand: { name: "استوديو المثال", logo: "", color: "", print: "" },
  poweredBy: true,
  urls: {
    checkout:  "https://example.com/t/EXAMPLEOUT02/",
    wifi:      "https://example.com/t/EXAMPLEWIFI2/",
    emergency: "https://example.com/t/EXAMPLESOS02/",
    guide:     "https://example.com/t/EXAMPLEGUID2/"
  },
  wifi: { ssid: "Studio-Mithal", password: "" },   // بدون كلمة مرور: «الشبكة مفتوحة، بدون كلمة مرور.» (web-copy §2.3)
  checkoutTime: "",
  checkoutTimeEn: "",
  hostPhone: "",
  unified911: true,
  guideItems: ["ac", "rules", "address"]
};

const cfg = window.FELLAH_CONFIG || {};
const configured = cfg.SUPABASE_URL?.startsWith("https://") && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes("PASTE_");
let db = null;
if (configured && window.supabase) db = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

const dialog = document.querySelector("#authDialog");
let mode = "login";
function openAuth(next) {
  mode = next;
  document.querySelector("#authTitle").textContent = next === "signup" ? "إنشاء حساب جديد" : "دخول";
  document.querySelectorAll(".signupOnly").forEach(el => el.style.display = next === "signup" ? "block" : "none");
  document.querySelector("#authSubmit").textContent = next === "signup" ? "إنشاء الحساب" : "دخول";
  document.querySelector("#authMessage").textContent = "";
  dialog.showModal();
}
document.querySelector("#loginOpen").onclick = () => openAuth("login");
document.querySelector("#signupOpen").onclick = () => openAuth("signup");
document.querySelector("#authSubmit").onclick = async () => {
  const msg = document.querySelector("#authMessage");
  if (!db) { msg.textContent = "أضف إعدادات Supabase في config.js أولاً."; return; }
  const email = document.querySelector("#email").value.trim();
  const password = document.querySelector("#password").value;
  let result;
  if (mode === "signup") {
    const full_name = document.querySelector("#fullName").value.trim();
    const role = document.querySelector("#role").value;
    result = await db.auth.signUp({email, password, options:{data:{full_name, role}}});
  } else result = await db.auth.signInWithPassword({email,password});
  msg.textContent = result.error ? result.error.message : "تم إرسال/تنفيذ الطلب. تفقد بريدك إذا طُلب تأكيد الحساب.";
};
async function loadProducts() {
  const holder = document.querySelector("#products");
  if (!db) { holder.innerHTML = '<p class="muted">الواجهة جاهزة. بعد ربط قاعدة البيانات ستظهر عروض الفلاحين هنا.</p>'; return; }
  const {data,error} = await db.from("products").select("id,name,description,price,unit,region,category").eq("is_active",true).order("created_at",{ascending:false});
  if (error) { holder.textContent = "تعذّر تحميل المنتجات حالياً."; return; }
  const emojis = {vegetables:"🥬",fruit:"🍊",grains:"🌾",olive:"🫒",other:"🌱"};
  holder.innerHTML = "";
  (data || []).forEach(p => {
    const card = document.createElement("article"); card.className = "product";
    const emoji = document.createElement("div"); emoji.className="emoji"; emoji.textContent=emojis[p.category]||"🌱";
    const h = document.createElement("h3"); h.textContent=p.name;
    const desc = document.createElement("p"); desc.className="muted"; desc.textContent=[p.region,p.description].filter(Boolean).join(" • ");
    const price = document.createElement("div"); price.className="price"; price.textContent=`${p.price} د.ت / ${p.unit}`;
    card.append(emoji,h,desc,price); holder.append(card);
  });
  if (!data?.length) holder.innerHTML='<p class="muted">ما فماش عروض منشورة توّة. كن أوّل فلاح يضيف منتوج.</p>';
}
document.querySelector("#search").addEventListener("input", e => {
  const q=e.target.value.trim().toLowerCase();
  document.querySelectorAll(".product").forEach(c=>c.style.display=c.textContent.toLowerCase().includes(q)?"":"none");
});
loadProducts();

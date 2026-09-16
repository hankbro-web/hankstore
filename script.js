import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc, updateDoc, deleteDoc, setDoc, where } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),storage=getStorage(app);
const money=n=>"₹"+Number(n||0).toLocaleString("en-IN");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
const defaults=[];let products=defaults,cart=JSON.parse(localStorage.getItem("hankCart")||"[]");

function toast(msg){const t=document.getElementById("toast");if(t){t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}else alert(msg)}
function saveCart(){localStorage.setItem("hankCart",JSON.stringify(cart));updateCount()}
function updateCount(){document.querySelectorAll("#cart-count").forEach(x=>x.textContent=cart.reduce((s,i)=>s+i.quantity,0))}
function toggleMenu(){document.getElementById("navbar")?.classList.toggle("show")}
function addToCart(id,qty=1){const p=products.find(x=>x.id===id);if(!p)return;const item=cart.find(x=>x.id===id);item?item.quantity+=qty:cart.push({id,quantity:qty});saveCart();toast("Added to cart 🛒")}
function imageMarkup(p,cls="product-image"){return `<div class="${cls}">${p.imageUrl?`<img src="${esc(p.imageUrl)}" alt="${esc(p.name)}" loading="lazy">`:`<span class="fallback-icon">${esc(p.icon||"🛍️")}</span>`}</div>`}
function card(p){return `<article class="product-card"><a href="product.html?id=${encodeURIComponent(p.id)}">${imageMarkup(p)} </a><div class="product-info"><span class="product-cat">${esc(p.category||"product")}</span><h3>${esc(p.name)}</h3><div class="price-row"><span class="price">${money(p.price)}</span>${p.originalPrice?`<span class="old-price">${money(p.originalPrice)}</span>`:""}</div><button class="add-btn" onclick="addToCart('${esc(p.id)}')">Add to Cart</button></div></article>`}
function renderProducts(){const f=document.getElementById("featured-products"),g=document.getElementById("all-products");if(f)f.innerHTML=products.slice(0,4).map(card).join("");if(g){const q=(document.getElementById("search")?.value||"").toLowerCase(),c=document.getElementById("category")?.value||"all",s=document.getElementById("sort")?.value;let list=products.filter(p=>(`${p.name} ${p.category}`.toLowerCase().includes(q))&&(c==="all"||p.category===c));if(s==="low")list.sort((a,b)=>a.price-b.price);if(s==="high")list.sort((a,b)=>b.price-a.price);g.innerHTML=list.map(card).join("");const n=document.getElementById("no-products");if(n)n.hidden=!!list.length}}
function listenProducts(){try{return onSnapshot(query(collection(db,"products"),orderBy("createdAt","desc")),snap=>{products=snap.docs.map(d=>({id:d.id,...d.data()}));renderProducts();loadProduct();loadCart();loadCheckout();renderAdminProducts()},err=>{console.warn(err);renderProducts()})}catch(e){console.warn(e)}}
function loadProduct(){const el=document.getElementById("product-detail");if(!el)return;const id=new URLSearchParams(location.search).get("id"),p=products.find(x=>String(x.id)===String(id));if(!p){el.innerHTML=`<div class="empty"><h2>Product not found</h2><a class="btn" href="shop.html">Back to Shop</a></div>`;return}el.innerHTML=`<div class="detail-grid"><div class="detail-image">${p.imageUrl?`<img src="${esc(p.imageUrl)}" alt="${esc(p.name)}">`:`<span class="fallback-icon">${esc(p.icon||"🛍️")}</span>`}</div><div class="detail-info"><p class="eyebrow">${esc(p.category)}</p><h1>${esc(p.name)}</h1><div class="price-row"><span class="price">${money(p.price)}</span>${p.originalPrice?`<span class="old-price">${money(p.originalPrice)}</span>`:""}</div><p class="desc">${esc(p.description||"Premium HankStore product.")}</p><div class="quantity"><b>Quantity</b><input id="detail-qty" class="input" type="number" min="1" max="20" value="1"></div><button class="btn" onclick="addToCart('${esc(p.id)}',Number(document.getElementById('detail-qty').value)||1)">Add to Cart</button></div></div>`}
function loadCart(){const el=document.getElementById("cart-items");if(!el)return;const empty=document.getElementById("cart-empty"),sum=document.getElementById("cart-summary");if(!cart.length){el.innerHTML="";if(empty)empty.hidden=false;if(sum)sum.hidden=true;return}if(empty)empty.hidden=true;if(sum)sum.hidden=false;let total=0;el.innerHTML=cart.map(i=>{const p=products.find(x=>String(x.id)===String(i.id));if(!p)return"";const t=p.price*i.quantity;total+=t;return `<div class="cart-row"><div class="cart-img">${p.imageUrl?`<img src="${esc(p.imageUrl)}" alt="">`:esc(p.icon||"🛍️")}</div><div class="cart-info"><h3>${esc(p.name)}</h3><p class="muted">${money(p.price)}</p></div><div class="qty"><button onclick="changeQty('${esc(p.id)}',-1)">−</button><b>${i.quantity}</b><button onclick="changeQty('${esc(p.id)}',1)">+</button></div><b>${money(t)}</b><button class="remove" onclick="removeItem('${esc(p.id)}')">Remove</button></div>`}).join("");if(document.getElementById("subtotal"))document.getElementById("subtotal").textContent=money(total);if(document.getElementById("total"))document.getElementById("total").textContent=money(total)}
function changeQty(id,n){const i=cart.find(x=>x.id===id);if(!i)return;i.quantity+=n;if(i.quantity<1)cart=cart.filter(x=>x.id!==id);saveCart();loadCart();loadCheckout()}
function removeItem(id){cart=cart.filter(x=>x.id!==id);saveCart();loadCart();loadCheckout()}
function loadCheckout(){const el=document.getElementById("checkout-items");if(!el)return;let total=0;el.innerHTML=cart.map(i=>{const p=products.find(x=>x.id===i.id);if(!p)return"";const t=p.price*i.quantity;total+=t;return `<div class="summary-line"><span>${esc(p.name)} × ${i.quantity}</span><b>${money(t)}</b></div>`}).join("");const t=document.getElementById("checkout-total");if(t)t.textContent=money(total)}
function setupCheckout(){const f=document.getElementById("checkout-form");if(!f)return;onAuthStateChanged(auth,u=>{const hint=document.getElementById("login-hint");if(hint)hint.innerHTML=u?`Signed in as <b>${esc(u.email)}</b>.`:`Please <a class="text-link" href="login.html?next=checkout.html">login</a> before placing your order.`});f.onsubmit=async e=>{e.preventDefault();if(!cart.length)return toast("Your cart is empty.");if(!auth.currentUser)return location.href="login.html?next=checkout.html";const btn=f.querySelector("button[type=submit]");btn.disabled=true;try{const total=cart.reduce((s,i)=>{const p=products.find(x=>x.id===i.id);return s+(p?p.price*i.quantity:0)},0);const customer={name:document.getElementById("name").value.trim(),email:document.getElementById("email").value.trim()||auth.currentUser.email||"",phone:document.getElementById("phone").value.trim(),address:document.getElementById("address").value.trim(),city:document.getElementById("city").value.trim(),pincode:document.getElementById("pincode").value.trim()};const payment=document.querySelector("input[name=payment]:checked")?.value||"cod";const refDoc=await addDoc(collection(db,"orders"),{customer,payment,items:cart.map(i=>{const p=products.find(x=>x.id===i.id);return{id:i.id,name:p?.name||"Product",price:p?.price||0,quantity:i.quantity}}),total,status:"New",createdAt:serverTimestamp(),customerUid:auth.currentUser.uid,deliveryBoyUid:"",deliveryBoyEmail:""});cart=[];saveCart();toast("Order placed successfully!");setTimeout(()=>location.href=`index.html?order=${refDoc.id}`,700)}catch(err){toast("Order failed: "+err.message);btn.disabled=false}}}
function fillEmail(){const e=document.getElementById("email"),u=auth.currentUser;if(e&&u&&!e.value)e.value=u.email||""}
async function demoLogin(e){e.preventDefault();const form=e.target,email=form.querySelector("input[type=email]").value.trim(),pass=form.querySelector("input[type=password]").value;try{await signInWithEmailAndPassword(auth,email,pass);const next=new URLSearchParams(location.search).get("next")||"index.html";location.href=next}catch(err){toast(err.message)}}
async function createAccount(){const email=document.getElementById("signup-email")?.value.trim(),pass=document.getElementById("signup-password")?.value;if(!email||!pass)return toast("Enter email and password.");try{await createUserWithEmailAndPassword(auth,email,pass);toast("Account created successfully!");setTimeout(()=>location.href="index.html",500)}catch(err){toast(err.message)}}
function showAuthTab(tab){document.querySelectorAll("[data-auth-tab]").forEach(x=>x.classList.toggle("active",x.dataset.authTab===tab));document.getElementById("login-box")?.classList.toggle("hide",tab!=="login");document.getElementById("signup-box")?.classList.toggle("hide",tab!=="signup")}
async function adminLogin(e){e.preventDefault();const email=document.getElementById("admin-email").value.trim(),pass=document.getElementById("admin-password").value;try{const r=await signInWithEmailAndPassword(auth,email,pass),a=await getDoc(doc(db,"admins",r.user.uid));if(!a.exists()||a.data().active!==true){await signOut(auth);return toast("This account is not an active admin.")}location.href="index.html"}catch(err){toast("Login failed: "+err.message)}}
async function requireAdmin(){if(!location.pathname.includes("/admin/")||location.pathname.endsWith("login.html"))return;onAuthStateChanged(auth,async u=>{if(!u)return location.href="login.html";const a=await getDoc(doc(db,"admins",u.uid));if(!a.exists()||a.data().active!==true){await signOut(auth);location.href="login.html"}else initAdmin()})}

function renderAdminProducts(){const el=document.getElementById("admin-products-list");if(!el)return;el.innerHTML=products.map(p=>`<div class="admin-product">${p.imageUrl?`<img src="${esc(p.imageUrl)}" alt="${esc(p.name)}">`:`<div class="product-image" style="height:160px"><span class="fallback-icon">${esc(p.icon||"🛍️")}</span></div>`}<div class="ap-body"><b>${esc(p.name)}</b><p class="muted">${money(p.price)} · ${esc(p.category)}</p><button class="btn danger" onclick="deleteProduct('${esc(p.id)}','${esc(p.imagePath||"")}')">Delete</button></div></div>`).join("")||`<div class="empty">Your uploaded products will appear here.</div>`}
async function deleteProduct(id,path){if(!confirm("Delete this product?"))return;try{await deleteDoc(doc(db,"products",id));if(path){try{await deleteObject(ref(storage,path))}catch(e){}}toast("Product deleted")}catch(e){toast(e.message)}}
function previewFiles(files){const wrap=document.getElementById("upload-preview");if(!wrap)return;wrap.innerHTML="";[...files].slice(0,3).forEach(file=>{const url=URL.createObjectURL(file);wrap.innerHTML+=`<img src="${url}" alt="preview">`})}
async function uploadProductImages(files,productId){const urls=[];for(let i=0;i<Math.min(files.length,3);i++){const file=files[i];if(!file.type.startsWith("image/"))continue;if(file.size>5*1024*1024)throw new Error("Each image must be under 5MB.");const path=`products/${productId}/${Date.now()}-${i}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`,r=ref(storage,path);await uploadBytes(r,file,{contentType:file.type});urls.push({url:await getDownloadURL(r),path})}return urls}

function listenDeliveryBoys(){
  const el=document.getElementById("delivery-boys-list"); if(!el)return;
  onSnapshot(collection(db,"deliveryBoys"),snap=>{
    const boys=snap.docs.map(d=>({uid:d.id,...d.data()}));
    const count=document.getElementById("delivery-count"); if(count)count.textContent=boys.length;
    el.innerHTML=boys.map(b=>`<div class="order-card"><div class="order-top"><div><b>${esc(b.email)}</b><p class="muted">${b.name?esc(b.name):"Delivery Boy"}</p></div><div class="status">${b.active===false?"INACTIVE":"ACTIVE"}</div></div><button class="btn danger" onclick="removeDeliveryBoy('${esc(b.uid)}')">Remove access</button></div>`).join("")||`<div class="empty">No delivery boys added yet.</div>`;
  });
}
async function addDeliveryBoy(){
  const email=document.getElementById("delivery-email")?.value.trim().toLowerCase();
  if(!email)return toast("Enter delivery boy email.");
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return toast("Enter a valid email.");
  try{
    await setDoc(doc(db,"deliveryInvites",email),{email,active:true,createdAt:serverTimestamp()});
    toast("Delivery email added. They can create/login with this email.");
    const f=document.getElementById("delivery-email");if(f)f.value="";
  }catch(e){toast(e.message)}
}
async function removeDeliveryBoy(uid){
  if(!confirm("Remove this delivery boy's access?"))return;
  try{await updateDoc(doc(db,"deliveryBoys",uid),{active:false});toast("Delivery access removed.")}catch(e){toast(e.message)}
}
async function assignOrder(orderId){
  const sel=document.getElementById("assign-"+orderId);const uid=sel?.value;
  if(!uid)return toast("Select a delivery boy.");
  try{
    const b=await getDoc(doc(db,"deliveryBoys",uid));if(!b.exists()||b.data().active===false)return toast("Delivery boy is not active.");
    await updateDoc(doc(db,"orders",orderId),{deliveryBoyUid:uid,deliveryBoyEmail:b.data().email||"",status:"Assigned"});
    toast("Order assigned.");
  }catch(e){toast(e.message)}
}
function initAdmin(){
  const form=document.getElementById("admin-form"),filesInput=document.getElementById("pimages"),preview=document.getElementById("upload-preview");
  filesInput?.addEventListener("change",()=>previewFiles(filesInput.files));
  listenDeliveryBoys();
  onSnapshot(collection(db,"deliveryBoys"),boysSnap=>{
    const boys=boysSnap.docs.map(d=>({uid:d.id,...d.data()})).filter(b=>b.active!==false);
    onSnapshot(collection(db,"orders"),snap=>{
      const orders=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
      document.getElementById("admin-orders").textContent=orders.length;document.getElementById("admin-revenue").textContent=money(orders.reduce((s,o)=>s+Number(o.total||0),0));
      const el=document.getElementById("admin-orders-list");
      el.innerHTML=orders.map(o=>{
        const opts=boys.map(b=>`<option value="${esc(b.uid)}" ${o.deliveryBoyUid===b.uid?"selected":""}>${esc(b.email)}</option>`).join("");
        return `<div class="order-card"><div class="order-top"><div><b>#${esc(o.id.slice(0,10))}</b><p class="muted">${o.createdAt?.toDate?o.createdAt.toDate().toLocaleString():"Just now"}</p></div><div><b>${money(o.total)}</b><div class="status">${esc(o.status||"New")}</div></div></div><p><b>Customer:</b> ${esc(o.customer?.name)}</p><p><b>Email:</b> ${esc(o.customer?.email)} · <b>Phone:</b> ${esc(o.customer?.phone)}</p><p><b>Address:</b> ${esc(o.customer?.address)}, ${esc(o.customer?.city)} - ${esc(o.customer?.pincode)}</p><p><b>Payment:</b> ${esc(o.payment)}</p><p><b>Items:</b> ${(o.items||[]).map(i=>`${esc(i.name)} × ${i.quantity}`).join(", ")}</p><div class="two"><select id="assign-${esc(o.id)}" class="input"><option value="">${o.deliveryBoyEmail?esc(o.deliveryBoyEmail):"Select delivery boy"}</option>${opts}</select><button class="btn" onclick="assignOrder('${esc(o.id)}')">Assign Delivery</button></div></div>`;
      }).join("")||`<div class="empty"><h3>No orders yet</h3><p>New orders will appear here automatically.</p></div>`;
    },err=>document.getElementById("admin-orders-list").innerHTML=`<div class="empty">${esc(err.message)}</div>`);
  });
  onSnapshot(collection(db,"products"),snap=>{document.getElementById("admin-products").textContent=snap.size;renderAdminProducts()});
  form?.addEventListener("submit",async e=>{e.preventDefault();const btn=form.querySelector("button[type=submit]"),files=[...(filesInput?.files||[])];btn.disabled=true;try{const name=document.getElementById("pname").value.trim(),price=Number(document.getElementById("pprice").value),originalPrice=Number(document.getElementById("poriginal").value)||0,category=document.getElementById("pcategory").value,desc=document.getElementById("pdescription").value.trim(),icon=document.getElementById("picon").value.trim()||"🛍️";const refDoc=await addDoc(collection(db,"products"),{name,price,originalPrice,category,description:desc,icon,createdAt:serverTimestamp(),imageUrl:"",imagePath:""});if(files.length){const uploaded=await uploadProductImages(files,refDoc.id);if(uploaded[0])await updateDoc(doc(db,"products",refDoc.id),{imageUrl:uploaded[0].url,imagePath:uploaded[0].path,imageUrls:uploaded.map(x=>x.url),imagePaths:uploaded.map(x=>x.path)})}form.reset();if(preview)preview.innerHTML="";toast("Product added — shop updated live!")}catch(err){toast(err.message)}finally{btn.disabled=false}});
}

async function deliveryLogin(e){
  e.preventDefault();
  const email=document.getElementById("delivery-login-email")?.value.trim().toLowerCase(),pass=document.getElementById("delivery-login-password")?.value;
  try{
    const r=await signInWithEmailAndPassword(auth,email,pass);
    const inv=await getDoc(doc(db,"deliveryInvites",email));
    const boy=await getDoc(doc(db,"deliveryBoys",r.user.uid));
    if(!inv.exists()||inv.data().active!==true){await signOut(auth);return toast("This email is not approved by admin.")}
    if(!boy.exists()){await setDoc(doc(db,"deliveryBoys",r.user.uid),{email,active:true,createdAt:serverTimestamp()})}
    location.href="index.html";
  }catch(err){toast("Login failed: "+err.message)}
}
async function deliverySignup(e){
  e.preventDefault();
  const email=document.getElementById("delivery-signup-email")?.value.trim().toLowerCase(),pass=document.getElementById("delivery-signup-password")?.value;
  try{
    const inv=await getDoc(doc(db,"deliveryInvites",email));
    if(!inv.exists()||inv.data().active!==true)return toast("Admin must add this email first.");
    const r=await createUserWithEmailAndPassword(auth,email,pass);
    await setDoc(doc(db,"deliveryBoys",r.user.uid),{email,active:true,createdAt:serverTimestamp()});
    toast("Account created.");
    setTimeout(()=>location.href="index.html",500);
  }catch(err){toast(err.message)}
}
async function requireDelivery(){
  if(!location.pathname.includes("/delivery/")||location.pathname.endsWith("login.html"))return;
  onAuthStateChanged(auth,async u=>{
    if(!u)return location.href="login.html";
    const b=await getDoc(doc(db,"deliveryBoys",u.uid));
    if(!b.exists()||b.data().active===false){await signOut(auth);location.href="login.html"}else initDelivery();
  });
}
function initDelivery(){
  const el=document.getElementById("delivery-orders-list"),uid=auth.currentUser?.uid;
  if(!el||!uid)return;
  onSnapshot(query(collection(db,"orders"),where("deliveryBoyUid","==",uid)),snap=>{
    const orders=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
    const count=document.getElementById("delivery-order-count");if(count)count.textContent=orders.length;
    el.innerHTML=orders.map(o=>`<div class="order-card"><div class="order-top"><div><b>Order #${esc(o.id.slice(0,10))}</b><p class="muted">${o.createdAt?.toDate?o.createdAt.toDate().toLocaleString():"Just now"}</p></div><div class="status">${esc(o.status||"Assigned")}</div></div><p><b>Customer:</b> ${esc(o.customer?.name)}</p><p><b>Phone:</b> ${esc(o.customer?.phone)}</p><p><b>Address:</b> ${esc(o.customer?.address)}, ${esc(o.customer?.city)} - ${esc(o.customer?.pincode)}</p><p><b>Amount:</b> ${money(o.total)} · <b>Payment:</b> ${esc(o.payment)}</p><p><b>Items:</b> ${(o.items||[]).map(i=>`${esc(i.name)} × ${i.quantity}`).join(", ")}</p><div class="two"><select id="status-${esc(o.id)}" class="input"><option ${o.status==="Assigned"?"selected":""}>Assigned</option><option ${o.status==="Out for Delivery"?"selected":""}>Out for Delivery</option><option ${o.status==="Delivered"?"selected":""}>Delivered</option></select><button class="btn" onclick="updateDeliveryStatus('${esc(o.id)}')">Update Status</button></div></div>`).join("")||`<div class="empty"><h3>No assigned orders</h3><p>Orders assigned by admin will appear here.</p></div>`;
  });
}
async function updateDeliveryStatus(orderId){
  const status=document.getElementById("status-"+orderId)?.value;
  if(!status)return;
  try{await updateDoc(doc(db,"orders",orderId),{status,deliveryUpdatedAt:serverTimestamp()});toast("Order status updated.")}catch(e){toast(e.message)}
}
async function deliveryLogout(){await signOut(auth);location.href="login.html"}

window.toggleMenu=toggleMenu;window.addToCart=addToCart;window.changeQty=changeQty;window.removeItem=removeItem;window.demoLogin=demoLogin;window.createAccount=createAccount;window.showAuthTab=showAuthTab;window.adminLogin=adminLogin;window.adminLogout=adminLogout;window.clearAllOrders=()=>toast("Orders stay safely in Firestore.");window.deleteProduct=deleteProduct;window.fillEmail=fillEmail;window.addDeliveryBoy=addDeliveryBoy;window.removeDeliveryBoy=removeDeliveryBoy;window.assignOrder=assignOrder;window.deliveryLogin=deliveryLogin;window.deliverySignup=deliverySignup;window.deliveryLogout=deliveryLogout;window.updateDeliveryStatus=updateDeliveryStatus;

document.addEventListener("DOMContentLoaded",()=>{updateCount();renderProducts();loadProduct();loadCart();loadCheckout();setupCheckout();fillEmail();document.getElementById("search")?.addEventListener("input",renderProducts);document.getElementById("category")?.addEventListener("change",renderProducts);document.getElementById("sort")?.addEventListener("change",renderProducts);listenProducts();requireAdmin();requireDelivery()});

# HankStore — Firebase + GitHub Pages

Mobile-first online store with Firebase Authentication, Firestore real-time products/orders, and Firebase Storage product photo uploads.

## Included
- Modern responsive blue/purple/black/white design
- Home, Shop, Product, Cart, Checkout, Customer Login/Signup
- Admin login + live order dashboard
- Admin product creation with up to 3 product images
- Firebase Storage image upload and live Firestore product catalog
- Product delete from admin

## IMPORTANT: one Firebase Storage step
Before using the **product photo upload**, open Firebase Console → Hankstore project → **Storage** → Get started → choose the default security rules flow and finish setup.
Then open Storage → Rules and publish the contents of `storage.rules.example` from this ZIP.

Keep the Firestore rules as previously configured, or publish `firestore.rules.example` if needed.

## GitHub Pages
Upload the **contents of the HankStore folder** to the root of your GitHub repository (do not upload only the ZIP). Then Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save.

Your store will be:
`https://YOUR-USERNAME.github.io/hankstore/`

Admin:
`https://YOUR-USERNAME.github.io/hankstore/admin/login.html`

## Firebase Auth
Email/Password must be enabled. The admin user's UID must have this Firestore document:
`admins/{UID}` with `active` as a Boolean `true`.

If Firebase Auth rejects your GitHub Pages login, add `YOUR-USERNAME.github.io` under Firebase Console → Authentication → Settings → Authorized domains.

## Notes
- Firebase web config is intended to be used in browser code. Never put a Firebase service-account private key or admin SDK credentials in this website.
- Online card payment is not wired yet; checkout currently supports Cash on Delivery and records the selected payment method. For real online payments, add Razorpay/Stripe with server-side verification.
- GitHub Pages sites are public, so do not place secrets/passwords in HTML/JS.

# Ubuntu Multi-Website Server Setup (`/var/www/websites/`)

Aapke server structure ke hisaab se Antra ko ek alag site folder ke roop mein rakhna best hai (kyunki Antra ek single **Next.js full-stack app** hai jisme frontend UI aur backend API routes dono ek hi project mein hain):

```text
/var/www/websites/
├── website1/
│    ├── frontend/
│    └── backend/
├── website2/
│    ├── frontend/
│    └── backend/
└── antra/                  <-- Antra (Next.js Frontend + Backend APIs + storage/)
```

---

## Step 1: Project ko `/var/www/websites/antra` mein rakhein
```bash
sudo mkdir -p /var/www/websites/antra
sudo cp -r /path/to/antra123/. /var/www/websites/antra/
sudo chown -R $USER:$USER /var/www/websites/antra
```

## Step 2: Free Port Check karein
Kyunki `website1` aur `website2` pehle se chal rahi hain, pehle check karein kaun sa port free hai (for example `3001` ya `3002`):
```bash
ss -tulpn
```

## Step 3: Antra Setup Run karein (Existing Sites ko Bina Touch Kiye)
Apne domain aur free port ke saath script chalayein:
```bash
cd /var/www/websites/antra
sudo bash deploy/setup-ubuntu.sh antra.yourdomain.com 3001
```

Yeh script:
- `website1` aur `website2` ke Nginx ya PM2 processes ko **bilkul touch nahi** karti.
- Check karti hai ki port `3001` free hai.
- `npm install` + `npm run build` chalati hai.
- PM2 mein `antra` app ko `127.0.0.1:3001` par start karti hai.
- Sirf `/etc/nginx/sites-available/antra` add karke `nginx reload` karti hai (`500M` video upload limit ke saath).

## Step 4: HTTPS / SSL Lagayein (Zaroori)
Production mode (`next start`) mein login cookies (`secure: true`) aur camera recording (`getUserMedia`) **sirf HTTPS** par chalte hain:
```bash
sudo certbot --nginx -d antra.yourdomain.com
```

*(Optional: PDF download links mein `localhost` ki jagah apna live domain dikhane ke liye `.env` mein `APP_URL=https://antra.yourdomain.com` add kar sakte hain.)*

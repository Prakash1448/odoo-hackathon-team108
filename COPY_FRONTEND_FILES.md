# How to Copy Remaining Frontend Files

Since all the page files already exist in `src/pages/`, you can simply copy them to the frontend folder.

## Windows Command (Quick Copy)

Run this from `c:\Prakash Projects\Omin2\New`:

```cmd
REM Create directories
mkdir frontend\src\pages

REM Copy all page files
for %f in (src\pages\*.jsx) do copy "%f" "frontend\src\pages\"

REM Done
echo All pages copied!
```

Or use PowerShell:

```powershell
# Copy all page files
Copy-Item -Path "src\pages\*" -Destination "frontend\src\pages\" -Force
```

## Manual Copy (If Automatic Doesn't Work)

Copy these files from `src\pages\` to `frontend\src\pages\`:

1. Dashboard.jsx
2. Register.jsx
3. RequestsList.jsx
4. CreateRequest.jsx
5. RequestDetail.jsx
6. Quotations.jsx
7. QuotationDetail.jsx
8. Profile.jsx

## Files Already in Frontend Folder

These are already created in the frontend folder:
✅ Login.jsx
✅ App.jsx
✅ main.jsx
✅ api.js
✅ index.css

## What Happens After Copying

Once all page files are copied to `frontend/src/pages/`, you can:

1. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start frontend:**
   ```bash
   npm run dev
   ```

3. **Access on:** http://localhost:5173

## Final Check

After copying, your frontend folder should have this structure:

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx ✅
│   │   ├── Register.jsx ✅
│   │   ├── Dashboard.jsx ✅
│   │   ├── RequestsList.jsx ✅
│   │   ├── CreateRequest.jsx ✅
│   │   ├── RequestDetail.jsx ✅
│   │   ├── Quotations.jsx ✅
│   │   ├── QuotationDetail.jsx ✅
│   │   └── Profile.jsx ✅
│   ├── components/
│   │   ├── Header.jsx ✅
│   │   └── PrivateRoute.jsx ✅
│   ├── App.jsx ✅
│   ├── main.jsx ✅
│   ├── api.js ✅
│   └── index.css ✅
├── package.json ✅
├── vite.config.js ✅
├── index.html ✅
└── .gitignore ✅
```

All ✅ means ready!

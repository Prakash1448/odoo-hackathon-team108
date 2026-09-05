# Frontend Setup Instructions

## New Project Structure

```
dealflow360/
├── backend/                    (Node.js/Express Backend)
│   ├── server.js
│   ├── database.js
│   ├── auth.js
│   ├── routes/
│   └── scripts/
│
├── frontend/                   (React Frontend - NEW!)
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── api.js
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── .gitignore
│
├── package.json                (Root - Backend packages)
├── .env
└── [Documentation files]
```

## Setup Instructions

### Step 1: Install Backend Dependencies
```bash
cd "c:\Prakash Projects\Omin2\New"
npm install
```

### Step 2: Install Frontend Dependencies
```bash
cd frontend
npm install
```

### Step 3: Start Backend (Terminal 1)
```bash
cd "c:\Prakash Projects\Omin2\New"
npm run server
```

### Step 4: Start Frontend (Terminal 2)
```bash
cd "c:\Prakash Projects\Omin2\New\frontend"
npm run dev
```

### Step 5: Access Application
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## Important Notes

1. **Frontend is now in `/frontend` folder**
   - Install dependencies separately: `cd frontend && npm install`
   - Run frontend separately: `npm run dev` from frontend folder

2. **Backend remains at root**
   - Install dependencies at root: `npm install`
   - Run: `npm run server`

3. **Test Data Script**
   - Run from root: `npm run test:data`

4. **Environment File**
   - `.env` at root configures backend
   - Frontend uses VITE_API_URL environment variable

---

## Frontend Package Installation

The frontend folder has its own `package.json` with only frontend dependencies:
- React 18.2.0
- React Router 6.16.0
- Axios 1.5.0
- Vite 5.0.0

Install by running:
```bash
cd frontend
npm install
```

This will be much faster than before and will only install frontend packages.

---

## Important: Copy Remaining Frontend Files

The following files still need to be copied to the frontend folder:

### Pages (copy from ../src/pages/ to src/pages/):
- Register.jsx
- Dashboard.jsx
- RequestsList.jsx
- CreateRequest.jsx
- RequestDetail.jsx
- Quotations.jsx
- QuotationDetail.jsx
- Profile.jsx

### Run this command from the frontend folder to copy them:
```bash
# Windows Command Prompt
copy ..\src\pages\*.jsx src\pages\
```

Or manually copy each file from `c:\Prakash Projects\Omin2\New\src\pages\*` to `c:\Prakash Projects\Omin2\New\frontend\src\pages\*`

---

## Structure Summary

- **Backend**: Stays at root `c:\Prakash Projects\Omin2\New\`
- **Frontend**: Now in `c:\Prakash Projects\Omin2\New\frontend\`
- **Each has its own `package.json`** and dependencies
- **Frontend runs on port 5173**
- **Backend runs on port 5000**

Done! Now you have a proper separated frontend and backend structure! 🎉

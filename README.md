# Poultry Farm Mortality Management System

A production-ready, enterprise-grade web application for poultry farm mortality tracking, farm & shade architecture management, batch lifecycle supervision, role-based manager access control, real-time alert notifications, and certified PDF report generation.

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC):**
   - **ADMIN**: Complete platform oversight, manager access request approval/rejection, account enable/disable, global analytics & trends, farm-wise and batch-wise mortality intelligence, certified PDF reporting, and comprehensive audit logs.
   - **MANAGER**: Strict isolation—managers only see and manage farms and batches assigned to them. Daily mortality logging with live bird count calculations, history tracking, report generation, and profile management.

2. **Manager Registration & Approval Flow:**
   - **Step 1 — Registration**: Manager enters Full Name, Email, Phone, and Password. Account is created in `PENDING_VERIFICATION` status and a 6-digit OTP is generated.
   - **Step 2 — Email Verification**: Manager enters the 6-digit OTP with a live countdown timer. Once verified, account moves to `PENDING_ADMIN_APPROVAL`.
   - **Step 3 — Admin Approval**: Admin reviews incoming manager requests and approves or rejects access. Only approved managers can log in and manage farms.

3. **Core Mortality Management & Validations:**
   - **Hierarchical Scoping**: Farm → Shade → Batch → Mortality.
   - **Live Calculations**:
     - $\text{Total Mortality} = \sum(\text{mortality counts for batch})$
     - $\text{Current Birds} = \text{Initial Birds} - \text{Total Mortality}$
     - $\text{Mortality \%} = \left(\frac{\text{Total Mortality}}{\text{Initial Birds}}\right) \times 100$
   - **Strict Business Validations**:
     - Prevents mortality count exceeding current bird count.
     - Prevents negative or zero mortality.
     - Enforces duplicate prevention for same batch, shade, and date.
     - Prevents entries on inactive or completed batches.
     - Automatically decrements batch living birds upon save.
     - Dispatches real-time notification to administrators upon every submission.

4. **Certified PDF Report Generation & Printing:**
   - Native backend PDF generation using **ReportLab** producing publication-quality reports with key KPI metrics, batch summary, and daily mortality tables.
   - Print-friendly layout that hides headers, navigation, and buttons, optimized for standard A4 paper.

5. **Real-time Notifications & Audit Logging:**
   - In-app notification bell with unread counter badge.
   - Automatic toast alerts on new mortality reports and manager requests.
   - Immutable audit trail recording user, action, entity type, and diff payload.

---

## 🚀 Quick Evaluation Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@poultryfarm.com` | `Admin@123456` | Full platform oversight & approvals |
| **MANAGER (Approved)** | `john@poultryfarm.com` | `Manager@123` | Assigned to *Green Valley Poultry Farm* |
| **MANAGER (Approved)** | `sarah@poultryfarm.com` | `Manager@123` | Assigned to *Sunrise Avian Farms* |
| **MANAGER (Pending)** | `pending@poultryfarm.com` | `Manager@123` | Awaiting administrator approval |

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.13)
- **Database ORM**: SQLAlchemy 2.0
- **Database Engine**: PostgreSQL & SQLite
- **Security**: JWT Access & Refresh Tokens, Bcrypt password hashing
- **PDF Generation**: ReportLab
- **Data Validation**: Pydantic v2 & Pydantic-Settings
- **Real-Time**: WebSockets & Periodic Polling

### Frontend
- **Core**: React.js (Vite)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v7
- **Charts & Visualizations**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios with automatic JWT interceptors

---

## 💻 Running the Application Locally

### 1. Backend Server
```bash
cd backend

# Activate virtual environment
.\venv\Scripts\activate   # On Windows
# source venv/bin/activate # On Linux/macOS

# Run database migrations / seed
python seed.py

# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API and Swagger interactive documentation will be available at:
- **API URL**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Frontend Application
```bash
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Vite dev server
npm run dev
```
The frontend dashboard will be available at:
- **Web App**: [http://localhost:5173](http://localhost:5173)

---

## 📂 Project Architecture

```
poltry web/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, database engine, security & JWT
│   │   ├── dependencies/   # Auth & RBAC injection dependencies
│   │   ├── models/         # SQLAlchemy models (User, Farm, Shade, Batch, Mortality, Notification, Audit)
│   │   ├── routers/        # FastAPI endpoints (Auth, Admin, Managers, Farms, Shades, Batches, Mortality, Reports, Notifications)
│   │   ├── schemas/        # Pydantic request/response validation schemas
│   │   ├── services/       # Business logic layer (Auth, Mortality, Farm, Batch, Notification, PDF, Email, Audit)
│   │   ├── utils/          # WebSocket connection manager
│   │   └── main.py         # Application root with CORS & exception handlers
│   ├── tests/              # Pytest automated test suite
│   ├── seed.py             # Database initialization and demo seeder
│   └── requirements.txt    # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── components/     # StatCard, Badge, LoadingSpinner, NotificationDropdown, ProtectedRoute
    │   ├── context/        # AuthContext, ToastContext, NotificationContext
    │   ├── layouts/        # DashboardLayout, Sidebar, Navbar
    │   ├── pages/
    │   │   ├── auth/       # Login, Register, VerifyOtp, PendingApproval
    │   │   ├── admin/      # Dashboard, Managers, Farms, Batches, Mortality, Reports, AuditLogs
    │   │   └── manager/    # Dashboard, AddMortality, Farms, Batches, History, Reports, Profile
    │   ├── services/       # Axios API client modules
    │   ├── App.jsx         # Main router and route definitions
    │   └── index.css       # Tailwind base styles, typography, and print CSS
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 🧪 Testing

Run the automated backend test suite:
```bash
cd backend
.\venv\Scripts\python -m pytest -v
```
Tests cover:
- Authentication & JWT token issuing
- Admin authorization enforcement
- Manager isolation & access restrictions
- Invalid mortality rejection (exceeding living birds)
- Binary PDF generation & streaming

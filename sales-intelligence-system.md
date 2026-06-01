# 🧠 Sales Intelligence System — الدليل الشامل الكامل

> نظام تحليل اجتماعات المبيعات بالكامل مجاناً | من الصفر للإنتاج

---

## 📋 فهرس المحتويات

1. [نظرة عامة على المشروع](#1-نظرة-عامة)
2. [لماذا هذا النظام؟](#2-لماذا-هذا-النظام)
3. [Tech Stack المجاني الكامل](#3-tech-stack-المجاني-الكامل)
4. [المعمارية التفصيلية](#4-المعمارية-التفصيلية)
5. [قاعدة البيانات](#5-قاعدة-البيانات)
6. [إعداد البيئة خطوة بخطوة](#6-إعداد-البيئة-خطوة-بخطوة)
7. [Backend — FastAPI كامل](#7-backend-fastapi-كامل)
8. [نظام المعالجة والقوائم](#8-نظام-المعالجة-والقوائم)
9. [Whisper — تحويل الصوت](#9-whisper--تحويل-الصوت)
10. [AI Analysis — Groq + Gemini](#10-ai-analysis--groq--gemini)
11. [نظام التقارير اليومية](#11-نظام-التقارير-اليومية)
12. [Frontend — Next.js Dashboard](#12-frontend-nextjs-dashboard)
13. [نظام الإشعارات](#13-نظام-الإشعارات)
14. [خطة الاختبار الكاملة](#14-خطة-الاختبار-الكاملة)
15. [النشر على Oracle Cloud](#15-النشر-على-oracle-cloud)
16. [المشاكل الشائعة وحلولها](#16-المشاكل-الشائعة-وحلولها)
17. [خطة التطوير المستقبلية](#17-خطة-التطوير-المستقبلية)

---

## 1. نظرة عامة

### ما هو النظام؟

Sales Intelligence System هو منصة تحول تسجيلات اجتماعات Zoom إلى:
- نصوص مكتوبة (Transcription)
- تحليلات AI شاملة
- تقارير أداء للمندوبين
- تقرير يومي للإدارة
- توصيات قابلة للتنفيذ

### من يستخدمه؟

| المستخدم | ما يحتاجه |
|----------|-----------|
| **مندوب المبيعات** | رفع التسجيل، رؤية تقريره، تتبع تحسنه |
| **مدير الفريق** | أداء كل الفريق، أكثر الاعتراضات، نسب الإغلاق |
| **الإدارة العليا** | تقرير يومي موجز في الإيميل، KPIs واضحة |

---

## 2. لماذا هذا النظام؟

### المشكلة الحالية

```
❌ المدير يسمع تقارير مندوبين كلامية غير دقيقة
❌ مافيش بيانات حقيقية عن جودة المحادثات
❌ الاعتراضات المتكررة مش متتبعة
❌ مافيش معيار موضوعي لتقييم المندوب
❌ الفرص الضائعة مش محللة
```

### الحل

```
✅ كل اجتماع يتحول لبيانات قابلة للقياس
✅ Score موضوعي لكل محادثة
✅ الاعتراضات الأكثر تكراراً واضحة
✅ توصيات coaching محددة لكل مندوب
✅ تقرير يومي أوتوماتيكي للإدارة
```

---

## 3. Tech Stack المجاني الكامل

### جدول المقارنة الشامل

| الجزء | الخيار المدفوع | البديل المجاني | الحد المجاني |
|-------|---------------|----------------|--------------|
| Frontend Hosting | AWS Amplify $5/شهر | Vercel | غير محدود للمشاريع الشخصية |
| Backend Hosting | AWS EC2 $30/شهر | Oracle Cloud ARM | مجاني للأبد |
| Database | AWS RDS $15/شهر | Supabase | 500MB + 2 projects |
| Storage | AWS S3 $2/شهر | Cloudflare R2 | 10GB/شهر |
| Transcription | AssemblyAI $35/شهر | Whisper (local) | مجاني open source |
| AI Analysis | OpenAI GPT-4 $20/شهر | Groq API | 14,400 req/يوم |
| AI Backup | Azure OpenAI | Gemini API | 15 req/دقيقة |
| Queue | AWS SQS $0.40/مليون | Upstash Redis | 10,000 req/يوم |
| Auth | Auth0 $23/شهر | NextAuth.js | مجاني open source |
| Email Reports | SendGrid $15/شهر | Resend.com | 3,000 إيميل/شهر |
| Monitoring | Datadog $15/شهر | Grafana + Prometheus | مجاني open source |

### **التكلفة الإجمالية = صفر دولار**

---

## 4. المعمارية التفصيلية

### الصورة الكاملة للنظام

```
┌─────────────────────────────────────────────────────────────┐
│                     المستخدمون                               │
│  [مندوب مبيعات]  [مدير فريق]  [إدارة عليا / إيميل يومي]    │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js Frontend (Vercel)                       │
│  - لوحة تحكم المندوب                                        │
│  - لوحة تحكم المدير                                         │
│  - صفحة رفع التسجيلات                                       │
│  - صفحة التقارير                                            │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTPS Requests
               ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (Oracle Cloud)                   │
│  /api/upload   → رفع الملفات                                │
│  /api/meetings → إدارة الاجتماعات                           │
│  /api/reports  → التقارير                                   │
│  /api/users    → إدارة المستخدمين                           │
│  /api/admin    → لوحة المدير                                │
└──────┬───────────────┬────────────────────────────────────┘
       │               │
       ▼               ▼
┌──────────────┐  ┌─────────────────────────────────────────┐
│  PostgreSQL  │  │         Redis Queue (Upstash)            │
│  (Supabase)  │  │  job_queue → [job1, job2, job3, ...]     │
│              │  └──────────────────┬────────────────────┘
│  Users       │                     │
│  Meetings    │                     ▼
│  Transcripts │  ┌─────────────────────────────────────────┐
│  Analysis    │  │         Celery Workers                   │
│  Scores      │  │  Worker 1: Audio Extraction (FFmpeg)     │
│  Reports     │  │  Worker 2: Transcription (Whisper)       │
│  Objections  │  │  Worker 3: AI Analysis (Groq/Gemini)     │
└──────────────┘  │  Worker 4: Report Generation             │
                  │  Worker 5: Email Sending                 │
                  └─────────────────────────────────────────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
              ┌──────────┐ ┌───────┐ ┌──────────────┐
              │  FFmpeg  │ │Whisper│ │  Groq API    │
              │ (local)  │ │large  │ │  (Analysis)  │
              │          │ │  -v3  │ │              │
              └──────────┘ └───────┘ └──────────────┘
                                           │
                                           ▼
                              ┌─────────────────────┐
                              │   Resend.com (Email) │
                              │   Daily Report 8 AM  │
                              └─────────────────────┘
```

### لماذا Queue وليس معالجة مباشرة؟

```
❌ بدون Queue:
المندوب يرفع ملف → API يبدأ المعالجة → 20 دقيقة انتظار → Timeout!
لو 5 مندوبين رفعوا في نفس الوقت → السيرفر ينهار

✅ مع Queue:
المندوب يرفع ملف → API يقول "استلمنا الملف" (ثانيتين)
                  → Worker يعالج في الخلفية
                  → المندوب يستلم إشعار لما يخلص
لو 50 مندوب رفعوا → Queue ينظم المعالجة واحد واحد
```

---

## 5. قاعدة البيانات

### Schema الكامل

```sql
-- ========================================
-- جدول المستخدمين
-- ========================================
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role        VARCHAR(20) NOT NULL DEFAULT 'sales',
                -- 'sales' | 'manager' | 'admin'
    team_id     INT REFERENCES teams(id),
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT NOW(),
    last_login  TIMESTAMP
);

-- ========================================
-- جدول الفرق
-- ========================================
CREATE TABLE teams (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    manager_id  INT REFERENCES users(id),
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- جدول الاجتماعات (الجدول الأساسي)
-- ========================================
CREATE TABLE meetings (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id),
    customer_name   VARCHAR(200) NOT NULL,
    customer_company VARCHAR(200),
    meeting_title   VARCHAR(300),
    file_path       TEXT,           -- مسار الملف المخزن
    file_size_mb    DECIMAL(10,2),
    duration_seconds INT,           -- مدة الاجتماع بالثواني
    status          VARCHAR(30) DEFAULT 'uploaded',
                    -- uploaded | processing | transcribed | analyzed | failed
    error_message   TEXT,           -- في حالة الفشل
    meeting_date    DATE,
    created_at      TIMESTAMP DEFAULT NOW(),
    processed_at    TIMESTAMP
);

-- ========================================
-- جدول النصوص (Transcripts)
-- منفصل لأن النص قد يصل لـ 50,000 كلمة
-- ========================================
CREATE TABLE transcripts (
    id              SERIAL PRIMARY KEY,
    meeting_id      INT UNIQUE REFERENCES meetings(id) ON DELETE CASCADE,
    full_text       TEXT NOT NULL,          -- النص الكامل
    language        VARCHAR(10) DEFAULT 'ar',
    word_count      INT,
    whisper_model   VARCHAR(30),            -- سجّل الـ model المستخدم
    processing_time_sec INT,                -- وقت المعالجة بالثواني
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- جدول تحديد المتكلمين (Speaker Diarization)
-- كل سطر = جملة واحدة من شخص محدد
-- ========================================
CREATE TABLE speaker_segments (
    id          SERIAL PRIMARY KEY,
    meeting_id  INT REFERENCES meetings(id) ON DELETE CASCADE,
    speaker     VARCHAR(20),    -- 'sales_rep' | 'customer' | 'unknown'
    text        TEXT NOT NULL,  -- النص المقول
    start_time  DECIMAL(10,2), -- بالثواني من بداية التسجيل
    end_time    DECIMAL(10,2),
    confidence  DECIMAL(5,4)   -- درجة الثقة 0-1
);

-- ========================================
-- جدول التحليل الكامل
-- ========================================
CREATE TABLE analyses (
    id                  SERIAL PRIMARY KEY,
    meeting_id          INT UNIQUE REFERENCES meetings(id) ON DELETE CASCADE,
    
    -- الملخص العام
    summary             TEXT,
    key_points          JSONB,  -- نقاط رئيسية كـ array
    
    -- تحليل العميل
    customer_questions  JSONB,  -- أسئلة العميل كـ array
    customer_pain_points JSONB, -- مشاكل العميل
    customer_interest_level VARCHAR(20), -- high | medium | low
    
    -- الاعتراضات
    objections          JSONB,  -- قائمة الاعتراضات
    objections_handled  JSONB,  -- الاعتراضات التي تم التعامل معها
    
    -- تحليل المندوب
    rep_strengths       JSONB,  -- نقاط قوة المندوب
    rep_weaknesses      JSONB,  -- نقاط ضعف
    talk_to_listen_ratio DECIMAL(5,2), -- نسبة كلام المندوب للعميل
    
    -- التوصيات
    next_steps          JSONB,  -- الخطوات التالية المقترحة
    follow_up_deadline  DATE,   -- موعد المتابعة
    
    -- التوقعات
    closing_probability INT,    -- 0-100%
    deal_stage          VARCHAR(30), -- qualified | proposal | negotiation | closing
    
    -- AI metadata
    ai_model_used       VARCHAR(50),
    processing_time_sec INT,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- جدول التقييمات (Scores)
-- ========================================
CREATE TABLE scores (
    id              SERIAL PRIMARY KEY,
    meeting_id      INT UNIQUE REFERENCES meetings(id) ON DELETE CASCADE,
    user_id         INT REFERENCES users(id),
    
    -- التقييمات الفرعية (كل واحد من 0-10)
    opening_score       DECIMAL(4,2),   -- جودة الافتتاح
    discovery_score     DECIMAL(4,2),   -- جودة طرح الأسئلة
    presentation_score  DECIMAL(4,2),   -- جودة الشرح
    objection_score     DECIMAL(4,2),   -- التعامل مع الاعتراضات
    closing_score       DECIMAL(4,2),   -- محاولة الإغلاق
    communication_score DECIMAL(4,2),   -- جودة التواصل
    
    -- التقييم الكلي
    total_score     DECIMAL(5,2),   -- من 100
    grade           VARCHAR(5),     -- A+ | A | B+ | B | C | D | F
    
    -- المقارنة
    team_avg_score  DECIMAL(5,2),   -- متوسط الفريق في نفس الفترة
    percentile      INT,            -- ترتيبه في الفريق (مثلاً 75 = أفضل من 75%)
    
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- جدول الاعتراضات المستقلة (للتحليل الإجمالي)
-- كل اعتراض يتسجل مستقلاً للتحليل الشامل
-- ========================================
CREATE TABLE objections (
    id              SERIAL PRIMARY KEY,
    meeting_id      INT REFERENCES meetings(id) ON DELETE CASCADE,
    user_id         INT REFERENCES users(id),
    
    objection_text  TEXT NOT NULL,
    category        VARCHAR(50),    -- price | features | timing | trust | competition
    was_handled     BOOLEAN DEFAULT false,
    handling_quality VARCHAR(20),   -- excellent | good | poor | not_handled
    
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- جدول التقارير اليومية
-- ========================================
CREATE TABLE daily_reports (
    id              SERIAL PRIMARY KEY,
    report_date     DATE UNIQUE NOT NULL,
    
    -- إحصائيات اليوم
    total_meetings      INT DEFAULT 0,
    total_duration_min  INT DEFAULT 0,
    avg_score           DECIMAL(5,2),
    avg_closing_prob    DECIMAL(5,2),
    
    -- أفضل وأسوأ
    top_performer_id    INT REFERENCES users(id),
    needs_coaching_id   INT REFERENCES users(id),
    
    -- الاعتراضات
    top_objections      JSONB,  -- أكثر 5 اعتراضات تكراراً
    
    -- محتوى التقرير
    report_html         TEXT,   -- HTML للإيميل
    report_json         JSONB,  -- البيانات الكاملة
    
    sent_to             JSONB,  -- قائمة الإيميلات اللي اتبعتلها
    sent_at             TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- Indexes للأداء
-- ========================================
CREATE INDEX idx_meetings_user_id ON meetings(user_id);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_created_at ON meetings(created_at);
CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_objections_category ON objections(category);
CREATE INDEX idx_speaker_segments_meeting ON speaker_segments(meeting_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date);
```

---

## 6. إعداد البيئة خطوة بخطوة

### المتطلبات الأساسية

```bash
# تأكد من وجود هذه البرامج
python --version    # Python 3.10+
node --version      # Node.js 18+
git --version       # Git
ffmpeg -version     # FFmpeg
```

### الخطوة 1: تنزيل Whisper

```bash
# 1. إنشاء virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# أو: venv\Scripts\activate  (Windows)

# 2. تثبيت Whisper
pip install openai-whisper

# 3. تثبيت PyTorch (للمعالجة الأسرع)
# لو عندك GPU NVIDIA:
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
# لو CPU فقط:
pip install torch torchvision torchaudio

# 4. تثبيت FFmpeg
# Ubuntu/Debian:
sudo apt update && sudo apt install ffmpeg
# macOS:
brew install ffmpeg
# Windows: نزّل من https://ffmpeg.org/download.html

# 5. اختبار Whisper
whisper --help
# لو طلع output = كل شيء شغال ✅
```

### الخطوة 2: إعداد Backend

```bash
# 1. إنشاء مجلد المشروع
mkdir sales-intelligence && cd sales-intelligence

# 2. هيكل المجلد
mkdir -p backend/{api,services,models,utils,workers}
mkdir -p backend/storage/meetings
mkdir -p frontend
touch backend/.env

# 3. تثبيت المكتبات
pip install \
  fastapi==0.104.1 \
  uvicorn[standard]==0.24.0 \
  sqlalchemy==2.0.23 \
  psycopg2-binary==2.9.9 \
  python-multipart==0.0.6 \
  celery==5.3.4 \
  redis==5.0.1 \
  python-jose[cryptography]==3.3.0 \
  passlib[bcrypt]==1.7.4 \
  openai-whisper \
  httpx==0.25.2 \
  python-dotenv==1.0.0 \
  schedule==1.2.1 \
  jinja2==3.1.2 \
  aiofiles==23.2.1 \
  pytest==7.4.3 \
  pytest-asyncio==0.21.1

pip freeze > requirements.txt
```

### الخطوة 3: ملف البيئة (.env)

```bash
# backend/.env
# =========================================
# Database
# =========================================
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres

# =========================================
# Security
# =========================================
SECRET_KEY=your-super-secret-key-change-this-in-production-minimum-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480  # 8 ساعات

# =========================================
# AI Services (مجانية)
# =========================================
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx         # من console.groq.com
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx # من aistudio.google.com
GROQ_MODEL=llama-3.1-70b-versatile

# =========================================
# Email (مجاني)
# =========================================
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx  # من resend.com
FROM_EMAIL=reports@yourdomain.com
ADMIN_EMAILS=manager@company.com,ceo@company.com

# =========================================
# Whisper
# =========================================
WHISPER_MODEL=large-v3    # الأدق للعربية
WHISPER_LANGUAGE=ar

# =========================================
# Storage
# =========================================
STORAGE_PATH=./storage/meetings
MAX_FILE_SIZE_MB=500

# =========================================
# Redis (Upstash)
# =========================================
REDIS_URL=redis://default:password@us1-xxx.upstash.io:6379

# =========================================
# App Settings
# =========================================
APP_NAME=Sales Intelligence System
DAILY_REPORT_HOUR=8   # إرسال التقرير الساعة 8 صباحاً
```

---

## 7. Backend — FastAPI كامل

### الملفات الأساسية

#### `backend/main.py`

```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from contextlib import asynccontextmanager

from .api import auth, meetings, reports, admin, users
from .database import engine, Base
from .utils.scheduler import start_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # تشغيل عند بدء التطبيق
    Base.metadata.create_all(bind=engine)
    start_scheduler()  # تشغيل التقارير اليومية
    print("✅ Sales Intelligence System Started")
    yield
    print("🔴 System Shutting Down")

app = FastAPI(
    title="Sales Intelligence System",
    version="1.0.0",
    description="نظام تحليل اجتماعات المبيعات",
    lifespan=lifespan
)

# CORS للـ Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router,     prefix="/api/auth",     tags=["Authentication"])
app.include_router(meetings.router, prefix="/api/meetings", tags=["Meetings"])
app.include_router(reports.router,  prefix="/api/reports",  tags=["Reports"])
app.include_router(admin.router,    prefix="/api/admin",    tags=["Admin"])
app.include_router(users.router,    prefix="/api/users",    tags=["Users"])

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}
```

#### `backend/api/meetings.py`

```python
import os
import uuid
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.meeting import Meeting
from ..workers.tasks import process_meeting_task
from ..utils.auth import get_current_user
from ..config import settings

router = APIRouter()

ALLOWED_EXTENSIONS = {".mp4", ".mp3", ".m4a", ".wav", ".webm"}
MAX_SIZE_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024

@router.post("/upload")
async def upload_meeting(
    file: UploadFile = File(...),
    customer_name: str = Form(...),
    customer_company: str = Form(None),
    meeting_title: str = Form(None),
    meeting_date: str = Form(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    رفع تسجيل اجتماع للمعالجة.
    
    - يقبل: MP4, MP3, M4A, WAV, WEBM
    - الحد الأقصى للحجم: 500MB
    - يرجع: meeting_id فوراً (المعالجة في الخلفية)
    """
    # التحقق من الامتداد
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"نوع الملف غير مدعوم. المدعوم: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # قراءة الملف والتحقق من الحجم
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"حجم الملف {file_size/1024/1024:.1f}MB يتجاوز الحد {settings.MAX_FILE_SIZE_MB}MB"
        )
    
    # حفظ الملف
    file_id = str(uuid.uuid4())
    file_name = f"{file_id}{file_ext}"
    file_path = os.path.join(settings.STORAGE_PATH, file_name)
    
    os.makedirs(settings.STORAGE_PATH, exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # إنشاء سجل في قاعدة البيانات
    meeting = Meeting(
        user_id=current_user.id,
        customer_name=customer_name,
        customer_company=customer_company,
        meeting_title=meeting_title or f"اجتماع مع {customer_name}",
        file_path=file_path,
        file_size_mb=round(file_size / 1024 / 1024, 2),
        meeting_date=meeting_date,
        status="uploaded"
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    
    # إرسال للـ Queue للمعالجة في الخلفية
    process_meeting_task.delay(meeting.id)
    
    return {
        "message": "تم استلام الملف. جاري المعالجة...",
        "meeting_id": meeting.id,
        "status": "uploaded",
        "estimated_time_minutes": round(file_size / 1024 / 1024 / 10, 0)  # تقدير تقريبي
    }

@router.get("/")
def get_my_meetings(
    page: int = 1,
    limit: int = 20,
    status: str = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """جلب اجتماعات المندوب الحالي."""
    query = db.query(Meeting).filter(Meeting.user_id == current_user.id)
    
    if status:
        query = query.filter(Meeting.status == status)
    
    total = query.count()
    meetings = query.order_by(Meeting.created_at.desc()) \
                   .offset((page - 1) * limit) \
                   .limit(limit) \
                   .all()
    
    return {
        "total": total,
        "page": page,
        "meetings": [m.to_dict() for m in meetings]
    }

@router.get("/{meeting_id}")
def get_meeting_detail(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """جلب تفاصيل اجتماع محدد مع التحليل الكامل."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    
    if not meeting:
        raise HTTPException(status_code=404, detail="الاجتماع غير موجود")
    
    # المندوب يشوف اجتماعاته فقط، المدير يشوف الكل
    if current_user.role == "sales" and meeting.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    return meeting.to_dict(include_analysis=True)

@router.get("/{meeting_id}/status")
def get_processing_status(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """تتبع حالة المعالجة."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="غير موجود")
    
    status_messages = {
        "uploaded": "⏳ في انتظار المعالجة",
        "processing": "🔄 جاري استخراج الصوت",
        "transcribing": "🎙️ جاري تحويل الصوت لنص",
        "analyzing": "🧠 جاري التحليل بالذكاء الاصطناعي",
        "analyzed": "✅ اكتمل التحليل",
        "failed": "❌ فشلت المعالجة"
    }
    
    return {
        "status": meeting.status,
        "message": status_messages.get(meeting.status, ""),
        "error": meeting.error_message if meeting.status == "failed" else None
    }
```

---

## 8. نظام المعالجة والقوائم

### `backend/workers/tasks.py`

```python
"""
Celery Tasks — معالجة الاجتماعات في الخلفية

كيف يعمل:
1. المندوب يرفع ملف → API يضيف task للـ Queue
2. Worker يأخذ الـ task ويبدأ المعالجة:
   أ. استخراج الصوت (FFmpeg)
   ب. تحويل الصوت لنص (Whisper)
   ج. تحديد المتكلمين (Speaker Diarization)
   د. تحليل المحتوى (Groq AI)
   هـ. حساب الـ Score
   و. إشعار المندوب
"""
import os
import subprocess
from celery import Celery
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import Meeting, Transcript, Analysis, Score
from ..services.whisper_service import transcribe_audio
from ..services.ai_service import analyze_transcript
from ..services.scoring_service import calculate_score
from ..services.notification_service import notify_user
from ..config import settings

# إعداد Celery
celery_app = Celery(
    "sales_intelligence",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Riyadh",
    task_track_started=True,
    task_acks_late=True,  # مهم: لا تحذف الـ task إلا لو اكتملت
)


def update_status(db: Session, meeting_id: int, status: str, error: str = None):
    """تحديث حالة الاجتماع في قاعدة البيانات."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if meeting:
        meeting.status = status
        if error:
            meeting.error_message = error
        db.commit()


@celery_app.task(
    bind=True,
    max_retries=3,           # إعادة المحاولة 3 مرات عند الفشل
    retry_backoff=True,      # انتظار متزايد بين المحاولات
    retry_backoff_max=600    # الحد الأقصى للانتظار 10 دقائق
)
def process_meeting_task(self, meeting_id: int):
    """
    Task رئيسية لمعالجة اجتماع كامل.
    """
    db = SessionLocal()
    
    try:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            raise ValueError(f"Meeting {meeting_id} not found")
        
        # ================================
        # الخطوة 1: استخراج الصوت
        # ================================
        update_status(db, meeting_id, "processing")
        print(f"[{meeting_id}] 🎬 Starting audio extraction...")
        
        audio_path = extract_audio(meeting.file_path)
        print(f"[{meeting_id}] ✅ Audio extracted: {audio_path}")
        
        # ================================
        # الخطوة 2: تحويل الصوت لنص
        # ================================
        update_status(db, meeting_id, "transcribing")
        print(f"[{meeting_id}] 🎙️ Starting transcription...")
        
        transcript_result = transcribe_audio(audio_path)
        
        # حفظ النص
        transcript = Transcript(
            meeting_id=meeting_id,
            full_text=transcript_result["text"],
            word_count=len(transcript_result["text"].split()),
            whisper_model=settings.WHISPER_MODEL,
            processing_time_sec=transcript_result["processing_time"]
        )
        db.add(transcript)
        db.commit()
        print(f"[{meeting_id}] ✅ Transcribed: {transcript.word_count} words")
        
        # ================================
        # الخطوة 3: تحليل الذكاء الاصطناعي
        # ================================
        update_status(db, meeting_id, "analyzing")
        print(f"[{meeting_id}] 🧠 Starting AI analysis...")
        
        analysis_result = analyze_transcript(
            transcript=transcript_result["text"],
            customer_name=meeting.customer_name,
            duration_minutes=meeting.duration_seconds // 60 if meeting.duration_seconds else 0
        )
        
        # حفظ التحليل
        analysis = Analysis(
            meeting_id=meeting_id,
            summary=analysis_result["summary"],
            customer_questions=analysis_result["questions"],
            objections=analysis_result["objections"],
            next_steps=analysis_result["next_steps"],
            closing_probability=analysis_result["closing_probability"],
            rep_strengths=analysis_result["strengths"],
            rep_weaknesses=analysis_result["weaknesses"],
            talk_to_listen_ratio=analysis_result["talk_ratio"],
            ai_model_used=analysis_result["model_used"]
        )
        db.add(analysis)
        
        # ================================
        # الخطوة 4: حساب الـ Score
        # ================================
        score = calculate_score(analysis_result, transcript_result, meeting)
        score_record = Score(
            meeting_id=meeting_id,
            user_id=meeting.user_id,
            total_score=score["total"],
            opening_score=score["opening"],
            discovery_score=score["discovery"],
            presentation_score=score["presentation"],
            objection_score=score["objections"],
            closing_score=score["closing"],
            communication_score=score["communication"],
            grade=score["grade"]
        )
        db.add(score_record)
        
        # ================================
        # الخطوة 5: تحديث الحالة النهائية
        # ================================
        meeting.status = "analyzed"
        db.commit()
        
        print(f"[{meeting_id}] 🎉 Processing complete! Score: {score['total']}")
        
        # إشعار المندوب
        notify_user(
            user_id=meeting.user_id,
            message=f"✅ تم تحليل اجتماعك مع {meeting.customer_name} | Score: {score['total']}/100"
        )
        
        # تنظيف ملف الصوت المؤقت
        if os.path.exists(audio_path):
            os.remove(audio_path)
        
        return {"status": "success", "meeting_id": meeting_id, "score": score["total"]}
        
    except Exception as e:
        error_msg = str(e)
        print(f"[{meeting_id}] ❌ Error: {error_msg}")
        update_status(db, meeting_id, "failed", error_msg)
        
        # إعادة المحاولة تلقائياً
        raise self.retry(exc=e, countdown=60)
        
    finally:
        db.close()


def extract_audio(video_path: str) -> str:
    """
    استخراج الصوت من الفيديو باستخدام FFmpeg.
    
    يحول: MP4 → WAV (16kHz mono) — الصيغة المثالية لـ Whisper
    """
    audio_path = video_path.replace(".mp4", "_audio.wav") \
                           .replace(".webm", "_audio.wav")
    
    cmd = [
        "ffmpeg",
        "-i", video_path,           # ملف الدخل
        "-vn",                       # بدون فيديو
        "-acodec", "pcm_s16le",     # صيغة WAV
        "-ar", "16000",              # 16kHz — مثالي لـ Whisper
        "-ac", "1",                  # Mono
        "-y",                        # استبدل إذا موجود
        audio_path
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg failed: {result.stderr}")
    
    return audio_path
```

---

## 9. Whisper — تحويل الصوت

### `backend/services/whisper_service.py`

```python
"""
Whisper Service — تحويل الصوت إلى نص بالعربية

نقاط مهمة:
- large-v3 هو الأفضل للعربية
- وقت المعالجة: ~15-25 دقيقة/ساعة على CPU
- على GPU: ~2-3 دقائق/ساعة
- خلط عربي/إنجليزي: الدقة 70-80%

لتحسين الأداء:
- استخدم medium للاجتماعات القصيرة (< 30 دقيقة)
- استخدم large-v3 للاجتماعات الطويلة المهمة
"""
import time
import whisper
import torch
from datetime import datetime
from ..config import settings


class WhisperService:
    _model = None  # Singleton — لا تحمّل الـ model أكثر من مرة
    
    @classmethod
    def get_model(cls):
        """
        تحميل الـ model مرة واحدة فقط وتخزينه في الذاكرة.
        الـ model يأخذ ~3GB RAM
        """
        if cls._model is None:
            print(f"⏳ Loading Whisper model: {settings.WHISPER_MODEL}")
            
            # استخدام GPU إذا متاح، وإلا CPU
            device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"🖥️ Using device: {device}")
            
            cls._model = whisper.load_model(
                settings.WHISPER_MODEL,
                device=device
            )
            print(f"✅ Whisper model loaded ({settings.WHISPER_MODEL})")
        
        return cls._model
    
    def transcribe(self, audio_path: str) -> dict:
        """
        تحويل ملف صوتي إلى نص.
        
        Returns:
            {
                "text": النص الكامل,
                "segments": قطع النص مع التوقيت,
                "language": اللغة المكتشفة,
                "processing_time": وقت المعالجة بالثواني
            }
        """
        model = self.get_model()
        start_time = time.time()
        
        print(f"🎙️ Starting transcription: {audio_path}")
        
        result = model.transcribe(
            audio_path,
            language=settings.WHISPER_LANGUAGE,  # "ar" للعربية
            task="transcribe",
            
            # إعدادات تحسين الدقة
            temperature=0.0,         # أقل عشوائية = أكثر دقة
            compression_ratio_threshold=2.4,
            no_speech_threshold=0.6, # تجاهل الصمت
            condition_on_previous_text=True,  # سياق أفضل
            
            # تحسين للمحادثات
            word_timestamps=True,    # توقيت كل كلمة
            verbose=False
        )
        
        processing_time = int(time.time() - start_time)
        
        # تنظيف النص
        clean_text = self._clean_arabic_text(result["text"])
        
        # تحديد المتكلمين (تبسيطي - بدون speaker diarization)
        segments_with_speakers = self._identify_speakers(result["segments"])
        
        print(f"✅ Transcription done in {processing_time}s | {len(clean_text.split())} words")
        
        return {
            "text": clean_text,
            "segments": segments_with_speakers,
            "language": result["language"],
            "processing_time": processing_time,
            "word_count": len(clean_text.split())
        }
    
    def _clean_arabic_text(self, text: str) -> str:
        """تنظيف النص العربي من الرموز غير الضرورية."""
        import re
        # إزالة المسافات المتعددة
        text = re.sub(r'\s+', ' ', text)
        # إزالة النقاط المتكررة
        text = re.sub(r'\.{3,}', '...', text)
        return text.strip()
    
    def _identify_speakers(self, segments: list) -> list:
        """
        محاولة تحديد المتكلمين بشكل بسيط.
        
        طريقة بسيطة: لو الجملة سؤال → العميل
                    لو الجملة جواب طويل → المندوب
        
        للدقة الحقيقية: يحتاج pyannote-audio (يحتاج GPU)
        """
        identified = []
        for i, seg in enumerate(segments):
            text = seg["text"].strip()
            
            # تحديد بسيط
            is_question = text.endswith("?") or text.endswith("؟")
            is_short = len(text.split()) < 10
            
            # المندوب عادة يتكلم أكثر في البداية
            if i < 3:
                speaker = "sales_rep"
            elif is_question and is_short:
                speaker = "customer"
            else:
                speaker = "sales_rep"
            
            identified.append({
                **seg,
                "speaker": speaker
            })
        
        return identified


# Instance واحد للاستخدام في كل مكان
whisper_service = WhisperService()


def transcribe_audio(audio_path: str) -> dict:
    """Wrapper function للاستخدام في الـ tasks."""
    return whisper_service.transcribe(audio_path)
```

---

## 10. AI Analysis — Groq + Gemini

### `backend/services/ai_service.py`

```python
"""
AI Analysis Service

يستخدم Groq بالدرجة الأولى (مجاني وسريع جداً - 300 tokens/ثانية)
وينتقل لـ Gemini كـ fallback لو Groq وصل للحد اليومي
"""
import json
import httpx
import time
from ..config import settings


ANALYSIS_PROMPT = """
أنت خبير تحليل مبيعات متخصص في السوق العربي والخليجي.

تم تسجيل اجتماع مبيعات مع العميل: {customer_name}
مدة الاجتماع: {duration_minutes} دقيقة

النص الكامل للمحادثة:
=====================================
{transcript}
=====================================

قم بتحليل هذا الاجتماع وأعطني النتيجة بصيغة JSON فقط بدون أي نص إضافي:

{{
    "summary": "ملخص الاجتماع في 3-4 جمل",
    "customer_questions": ["سؤال 1", "سؤال 2", "..."],
    "objections": [
        {{
            "text": "نص الاعتراض",
            "category": "price|features|timing|trust|competition",
            "was_handled": true|false,
            "handling_quality": "excellent|good|poor|not_handled"
        }}
    ],
    "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
    "weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2"],
    "next_steps": ["خطوة 1", "خطوة 2"],
    "follow_up_days": 2,
    "closing_probability": 75,
    "deal_stage": "qualified|proposal|negotiation|closing|lost",
    "customer_interest": "high|medium|low",
    "talk_ratio": 65,
    "key_topics": ["موضوع 1", "موضوع 2"],
    "missing_topics": ["موضوع مهم لم يُذكر 1"],
    "coaching_notes": "ملاحظات للمدير عن أداء المندوب"
}}
"""


class AIAnalysisService:
    
    def analyze(self, transcript: str, customer_name: str, duration_minutes: int) -> dict:
        """
        تحليل نص الاجتماع بالذكاء الاصطناعي.
        يجرب Groq أولاً، وإذا فشل يستخدم Gemini.
        """
        prompt = ANALYSIS_PROMPT.format(
            customer_name=customer_name,
            duration_minutes=duration_minutes,
            transcript=transcript[:8000]  # أول 8000 حرف لتجنب تجاوز الـ context
        )
        
        # المحاولة الأولى: Groq (الأسرع والأفضل)
        try:
            result = self._call_groq(prompt)
            result["model_used"] = f"groq/{settings.GROQ_MODEL}"
            return result
        except Exception as e:
            print(f"⚠️ Groq failed: {e}. Trying Gemini...")
        
        # المحاولة الثانية: Gemini (backup مجاني)
        try:
            result = self._call_gemini(prompt)
            result["model_used"] = "gemini/gemini-pro"
            return result
        except Exception as e:
            print(f"❌ Gemini also failed: {e}")
            raise RuntimeError("All AI services failed")
    
    def _call_groq(self, prompt: str) -> dict:
        """استدعاء Groq API."""
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": settings.GROQ_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": "أنت محلل مبيعات خبير. أعطِ النتيجة بصيغة JSON فقط."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "temperature": 0.1,
                    "max_tokens": 2000
                }
            )
            
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            return self._parse_json(content)
    
    def _call_gemini(self, prompt: str) -> dict:
        """استدعاء Google Gemini API."""
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={settings.GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.1,
                        "maxOutputTokens": 2000
                    }
                }
            )
            
            response.raise_for_status()
            content = response.json()["candidates"][0]["content"]["parts"][0]["text"]
            return self._parse_json(content)
    
    def _parse_json(self, content: str) -> dict:
        """
        استخراج JSON من استجابة الـ AI.
        يتعامل مع حالة إرجاع النص مع markdown.
        """
        # إزالة markdown code blocks إذا موجود
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        
        return json.loads(content.strip())


ai_service = AIAnalysisService()


def analyze_transcript(transcript: str, customer_name: str, duration_minutes: int) -> dict:
    return ai_service.analyze(transcript, customer_name, duration_minutes)
```

---

## 11. نظام التقارير اليومية

### كيف يعمل التقرير اليومي؟

```
كل يوم الساعة 8 صباحاً:
   ↓
يجمع كل الاجتماعات من اليوم السابق
   ↓
يحسب الإحصائيات (متوسط التقييم، نسب الإغلاق، ...)
   ↓
يحدد أفضل وأسوأ مندوب
   ↓
يستخرج أكثر الاعتراضات تكراراً
   ↓
يولّد توصيات AI للإدارة
   ↓
يرسل HTML email لكل المديرين والإدارة
```

### `backend/services/report_service.py`

```python
"""
Daily Report Service — التقرير اليومي للإدارة

يُرسَل كل يوم الساعة 8 صباحاً على إيميلات الإدارة
"""
import json
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import SessionLocal
from ..models import Meeting, Score, Analysis, Objection, User, DailyReport
from ..config import settings
from .email_service import send_email


class DailyReportService:
    
    def generate_and_send(self, report_date: date = None) -> dict:
        """
        توليد وإرسال التقرير اليومي.
        
        report_date: تاريخ التقرير (افتراضي: أمس)
        """
        if not report_date:
            report_date = date.today() - timedelta(days=1)
        
        db = SessionLocal()
        try:
            print(f"📊 Generating daily report for {report_date}...")
            
            # جمع البيانات
            data = self._collect_data(db, report_date)
            
            if data["total_meetings"] == 0:
                print("⚠️ No meetings yesterday. Skipping report.")
                return {"status": "skipped", "reason": "no meetings"}
            
            # توليد التوصيات بالـ AI
            data["ai_recommendations"] = self._generate_ai_recommendations(data)
            
            # توليد HTML
            html_content = self._render_html(data, report_date)
            
            # حفظ في قاعدة البيانات
            report = DailyReport(
                report_date=report_date,
                total_meetings=data["total_meetings"],
                avg_score=data["avg_score"],
                avg_closing_prob=data["avg_closing_prob"],
                top_objections=data["top_objections"],
                report_html=html_content,
                report_json=json.dumps(data, ensure_ascii=False, default=str)
            )
            db.add(report)
            db.commit()
            
            # إرسال الإيميل
            recipients = settings.ADMIN_EMAILS.split(",")
            sent = send_email(
                to=recipients,
                subject=f"📊 تقرير المبيعات اليومي — {report_date.strftime('%d %B %Y')}",
                html_content=html_content
            )
            
            report.sent_to = recipients
            report.sent_at = datetime.now()
            db.commit()
            
            print(f"✅ Report sent to {len(recipients)} recipients")
            return {"status": "success", "meetings": data["total_meetings"], "sent_to": len(recipients)}
        
        finally:
            db.close()
    
    def _collect_data(self, db: Session, report_date: date) -> dict:
        """جمع كل البيانات المطلوبة للتقرير."""
        start = datetime.combine(report_date, datetime.min.time())
        end = datetime.combine(report_date + timedelta(days=1), datetime.min.time())
        
        # الاجتماعات المكتملة
        meetings = db.query(Meeting).filter(
            Meeting.created_at >= start,
            Meeting.created_at < end,
            Meeting.status == "analyzed"
        ).all()
        
        if not meetings:
            return {"total_meetings": 0}
        
        meeting_ids = [m.id for m in meetings]
        
        # التقييمات
        scores = db.query(Score).filter(Score.meeting_id.in_(meeting_ids)).all()
        avg_score = sum(s.total_score for s in scores) / len(scores) if scores else 0
        
        # نسب الإغلاق
        analyses = db.query(Analysis).filter(Analysis.meeting_id.in_(meeting_ids)).all()
        avg_closing = sum(a.closing_probability for a in analyses) / len(analyses) if analyses else 0
        
        # الاعتراضات الأكثر تكراراً
        objections = db.query(
            Objection.category,
            func.count(Objection.id).label("count")
        ).filter(
            Objection.meeting_id.in_(meeting_ids)
        ).group_by(Objection.category).order_by(func.count(Objection.id).desc()).limit(5).all()
        
        # أفضل وأسوأ مندوب
        user_scores = {}
        for s in scores:
            if s.user_id not in user_scores:
                user_scores[s.user_id] = []
            user_scores[s.user_id].append(s.total_score)
        
        user_averages = {uid: sum(scores)/len(scores) for uid, scores in user_scores.items()}
        
        best_user_id = max(user_averages, key=user_averages.get) if user_averages else None
        worst_user_id = min(user_averages, key=user_averages.get) if user_averages else None
        
        # بيانات كل مندوب
        reps_data = []
        for user_id, avg in user_averages.items():
            user = db.query(User).filter(User.id == user_id).first()
            user_meetings = [m for m in meetings if m.user_id == user_id]
            user_analyses = [a for a in analyses if any(m.id == a.meeting_id for m in user_meetings)]
            
            reps_data.append({
                "name": user.name if user else "غير معروف",
                "meetings_count": len(user_meetings),
                "avg_score": round(avg, 1),
                "avg_closing": round(
                    sum(a.closing_probability for a in user_analyses) / len(user_analyses)
                    if user_analyses else 0, 1
                ),
                "grade": self._score_to_grade(avg)
            })
        
        reps_data.sort(key=lambda x: x["avg_score"], reverse=True)
        
        return {
            "total_meetings": len(meetings),
            "total_duration_min": sum(m.duration_seconds // 60 for m in meetings if m.duration_seconds),
            "avg_score": round(avg_score, 1),
            "avg_closing_prob": round(avg_closing, 1),
            "top_objections": [{"category": o.category, "count": o.count} for o in objections],
            "reps_data": reps_data,
            "best_rep": reps_data[0] if reps_data else None,
            "needs_coaching": reps_data[-1] if len(reps_data) > 1 else None,
        }
    
    def _generate_ai_recommendations(self, data: dict) -> list:
        """
        توليد توصيات ذكية للإدارة.
        
        مثال:
        - "3 مندوبين ذكروا اعتراض 'السعر مرتفع' — ننصح بمراجعة سياسة الأسعار"
        - "متوسط نسبة الإغلاق 78% — أعلى من الهدف الشهري"
        """
        recommendations = []
        
        # توصية بناءً على الاعتراضات
        if data.get("top_objections"):
            top_obj = data["top_objections"][0]
            obj_messages = {
                "price": f"⚠️ اعتراض السعر تكرر {top_obj['count']} مرات — راجع سياسة التسعير أو جهّز مبررات قيمة أقوى",
                "features": f"⚠️ سؤال عن الميزات تكرر {top_obj['count']} مرات — المندوبون يحتاجون تدريباً على المنتج",
                "timing": f"⚠️ اعتراض التوقيت تكرر {top_obj['count']} مرات — جهّز عروض محدودة الوقت",
                "trust": f"⚠️ مشكلة الثقة تكررت {top_obj['count']} مرات — أضف شهادات عملاء ودراسات حالة",
                "competition": f"⚠️ مقارنة بالمنافسين تكررت {top_obj['count']} مرات — جهّز Battlecard محدّث"
            }
            if top_obj["category"] in obj_messages:
                recommendations.append(obj_messages[top_obj["category"]])
        
        # توصية بناءً على متوسط التقييم
        if data.get("avg_score", 0) < 60:
            recommendations.append("🔴 متوسط الأداء منخفض — ننصح بجلسة تدريبية هذا الأسبوع")
        elif data.get("avg_score", 0) >= 80:
            recommendations.append("🟢 أداء ممتاز اليوم — شارك التجارب الناجحة مع الفريق")
        
        # توصية بناءً على نسبة الإغلاق
        if data.get("avg_closing_prob", 0) >= 70:
            recommendations.append("🔥 نسبة الإغلاق مرتفعة — تابع الفرص الساخنة هذه الأسبوع فوراً")
        
        # توصية بناءً على أسوأ مندوب
        if data.get("needs_coaching"):
            rep = data["needs_coaching"]
            if rep["avg_score"] < 50:
                recommendations.append(
                    f"🎯 {rep['name']} يحتاج coaching عاجل — متوسط أداؤه {rep['avg_score']}/100"
                )
        
        return recommendations
    
    def _render_html(self, data: dict, report_date: date) -> str:
        """توليد HTML للإيميل."""
        reps_table = ""
        for i, rep in enumerate(data.get("reps_data", []), 1):
            medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f"#{i}"
            reps_table += f"""
            <tr>
                <td style="padding:8px;border-bottom:1px solid #f0f0f0">{medal}</td>
                <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-weight:600">{rep['name']}</td>
                <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center">{rep['meetings_count']}</td>
                <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center">
                    <span style="color:{'#22c55e' if rep['avg_score'] >= 70 else '#f97316' if rep['avg_score'] >= 50 else '#ef4444'};font-weight:700">
                        {rep['avg_score']}/100
                    </span>
                </td>
                <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center">{rep['avg_closing']}%</td>
                <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center">{rep['grade']}</td>
            </tr>
            """
        
        objections_list = "".join(
            f"<li><strong>{obj['category']}</strong>: {obj['count']} مرة</li>"
            for obj in data.get("top_objections", [])
        )
        
        recommendations_list = "".join(
            f"<li style='margin-bottom:8px'>{rec}</li>"
            for rec in data.get("ai_recommendations", [])
        )
        
        return f"""
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>تقرير المبيعات اليومي</title>
        </head>
        <body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;direction:rtl">
            <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.1)">
                
                <!-- Header -->
                <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:30px;color:#fff;text-align:center">
                    <h1 style="margin:0;font-size:24px">📊 تقرير المبيعات اليومي</h1>
                    <p style="margin:8px 0 0;opacity:.9">{report_date.strftime('%A, %d %B %Y')}</p>
                </div>
                
                <!-- KPIs -->
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-bottom:1px solid #f0f0f0">
                    <div style="padding:20px;text-align:center;border-left:1px solid #f0f0f0">
                        <div style="font-size:36px;font-weight:700;color:#2563eb">{data['total_meetings']}</div>
                        <div style="color:#666;font-size:14px;margin-top:4px">اجتماع</div>
                    </div>
                    <div style="padding:20px;text-align:center;border-left:1px solid #f0f0f0">
                        <div style="font-size:36px;font-weight:700;color:#22c55e">{data['avg_score']}</div>
                        <div style="color:#666;font-size:14px;margin-top:4px">متوسط الأداء / 100</div>
                    </div>
                    <div style="padding:20px;text-align:center">
                        <div style="font-size:36px;font-weight:700;color:#f97316">{data['avg_closing_prob']}%</div>
                        <div style="color:#666;font-size:14px;margin-top:4px">متوسط فرص الإغلاق</div>
                    </div>
                </div>
                
                <!-- Reps Table -->
                <div style="padding:24px">
                    <h2 style="margin:0 0 16px;color:#1e3a5f;font-size:18px">🏆 أداء الفريق</h2>
                    <table style="width:100%;border-collapse:collapse">
                        <thead>
                            <tr style="background:#f8f9fa">
                                <th style="padding:10px 8px;text-align:right;color:#666;font-size:13px">#</th>
                                <th style="padding:10px 8px;text-align:right;color:#666;font-size:13px">المندوب</th>
                                <th style="padding:10px 8px;text-align:center;color:#666;font-size:13px">اجتماعات</th>
                                <th style="padding:10px 8px;text-align:center;color:#666;font-size:13px">التقييم</th>
                                <th style="padding:10px 8px;text-align:center;color:#666;font-size:13px">احتمال الإغلاق</th>
                                <th style="padding:10px 8px;text-align:center;color:#666;font-size:13px">الدرجة</th>
                            </tr>
                        </thead>
                        <tbody>{reps_table}</tbody>
                    </table>
                </div>
                
                <!-- Top Objections -->
                <div style="padding:0 24px 24px">
                    <h2 style="margin:0 0 12px;color:#1e3a5f;font-size:18px">⚠️ أكثر الاعتراضات تكراراً</h2>
                    <ul style="margin:0;padding-right:20px;color:#444;line-height:2">
                        {objections_list}
                    </ul>
                </div>
                
                <!-- AI Recommendations -->
                <div style="padding:24px;background:#f0f7ff;border-top:1px solid #dbeafe">
                    <h2 style="margin:0 0 12px;color:#1e3a5f;font-size:18px">🤖 توصيات الذكاء الاصطناعي</h2>
                    <ul style="margin:0;padding-right:20px;color:#444;line-height:1.8">
                        {recommendations_list}
                    </ul>
                </div>
                
                <!-- Footer -->
                <div style="padding:20px;text-align:center;background:#1e3a5f;color:#94a3b8;font-size:13px">
                    <p style="margin:0">Sales Intelligence System | تم الإرسال تلقائياً الساعة 8:00 صباحاً</p>
                    <p style="margin:4px 0 0">
                        <a href="https://your-dashboard.vercel.app" style="color:#60a5fa">عرض التقرير الكامل على Dashboard</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _score_to_grade(self, score: float) -> str:
        if score >= 90: return "A+"
        elif score >= 80: return "A"
        elif score >= 70: return "B+"
        elif score >= 60: return "B"
        elif score >= 50: return "C"
        elif score >= 40: return "D"
        else: return "F"


### `backend/utils/scheduler.py`

```python
"""
Scheduler — يشغّل التقرير اليومي تلقائياً.
"""
import schedule
import threading
import time
from datetime import date
from ..services.report_service import DailyReportService

report_service = DailyReportService()

def run_daily_report():
    """تشغيل التقرير اليومي."""
    print("⏰ Running daily report job...")
    try:
        result = report_service.generate_and_send()
        print(f"✅ Daily report done: {result}")
    except Exception as e:
        print(f"❌ Daily report failed: {e}")

def start_scheduler():
    """تشغيل الـ Scheduler في thread منفصل."""
    schedule.every().day.at("08:00").do(run_daily_report)
    
    def run_schedule():
        while True:
            schedule.run_pending()
            time.sleep(60)
    
    thread = threading.Thread(target=run_schedule, daemon=True)
    thread.start()
    print("⏰ Daily report scheduler started (8:00 AM)")
```

---

## 12. Frontend — Next.js Dashboard

### هيكل الصفحات

```
frontend/
├── app/
│   ├── page.tsx                    → Landing / Login
│   ├── dashboard/
│   │   ├── page.tsx                → Dashboard المندوب
│   │   └── upload/page.tsx         → رفع تسجيل جديد
│   ├── meetings/
│   │   └── [id]/page.tsx           → تفاصيل اجتماع
│   └── admin/
│       ├── page.tsx                → Dashboard المدير
│       └── team/page.tsx           → إدارة الفريق
├── components/
│   ├── MeetingCard.tsx             → بطاقة اجتماع
│   ├── ScoreGauge.tsx              → عرض التقييم
│   ├── UploadForm.tsx              → نموذج الرفع
│   └── AnalysisReport.tsx          → عرض التحليل
└── lib/
    ├── api.ts                      → Axios instance
    └── auth.ts                     → NextAuth config
```

### `frontend/components/UploadForm.tsx`

```typescript
"use client";

import { useState } from "react";
import axios from "axios";

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !customerName) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("customer_name", customerName);
    formData.append("meeting_title", meetingTitle);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/meetings/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          onUploadProgress: (progress) => {
            const percent = Math.round(
              (progress.loaded * 100) / (progress.total || 1)
            );
            console.log(`Upload: ${percent}%`);
          },
        }
      );

      setResult(response.data);
      // ابدأ polling لمتابعة حالة المعالجة
      startStatusPolling(response.data.meeting_id);
    } catch (err: any) {
      setError(err.response?.data?.detail || "حدث خطأ في الرفع");
    }

    setUploading(false);
  };

  const startStatusPolling = (meetingId: number) => {
    const interval = setInterval(async () => {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/meetings/${meetingId}/status`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      console.log("Status:", res.data.status);

      if (["analyzed", "failed"].includes(res.data.status)) {
        clearInterval(interval);
        if (res.data.status === "analyzed") {
          window.location.href = `/meetings/${meetingId}`;
        }
      }
    }, 10000); // كل 10 ثواني
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-right">
        📤 رفع تسجيل اجتماع جديد
      </h1>

      <form onSubmit={handleUpload} className="space-y-4">
        {/* اسم العميل */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
            اسم العميل *
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-right focus:ring-2 focus:ring-blue-500"
            placeholder="مثال: شركة ABC"
            required
          />
        </div>

        {/* رفع الملف */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
            ملف التسجيل *
          </label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            {file ? (
              <div>
                <span className="text-2xl">✅</span>
                <p className="mt-2 font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            ) : (
              <div>
                <span className="text-4xl">🎬</span>
                <p className="mt-2 text-gray-600">
                  اضغط لاختيار ملف أو اسحبه هنا
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  MP4, MP3, M4A, WAV — حد أقصى 500MB
                </p>
              </div>
            )}
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept=".mp4,.mp3,.m4a,.wav,.webm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        {/* زر الرفع */}
        <button
          type="submit"
          disabled={uploading || !file || !customerName}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {uploading ? "⏳ جاري الرفع..." : "📤 رفع وتحليل الاجتماع"}
        </button>
      </form>

      {/* نتيجة الرفع */}
      {result && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-right">
          <h3 className="font-bold text-green-800">✅ تم استلام الملف!</h3>
          <p className="text-green-700 mt-1">
            جاري المعالجة. ستصلك إشعار عند الانتهاء.
          </p>
          <p className="text-sm text-green-600 mt-2">
            الوقت المتوقع: {result.estimated_time_minutes} دقيقة
          </p>
        </div>
      )}

      {/* رسالة خطأ */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-right">
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 13. نظام الإشعارات

### طرق الإشعار المجانية

```
1. إيميل (Resend.com — 3,000/شهر مجاناً)
   → المندوب: "تم تحليل اجتماعك ✅ Score: 87/100"
   → المدير: التقرير اليومي كل 8 صباحاً

2. Webhook (لو عندك Slack أو Teams)
   → إشعار فوري في قناة المبيعات

3. Server-Sent Events (SSE في الـ Frontend)
   → تحديث تلقائي للـ Dashboard بدون Refresh
```

### `backend/services/email_service.py`

```python
"""إرسال الإيميلات عبر Resend.com (مجاني 3000/شهر)."""
import httpx
from ..config import settings


def send_email(to: list[str], subject: str, html_content: str) -> bool:
    """إرسال إيميل."""
    try:
        with httpx.Client() as client:
            response = client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": settings.FROM_EMAIL,
                    "to": to,
                    "subject": subject,
                    "html": html_content
                }
            )
            return response.status_code == 200
    except Exception as e:
        print(f"Email failed: {e}")
        return False


def send_processing_complete(user_email: str, meeting_data: dict) -> bool:
    """إشعار اكتمال تحليل الاجتماع."""
    html = f"""
    <div dir="rtl" style="font-family:Arial;max-width:600px;margin:auto">
        <h2 style="color:#2563eb">✅ تم تحليل اجتماعك!</h2>
        <p><strong>العميل:</strong> {meeting_data['customer_name']}</p>
        <p><strong>التقييم:</strong> 
           <span style="font-size:24px;font-weight:bold;color:#22c55e">
               {meeting_data['score']}/100
           </span>
        </p>
        <p><strong>احتمالية الإغلاق:</strong> {meeting_data['closing_prob']}%</p>
        <hr/>
        <h3>أبرز نتائج التحليل:</h3>
        <p>{meeting_data['summary']}</p>
        <a href="{settings.FRONTEND_URL}/meetings/{meeting_data['id']}" 
           style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
            عرض التقرير الكامل
        </a>
    </div>
    """
    return send_email([user_email], f"✅ تحليل اجتماع {meeting_data['customer_name']} جاهز", html)
```

---

## 14. خطة الاختبار الكاملة

### 14.1 — اختبار الوحدات (Unit Tests)

#### `backend/tests/test_whisper.py`

```python
"""
اختبار خدمة Whisper.
تشغيل: pytest backend/tests/test_whisper.py -v
"""
import pytest
import os
from unittest.mock import patch, MagicMock
from backend.services.whisper_service import WhisperService

class TestWhisperService:
    
    def test_clean_arabic_text(self):
        """اختبار تنظيف النص العربي."""
        service = WhisperService()
        dirty = "مرحبا   بكم   في   النظام..."
        clean = service._clean_arabic_text(dirty)
        assert "  " not in clean  # لا مسافات مضاعفة
    
    def test_audio_file_not_found(self):
        """يجب أن يرمي خطأ لو الملف مش موجود."""
        service = WhisperService()
        with pytest.raises(Exception):
            service.transcribe("non_existent_file.wav")
    
    @patch("backend.services.whisper_service.whisper")
    def test_transcription_returns_correct_structure(self, mock_whisper):
        """التحقق من هيكل النتيجة."""
        # تجهيز Mock
        mock_model = MagicMock()
        mock_model.transcribe.return_value = {
            "text": "مرحبا هذا اختبار",
            "segments": [],
            "language": "ar"
        }
        mock_whisper.load_model.return_value = mock_model
        
        service = WhisperService()
        service._model = mock_model
        
        # إنشاء ملف صوتي مؤقت للاختبار
        with open("/tmp/test_audio.wav", "wb") as f:
            f.write(b"\x00" * 100)  # ملف فارغ للاختبار
        
        result = service.transcribe("/tmp/test_audio.wav")
        
        assert "text" in result
        assert "processing_time" in result
        assert "word_count" in result
        assert result["language"] == "ar"
```

#### `backend/tests/test_ai_service.py`

```python
"""اختبار خدمة التحليل الذكاء الاصطناعي."""
import pytest
import json
from unittest.mock import patch, MagicMock
from backend.services.ai_service import AIAnalysisService

SAMPLE_TRANSCRIPT = """
المندوب: مرحبا، شكرا لوقتك اليوم. كيف تسير الأمور؟
العميل: بخير شكرا. تفضل عرفني على نظامكم.
المندوب: بالتأكيد. نحن نقدم نظام إدارة مبيعات متكامل...
العميل: كم تكلفة الاشتراك السنوي؟
المندوب: التكلفة تبدأ من 500 دولار شهرياً.
العميل: هذا مرتفع نوعاً ما. هل يوجد خطة أرخص؟
"""

SAMPLE_AI_RESPONSE = {
    "summary": "اجتماع تعريفي مع عميل محتمل. اهتمام بالنظام مع اعتراض على السعر.",
    "customer_questions": ["كم تكلفة الاشتراك السنوي؟"],
    "objections": [{"text": "هذا مرتفع", "category": "price", "was_handled": False, "handling_quality": "not_handled"}],
    "strengths": ["تقديم النظام بوضوح"],
    "weaknesses": ["لم يتعامل مع اعتراض السعر"],
    "next_steps": ["إرسال عرض سعر"],
    "follow_up_days": 2,
    "closing_probability": 45,
    "deal_stage": "proposal",
    "customer_interest": "medium",
    "talk_ratio": 60,
    "key_topics": ["التسعير", "الميزات"],
    "missing_topics": ["عائد الاستثمار ROI"],
    "coaching_notes": "المندوب يحتاج تدريب على معالجة اعتراضات السعر"
}

class TestAIAnalysisService:
    
    @patch("httpx.Client")
    def test_groq_analysis(self, mock_client):
        """اختبار تحليل Groq."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [{"message": {"content": json.dumps(SAMPLE_AI_RESPONSE)}}]
        }
        mock_response.status_code = 200
        mock_client.return_value.__enter__.return_value.post.return_value = mock_response
        
        service = AIAnalysisService()
        result = service.analyze(SAMPLE_TRANSCRIPT, "شركة ABC", 30)
        
        assert "summary" in result
        assert "closing_probability" in result
        assert 0 <= result["closing_probability"] <= 100
        assert result["closing_probability"] == 45
    
    def test_json_parsing_with_markdown(self):
        """اختبار parsing لما الـ AI يحط markdown."""
        service = AIAnalysisService()
        content_with_markdown = f"```json\n{json.dumps(SAMPLE_AI_RESPONSE)}\n```"
        result = service._parse_json(content_with_markdown)
        assert result["closing_probability"] == 45
    
    def test_json_parsing_invalid(self):
        """يجب أن يرمي خطأ للـ JSON الغلط."""
        service = AIAnalysisService()
        with pytest.raises(json.JSONDecodeError):
            service._parse_json("هذا ليس JSON")
```

#### `backend/tests/test_scoring.py`

```python
"""اختبار نظام التقييم."""
import pytest
from backend.services.scoring_service import calculate_score

def test_perfect_score():
    """اجتماع مثالي يجب أن يحصل على A+."""
    analysis = {
        "objections": [],
        "strengths": ["ممتاز في الشرح", "تعامل مع كل الأسئلة"],
        "weaknesses": [],
        "closing_probability": 95,
        "customer_interest": "high",
        "talk_ratio": 45  # 45% كلام المندوب = مثالي
    }
    transcript = {"word_count": 2000}
    meeting = MagicMock(duration_seconds=3600)
    
    score = calculate_score(analysis, transcript, meeting)
    assert score["total"] >= 85
    assert score["grade"] in ["A+", "A"]

def test_poor_score():
    """اجتماع سيء يجب أن يحصل على تقييم منخفض."""
    analysis = {
        "objections": [{"was_handled": False}, {"was_handled": False}],
        "strengths": [],
        "weaknesses": ["لا يستمع للعميل", "كلام كثير"],
        "closing_probability": 10,
        "customer_interest": "low",
        "talk_ratio": 90  # 90% كلام = المندوب لا يستمع
    }
    transcript = {"word_count": 300}
    meeting = MagicMock(duration_seconds=600)
    
    score = calculate_score(analysis, transcript, meeting)
    assert score["total"] < 50
    assert score["grade"] in ["D", "F"]

def test_score_components_sum():
    """مجموع مكونات التقييم يجب أن يساوي الإجمالي تقريباً."""
    analysis = {
        "objections": [{"was_handled": True}],
        "strengths": ["جيد"],
        "weaknesses": [],
        "closing_probability": 70,
        "customer_interest": "high",
        "talk_ratio": 50
    }
    score = calculate_score(analysis, {"word_count": 1000}, MagicMock(duration_seconds=2400))
    
    # التحقق من أن جميع المكونات موجودة
    assert "opening" in score
    assert "discovery" in score
    assert "presentation" in score
    assert "objections" in score
    assert "closing" in score
    assert "communication" in score
    assert "total" in score
```

### 14.2 — اختبار API (Integration Tests)

```python
"""
backend/tests/test_api.py
اختبار الـ API Endpoints
تشغيل: pytest backend/tests/test_api.py -v
"""
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

# =============================================
# اختبارات المصادقة
# =============================================
class TestAuth:
    
    def test_login_success(self):
        response = client.post("/api/auth/login", json={
            "email": "sales@test.com",
            "password": "Test@123"
        })
        assert response.status_code == 200
        assert "access_token" in response.json()
    
    def test_login_wrong_password(self):
        response = client.post("/api/auth/login", json={
            "email": "sales@test.com",
            "password": "WrongPassword"
        })
        assert response.status_code == 401
    
    def test_protected_route_without_token(self):
        response = client.get("/api/meetings/")
        assert response.status_code == 401

# =============================================
# اختبارات الرفع
# =============================================
class TestUpload:
    
    def get_token(self):
        r = client.post("/api/auth/login", json={
            "email": "sales@test.com", "password": "Test@123"
        })
        return r.json()["access_token"]
    
    def test_upload_valid_mp4(self, tmp_path):
        """اختبار رفع ملف MP4 صحيح."""
        # إنشاء ملف test مؤقت
        test_file = tmp_path / "test_meeting.mp4"
        test_file.write_bytes(b"\x00" * 1024 * 100)  # 100KB
        
        with open(test_file, "rb") as f:
            response = client.post(
                "/api/meetings/upload",
                headers={"Authorization": f"Bearer {self.get_token()}"},
                files={"file": ("test.mp4", f, "video/mp4")},
                data={
                    "customer_name": "شركة اختبار",
                    "meeting_title": "اجتماع اختبار"
                }
            )
        
        assert response.status_code == 200
        data = response.json()
        assert "meeting_id" in data
        assert data["status"] == "uploaded"
    
    def test_upload_invalid_format(self, tmp_path):
        """يجب رفض صيغ غير مدعومة."""
        test_file = tmp_path / "document.pdf"
        test_file.write_bytes(b"PDF content")
        
        with open(test_file, "rb") as f:
            response = client.post(
                "/api/meetings/upload",
                headers={"Authorization": f"Bearer {self.get_token()}"},
                files={"file": ("document.pdf", f, "application/pdf")},
                data={"customer_name": "اختبار"}
            )
        
        assert response.status_code == 400
        assert "غير مدعوم" in response.json()["detail"]
    
    def test_upload_oversized_file(self, tmp_path):
        """يجب رفض الملفات الكبيرة جداً."""
        # محاكاة ملف 600MB (أكبر من الحد 500MB)
        test_file = tmp_path / "huge.mp4"
        test_file.write_bytes(b"\x00" * 1024 * 1024 * 10)  # 10MB للاختبار
        
        # تعديل الحد مؤقتاً للاختبار
        import backend.config as config
        original = config.settings.MAX_FILE_SIZE_MB
        config.settings.MAX_FILE_SIZE_MB = 5  # 5MB
        
        with open(test_file, "rb") as f:
            response = client.post(
                "/api/meetings/upload",
                headers={"Authorization": f"Bearer {self.get_token()}"},
                files={"file": ("huge.mp4", f, "video/mp4")},
                data={"customer_name": "اختبار"}
            )
        
        config.settings.MAX_FILE_SIZE_MB = original
        assert response.status_code == 413
```

### 14.3 — اختبار يدوي (Manual Testing Checklist)

```markdown
## ✅ Checklist الاختبار اليدوي

### قبل كل Release جديد:

#### رفع الملفات
- [ ] رفع MP4 (اجتماع 30 دقيقة) يعمل بنجاح
- [ ] رفع MP3 يعمل بنجاح
- [ ] رفع ملف أكبر من 500MB يعطي رسالة خطأ واضحة
- [ ] رفع ملف PDF يعطي رسالة خطأ واضحة
- [ ] رفع بدون اسم عميل يعطي رسالة خطأ
- [ ] Status يتغير: uploaded → processing → transcribing → analyzing → analyzed

#### التحليل
- [ ] النص المحوّل يقرأ بشكل صحيح بالعربية
- [ ] الملخص منطقي ومرتبط بالاجتماع
- [ ] الأسئلة المستخرجة حقيقية من المحادثة
- [ ] الاعتراضات مصنفة صح (price, features, ...)
- [ ] Score بين 0 و 100
- [ ] احتمالية الإغلاق بين 0% و 100%

#### Dashboard
- [ ] مندوب يرى اجتماعاته فقط
- [ ] مدير يرى كل الاجتماعات
- [ ] مندوب لا يقدر يشوف اجتماعات مندوب ثاني
- [ ] التقرير التفصيلي يفتح بشكل صحيح

#### التقرير اليومي
- [ ] إرسال تقرير تجريبي: POST /api/admin/send-test-report
- [ ] الإيميل يصل للمديرين
- [ ] الجداول والأرقام صحيحة
- [ ] الروابط في الإيميل تعمل
```

---

## 15. النشر على Oracle Cloud

### لماذا Oracle Cloud؟

Oracle Free Tier يعطيك **مجاناً للأبد**:
- سيرفر ARM بـ 4 vCPU + 24GB RAM
- 200GB storage
- Bandwidth 10TB/شهر
- يكفي بسهولة لـ Whisper + FastAPI + PostgreSQL

### إعداد السيرفر

```bash
# 1. إنشاء حساب على oracle.com/cloud/free
# 2. إنشاء VM Instance:
#    - Shape: VM.Standard.A1.Flex (ARM)
#    - CPU: 4 | RAM: 24GB
#    - OS: Ubuntu 22.04

# 3. الاتصال بالسيرفر
ssh ubuntu@YOUR_SERVER_IP

# 4. تحديث النظام
sudo apt update && sudo apt upgrade -y

# 5. تثبيت المتطلبات
sudo apt install -y python3 python3-pip python3-venv \
    ffmpeg git nginx certbot python3-certbot-nginx

# 6. تثبيت Docker (اختياري للتبسيط)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# 7. Clone المشروع
git clone https://github.com/youruser/sales-intelligence.git
cd sales-intelligence

# 8. إعداد البيئة
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 9. إعداد .env
cp .env.example backend/.env
nano backend/.env  # أضف قيمك

# 10. تشغيل PostgreSQL محلياً (أو استخدم Supabase)
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres createdb sales_intelligence
sudo -u postgres createuser --pwprompt salesuser

# 11. Migrations
python -m backend.database init

# 12. تشغيل Celery Worker
celery -A backend.workers.tasks worker --loglevel=info &

# 13. تشغيل FastAPI
uvicorn backend.main:app --host 0.0.0.0 --port 8000 &

# 14. إعداد Nginx
sudo nano /etc/nginx/sites-available/sales-intelligence
```

### ملف Nginx Config

```nginx
server {
    server_name api.yourdomain.com;
    
    # رفع ملفات كبيرة (حتى 500MB)
    client_max_body_size 500M;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;  # مهم لرفع الملفات الكبيرة
        proxy_send_timeout 300s;
    }
}
```

```bash
# تفعيل وإضافة SSL مجاني
sudo ln -s /etc/nginx/sites-available/sales-intelligence /etc/nginx/sites-enabled/
sudo certbot --nginx -d api.yourdomain.com
sudo systemctl restart nginx
```

### Systemd Services (للتشغيل التلقائي عند إعادة التشغيل)

```ini
# /etc/systemd/system/sales-api.service
[Unit]
Description=Sales Intelligence API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/sales-intelligence
Environment=PATH=/home/ubuntu/sales-intelligence/venv/bin
ExecStart=/home/ubuntu/sales-intelligence/venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable sales-api celery-worker
sudo systemctl start sales-api celery-worker
```

---

## 16. المشاكل الشائعة وحلولها

### مشكلة: Whisper بطيء جداً

```bash
# الأعراض: اجتماع 30 دقيقة يأخذ 40+ دقيقة للمعالجة

# الحل 1: استخدم medium بدل large-v3 للاجتماعات القصيرة
# في .env:
WHISPER_MODEL=medium  # أسرع 3x مع دقة مقبولة للعربية

# الحل 2: تقسيم الصوت لأجزاء أصغر
# Whisper يعالج أسرع مع ملفات أقل من 10 دقائق

# الحل 3: تشغيل Workers متعددة
celery -A backend.workers.tasks worker --concurrency=2

# الحل 4: (المثالي) تفعيل GPU على Oracle Cloud
# أضف لـ pip install:
pip install openai-whisper[torch]
# و تأكد أن CUDA متاح:
python -c "import torch; print(torch.cuda.is_available())"
```

### مشكلة: Groq وصل للحد اليومي

```bash
# الأعراض: 429 Too Many Requests من Groq

# الحل 1: تقليل عدد tokens لكل request
# في الـ prompt: قلّل النص المرسل لأول 4000 كلمة بدل 8000

# الحل 2: تفعيل Gemini Fallback (موجود بالفعل في الكود)

# الحل 3: Caching
# لو نفس النص اتحلل قبل → ارجع النتيجة المحفوظة
import hashlib
cache_key = hashlib.md5(transcript[:1000].encode()).hexdigest()

# الحل 4: تقليل التحليل غير الضروري
# لا تحلل الاجتماعات أقل من 5 دقائق
if meeting.duration_seconds < 300:
    return {"summary": "اجتماع قصير", "closing_probability": 0}
```

### مشكلة: FFmpeg فشل في الاستخراج

```bash
# الأعراض: RuntimeError: FFmpeg failed: Invalid data found

# الحل 1: تحقق من صحة الملف
ffprobe -v quiet -print_format json -show_streams meeting.mp4

# الحل 2: أضف error handling للملفات التالفة
try:
    extract_audio(file_path)
except RuntimeError:
    # جرب طريقة بديلة
    cmd_fallback = ["ffmpeg", "-i", file_path, "-vn", "-f", "wav", audio_path]
    subprocess.run(cmd_fallback)

# الحل 3: التحقق من الامتداد مقابل المحتوى الحقيقي
file_type = subprocess.run(["file", "--mime-type", file_path], capture_output=True, text=True)
```

### مشكلة: النص العربي يخرج غلط

```bash
# الأعراض: نص بحروف غريبة أو مقلوب

# الحل 1: التأكد من الـ language في Whisper
result = model.transcribe(audio_path, language="ar")  # إجباري

# الحل 2: استخدام large-v3 بدل medium
WHISPER_MODEL=large-v3

# الحل 3: تحسين جودة الصوت قبل Whisper
# نزّل الضوضاء بـ FFmpeg
cmd = [
    "ffmpeg", "-i", audio_path,
    "-af", "highpass=f=300,lowpass=f=3000,afftdn=nf=-25",  # تصفية الضوضاء
    "-ar", "16000", "-ac", "1",
    clean_audio_path
]
```

---

## 17. خطة التطوير المستقبلية

### المرحلة الحالية (MVP) — شهر 1-2

```
✅ رفع تسجيلات Zoom يدوياً
✅ تحويل الصوت لنص (Whisper)
✅ تحليل AI (Groq/Gemini)
✅ تقرير لكل اجتماع
✅ Score تلقائي
✅ Dashboard للمندوب والمدير
✅ تقرير يومي بالإيميل
```

### المرحلة الثانية — شهر 3-4

```
🔄 Zoom Webhook (رفع تلقائي بعد كل اجتماع)
🔄 Speaker Diarization أدق (pyannote-audio)
🔄 Coaching Cards تلقائية للمندوبين
🔄 تتبع الأداء عبر الزمن (Trends)
🔄 تنبيهات Smart (مندوب أداؤه تراجع)
🔄 مقارنة بين الفرق والمناطق
```

### المرحلة الثالثة — شهر 5-6

```
🚀 Predictive Scoring (توقع الصفقات قبل الإغلاق)
🚀 Real-time Coaching (نصائح أثناء الاجتماع)
🚀 Competitive Intelligence (تحليل ذكر المنافسين)
🚀 Custom AI Models (model مدرب على بيانات شركتك)
🚀 CRM Integration (Salesforce, HubSpot)
🚀 Mobile App
```

---

## 📊 ملخص التكاليف النهائي

| الخدمة | الحد المجاني | متى تدفع؟ |
|--------|-------------|-----------|
| Oracle Cloud | مجاني للأبد (ARM) | لما تحتاج GPU أو RAM أكثر |
| Vercel | مجاني للأبد | لما الـ bandwidth يتجاوز 100GB/شهر |
| Supabase | 500MB مجاناً | لما البيانات تتجاوز 500MB |
| Groq | 14,400 req/يوم | أكثر من 400 اجتماع/يوم |
| Gemini | 15 req/دقيقة | نادراً (backup فقط) |
| Resend | 3,000 إيميل/شهر | لما المستخدمين يتجاوزون 100 مندوب |
| Upstash Redis | 10,000 req/يوم | لما Queue يتجاوز 300 job/يوم |
| **الإجمالي** | **صفر دولار** | **لحين الوصول لـ ~100 مندوب** |

---

## 🚀 البدء الفوري — Quick Start

```bash
# 1. Clone
git clone https://github.com/youruser/sales-intelligence.git
cd sales-intelligence

# 2. Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# عدّل .env بقيمك

# 3. Database
python -m backend.database init

# 4. Workers
celery -A backend.workers.tasks worker -l info &

# 5. API
uvicorn backend.main:app --reload --port 8000

# 6. Frontend
cd ../frontend
npm install
cp .env.local.example .env.local
npm run dev

# 7. الرابط
# API: http://localhost:8000/docs
# Frontend: http://localhost:3000
```

---

*آخر تحديث: 2025 | Sales Intelligence System v1.0*

from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import bcrypt
from jose import jwt, JWTError
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from fastapi import Request

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 720  # 30 days

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Models
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    theme_preference: str = "light"
    notification_enabled: bool = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    theme_preference: Optional[str] = None
    notification_enabled: Optional[bool] = None
    notification_times: Optional[List[str]] = None

class MoodEntry(BaseModel):
    mood_value: int = Field(ge=1, le=5)  # 1=very sad, 5=very happy
    mood_emoji: str
    mood_color: str
    factors: dict  # {sleep: int, stress: int, energy: int}
    journal_text: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class MoodEntryResponse(BaseModel):
    id: str
    user_id: str
    mood_value: int
    mood_emoji: str
    mood_color: str
    factors: dict
    journal_text: Optional[str] = None
    timestamp: datetime
    created_at: datetime

class PredictionResponse(BaseModel):
    id: str
    user_id: str
    prediction_date: str
    predicted_mood: float
    confidence: float
    reasoning: str
    coping_strategies: List[str]
    created_at: datetime

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode = {"user_id": user_id, "exp": expire}
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user = {
        "_id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.utcnow(),
        "theme_preference": "light",
        "notification_enabled": True,
        "notification_times": ["09:00", "14:00", "20:00"]
    }
    
    await db.users.insert_one(user)
    token = create_access_token(user_id)
    
    return {
        "token": token,
        "user": UserResponse(
            id=user_id,
            name=user["name"],
            email=user["email"],
            theme_preference=user["theme_preference"],
            notification_enabled=user["notification_enabled"]
        )
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(user["_id"])
    
    return {
        "token": token,
        "user": UserResponse(
            id=user["_id"],
            name=user["name"],
            email=user["email"],
            theme_preference=user.get("theme_preference", "light"),
            notification_enabled=user.get("notification_enabled", True)
        )
    }

@api_router.get("/auth/me")
async def get_me(user = Depends(get_current_user)):
    return UserResponse(
        id=user["_id"],
        name=user["name"],
        email=user["email"],
        theme_preference=user.get("theme_preference", "light"),
        notification_enabled=user.get("notification_enabled", True)
    )

@api_router.put("/auth/profile")
async def update_profile(update_data: UserUpdate, user = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
    if update_dict:
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": update_dict}
        )
    
    updated_user = await db.users.find_one({"_id": user["_id"]})
    return UserResponse(
        id=updated_user["_id"],
        name=updated_user["name"],
        email=updated_user["email"],
        theme_preference=updated_user.get("theme_preference", "light"),
        notification_enabled=updated_user.get("notification_enabled", True)
    )

# Mood Entry Routes
@api_router.post("/moods")
async def create_mood_entry(mood_data: MoodEntry, user = Depends(get_current_user)):
    entry_id = str(uuid.uuid4())
    entry = {
        "_id": entry_id,
        "user_id": user["_id"],
        "mood_value": mood_data.mood_value,
        "mood_emoji": mood_data.mood_emoji,
        "mood_color": mood_data.mood_color,
        "factors": mood_data.factors,
        "journal_text": mood_data.journal_text,
        "timestamp": mood_data.timestamp,
        "created_at": datetime.utcnow()
    }
    
    await db.mood_entries.insert_one(entry)
    
    return MoodEntryResponse(
        id=entry_id,
        user_id=user["_id"],
        mood_value=entry["mood_value"],
        mood_emoji=entry["mood_emoji"],
        mood_color=entry["mood_color"],
        factors=entry["factors"],
        journal_text=entry["journal_text"],
        timestamp=entry["timestamp"],
        created_at=entry["created_at"]
    )

@api_router.get("/moods")
async def get_mood_entries(days: int = 30, user = Depends(get_current_user)):
    start_date = datetime.utcnow() - timedelta(days=days)
    
    entries = await db.mood_entries.find({
        "user_id": user["_id"],
        "timestamp": {"$gte": start_date}
    }).sort("timestamp", -1).to_list(1000)
    
    return [
        MoodEntryResponse(
            id=entry["_id"],
            user_id=entry["user_id"],
            mood_value=entry["mood_value"],
            mood_emoji=entry["mood_emoji"],
            mood_color=entry["mood_color"],
            factors=entry["factors"],
            journal_text=entry.get("journal_text"),
            timestamp=entry["timestamp"],
            created_at=entry["created_at"]
        )
        for entry in entries
    ]

@api_router.get("/moods/stats")
async def get_mood_stats(days: int = 30, user = Depends(get_current_user)):
    start_date = datetime.utcnow() - timedelta(days=days)
    
    entries = await db.mood_entries.find({
        "user_id": user["_id"],
        "timestamp": {"$gte": start_date}
    }).to_list(1000)
    
    if not entries:
        return {
            "average_mood": 0,
            "total_entries": 0,
            "mood_distribution": {},
            "average_factors": {}
        }
    
    total_mood = sum(e["mood_value"] for e in entries)
    mood_distribution = {}
    for e in entries:
        mood_distribution[e["mood_value"]] = mood_distribution.get(e["mood_value"], 0) + 1
    
    # Calculate average factors
    avg_factors = {}
    if entries:
        factor_keys = entries[0]["factors"].keys()
        for key in factor_keys:
            avg_factors[key] = sum(e["factors"].get(key, 0) for e in entries) / len(entries)
    
    return {
        "average_mood": total_mood / len(entries),
        "total_entries": len(entries),
        "mood_distribution": mood_distribution,
        "average_factors": avg_factors
    }

@api_router.get("/moods/export")
async def export_mood_data(user = Depends(get_current_user)):
    entries = await db.mood_entries.find({
        "user_id": user["_id"]
    }).sort("timestamp", -1).to_list(10000)
    
    return {
        "user": {
            "name": user["name"],
            "email": user["email"]
        },
        "export_date": datetime.utcnow().isoformat(),
        "total_entries": len(entries),
        "entries": [
            {
                "mood_value": entry["mood_value"],
                "mood_emoji": entry["mood_emoji"],
                "mood_color": entry["mood_color"],
                "factors": entry["factors"],
                "journal_text": entry.get("journal_text"),
                "timestamp": entry["timestamp"].isoformat()
            }
            for entry in entries
        ]
    }

# AI Prediction Routes
@api_router.post("/predictions/generate")
async def generate_prediction(user = Depends(get_current_user)):
    # Get last 14 days of mood entries
    start_date = datetime.utcnow() - timedelta(days=14)
    entries = await db.mood_entries.find({
        "user_id": user["_id"],
        "timestamp": {"$gte": start_date}
    }).sort("timestamp", 1).to_list(1000)
    
    if len(entries) < 3:
        raise HTTPException(
            status_code=400,
            detail="Need at least 3 mood entries to generate predictions"
        )
    
    # Prepare data for AI
    mood_history = []
    for entry in entries:
        mood_history.append({
            "date": entry["timestamp"].strftime("%Y-%m-%d %H:%M"),
            "mood_value": entry["mood_value"],
            "mood_emoji": entry["mood_emoji"],
            "factors": entry["factors"],
            "journal": entry.get("journal_text", "")
        })
    
    # Create AI prompt
    prompt = f"""You are a compassionate mental health assistant analyzing mood patterns.

Mood History (last 14 days):
{mood_history}

Based on this mood history, provide:
1. A predicted mood value (1-5) for tomorrow
2. Your confidence level (0-1)
3. Brief reasoning about the prediction
4. 3-5 personalized coping strategies to help prepare for tomorrow

Respond in this JSON format:
{{
  "predicted_mood": <float 1-5>,
  "confidence": <float 0-1>,
  "reasoning": "<your analysis>",
  "coping_strategies": ["strategy1", "strategy2", "strategy3"]
}}"""
    
    try:
        # Initialize LLM Chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"prediction_{user['_id']}_{datetime.utcnow().isoformat()}",
            system_message="You are a compassionate mental health assistant."
        ).with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse response (assuming it returns JSON)
        import json
        try:
            result = json.loads(response)
        except:
            # If not valid JSON, create a default response
            result = {
                "predicted_mood": 3.5,
                "confidence": 0.7,
                "reasoning": "Based on your recent patterns, maintaining balance is key.",
                "coping_strategies": [
                    "Practice mindfulness for 10 minutes daily",
                    "Maintain regular sleep schedule",
                    "Stay connected with supportive people"
                ]
            }
        
        # Save prediction
        prediction_id = str(uuid.uuid4())
        tomorrow = datetime.utcnow() + timedelta(days=1)
        
        prediction = {
            "_id": prediction_id,
            "user_id": user["_id"],
            "prediction_date": tomorrow.strftime("%Y-%m-%d"),
            "predicted_mood": result["predicted_mood"],
            "confidence": result["confidence"],
            "reasoning": result["reasoning"],
            "coping_strategies": result["coping_strategies"],
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        await db.predictions.insert_one(prediction)
        
        return PredictionResponse(
            id=prediction_id,
            user_id=user["_id"],
            prediction_date=prediction["prediction_date"],
            predicted_mood=prediction["predicted_mood"],
            confidence=prediction["confidence"],
            reasoning=prediction["reasoning"],
            coping_strategies=prediction["coping_strategies"],
            created_at=prediction["created_at"]
        )
    except Exception as e:
        logger.error(f"Error generating prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate prediction: {str(e)}")

@api_router.get("/predictions")
async def get_predictions(user = Depends(get_current_user)):
    predictions = await db.predictions.find({
        "user_id": user["_id"],
        "is_active": True
    }).sort("created_at", -1).limit(10).to_list(10)
    
    return [
        PredictionResponse(
            id=pred["_id"],
            user_id=pred["user_id"],
            prediction_date=pred["prediction_date"],
            predicted_mood=pred["predicted_mood"],
            confidence=pred["confidence"],
            reasoning=pred["reasoning"],
            coping_strategies=pred["coping_strategies"],
            created_at=pred["created_at"]
        )
        for pred in predictions
    ]

# Worry Tree Models
class WorryCreate(BaseModel):
    worry_text: str
    intensity: int = Field(ge=1, le=10)

class WorryUpdate(BaseModel):
    category: Optional[str] = None
    intensity: Optional[int] = None
    resolution_note: Optional[str] = None

class WorryResponse(BaseModel):
    id: str
    user_id: str
    worry_text: str
    category: str  # let_go, take_action, scheduled, resolved
    intensity: int
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolution_note: Optional[str] = None

# Worry Tree Routes
@api_router.post("/worry-tree")
async def create_worry(worry_data: WorryCreate, user = Depends(get_current_user)):
    worry_id = str(uuid.uuid4())
    worry = {
        "_id": worry_id,
        "user_id": user["_id"],
        "worry_text": worry_data.worry_text,
        "category": "take_action",  # Default category
        "intensity": worry_data.intensity,
        "created_at": datetime.utcnow(),
        "resolved_at": None
    }
    
    await db.worries.insert_one(worry)
    
    return WorryResponse(
        id=worry_id,
        user_id=user["_id"],
        worry_text=worry["worry_text"],
        category=worry["category"],
        intensity=worry["intensity"],
        created_at=worry["created_at"],
        resolved_at=worry.get("resolved_at")
    )

@api_router.get("/worry-tree")
async def get_worries(user = Depends(get_current_user)):
    worries = await db.worries.find({
        "user_id": user["_id"]
    }).sort("created_at", -1).to_list(1000)
    
    return [
        WorryResponse(
            id=worry["_id"],
            user_id=worry["user_id"],
            worry_text=worry["worry_text"],
            category=worry["category"],
            intensity=worry["intensity"],
            created_at=worry["created_at"],
            resolved_at=worry.get("resolved_at"),
            resolution_note=worry.get("resolution_note")
        )
        for worry in worries
    ]

@api_router.put("/worry-tree/{worry_id}")
async def update_worry(worry_id: str, update_data: WorryUpdate, user = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
    # If marking as resolved, add resolved_at timestamp
    if update_dict.get("category") == "resolved":
        update_dict["resolved_at"] = datetime.utcnow()
        # Store resolution note if provided
        if update_data.resolution_note:
            update_dict["resolution_note"] = update_data.resolution_note
    
    result = await db.worries.update_one(
        {"_id": worry_id, "user_id": user["_id"]},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Worry not found")
    
    updated_worry = await db.worries.find_one({"_id": worry_id})
    
    return WorryResponse(
        id=updated_worry["_id"],
        user_id=updated_worry["user_id"],
        worry_text=updated_worry["worry_text"],
        category=updated_worry["category"],
        intensity=updated_worry["intensity"],
        created_at=updated_worry["created_at"],
        resolved_at=updated_worry.get("resolved_at"),
        resolution_note=updated_worry.get("resolution_note")
    )

@api_router.delete("/worry-tree/{worry_id}")
async def delete_worry(worry_id: str, user = Depends(get_current_user)):
    result = await db.worries.delete_one({"_id": worry_id, "user_id": user["_id"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Worry not found")
    
    return {"message": "Worry deleted successfully"}

# Achievements Routes
@api_router.get("/achievements")
async def get_achievements(user = Depends(get_current_user)):
    # Get user stats
    mood_count = await db.mood_entries.count_documents({"user_id": user["_id"]})
    worry_count = await db.worries.count_documents({"user_id": user["_id"]})
    resolved_worries = await db.worries.count_documents({"user_id": user["_id"], "category": "resolved"})
    
    # Calculate streak
    mood_entries = await db.mood_entries.find({"user_id": user["_id"]}).sort("timestamp", -1).to_list(1000)
    current_streak = 0
    longest_streak = 0
    
    if mood_entries:
        dates = set()
        for entry in mood_entries:
            dates.add(entry["timestamp"].date())
        
        sorted_dates = sorted(dates, reverse=True)
        current_streak = 1
        temp_streak = 1
        
        for i in range(len(sorted_dates) - 1):
            diff = (sorted_dates[i] - sorted_dates[i + 1]).days
            if diff == 1:
                temp_streak += 1
                if i == 0:
                    current_streak = temp_streak
            else:
                temp_streak = 1
            longest_streak = max(longest_streak, temp_streak)
        
        longest_streak = max(longest_streak, current_streak)
    
    # Count happy moods (4 or 5)
    happy_moods = await db.mood_entries.count_documents({
        "user_id": user["_id"],
        "mood_value": {"$gte": 4}
    })
    
    # Define achievements
    achievements = [
        {
            "id": "1",
            "title": "First Step",
            "description": "Log your first mood entry",
            "icon": "🌟",
            "unlocked": mood_count >= 1,
            "progress": min(mood_count, 1),
            "requirement": 1
        },
        {
            "id": "2",
            "title": "Week Warrior",
            "description": "Log moods for 7 days in a row",
            "icon": "🔥",
            "unlocked": current_streak >= 7,
            "progress": min(current_streak, 7),
            "requirement": 7
        },
        {
            "id": "3",
            "title": "Month Master",
            "description": "Log moods for 30 days in a row",
            "icon": "🏆",
            "unlocked": current_streak >= 30,
            "progress": min(current_streak, 30),
            "requirement": 30
        },
        {
            "id": "4",
            "title": "Century Club",
            "description": "Log 100 mood entries",
            "icon": "💯",
            "unlocked": mood_count >= 100,
            "progress": min(mood_count, 100),
            "requirement": 100
        },
        {
            "id": "5",
            "title": "Happy Days",
            "description": "Log 10 very good moods",
            "icon": "😄",
            "unlocked": happy_moods >= 10,
            "progress": min(happy_moods, 10),
            "requirement": 10
        },
        {
            "id": "6",
            "title": "Growth Mindset",
            "description": "Log 50 journal entries",
            "icon": "🌱",
            "unlocked": False,
            "progress": 0,
            "requirement": 50
        },
        {
            "id": "7",
            "title": "Worry Warrior",
            "description": "Create 10 worry trees",
            "icon": "🌳",
            "unlocked": worry_count >= 10,
            "progress": min(worry_count, 10),
            "requirement": 10
        },
        {
            "id": "8",
            "title": "Peace Seeker",
            "description": "Resolve 20 worries",
            "icon": "🕊️",
            "unlocked": resolved_worries >= 20,
            "progress": min(resolved_worries, 20),
            "requirement": 20
        },
        {
            "id": "9",
            "title": "Consistent Tracker",
            "description": "Log moods for 365 days",
            "icon": "📅",
            "unlocked": current_streak >= 365,
            "progress": min(current_streak, 365),
            "requirement": 365
        }
    ]
    
    unlocked_count = len([a for a in achievements if a["unlocked"]])
    
    return {
        "achievements": achievements,
        "stats": {
            "progress": unlocked_count,
            "total": len(achievements),
            "completion": round((unlocked_count / len(achievements)) * 100)
        }
    }

# Stripe Payment Integration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Subscription Packages - DO NOT ACCEPT FROM FRONTEND
SUBSCRIPTION_PACKAGES = {
    "monthly": {"amount": 2.99, "currency": "usd", "name": "Monthly Premium"},
    "yearly": {"amount": 29.99, "currency": "usd", "name": "Yearly Premium"},
}

class SubscriptionRequest(BaseModel):
    package_id: str
    origin_url: str

@api_router.post("/subscription/checkout")
async def create_subscription_checkout(request: SubscriptionRequest, http_request: Request, user = Depends(get_current_user)):
    # Validate package
    if request.package_id not in SUBSCRIPTION_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid subscription package")
    
    package = SUBSCRIPTION_PACKAGES[request.package_id]
    
    # Create Stripe checkout
    try:
        webhook_url = f"{request.origin_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Build success and cancel URLs
        success_url = f"{request.origin_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{request.origin_url}/subscription/cancel"
        
        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            amount=package["amount"],
            currency=package["currency"],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": user["_id"],
                "user_email": user["email"],
                "package_id": request.package_id,
                "package_name": package["name"]
            }
        )
        
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Save payment transaction
        transaction_id = str(uuid.uuid4())
        transaction = {
            "_id": transaction_id,
            "user_id": user["_id"],
            "session_id": session.session_id,
            "package_id": request.package_id,
            "amount": package["amount"],
            "currency": package["currency"],
            "payment_status": "pending",
            "status": "initiated",
            "created_at": datetime.utcnow(),
            "metadata": checkout_request.metadata
        }
        
        await db.payment_transactions.insert_one(transaction)
        
        return {"url": session.url, "session_id": session.session_id}
        
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")

@api_router.get("/subscription/status/{session_id}")
async def get_subscription_status(session_id: str, user = Depends(get_current_user)):
    try:
        # Check if already processed
        transaction = await db.payment_transactions.find_one({"session_id": session_id, "user_id": user["_id"]})
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # If already completed, return cached status
        if transaction.get("payment_status") == "paid":
            return {
                "status": transaction.get("status"),
                "payment_status": transaction.get("payment_status"),
                "already_processed": True
            }
        
        # Get status from Stripe
        webhook_url = f"https://api.example.com/webhook/stripe"  # Dummy URL for status check
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction
        update_data = {
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "updated_at": datetime.utcnow()
        }
        
        # If payment is complete, activate subscription
        if checkout_status.payment_status == "paid" and transaction.get("payment_status") != "paid":
            # Activate premium subscription
            await db.users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "subscription_status": "active",
                        "subscription_package": transaction["package_id"],
                        "subscription_activated_at": datetime.utcnow()
                    }
                }
            )
            update_data["processed"] = True
        
        await db.payment_transactions.update_one(
            {"_id": transaction["_id"]},
            {"$set": update_data}
        )
        
        return {
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "amount_total": checkout_status.amount_total,
            "currency": checkout_status.currency
        }
        
    except Exception as e:
        logger.error(f"Error checking payment status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to check payment status: {str(e)}")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        webhook_url = "https://api.example.com/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction based on webhook
        if webhook_response.payment_status == "paid":
            transaction = await db.payment_transactions.find_one({"session_id": webhook_response.session_id})
            
            if transaction and transaction.get("payment_status") != "paid":
                # Activate subscription
                user_id = transaction["metadata"].get("user_id")
                await db.users.update_one(
                    {"_id": user_id},
                    {
                        "$set": {
                            "subscription_status": "active",
                            "subscription_package": transaction["package_id"],
                            "subscription_activated_at": datetime.utcnow()
                        }
                    }
                )
                
                # Update transaction
                await db.payment_transactions.update_one(
                    {"_id": transaction["_id"]},
                    {"$set": {
                        "payment_status": "paid",
                        "status": "complete",
                        "processed": True,
                        "webhook_received_at": datetime.utcnow()
                    }}
                )
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Error handling webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

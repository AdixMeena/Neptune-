from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
import base64
import json
import math

import cv2
import mediapipe as mp
import numpy as np

load_dotenv()

# ── Optional: Supabase client for saving sessions ─────────────────────────────
try:
    from supabase import create_client, Client
    _url  = os.getenv("SUPABASE_URL", "")
    _key  = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    supabase: Optional[Client] = create_client(_url, _key) if _url and _key else None
except Exception:
    supabase = None

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Phoenix-AI Backend",
    description="REST API for the Phoenix-AI rehabilitation platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ────────────────────────────────────────────────────────────────────
class JointScore(BaseModel):
    name: str
    score: int
    status: str   # "good" | "warning"

class SessionResult(BaseModel):
    patient_id:  str
    exercise_id: int
    score:       int
    reps:        int
    duration:    int          # seconds
    joint_scores: List[JointScore]

class FeedbackPayload(BaseModel):
    patient_id: str
    doctor_id:  str
    message:    str

# ── Helpers ───────────────────────────────────────────────────────────────────
def score_label(score: int) -> str:
    if score >= 80:
        return "Excellent session"
    elif score >= 60:
        return "Good effort"
    else:
        return "Keep practicing"


DEFAULT_RANGES = {
    "left_knee": (80, 160),
    "right_knee": (80, 160),
    "left_hip": (60, 140),
    "right_hip": (60, 140),
    "left_shoulder": (30, 110),
    "right_shoulder": (30, 110),
    "spine": (150, 180),
}

EXERCISE_TARGETS = {
    1: {"primary": "left_knee", "ranges": {"left_knee": (90, 120), "right_knee": (90, 120), "left_hip": (70, 120)}},
    2: {"primary": "left_hip", "ranges": {"left_hip": (30, 60), "right_hip": (30, 60)}},
    3: {"primary": "left_knee", "ranges": {"left_knee": (0, 20), "right_knee": (0, 20)}},
    4: {"primary": "left_shoulder", "ranges": {"left_shoulder": (20, 60), "right_shoulder": (20, 60)}},
    5: {"primary": "left_shoulder", "ranges": {"left_shoulder": (40, 80), "right_shoulder": (40, 80)}},
    6: {"primary": "spine", "ranges": {"spine": (165, 180)}},
    7: {"primary": "spine", "ranges": {"spine": (140, 175)}},
    8: {"primary": "left_shoulder", "ranges": {"left_shoulder": (20, 60), "right_shoulder": (20, 60)}},
    9: {"primary": "left_shoulder", "ranges": {"left_shoulder": (20, 60), "right_shoulder": (20, 60)}},
}


POSE_CONNECTIONS = [
    (11, 13), (13, 15), (12, 14), (14, 16),
    (11, 12), (11, 23), (12, 24),
    (23, 24), (23, 25), (25, 27), (24, 26), (26, 28),
    (27, 29), (28, 30), (29, 31), (30, 32),
]


def angle_degrees(a, b, c) -> Optional[float]:
    if a is None or b is None or c is None:
        return None
    ba = np.array(a) - np.array(b)
    bc = np.array(c) - np.array(b)
    denom = (np.linalg.norm(ba) * np.linalg.norm(bc))
    if denom == 0:
        return None
    cos_angle = float(np.dot(ba, bc) / denom)
    cos_angle = max(-1.0, min(1.0, cos_angle))
    return math.degrees(math.acos(cos_angle))


def midpoint(a, b):
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]


def score_for_angle(angle, low, high):
    if angle is None:
        return 0
    if low <= angle <= high:
        return 100
    deviation = min(abs(angle - low), abs(angle - high))
    return max(0, int(round(100 - deviation * 2)))

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "Phoenix-AI Backend", "supabase_connected": supabase is not None}


@app.websocket("/ws/session/{session_id}")
async def session_ws(websocket: WebSocket, session_id: str):
    await websocket.accept()

    exercise_id = int(websocket.query_params.get("exercise_id", "0"))
    target_config = EXERCISE_TARGETS.get(exercise_id, {"primary": "left_knee", "ranges": {}})
    primary_joint = target_config["primary"]
    target_ranges = {**DEFAULT_RANGES, **target_config["ranges"]}

    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        enable_segmentation=False,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    rep_phase = 0
    rep_count = 0

    try:
        while True:
            payload = await websocket.receive_text()
            try:
                data = json.loads(payload)
                frame_b64 = data.get("frame", "")
            except json.JSONDecodeError:
                frame_b64 = payload

            if not frame_b64:
                await websocket.send_text(json.dumps({
                    "landmarks": [],
                    "joint_scores": {},
                    "session_score": 0,
                    "rep_counted": False,
                    "feedback": "No frame data",
                }))
                continue

            if "," in frame_b64:
                frame_b64 = frame_b64.split(",", 1)[1]

            img_bytes = base64.b64decode(frame_b64)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            if frame is None:
                await websocket.send_text(json.dumps({
                    "landmarks": [],
                    "joint_scores": {},
                    "session_score": 0,
                    "rep_counted": False,
                    "feedback": "Invalid frame",
                }))
                continue

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = pose.process(rgb)

            if not result.pose_landmarks:
                await websocket.send_text(json.dumps({
                    "landmarks": [],
                    "joint_scores": {},
                    "session_score": 0,
                    "rep_counted": False,
                    "feedback": "No pose detected",
                }))
                continue

            landmarks = []
            for lm in result.pose_landmarks.landmark:
                landmarks.append({"x": lm.x, "y": lm.y, "z": lm.z})

            def lm(idx):
                if idx >= len(landmarks):
                    return None
                return [landmarks[idx]["x"], landmarks[idx]["y"], landmarks[idx]["z"]]

            left_shoulder = lm(11)
            right_shoulder = lm(12)
            left_elbow = lm(13)
            right_elbow = lm(14)
            left_hip = lm(23)
            right_hip = lm(24)
            left_knee = lm(25)
            right_knee = lm(26)
            left_ankle = lm(27)
            right_ankle = lm(28)

            shoulder_center = midpoint(left_shoulder, right_shoulder)
            hip_center = midpoint(left_hip, right_hip)
            knee_center = midpoint(left_knee, right_knee)

            angles = {
                "left_knee": angle_degrees(left_hip, left_knee, left_ankle),
                "right_knee": angle_degrees(right_hip, right_knee, right_ankle),
                "left_hip": angle_degrees(left_shoulder, left_hip, left_knee),
                "right_hip": angle_degrees(right_shoulder, right_hip, right_knee),
                "left_shoulder": angle_degrees(left_elbow, left_shoulder, left_hip),
                "right_shoulder": angle_degrees(right_elbow, right_shoulder, right_hip),
                "spine": angle_degrees(shoulder_center, hip_center, knee_center),
            }

            joint_scores = {}
            score_values = []
            worst_joint = None
            worst_score = 101

            for joint, (low, high) in target_ranges.items():
                score = score_for_angle(angles.get(joint), low, high)
                joint_scores[joint] = score
                score_values.append(score)
                if score < worst_score:
                    worst_score = score
                    worst_joint = joint

            session_score = int(round(sum(score_values) / len(score_values))) if score_values else 0

            rep_counted = False
            primary_range = target_ranges.get(primary_joint)
            if primary_range:
                midpoint_angle = (primary_range[0] + primary_range[1]) / 2
                current_angle = angles.get(primary_joint)
                if current_angle is not None:
                    above = current_angle >= midpoint_angle
                    if rep_phase == 0 and above:
                        rep_phase = 1
                    elif rep_phase == 1 and not above:
                        rep_phase = 0
                        rep_count += 1
                        rep_counted = True

            if session_score >= 85:
                feedback = "Great form"
            elif worst_joint:
                feedback = f"Adjust {worst_joint.replace('_', ' ')}"
            else:
                feedback = "Hold steady"

            await websocket.send_text(json.dumps({
                "landmarks": landmarks,
                "joint_scores": joint_scores,
                "session_score": session_score,
                "rep_counted": rep_counted,
                "feedback": feedback,
            }))

    except WebSocketDisconnect:
        pass
    finally:
        pose.close()


@app.post("/session")
async def save_session(result: SessionResult):
    """
    Called after a patient completes a camera session.
    Persists the session score + joint breakdown to Supabase.
    """
    payload = {
        "patient_id":   result.patient_id,
        "exercise_id":  result.exercise_id,
        "score":        result.score,
        "reps":         result.reps,
        "duration":     result.duration,
        "joint_scores": [j.model_dump() for j in result.joint_scores],
        "label":        score_label(result.score),
    }

    if supabase:
        try:
            data = supabase.table("sessions").insert(payload).execute()
            return {"success": True, "data": data.data, "label": payload["label"]}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # If Supabase not configured, still return success (demo mode)
    return {"success": True, "data": payload, "label": payload["label"], "note": "Supabase not configured — data not persisted"}


@app.get("/patient/{patient_id}/stats")
async def get_patient_stats(patient_id: str):
    """
    Returns aggregated session stats for a patient.
    """
    if not supabase:
        return {
            "total_sessions": 0,
            "avg_score":      0,
            "best_score":     0,
            "last_session":   None,
            "note":           "Supabase not configured",
        }

    try:
        res    = supabase.table("sessions").select("*").eq("patient_id", patient_id).order("created_at", desc=True).execute()
        items  = res.data or []
        scores = [s["score"] for s in items]
        return {
            "total_sessions": len(items),
            "avg_score":      round(sum(scores) / len(scores), 1) if scores else 0,
            "best_score":     max(scores) if scores else 0,
            "last_session":   items[0] if items else None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/feedback")
async def send_feedback(payload: FeedbackPayload):
    """
    Doctor sends feedback message to a patient.
    """
    row = {
        "patient_id": payload.patient_id,
        "doctor_id":  payload.doctor_id,
        "message":    payload.message,
        "is_read":    False,
    }

    if supabase:
        try:
            data = supabase.table("feedback").insert(row).execute()
            return {"success": True, "data": data.data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    return {"success": True, "data": row, "note": "Supabase not configured — data not persisted"}


@app.get("/feedback/{patient_id}")
async def get_feedback(patient_id: str):
    """
    Fetch all feedback messages for a patient.
    """
    if not supabase:
        return {"data": [], "note": "Supabase not configured"}

    try:
        res = supabase.table("feedback").select("*").eq("patient_id", patient_id).order("created_at", desc=True).execute()
        return {"data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

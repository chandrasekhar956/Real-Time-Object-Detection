"""
Weapon Detection Backend
------------------------
Uses YOLOv8n model (auto-downloads if missing).

Endpoints:
  GET  /                   -> health JSON
  GET  /video              -> webcam MJPEG stream
  GET  /cctv?stream=URL    -> RTSP/IP camera MJPEG stream
  GET  /detection-status   -> {"detected": bool}
  POST /upload             -> image/video detect; returns annotated image (image) or JSON+video (video)

Detection keywords: ["gun", "knife", "weapon", "pistol", "rifle", "revolver"]

Optional email alert on detection: set EMAIL_* environment variables.

Run:
  cd backend
  python -m venv venv
  .\\venv\\Scripts\\Activate.ps1
  pip install -r requirements.txt
  python app.py
"""

import os
import time
import threading
import smtplib
from email.message import EmailMessage
from typing import Union

import cv2
import numpy as np
from flask import Flask, Response, request, jsonify, send_file
from flask_cors import CORS
from ultralytics import YOLO

# ------------------------------------------------------------------
# Config
# ------------------------------------------------------------------
MODEL_NAME = "yolov8n.pt"             # Ultralytics small model (auto-download)
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Email alert config via environment variables
EMAIL_SENDER = os.getenv("EMAIL_SENDER", "")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
EMAIL_RECEIVER = os.getenv("EMAIL_RECEIVER", "")

ALERT_COOLDOWN_SEC = 30    # seconds between email sends
VIDEO_SAMPLE_FRAMES = 100  # frames to scan in uploaded videos before stopping

# ------------------------------------------------------------------
# Flask init
# ------------------------------------------------------------------
app = Flask(__name__)
CORS(app)

# ------------------------------------------------------------------
# Load YOLO model
# ------------------------------------------------------------------
print(f"[MODEL] Loading YOLO model: {MODEL_NAME}")
model = YOLO(MODEL_NAME)

# ------------------------------------------------------------------
# Detection state shared w/ /detection-status
# ------------------------------------------------------------------
_detection_flag = False
_detection_lock = threading.Lock()
_last_alert_time = 0.0

def _set_detected(flag: bool):
    global _detection_flag
    with _detection_lock:
        _detection_flag = flag

def _get_detected() -> bool:
    with _detection_lock:
        return _detection_flag

# ------------------------------------------------------------------
# Email alert
# ------------------------------------------------------------------
def _send_email_alert():
    if not EMAIL_SENDER or not EMAIL_PASSWORD or not EMAIL_RECEIVER:
        print("[ALERT] Email config missing; not sending.")
        return
    msg = EmailMessage()
    msg["Subject"] = "Weapon Detected!"
    msg["From"] = EMAIL_SENDER
    msg["To"] = EMAIL_RECEIVER
    msg.set_content("⚠ A weapon was detected by the surveillance system.")
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL_SENDER, EMAIL_PASSWORD)
            smtp.send_message(msg)
        print("[ALERT] Email sent.")
    except Exception as e:
        print(f"[ALERT] Email error: {e}")

def _send_email_async():
    threading.Thread(target=_send_email_alert, daemon=True).start()

# ------------------------------------------------------------------
# YOLO helpers
# ------------------------------------------------------------------
def _weapon_in_results(results) -> bool:
    r = results[0]
    names = model.names
    for b in r.boxes:
        cls = int(b.cls[0])
        label = names.get(cls, "").lower()
        if any(kw in label for kw in WEAPON_KEYWORDS):
            return True
    return False

def _annotate(frame: np.ndarray):
    results = model(frame)
    weapon_found = _weapon_in_results(results)
    annotated = results[0].plot()
    return annotated, weapon_found

# ------------------------------------------------------------------
# Streaming generator
# ------------------------------------------------------------------
def _stream_generator(source: Union[int, str]):
    global _last_alert_time
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(f"[STREAM] Unable to open source: {source}")
        return
    while True:
        ok, frame = cap.read()
        if not ok:
            print("[STREAM] Frame read failed; ending stream.")
            break
        annotated, weapon_found = _annotate(frame)
        if weapon_found:
            _set_detected(True)
            with _detection_lock:
                if time.time() - _last_alert_time > ALERT_COOLDOWN_SEC:
                    _last_alert_time = time.time()
                    _send_email_async()
        else:
            _set_detected(False)
        ok_enc, buf = cv2.imencode(".jpg", annotated)
        if not ok_enc:
            continue
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" +
            buf.tobytes() +
            b"\r\n"
        )
    cap.release()

# ------------------------------------------------------------------
# Upload detection (image or video)
# ------------------------------------------------------------------
def _detect_image(path: str):
    img = cv2.imread(path)
    if img is None:
        return jsonify({"error": "Cannot read image."}), 400
    annotated, weapon_found = _annotate(img)
    if weapon_found:
        _set_detected(True)
        _send_email_async()
    out_path = os.path.join(UPLOAD_DIR, "detected.jpg")
    cv2.imwrite(out_path, annotated)
    return send_file(out_path, mimetype="image/jpeg")

def _detect_video(path: str):
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        return jsonify({"error": "Cannot open video."}), 400
    found = False
    frames = 0
    out_path = os.path.join(UPLOAD_DIR, "detected.mp4")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    fps = cap.get(cv2.CAP_PROP_FPS) or 20
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    writer = cv2.VideoWriter(out_path, fourcc, fps, (width, height))
    while cap.isOpened() and frames < VIDEO_SAMPLE_FRAMES:
        ok, frame = cap.read()
        if not ok:
            break
        annotated, weapon_found = _annotate(frame)
        writer.write(annotated)
        if weapon_found:
            found = True
            break
        frames += 1
    cap.release()
    writer.release()
    if found:
        _set_detected(True)
        _send_email_async()
        return jsonify({"message": "Weapon detected in video.", "output": out_path})
    else:
        return jsonify({"message": "No weapon detected in sampled frames.", "output": out_path})

# ------------------------------------------------------------------
# Routes
# ------------------------------------------------------------------
@app.route("/", methods=["GET"])
def root():
    return jsonify({"message": "Weapon Detection API running."})

@app.route("/detection-status", methods=["GET"])
def detection_status():
    return jsonify({"detected": _get_detected()})

@app.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "Empty filename"}), 400
    save_path = os.path.join(UPLOAD_DIR, f.filename)
    f.save(save_path)
    ext = os.path.splitext(f.filename)[1].lower()
    if ext in (".jpg", ".jpeg", ".png", ".bmp", ".webp"):
        return _detect_image(save_path)
    elif ext in (".mp4", ".avi", ".mov", ".mkv", ".wmv"):
        return _detect_video(save_path)
    else:
        return jsonify({"error": f"Unsupported file type: {ext}"}), 400

@app.route("/video")
def video():
    return Response(
        _stream_generator(0),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )

@app.route("/cctv")
def cctv():
    url = request.args.get("stream")
    if not url:
        return jsonify({"error": "Missing stream URL"}), 400
    return Response(
        _stream_generator(url),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )

# ------------------------------------------------------------------
# Main
# ------------------------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)

from ultralytics import YOLO

model = YOLO('yolov8n.pt')
model.train(
    data=r'C:\Users\Chandra Sekhar\OneDrive\Documents\REAL TIME OBJECT DETECTION\backend\general object detection.v1i.yolov8\data.yaml',
    epochs=25,
    imgsz=640
)
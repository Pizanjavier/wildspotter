# WildSpotter ML Models

On-device satellite tile classifier for ground suitability detection.

## Quick Start

```bash
cd models

# Create isolated virtual environment (TensorFlow requires Python <=3.12)
/opt/homebrew/opt/python@3.12/bin/python3.12 -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate

# Verify Python version (must be 3.12.x)
python --version

# Install dependencies
pip install -r requirements.txt

# Step 1: Collect coordinates from Overpass (5 regions, ~500+ points)
python datasetcreator.py

# Step 2: Download ArcGIS satellite tiles (matches app's tile source)
python imagedownloader.py

# Step 3: Auto-label images using color heuristics
python autolabeler.py

# Step 4: Review labels in browser (fix edge cases)
python -m http.server 8888
# Open http://localhost:8888/reviewer.html
# Click GOOD/BAD to correct labels, then EXPORT CORRECTED LABELS
# Save labels_corrected.csv to models/ directory, stop the server

# Step 5: Train the model
python train.py
# Optional: python train.py --epochs 20 --batch-size 32

# Deactivate when done
deactivate
```

## Pipeline Output

| File | Format | Size | Purpose |
|------|--------|------|---------|
| `spot-classifier.tflite` | TFLite (quantized) | ~3 MB | `@tensorflow/tfjs-react-native` |
| `spot-classifier.onnx` | ONNX | ~9 MB | `onnxruntime-react-native` |

## Detection Targets

| Field | What it detects |
|-------|----------------|
| `groundSuitable` | Open mineral/dirt ground suitable for parking |
| `canopyDense` | Dense tree canopy blocking vehicle access |
| `vehiclesDetected` | Parked vans/campers (future, needs real ML) |

## App Integration

After training, update `src/services/ai/model-loader.ts` to load the exported model
and replace the heuristic classifier with real inference in `src/services/ai/index.ts`.

## File Structure

```
models/
├── requirements.txt         # Python dependencies
├── datasetcreator.py        # Step 1: Overpass coordinate collector
├── imagedownloader.py       # Step 2: ArcGIS tile downloader
├── autolabeler.py           # Step 3: Heuristic auto-labeler
├── reviewer.html            # Step 4: Browser-based label review tool
├── train.py                 # Step 5: MobileNetV2 training + export
├── training_coords.csv      # Generated coordinates (gitignored)
├── labels.csv               # Auto-generated labels (gitignored)
├── labels_corrected.csv     # Reviewer corrections (gitignored)
├── dataset_images/          # Downloaded tiles (gitignored)
├── labeled/                 # Sorted tiles for training (gitignored)
├── spot-classifier.tflite   # Trained model (gitignored)
└── spot-classifier.onnx     # Trained model (gitignored)
```

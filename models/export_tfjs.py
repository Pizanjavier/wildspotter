"""
Export the trained model to TensorFlow.js layers model format.

Trains the model, exports via tensorflowjs Python API, then patches
the model.json for browser TF.js compatibility (Keras 3 → TF.js fixes).

Usage:
    python export_tfjs.py
"""

import json
import os

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import tensorflow as tf

IMG_SIZE = 256
MODEL_NAME = "spot-classifier"
LABELED_DIR = "labeled"
TFJS_DIR = os.path.join("..", "public", "models", MODEL_NAME)


def build_and_train():
    """Train on existing labeled data."""
    suitable_dir = os.path.join(LABELED_DIR, "ground_suitable")
    unsuitable_dir = os.path.join(LABELED_DIR, "ground_unsuitable")

    if not os.path.isdir(suitable_dir) or not os.path.isdir(unsuitable_dir):
        raise FileNotFoundError("Missing labeled/ directory. Run smartlabeler.py first.")

    suitable_count = len([f for f in os.listdir(suitable_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
    unsuitable_count = len([f for f in os.listdir(unsuitable_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
    total = suitable_count + unsuitable_count
    print(f"Dataset: {suitable_count} suitable, {unsuitable_count} unsuitable ({total} total)")

    class_weight = {
        0: total / (2 * unsuitable_count) if unsuitable_count > 0 else 1.0,
        1: total / (2 * suitable_count) if suitable_count > 0 else 1.0,
    }

    train_ds = tf.keras.utils.image_dataset_from_directory(
        LABELED_DIR, labels="inferred", label_mode="binary",
        class_names=["ground_unsuitable", "ground_suitable"],
        image_size=(IMG_SIZE, IMG_SIZE), batch_size=16,
        validation_split=0.2, subset="training", seed=42,
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        LABELED_DIR, labels="inferred", label_mode="binary",
        class_names=["ground_unsuitable", "ground_suitable"],
        image_size=(IMG_SIZE, IMG_SIZE), batch_size=16,
        validation_split=0.2, subset="validation", seed=42,
    )

    normalize = tf.keras.layers.Rescaling(1.0 / 255)
    augment = tf.keras.Sequential([
        tf.keras.layers.RandomFlip("horizontal_and_vertical"),
        tf.keras.layers.RandomRotation(0.2),
        tf.keras.layers.RandomBrightness(0.1),
        tf.keras.layers.RandomContrast(0.1),
    ])
    train_ds = train_ds.map(lambda x, y: (augment(normalize(x), training=True), y)).prefetch(tf.data.AUTOTUNE)
    val_ds = val_ds.map(lambda x, y: (normalize(x), y)).prefetch(tf.data.AUTOTUNE)

    base = tf.keras.applications.MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3), include_top=False, weights="imagenet",
    )
    for layer in base.layers[:-30]:
        layer.trainable = False

    model = tf.keras.Sequential([
        base,
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(64, activation="relu"),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(1, activation="sigmoid"),
    ])
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
        loss="binary_crossentropy",
        metrics=["accuracy", tf.keras.metrics.AUC(name="auc")],
    )

    print("Training (up to 20 epochs with early stopping)...")
    model.fit(
        train_ds, validation_data=val_ds, epochs=20,
        class_weight=class_weight,
        callbacks=[
            tf.keras.callbacks.EarlyStopping(
                monitor="val_auc", patience=5, mode="max", restore_best_weights=True
            ),
            tf.keras.callbacks.ReduceLROnPlateau(
                monitor="val_loss", factor=0.5, patience=3, min_lr=1e-6
            ),
        ],
    )

    val_loss, val_acc, val_auc = model.evaluate(val_ds)
    print(f"\nValidation — Accuracy: {val_acc:.4f}, AUC: {val_auc:.4f}")
    return model


def patch_model_json(path: str):
    """Fix Keras 3 model topology for browser TF.js compatibility.

    Keras 3 exports a different JSON schema than what TF.js expects (Keras 2 format).
    Key differences fixed here:
    1. model_config wrapper → hoist class_name/config to modelTopology level
    2. inbound_nodes: {args: [__keras_tensor__], kwargs} → [[layer, idx, tensor]]
    3. batch_shape → batch_input_shape for InputLayer
    4. DTypePolicy objects → plain dtype strings
    5. Remove module/registered_name keys
    6. Remove training_config (TF.js doesn't use it)
    """
    with open(path) as f:
        data = json.load(f)

    topo = data["modelTopology"]

    # --- 1. Hoist model_config to top level of modelTopology ---
    if "model_config" in topo:
        mc = topo.pop("model_config")
        topo["class_name"] = mc["class_name"]
        topo["config"] = mc["config"]
    topo.pop("training_config", None)

    # --- 2. Convert Keras 3 inbound_nodes to Keras 2 format ---
    def convert_inbound_nodes(nodes):
        """Convert [{args: [__keras_tensor__...], kwargs}] → [[[layer, idx, tensor]]]."""
        if not isinstance(nodes, list):
            return nodes
        result = []
        for node in nodes:
            if not isinstance(node, dict) or "args" not in node:
                result.append(node)
                continue
            connections = []
            args = node["args"]
            for arg in args:
                if isinstance(arg, list):
                    # Multiple inputs (e.g., Add layer): arg is a list of tensors
                    for tensor in arg:
                        kh = _extract_keras_history(tensor)
                        if kh:
                            connections.append(kh)
                else:
                    kh = _extract_keras_history(arg)
                    if kh:
                        connections.append(kh)
            result.append(connections)
        return result

    def _extract_keras_history(tensor):
        """Extract [layer_name, node_index, tensor_index] from a __keras_tensor__."""
        if isinstance(tensor, dict) and tensor.get("class_name") == "__keras_tensor__":
            cfg = tensor.get("config", {})
            kh = cfg.get("keras_history")
            if isinstance(kh, list) and len(kh) == 3:
                return kh
        return None

    # --- 3. Generic tree fixer ---
    def fix_node(obj):
        if isinstance(obj, dict):
            # Fix InputLayer: batch_shape → batch_input_shape
            if obj.get("class_name") == "InputLayer":
                cfg = obj.get("config", {})
                if "batch_shape" in cfg:
                    cfg["batch_input_shape"] = cfg.pop("batch_shape")
                cfg.pop("optional", None)

            # Fix DTypePolicy objects → plain string
            if obj.get("class_name") == "DTypePolicy":
                return obj.get("config", {}).get("name", "float32")

            # Convert Keras 3 inbound_nodes format
            if "inbound_nodes" in obj:
                obj["inbound_nodes"] = convert_inbound_nodes(obj["inbound_nodes"])

            # Fix input_layers/output_layers: Keras 3 uses flat [name, idx, idx],
            # TF.js expects nested [[name, idx, idx]]
            for key in ("input_layers", "output_layers"):
                if key in obj and isinstance(obj[key], list) and len(obj[key]) > 0:
                    if isinstance(obj[key][0], str):
                        obj[key] = [obj[key]]

            # Remove keys TF.js doesn't understand
            obj.pop("module", None)
            obj.pop("registered_name", None)
            obj.pop("build_config", None)
            obj.pop("compile_config", None)
            obj.pop("build_input_shape", None)

            # Recurse into all values
            for key in list(obj.keys()):
                obj[key] = fix_node(obj[key])

        elif isinstance(obj, list):
            return [fix_node(item) for item in obj]

        return obj

    fix_node(data)

    # --- 4. Strip Sequential model name prefix from weight names ---
    # Keras 3 exports weights as "sequential_1/dense/kernel" but TF.js
    # expects "dense/kernel" (relative to the Sequential container).
    seq_name = data["modelTopology"].get("config", {}).get("name", "")
    if seq_name:
        prefix = seq_name + "/"
        for group in data.get("weightsManifest", []):
            for w in group.get("weights", []):
                if w["name"].startswith(prefix):
                    w["name"] = w["name"][len(prefix):]

    with open(path, "w") as f:
        json.dump(data, f)

    print("  Patched model.json for TF.js compatibility")


def export(model):
    import shutil
    import subprocess
    import tempfile

    if os.path.exists(TFJS_DIR):
        shutil.rmtree(TFJS_DIR)
    os.makedirs(TFJS_DIR, exist_ok=True)

    # Export via SavedModel → TF.js graph model (avoids Keras 3 topology issues)
    saved_model_dir = tempfile.mkdtemp(prefix="wildspotter_saved_model_")
    print(f"\nSaving TF SavedModel to {saved_model_dir}...")
    model.export(saved_model_dir)

    print("Converting SavedModel → TF.js graph model...")
    subprocess.run([
        "tensorflowjs_converter",
        "--input_format=tf_saved_model",
        "--output_format=tfjs_graph_model",
        "--signature_name=serving_default",
        saved_model_dir,
        TFJS_DIR,
    ], check=True)

    shutil.rmtree(saved_model_dir)

    print(f"\nExported to {TFJS_DIR}/:")
    for f in sorted(os.listdir(TFJS_DIR)):
        size = os.path.getsize(os.path.join(TFJS_DIR, f))
        print(f"  {f} ({size / 1024:.0f} KB)")


if __name__ == "__main__":
    model = build_and_train()
    export(model)
    print("\nDone. The model is ready for the app at public/models/spot-classifier/")

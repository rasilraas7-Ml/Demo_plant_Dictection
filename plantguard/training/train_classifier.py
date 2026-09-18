"""
PlantGuard AI — Disease Classification Model Training Pipeline
Model 1: MobileNetV2 Transfer Learning for Plant Disease Classification

Dataset: PlantVillage / PlantDoc
Input Resolution: 224x224x3
Output: Multi-Class Softmax Classification (Tomato Early Blight, Late Blight, etc.)
"""

import os
import json
import argparse
from pathlib import Path
import tensorflow as tf
from tensorflow.keras import layers, models, applications, callbacks

def build_classifier_model(num_classes, input_shape=(224, 224, 3)):
    """
    Builds transfer learning classifier using pre-trained MobileNetV2 backbone.
    Fine-tuned with custom classification head, dropout, and batch normalization.
    """
    base_model = applications.MobileNetV2(
        input_shape=input_shape,
        include_top=False,
        weights='imagenet'
    )
    # Freeze initial base layers for initial warm-up
    base_model.trainable = False

    inputs = layers.Input(shape=input_shape)
    # Data Augmentation pipeline
    x = layers.RandomFlip("horizontal_and_vertical")(inputs)
    x = layers.RandomRotation(0.15)(x)
    x = layers.RandomZoom(0.1)(x)
    x = layers.RandomContrast(0.1)(x)

    # MobileNetV2 Feature Extraction
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(256, activation='relu')(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(num_classes, activation='softmax', name="disease_prediction")(x)

    model = models.Model(inputs, outputs, name="plantguard_disease_classifier")
    return model, base_model

def train(dataset_dir, output_model_path, epochs=25, batch_size=32, lr=1e-3):
    dataset_path = Path(dataset_dir)
    train_dir = dataset_path / 'train'
    val_dir = dataset_path / 'val'

    print(f"[PlantGuard Training] Loading dataset from: {dataset_path}")

    # Load dataset with Keras image utility
    train_ds = tf.keras.utils.image_dataset_from_directory(
        train_dir,
        image_size=(224, 224),
        batch_size=batch_size,
        label_mode='categorical'
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        val_dir,
        image_size=(224, 224),
        batch_size=batch_size,
        label_mode='categorical'
    )

    class_names = train_ds.class_names
    num_classes = len(class_names)
    print(f"[PlantGuard Training] Found {num_classes} classes: {class_names}")

    # Save class mapping to models/labels.json
    labels_meta = {"classes": []}
    for idx, name in enumerate(class_names):
        parts = name.split('___')
        plant = parts[0].replace('_', ' ')
        disease = parts[1].replace('_', ' ') if len(parts) > 1 else 'Healthy'
        labels_meta["classes"].append({
            "index": idx,
            "id": name,
            "plant": plant,
            "disease": disease,
            "is_healthy": "healthy" in disease.lower()
        })

    labels_file = Path(output_model_path).parent / 'labels.json'
    labels_file.parent.mkdir(parents=True, exist_ok=True)
    with open(labels_file, 'w') as f:
        json.dump(labels_meta, f, indent=2)
    print(f"[PlantGuard Training] Saved label dictionary to {labels_file}")

    # Optimize pipeline performance
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.prefetch(buffer_size=AUTOTUNE)

    # Build and compile model
    model, base_model = build_classifier_model(num_classes)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=lr),
        loss='categorical_crossentropy',
        metrics=['accuracy', tf.keras.metrics.TopKCategoricalAccuracy(k=3, name="top_3_acc")]
    )
    model.summary()

    # Training callbacks
    cb = [
        callbacks.ModelCheckpoint(str(output_model_path), save_best_only=True, monitor='val_accuracy'),
        callbacks.EarlyStopping(monitor='val_accuracy', patience=5, restore_best_weights=True),
        callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-6)
    ]

    # Phase 1: Train Top Layers
    print("[PlantGuard Training] Phase 1: Training Classification Head...")
    model.fit(train_ds, validation_data=val_ds, epochs=10, callbacks=cb)

    # Phase 2: Fine-tune MobileNetV2 top 30 layers
    print("[PlantGuard Training] Phase 2: Fine-Tuning Backbone Layers...")
    base_model.trainable = True
    for layer in base_model.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=lr * 0.1),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    model.fit(train_ds, validation_data=val_ds, epochs=epochs, callbacks=cb)

    # Save final model
    model.save(str(output_model_path))
    print(f"[PlantGuard Training] Successfully trained and saved model to {output_model_path}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Train MobileNetV2 Plant Disease Classifier")
    parser.add_argument('--dataset', type=str, default='dataset/classification', help="Path to classification dataset directory")
    parser.add_argument('--output', type=str, default='../models/disease_classifier.keras', help="Output .keras model file path")
    parser.add_argument('--epochs', type=int, default=25, help="Number of epochs")
    parser.add_argument('--batch_size', type=int, default=32, help="Batch size")
    parser.add_argument('--lr', type=float, default=0.001, help="Initial learning rate")
    args = parser.parse_args()

    train(args.dataset, args.output, epochs=args.epochs, batch_size=args.batch_size, lr=args.lr)

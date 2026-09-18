"""
PlantGuard AI — Lesion & Leaf Damage Segmentation Model Training Pipeline
Model 2: U-Net for 3-Class Semantic Segmentation
    Class 0: Background
    Class 1: Healthy Leaf Lamina
    Class 2: Diseased / Damaged Lesion Area

Input Resolution: 256x256x3
Output Resolution: 256x256x3 (Softmax across 3 classes)
Loss: Categorical Focal Loss / Dice Loss
"""

import os
import argparse
from pathlib import Path
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks

def double_conv_block(x, n_filters):
    """Conv2D -> BatchNormalization -> ReLU -> Conv2D -> BatchNormalization -> ReLU"""
    x = layers.Conv2D(n_filters, 3, padding='same', kernel_initializer='he_normal')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation('relu')(x)
    x = layers.Conv2D(n_filters, 3, padding='same', kernel_initializer='he_normal')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation('relu')(x)
    return x

def build_unet_model(input_shape=(256, 256, 3), num_classes=3):
    """
    Constructs full U-Net architecture with skip connections:
    Encoder (contracting path) -> Bottleneck -> Decoder (expansive path)
    """
    inputs = layers.Input(shape=input_shape)

    # Encoder
    c1 = double_conv_block(inputs, 32)
    p1 = layers.MaxPooling2D((2, 2))(c1)

    c2 = double_conv_block(p1, 64)
    p2 = layers.MaxPooling2D((2, 2))(c2)

    c3 = double_conv_block(p2, 128)
    p3 = layers.MaxPooling2D((2, 2))(c3)

    c4 = double_conv_block(p3, 256)
    p4 = layers.MaxPooling2D((2, 2))(c4)

    # Bottleneck
    b = double_conv_block(p4, 512)

    # Decoder
    u4 = layers.Conv2DTranspose(256, (2, 2), strides=(2, 2), padding='same')(b)
    u4 = layers.concatenate([u4, c4])
    c5 = double_conv_block(u4, 256)

    u3 = layers.Conv2DTranspose(128, (2, 2), strides=(2, 2), padding='same')(c5)
    u3 = layers.concatenate([u3, c3])
    c6 = double_conv_block(u3, 128)

    u2 = layers.Conv2DTranspose(64, (2, 2), strides=(2, 2), padding='same')(c6)
    u2 = layers.concatenate([u2, c2])
    c7 = double_conv_block(u2, 64)

    u1 = layers.Conv2DTranspose(32, (2, 2), strides=(2, 2), padding='same')(c7)
    u1 = layers.concatenate([u1, c1])
    c8 = double_conv_block(u1, 32)

    # Output Layer: 3 classes (0: background, 1: healthy leaf, 2: lesion)
    outputs = layers.Conv2D(num_classes, 1, activation='softmax', name="lesion_segmentation_mask")(c8)

    model = models.Model(inputs=inputs, outputs=outputs, name="plantguard_unet_lesion_segmenter")
    return model

def dice_coef(y_true, y_pred, smooth=1e-6):
    """Dice coefficient metric for segmentation precision."""
    y_true_f = tf.reshape(y_true, [-1])
    y_pred_f = tf.reshape(y_pred, [-1])
    intersection = tf.reduce_sum(y_true_f * y_pred_f)
    return (2. * intersection + smooth) / (tf.reduce_sum(y_true_f) + tf.reduce_sum(y_pred_f) + smooth)

def train_segmentation(dataset_dir, output_model_path, epochs=35, batch_size=16, lr=3e-4):
    print(f"[PlantGuard U-Net Training] Initializing dataset from {dataset_dir}...")

    model = build_unet_model(input_shape=(256, 256, 3), num_classes=3)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=lr),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy', dice_coef]
    )
    model.summary()

    cb = [
        callbacks.ModelCheckpoint(str(output_model_path), save_best_only=True, monitor='val_loss'),
        callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-6),
        callbacks.EarlyStopping(monitor='val_loss', patience=7, restore_best_weights=True)
    ]

    print(f"[PlantGuard U-Net Training] Model architecture compiled successfully.")
    print(f"[PlantGuard U-Net Training] Model will be saved to: {output_model_path}")

    # Note: When datasets are placed in dataset/segmentation/, load with tf.data.Dataset
    # For initial generation, save architecture skeleton
    model.save(str(output_model_path))
    print(f"[PlantGuard U-Net Training] Saved initial compiled U-Net model to {output_model_path}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Train U-Net Lesion Segmentation Model")
    parser.add_argument('--dataset', type=str, default='dataset/segmentation', help="Path to segmentation dataset")
    parser.add_argument('--output', type=str, default='../models/damage_segmenter.keras', help="Output .keras model file path")
    parser.add_argument('--epochs', type=int, default=35, help="Number of training epochs")
    parser.add_argument('--batch_size', type=int, default=16, help="Batch size")
    parser.add_argument('--lr', type=float, default=0.0003, help="Learning rate")
    args = parser.parse_args()

    train_segmentation(args.dataset, args.output, epochs=args.epochs, batch_size=args.batch_size, lr=args.lr)

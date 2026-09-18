# PlantGuard AI — Dataset Guidelines & Directory Layout

To train custom models for PlantGuard AI, structure your datasets as shown below:

```text
plantguard/training/dataset/
├── classification/
│   ├── train/
│   │   ├── Tomato___Early_Blight/
│   │   ├── Tomato___Late_Blight/
│   │   ├── Tomato___Healthy/
│   │   ├── Potato___Early_Blight/
│   │   ├── Potato___Late_Blight/
│   │   ├── Pepper___Bacterial_Spot/
│   │   └── ...
│   └── val/
│       ├── Tomato___Early_Blight/
│       └── ...
└── segmentation/
    ├── images/
    │   ├── leaf_001.jpg
    │   ├── leaf_002.jpg
    │   └── ...
    └── masks/
        ├── leaf_001.png   (PNG with pixel values: 0=background, 1=healthy, 2=lesion)
        ├── leaf_002.png
        └── ...
```

## Recommended Public Datasets

### 1. Classification Datasets
- **PlantVillage Dataset**: Over 54,000 images covering 38 disease categories (Tomato, Potato, Corn, Apple, Grape, Pepper).
- **PlantDoc Dataset**: In-the-field agricultural leaf images under diverse outdoor lighting.
- **Kaggle New Plant Diseases Dataset**: 87,000 augmented RGB images.

### 2. Lesion Segmentation Datasets
- **Plant Pathology 2020 / 2021 (FGVC7 / FGVC8)**: High-resolution lesion bounding boxes and segmentations.
- **Kaggle Plant Leaf Lesion Segmentation Dataset**: Pixel-level binary and multi-class lesion masks.
- **Annotated Leaf Infection Dataset (LabelMe / CVAT)**: Custom masks labeled using tools like Roboflow or CVAT.

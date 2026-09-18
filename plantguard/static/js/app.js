// PlantGuard AI Client Interaction Script
document.addEventListener('DOMContentLoaded', () => {
  const captureBtn = document.getElementById('capture-btn');
  const overlaySelect = document.getElementById('overlay-mode');
  const resultPanel = document.getElementById('result-panel');

  if (captureBtn) {
    captureBtn.addEventListener('click', async () => {
      captureBtn.disabled = true;
      captureBtn.innerText = 'Analyzing Leaf Specimen...';

      try {
        const response = await fetch('/capture', { method: 'POST' });
        const data = await response.json();

        if (!data.leaf_detected) {
          alert(data.message || 'Please place a single leaf clearly inside the camera frame.');
          captureBtn.disabled = false;
          captureBtn.innerText = 'Capture & Diagnose Leaf';
          return;
        }

        // Populate Result Panel
        document.getElementById('res-plant').innerText = `${data.plant} — ${data.disease}`;
        document.getElementById('res-scientific').innerText = data.scientific_name || '';
        document.getElementById('res-confidence').innerText = `${data.confidence}%`;
        document.getElementById('res-damage').innerText = `${data.damage_percentage}%`;
        document.getElementById('res-healthy').innerText = `${data.healthy_percentage}%`;
        document.getElementById('res-leaf-area').innerText = `${data.leaf_area.toLocaleString()} px`;
        document.getElementById('res-severity').innerText = data.severity;

        // Set Images
        window.currentAnalysis = data;
        updatePreviewImage(overlaySelect ? overlaySelect.value : 'ai_analysis');

        resultPanel.style.display = 'block';
      } catch (err) {
        console.error(err);
        alert('Analysis request failed. Please verify Flask backend is running.');
      } finally {
        captureBtn.disabled = false;
        captureBtn.innerText = 'Capture & Diagnose Leaf';
      }
    });
  }

  if (overlaySelect) {
    overlaySelect.addEventListener('change', (e) => {
      updatePreviewImage(e.target.value);
    });
  }

  function updatePreviewImage(mode) {
    if (!window.currentAnalysis) return;
    const imgElem = document.getElementById('result-img');
    if (!imgElem) return;

    if (mode === 'original') {
      imgElem.src = window.currentAnalysis.original_image_url;
    } else if (mode === 'damage_mask') {
      imgElem.src = window.currentAnalysis.mask_image_url;
    } else {
      imgElem.src = window.currentAnalysis.processed_image_url;
    }
  }
});

import React, { useState } from 'react';
import { Terminal, Copy, Check, FileCode, Layers, Server, Cpu, Database, Play } from 'lucide-react';

export const PythonBackendDocs: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950 text-white p-6 rounded-2xl border border-zinc-800 shadow-sm">
        <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Terminal className="w-4 h-4" />
          <span>Production Architecture</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
          PlantGuard AI — Python, Flask, OpenCV &amp; TensorFlow Backend
        </h2>
        <p className="text-xs sm:text-sm text-zinc-300 mt-2 max-w-3xl leading-relaxed">
          The complete Python repository is packaged in the <code className="text-emerald-400 font-mono bg-zinc-800 px-1.5 py-0.5 rounded">plantguard/</code> directory, providing OpenCV camera streaming, MobileNetV2 disease classification, U-Net lesion segmentation, and Firebase Admin SDK synchronization.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-mono">
          <span className="px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700 text-emerald-300">
            Flask 3.0+
          </span>
          <span className="px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700 text-blue-300">
            OpenCV 4.9+
          </span>
          <span className="px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700 text-amber-300">
            TensorFlow / Keras 2.16+
          </span>
          <span className="px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700 text-orange-300">
            Firebase Admin SDK
          </span>
        </div>
      </div>

      {/* Code Structure Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Run Commands */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
              <Play className="w-4 h-4 text-emerald-600" />
              <span>Quick Run Commands</span>
            </h3>
            <button
              onClick={() => copyToClipboard(`cd plantguard\npip install -r requirements.txt\npython app.py`, 'run-cmd')}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center space-x-1"
            >
              {copiedId === 'run-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy</span>
            </button>
          </div>

          <div className="bg-zinc-950 text-zinc-300 p-3.5 rounded-xl font-mono text-xs overflow-x-auto space-y-1">
            <div className="text-zinc-500"># 1. Navigate to plantguard folder</div>
            <div>cd plantguard</div>
            <div className="text-zinc-500 pt-1"># 2. Install dependencies</div>
            <div>pip install -r requirements.txt</div>
            <div className="text-zinc-500 pt-1"># 3. Launch Flask server with OpenCV camera</div>
            <div className="text-emerald-400">python app.py</div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500">
            Server initializes at <code className="text-zinc-800 dark:text-zinc-200 font-mono">http://localhost:5000</code> or binds to <code className="font-mono">0.0.0.0</code>.
          </div>
        </div>

        {/* Windows PowerShell Commands */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-blue-600" />
              <span>Windows PowerShell Setup</span>
            </h3>
            <button
              onClick={() => copyToClipboard(`python -m venv venv\n.\\venv\\Scripts\\Activate.ps1\npip install -r requirements.txt\n$env:FLASK_ENV="development"\npython app.py`, 'ps-cmd')}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center space-x-1"
            >
              {copiedId === 'ps-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy</span>
            </button>
          </div>

          <div className="bg-zinc-950 text-zinc-300 p-3.5 rounded-xl font-mono text-xs overflow-x-auto space-y-1">
            <div className="text-zinc-500"># Create virtual environment</div>
            <div>python -m venv venv</div>
            <div>.\venv\Scripts\Activate.ps1</div>
            <div className="text-zinc-500 pt-1"># Install requirements &amp; run</div>
            <div>pip install -r requirements.txt</div>
            <div className="text-blue-400">python app.py</div>
          </div>
        </div>
      </div>

      {/* Full API Endpoints Reference */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs">
        <div className="flex items-center space-x-2 mb-4">
          <Server className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
            Flask REST API Endpoints Specification
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100/70 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Endpoint</th>
                <th className="py-2.5 px-3">Purpose</th>
                <th className="py-2.5 px-3">Response Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
              <tr>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">GET</span></td>
                <td className="py-2.5 px-3 text-zinc-900 dark:text-zinc-100 font-bold">/</td>
                <td className="py-2.5 px-3 font-sans">Main Web Dashboard UI</td>
                <td className="py-2.5 px-3 font-sans text-zinc-500">HTML template</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">GET</span></td>
                <td className="py-2.5 px-3 text-zinc-900 dark:text-zinc-100 font-bold">/camera</td>
                <td className="py-2.5 px-3 font-sans">Dedicated camera inspector view</td>
                <td className="py-2.5 px-3 font-sans text-zinc-500">HTML template</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">GET</span></td>
                <td className="py-2.5 px-3 text-zinc-900 dark:text-zinc-100 font-bold">/video_feed</td>
                <td className="py-2.5 px-3 font-sans">OpenCV live MJPEG multipart video stream with dynamic HUD</td>
                <td className="py-2.5 px-3 font-mono text-zinc-500">multipart/x-mixed-replace</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">POST</span></td>
                <td className="py-2.5 px-3 text-zinc-900 dark:text-zinc-100 font-bold">/api/analyze</td>
                <td className="py-2.5 px-3 font-sans">Full pipeline: Leaf detection, classification, lesion segmentation &amp; damage calculation</td>
                <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">
                  {`{ plant, disease, confidence, leaf_area, damaged_area, damage_percentage, severity, ... }`}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">POST</span></td>
                <td className="py-2.5 px-3 text-zinc-900 dark:text-zinc-100 font-bold">/capture</td>
                <td className="py-2.5 px-3 font-sans">Captures current camera frame and saves full report to Firestore</td>
                <td className="py-2.5 px-3 font-sans text-zinc-500">JSON Analysis Record</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">GET</span></td>
                <td className="py-2.5 px-3 text-zinc-900 dark:text-zinc-100 font-bold">/history</td>
                <td className="py-2.5 px-3 font-sans">Analysis history list from Firestore</td>
                <td className="py-2.5 px-3 font-sans text-zinc-500">JSON Array of Analyses</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">GET</span></td>
                <td className="py-2.5 px-3 text-zinc-900 dark:text-zinc-100 font-bold">/analysis/&lt;id&gt;</td>
                <td className="py-2.5 px-3 font-sans">Retrieve single complete analysis record</td>
                <td className="py-2.5 px-3 font-sans text-zinc-500">JSON Analysis Record</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">GET</span></td>
                <td className="py-2.5 px-3 text-zinc-900 dark:text-zinc-100 font-bold">/api/status</td>
                <td className="py-2.5 px-3 font-sans">Backend health and loaded model status</td>
                <td className="py-2.5 px-3 text-zinc-500">{`{ status: "online", models_loaded: true }`}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Training Pipeline */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs">
        <div className="flex items-center space-x-2 mb-3">
          <Cpu className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
            Training Pipelines (Model 1 Classifier + Model 2 Lesion U-Net)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
              Model 1: Disease Classifier
            </h4>
            <p className="text-zinc-500">
              MobileNetV2 transfer learning on 224x224 leaf images with Adam optimizer and Categorical Crossentropy.
            </p>
            <div className="bg-zinc-950 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px]">
              python training/train_classifier.py --epochs 25 --batch_size 32
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
              Model 2: Lesion U-Net Segmenter
            </h4>
            <p className="text-zinc-500">
              3-Class Semantic Segmentation (0: background, 1: healthy leaf, 2: lesion) with Dice Loss and IoU metrics.
            </p>
            <div className="bg-zinc-950 text-indigo-400 p-2.5 rounded-lg font-mono text-[11px]">
              python training/train_segmentation.py --epochs 40 --lr 0.0003
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

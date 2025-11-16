import { useState } from "react";
import { useAudio } from "./hooks/useAudio";

function App() {
  const {
    devices,
    isStreaming,
    audioLevels,
    startStream,
    stopStream,
    applyEffect,
    clearEffects,
    refreshDevices,
  } = useAudio();

  const [quality, setQuality] = useState<"low" | "medium" | "high" | "ultra">("high");

  const handleStartStream = async () => {
    try {
      await startStream({
        quality,
        bitrate: quality === "ultra" ? 510000 : quality === "high" ? 320000 : quality === "medium" ? 192000 : 128000,
        sampleRate: quality === "ultra" ? 96000 : 48000,
        channels: 2,
      });
    } catch (error) {
      console.error("Failed to start stream:", error);
    }
  };

  const handleStopStream = async () => {
    try {
      await stopStream();
    } catch (error) {
      console.error("Failed to stop stream:", error);
    }
  };

  const handleApplyEQ = async () => {
    try {
      await applyEffect("eq", {});
    } catch (error) {
      console.error("Failed to apply EQ:", error);
    }
  };

  const handleApplyCompressor = async () => {
    try {
      await applyEffect("compressor", {
        threshold: -20,
        ratio: 4,
        attack: 0.01,
        release: 0.1,
        makeup: 1.0,
      });
    } catch (error) {
      console.error("Failed to apply compressor:", error);
    }
  };

  return (
    <div className="container">
      <h1>VoiceCast Audio Engine</h1>

      <div className="card">
        <h2>Audio Devices</h2>
        <button onClick={refreshDevices}>Refresh Devices</button>
        <div className="device-list">
          <h3>Input Devices:</h3>
          {devices.filter(d => d.type === 'input').map(device => (
            <div key={device.id}>{device.name}</div>
          ))}
          <h3>Output Devices:</h3>
          {devices.filter(d => d.type === 'output').map(device => (
            <div key={device.id}>{device.name}</div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Streaming Control</h2>
        <div className="quality-selector">
          <label>Quality:</label>
          <select value={quality} onChange={(e) => setQuality(e.target.value as any)}>
            <option value="low">Low (128kbps)</option>
            <option value="medium">Medium (192kbps)</option>
            <option value="high">High (320kbps)</option>
            <option value="ultra">Ultra (510kbps, 96kHz)</option>
          </select>
        </div>
        <div className="stream-controls">
          {!isStreaming ? (
            <button onClick={handleStartStream}>Start Streaming</button>
          ) : (
            <button onClick={handleStopStream}>Stop Streaming</button>
          )}
        </div>
        <div className="status">
          Status: {isStreaming ? "🔴 Live" : "⚫ Stopped"}
        </div>
      </div>

      <div className="card">
        <h2>Audio Levels</h2>
        <div className="levels">
          <div className="level-meter">
            <label>Input Level:</label>
            <progress value={audioLevels.inputLevel} max={1}></progress>
            <span>{(audioLevels.inputLevel * 100).toFixed(1)}%</span>
          </div>
          <div className="level-meter">
            <label>Peak:</label>
            <progress value={audioLevels.peak} max={1}></progress>
            <span>{(audioLevels.peak * 100).toFixed(1)}%</span>
          </div>
          <div className="level-meter">
            <label>RMS:</label>
            <progress value={audioLevels.rms} max={1}></progress>
            <span>{(audioLevels.rms * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Audio Effects</h2>
        <div className="effects-controls">
          <button onClick={handleApplyEQ}>Apply Equalizer</button>
          <button onClick={handleApplyCompressor}>Apply Compressor</button>
          <button onClick={clearEffects}>Clear All Effects</button>
        </div>
      </div>
    </div>
  );
}

export default App;

"use client";

import { useState, useEffect, useRef } from "react";

interface SoundSettings {
  frequency: number;
  duration: number;
  gain: number;
}

const Metronome = () => {
  const [bpm, setBpm] = useState(120);
  const bpmRef = useRef(bpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [accentFirstBeat, setAccentFirstBeat] = useState(true);
  const [soundSettings, setSoundSettings] = useState<{
    normal: SoundSettings;
    accent: SoundSettings;
  }>({
    normal: {
      frequency: 800,
      duration: 0.05,
      gain: 0.5,
    },
    accent: {
      frequency: 1600,
      duration: 0.05,
      gain: 0.8,
    },
  });

  const audioContext = useRef<AudioContext | null>(null);
  const timerID = useRef<number | null>(null);
  const nextNoteTime = useRef(0);
  const currentBeatRef = useRef(0);
  const accentFirstBeatRef = useRef(accentFirstBeat);
  const soundSettingsRef = useRef(soundSettings);

  // Keep refs in sync with state
  useEffect(() => {
    accentFirstBeatRef.current = accentFirstBeat;
  }, [accentFirstBeat]);

  useEffect(() => {
    soundSettingsRef.current = soundSettings;
  }, [soundSettings]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    audioContext.current = new AudioContext();
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
      if (timerID.current) {
        window.clearTimeout(timerID.current);
      }
    };
  }, []);

  // Effect for handling beats per measure changes
  useEffect(() => {
    if (isPlaying) {
      if (timerID.current) {
        window.clearTimeout(timerID.current);
        timerID.current = null;
      }
      currentBeatRef.current = beatsPerMeasure - 1;
      setCurrentBeat(beatsPerMeasure - 1);

      if (audioContext.current) {
        nextNoteTime.current = audioContext.current.currentTime;
        scheduler();
      }
    }
  }, [beatsPerMeasure, isPlaying]);

  const playClick = (time: number) => {
    if (!audioContext.current) return;

    const osc = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioContext.current.destination);

    // Use refs instead of state for immediate updates
    const useAccent =
      accentFirstBeatRef.current && currentBeatRef.current === 0;
    const settings = useAccent
      ? soundSettingsRef.current.accent
      : soundSettingsRef.current.normal;

    osc.frequency.setValueAtTime(settings.frequency, time);
    gainNode.gain.setValueAtTime(settings.gain, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + settings.duration);

    osc.start(time);
    osc.stop(time + settings.duration);
  };

  const scheduler = () => {
    if (!audioContext.current) return;

    const currentTime = audioContext.current.currentTime;

    while (nextNoteTime.current < currentTime + 0.1) {
      // Update beat counter first
      const nextBeat = (currentBeatRef.current + 1) % beatsPerMeasure;
      currentBeatRef.current = nextBeat;
      setCurrentBeat(nextBeat);

      // Then play the click with the updated beat
      playClick(nextNoteTime.current);

      // Calculate time for next beat using the ref value
      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTime.current += secondsPerBeat;
    }

    timerID.current = window.setTimeout(scheduler, 25);
  };

  const startStop = () => {
    if (isPlaying) {
      if (timerID.current) {
        window.clearTimeout(timerID.current);
        timerID.current = null;
      }
      setIsPlaying(false);
    } else {
      if (!audioContext.current) {
        audioContext.current = new AudioContext();
      }

      if (audioContext.current.state === "suspended") {
        audioContext.current.resume();
      }

      currentBeatRef.current = beatsPerMeasure - 1;
      setCurrentBeat(beatsPerMeasure - 1);
      nextNoteTime.current = audioContext.current.currentTime;
      setIsPlaying(true);
      scheduler();
    }
  };

  const handleBpmChange = (newBpm: number) => {
    const clampedBpm = Math.min(Math.max(newBpm, 30), 300);
    setBpm(clampedBpm);
    bpmRef.current = clampedBpm;
  };

  const updateSoundSettings = (
    type: "normal" | "accent",
    field: keyof SoundSettings,
    value: number
  ) => {
    setSoundSettings((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  return (
    <div className="min-w-full md:min-w-[360px] p-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 text-center">
        Metronome
      </h1>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-lg sm:text-xl font-medium text-gray-700">
              BPM: {bpm}
            </span>
            <div className="flex space-x-3">
              <button
                onClick={() => handleBpmChange(bpm - 1)}
                className="w-12 h-12 flex items-center justify-center bg-gray-200 text-gray-700 text-2xl font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                −
              </button>
              <button
                onClick={() => handleBpmChange(bpm + 1)}
                className="w-12 h-12 flex items-center justify-center bg-gray-200 text-gray-700 text-2xl font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                +
              </button>
            </div>
          </div>
          <input
            type="range"
            min="30"
            max="300"
            value={bpm}
            onChange={(e) => handleBpmChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="flex justify-center space-x-4">
          {[...Array(beatsPerMeasure)].map((_, i) => (
            <div
              key={i}
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-all duration-100 ${
                currentBeat === i
                  ? "bg-blue-500 transform scale-110"
                  : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Accent first beat</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={accentFirstBeat}
                onChange={(e) => setAccentFirstBeat(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-gray-700 whitespace-nowrap">
              Beats per measure:
            </span>
            <select
              value={beatsPerMeasure}
              onChange={(e) => setBeatsPerMeasure(parseInt(e.target.value))}
              className="border rounded-lg px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[2, 3, 4, 6, 8].map((num) => (
                <option key={num} value={num} className="text-gray-700">
                  {num}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          <div className="space-y-4 bg-white px-2 py-3 sm:p-4 rounded-none sm:rounded-lg shadow-sm">
            <h3 className="font-medium text-gray-700">Normal Beat Sound</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm text-gray-600">Frequency</label>
                <span className="text-sm text-gray-500 w-16 text-right">
                  {soundSettings.normal.frequency} Hz
                </span>
              </div>
              <input
                type="range"
                min="200"
                max="2000"
                value={soundSettings.normal.frequency}
                onChange={(e) =>
                  updateSoundSettings(
                    "normal",
                    "frequency",
                    parseInt(e.target.value)
                  )
                }
                className="w-full accent-blue-500"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm text-gray-600">Volume</label>
                <span className="text-sm text-gray-500 w-16 text-right">
                  {Math.round(soundSettings.normal.gain * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={soundSettings.normal.gain * 100}
                onChange={(e) =>
                  updateSoundSettings(
                    "normal",
                    "gain",
                    parseInt(e.target.value) / 100
                  )
                }
                className="w-full accent-blue-500"
              />
            </div>
          </div>

          {accentFirstBeat && (
            <div className="space-y-4 bg-white px-2 py-3 sm:p-4 rounded-none sm:rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-700">Accent Beat Sound</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-600">Frequency</label>
                  <span className="text-sm text-gray-500 w-16 text-right">
                    {soundSettings.accent.frequency} Hz
                  </span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="2000"
                  value={soundSettings.accent.frequency}
                  onChange={(e) =>
                    updateSoundSettings(
                      "accent",
                      "frequency",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full accent-blue-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-600">Volume</label>
                  <span className="text-sm text-gray-500 w-16 text-right">
                    {Math.round(soundSettings.accent.gain * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={soundSettings.accent.gain * 100}
                  onChange={(e) =>
                    updateSoundSettings(
                      "accent",
                      "gain",
                      parseInt(e.target.value) / 100
                    )
                  }
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={startStop}
          className={`w-full py-3 sm:py-4 rounded-lg text-white font-semibold text-lg transition-colors ${
            isPlaying
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {isPlaying ? "Stop" : "Start"}
        </button>
      </div>
    </div>
  );
};

export default Metronome;

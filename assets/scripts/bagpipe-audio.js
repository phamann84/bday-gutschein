(() => {
  const body = document.body;
  const toggle = document.querySelector("[data-sound-toggle]");

  if (!toggle) {
    return;
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;

  if (!AudioCtx) {
    toggle.hidden = true;
    return;
  }

  let audioContext;
  let masterGain;
  let melodyTimer;
  let drones = [];
  let isRunning = false;
  let manuallyPaused = false;
  let autoplayTried = false;

  const tune = [
    466.16, 523.25, 587.33, 622.25, 698.46, 587.33, 523.25, 466.16,
    466.16, 523.25, 587.33, 698.46, 783.99, 698.46, 622.25, 587.33
  ];

  const updateToggle = (state, text, pressed) => {
    body.dataset.audioState = state;
    toggle.textContent = text;
    toggle.setAttribute("aria-pressed", String(pressed));
  };

  const withTimeout = (promise, timeoutMs) =>
    Promise.race([
      promise,
      new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error("Audio start timeout")), timeoutMs);
      })
    ]);

  const ensureContext = async () => {
    if (!audioContext) {
      audioContext = new AudioCtx();
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0.22;
      masterGain.connect(audioContext.destination);
    }

    if (audioContext.state === "suspended") {
      await withTimeout(audioContext.resume(), 250);
    }

    if (audioContext.state !== "running") {
      throw new Error("AudioContext not running");
    }
  };

  const createVoice = (frequency, type, gainValue, detune = 0) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.detune.value = detune;

    filter.type = "bandpass";
    filter.frequency.value = Math.max(frequency * 1.6, 420);
    filter.Q.value = 0.8;

    gain.gain.value = gainValue;

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    oscillator.start();

    return { oscillator, gain, filter };
  };

  const scheduleMelody = () => {
    let index = 0;

    melodyTimer = window.setInterval(() => {
      if (!audioContext || !masterGain || audioContext.state !== "running") {
        return;
      }

      const now = audioContext.currentTime;
      const note = tune[index % tune.length];
      const voiceA = createVoice(note, "triangle", 0.0001);
      const voiceB = createVoice(note * 2, "sawtooth", 0.00008, 4);

      [voiceA, voiceB].forEach((voice, voiceIndex) => {
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(0.0001, now);
        voice.gain.gain.linearRampToValueAtTime(voiceIndex === 0 ? 0.018 : 0.011, now + 0.06);
        voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);
        voice.oscillator.stop(now + 0.78);
      });

      index += 1;
    }, 650);
  };

  const start = async () => {
    await ensureContext();

    if (isRunning) {
      return;
    }

    drones = [
      createVoice(233.08, "sawtooth", 0.014),
      createVoice(466.16, "sawtooth", 0.009, 2),
      createVoice(349.23, "triangle", 0.007, -3)
    ];

    scheduleMelody();
    isRunning = true;
    manuallyPaused = false;
    updateToggle("playing", "Dudelsackmusik pausieren", true);
  };

  const stop = async ({ manual } = { manual: false }) => {
    if (!audioContext) {
      return;
    }

    window.clearInterval(melodyTimer);
    melodyTimer = undefined;

    drones.forEach((voice) => {
      try {
        voice.gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.2);
        voice.oscillator.stop(audioContext.currentTime + 0.25);
      } catch (error) {
        // Browser may already have stopped the node; safe to ignore.
      }
    });

    drones = [];
    isRunning = false;
    manuallyPaused = manual;
    updateToggle("idle", "Dudelsackmusik aktivieren", false);
  };

  const attemptAutoplay = async () => {
    if (autoplayTried || isRunning || manuallyPaused) {
      return;
    }

    autoplayTried = true;
    updateToggle("loading", "Dudelsackmusik startet …", false);

    try {
      await start();
    } catch (error) {
      updateToggle("pending", "Musik startet beim ersten Tippen", false);
    }
  };

  const pointerBoot = async (event) => {
    if (event.target === toggle || toggle.contains(event.target)) {
      return;
    }

    document.removeEventListener("pointerdown", pointerBoot);
    document.removeEventListener("keydown", keyBoot);

    if (isRunning || manuallyPaused) {
      return;
    }

    try {
      await start();
    } catch (error) {
      updateToggle("blocked", "Audio ist auf diesem Gerät blockiert", false);
    }
  };

  const keyBoot = async () => {
    if (document.activeElement === toggle) {
      return;
    }

    document.removeEventListener("pointerdown", pointerBoot);
    document.removeEventListener("keydown", keyBoot);

    if (isRunning || manuallyPaused) {
      return;
    }

    try {
      await start();
    } catch (error) {
      updateToggle("blocked", "Audio ist auf diesem Gerät blockiert", false);
    }
  };

  document.addEventListener("pointerdown", pointerBoot);
  document.addEventListener("keydown", keyBoot);
  window.addEventListener("pageshow", () => {
    autoplayTried = false;
    attemptAutoplay();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !isRunning && !manuallyPaused) {
      autoplayTried = false;
      attemptAutoplay();
    }
  });

  toggle.addEventListener("click", async () => {
    try {
      if (isRunning) {
        await stop({ manual: true });
      } else {
        await start();
      }
    } catch (error) {
      updateToggle("pending", "Musik startet beim ersten Tippen", false);
    }
  });

  updateToggle("loading", "Dudelsackmusik startet …", false);
})();

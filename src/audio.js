export function createAudio({ lavaBubbleSoundMinSeconds, lavaBubbleSoundSpreadSeconds, seededWave, showMessage }) {
  let audioContext = null;
  let audioMaster = null;
  let nextLavaBubbleSoundTime = 0;

  function start() {
    if (audioContext !== null) {
      audioContext.resume();
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      showMessage("This browser cannot play sound.");
      return;
    }

    audioContext = new AudioContextClass();
    audioMaster = audioContext.createGain();
    audioMaster.gain.value = 0.18;
    audioMaster.connect(audioContext.destination);
    addLavaAmbientSound();
  }

  function addLavaAmbientSound() {
    if (audioContext === null || audioMaster === null) {
      throw new Error("Audio must be started before lava sound is created.");
    }

    const seconds = 2;
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * seconds, audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);

    for (let index = 0; index < noiseData.length; index += 1) {
      noiseData[index] = Math.random() * 2 - 1;
    }

    const lavaNoise = audioContext.createBufferSource();
    lavaNoise.buffer = noiseBuffer;
    lavaNoise.loop = true;

    const lavaFilter = audioContext.createBiquadFilter();
    lavaFilter.type = "lowpass";
    lavaFilter.frequency.value = 260;
    lavaFilter.Q.value = 0.7;

    const lavaGain = audioContext.createGain();
    lavaGain.gain.value = 0.045;

    const lavaRumble = audioContext.createOscillator();
    lavaRumble.type = "sine";
    lavaRumble.frequency.value = 44;

    const rumbleGain = audioContext.createGain();
    rumbleGain.gain.value = 0.035;

    lavaNoise.connect(lavaFilter);
    lavaFilter.connect(lavaGain);
    lavaGain.connect(audioMaster);
    lavaRumble.connect(rumbleGain);
    rumbleGain.connect(audioMaster);

    lavaNoise.start();
    lavaRumble.start();
  }

  function playPickaxeHit() {
    if (audioContext === null || audioMaster === null) {
      return;
    }

    const startTime = audioContext.currentTime;
    const clang = audioContext.createOscillator();
    clang.type = "triangle";
    clang.frequency.setValueAtTime(760, startTime);
    clang.frequency.exponentialRampToValueAtTime(240, startTime + 0.13);

    const clangGain = audioContext.createGain();
    clangGain.gain.setValueAtTime(0.0001, startTime);
    clangGain.gain.exponentialRampToValueAtTime(0.11, startTime + 0.01);
    clangGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.16);

    const dust = audioContext.createBufferSource();
    const dustBuffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * 0.06), audioContext.sampleRate);
    const dustData = dustBuffer.getChannelData(0);

    for (let index = 0; index < dustData.length; index += 1) {
      dustData[index] = (Math.random() * 2 - 1) * (1 - index / dustData.length);
    }

    const dustFilter = audioContext.createBiquadFilter();
    dustFilter.type = "highpass";
    dustFilter.frequency.value = 650;

    const dustGain = audioContext.createGain();
    dustGain.gain.setValueAtTime(0.06, startTime);
    dustGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.07);

    dust.buffer = dustBuffer;
    clang.connect(clangGain);
    clangGain.connect(audioMaster);
    dust.connect(dustFilter);
    dustFilter.connect(dustGain);
    dustGain.connect(audioMaster);

    clang.start(startTime);
    clang.stop(startTime + 0.18);
    dust.start(startTime);
    dust.stop(startTime + 0.08);
  }

  function playLavaBubbleSound() {
    if (audioContext === null || audioMaster === null) {
      return;
    }

    const startTime = audioContext.currentTime;
    const bubble = audioContext.createOscillator();
    bubble.type = "sine";
    bubble.frequency.setValueAtTime(92, startTime);
    bubble.frequency.exponentialRampToValueAtTime(38, startTime + 0.18);

    const bubbleGain = audioContext.createGain();
    bubbleGain.gain.setValueAtTime(0.0001, startTime);
    bubbleGain.gain.exponentialRampToValueAtTime(0.045, startTime + 0.025);
    bubbleGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);

    bubble.connect(bubbleGain);
    bubbleGain.connect(audioMaster);
    bubble.start(startTime);
    bubble.stop(startTime + 0.24);
  }

  function playDragonFire() {
    if (audioContext === null || audioMaster === null) {
      return;
    }

    const startTime = audioContext.currentTime;
    const noiseBuffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * 0.22), audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);

    for (let index = 0; index < noiseData.length; index += 1) {
      noiseData[index] = (Math.random() * 2 - 1) * (1 - index / noiseData.length);
    }

    const fireNoise = audioContext.createBufferSource();
    fireNoise.buffer = noiseBuffer;

    const fireFilter = audioContext.createBiquadFilter();
    fireFilter.type = "bandpass";
    fireFilter.frequency.setValueAtTime(720, startTime);
    fireFilter.frequency.exponentialRampToValueAtTime(190, startTime + 0.22);

    const fireGain = audioContext.createGain();
    fireGain.gain.setValueAtTime(0.0001, startTime);
    fireGain.gain.exponentialRampToValueAtTime(0.1, startTime + 0.025);
    fireGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);

    fireNoise.connect(fireFilter);
    fireFilter.connect(fireGain);
    fireGain.connect(audioMaster);
    fireNoise.start(startTime);
    fireNoise.stop(startTime + 0.23);
  }

  function playBowShot() {
    if (audioContext === null || audioMaster === null) {
      return;
    }

    const startTime = audioContext.currentTime;
    const twang = audioContext.createOscillator();
    twang.type = "triangle";
    twang.frequency.setValueAtTime(180, startTime);
    twang.frequency.exponentialRampToValueAtTime(90, startTime + 0.12);

    const twangGain = audioContext.createGain();
    twangGain.gain.setValueAtTime(0.0001, startTime);
    twangGain.gain.exponentialRampToValueAtTime(0.08, startTime + 0.012);
    twangGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14);

    twang.connect(twangGain);
    twangGain.connect(audioMaster);
    twang.start(startTime);
    twang.stop(startTime + 0.16);
  }

  function playArrowHit() {
    if (audioContext === null || audioMaster === null) {
      return;
    }

    const startTime = audioContext.currentTime;
    const hit = audioContext.createOscillator();
    hit.type = "square";
    hit.frequency.setValueAtTime(520, startTime);
    hit.frequency.exponentialRampToValueAtTime(180, startTime + 0.08);

    const hitGain = audioContext.createGain();
    hitGain.gain.setValueAtTime(0.0001, startTime);
    hitGain.gain.exponentialRampToValueAtTime(0.075, startTime + 0.008);
    hitGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.1);

    hit.connect(hitGain);
    hitGain.connect(audioMaster);
    hit.start(startTime);
    hit.stop(startTime + 0.12);
  }

  function updateLava(time, gameStarted) {
    if (audioContext === null || !gameStarted || time < nextLavaBubbleSoundTime) {
      return;
    }

    playLavaBubbleSound();
    nextLavaBubbleSoundTime =
      time + lavaBubbleSoundMinSeconds + seededWave(time * 19.7) * lavaBubbleSoundSpreadSeconds;
  }

  return {
    playArrowHit,
    playBowShot,
    playDragonFire,
    playPickaxeHit,
    start,
    updateLava
  };
}

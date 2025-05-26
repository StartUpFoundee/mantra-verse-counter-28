
interface SpeechDetectionProps {
  onSpeechDetected: () => void;
  onSpeechEnded: () => void;
  minDecibels?: number;
}

export class SpeechDetection {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private isListening = false;
  private lastSpeechTime = 0;
  private isSpeaking = false;
  private silenceTimeout: number | null = null;
  private animationFrame: number | null = null;
  private onSpeechDetected: () => void;
  private onSpeechEnded: () => void;
  private minDecibels: number;
  private consecutiveSpeechFrames = 0;
  private baselineNoise = 0;
  private volumeBuffer: number[] = [];
  private isReadyForNextMantra = true;
  private mantraReadyTimeout: number | null = null;
  private mantraInProgress = false;
  private silenceTimer = 0;
  private audioFeedback: AudioContext | null = null;

  constructor({ onSpeechDetected, onSpeechEnded, minDecibels = -70 }: SpeechDetectionProps) {
    this.onSpeechDetected = onSpeechDetected;
    this.onSpeechEnded = onSpeechEnded;
    this.minDecibels = minDecibels;
  }

  public async start(): Promise<boolean> {
    try {
      if (this.isListening) return true;
      
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.audioFeedback = new AudioContext();
      
      // Ultra-sensitive settings for human voice detection
      this.analyser.fftSize = 4096; // Higher resolution for better frequency analysis
      this.analyser.minDecibels = -100;
      this.analyser.maxDecibels = -10;
      this.analyser.smoothingTimeConstant = 0.2; // Faster response
      
      // Request microphone with enhanced settings for human voice
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: false, // We'll do our own filtering
          autoGainControl: true,
          sampleRate: 48000, // Higher sample rate for better voice detection
          channelCount: 1
        } 
      });
      
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.stream);
      this.mediaStreamSource.connect(this.analyser);
      
      this.isListening = true;
      this.volumeBuffer = [];
      this.baselineNoise = 0;
      this.isReadyForNextMantra = true;
      this.mantraInProgress = false;
      this.silenceTimer = 0;
      
      // Start baseline calibration
      setTimeout(() => this.calibrateBaseline(), 1000);
      this.detectHumanVoice();
      
      console.log("🎤 Advanced human voice detection started - Long mantra support with 1.5-2s gap detection");
      return true;
    } catch (error) {
      console.error("Error starting speech detection:", error);
      return false;
    }
  }

  public stop(): void {
    if (!this.isListening) return;
    
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    
    if (this.mantraReadyTimeout) {
      clearTimeout(this.mantraReadyTimeout);
      this.mantraReadyTimeout = null;
    }
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    if (this.audioFeedback) {
      this.audioFeedback.close();
      this.audioFeedback = null;
    }
    
    this.analyser = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.mantraInProgress = false;
    this.consecutiveSpeechFrames = 0;
    this.volumeBuffer = [];
    this.isReadyForNextMantra = true;
    this.silenceTimer = 0;
    console.log("Advanced speech detection stopped");
  }

  private calibrateBaseline(): void {
    if (this.volumeBuffer.length > 20) {
      // Get the minimum volume from recent samples for baseline
      this.baselineNoise = Math.min(...this.volumeBuffer.slice(-20));
      console.log(`📊 Human voice baseline calibrated: ${this.baselineNoise.toFixed(2)}`);
    }
  }

  private getHumanVoiceLevel(): number {
    if (!this.analyser) return 0;
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    
    // Human voice fundamental frequency range: 85-255 Hz
    // Plus harmonics up to 3000 Hz for complete voice detection
    const sampleRate = this.audioContext!.sampleRate;
    const fundamentalStart = Math.floor(85 * bufferLength / (sampleRate / 2));
    const fundamentalEnd = Math.floor(255 * bufferLength / (sampleRate / 2));
    const harmonicsEnd = Math.floor(3000 * bufferLength / (sampleRate / 2));
    
    // Calculate energy in fundamental frequency range (most important)
    let fundamentalEnergy = 0;
    for (let i = fundamentalStart; i < Math.min(fundamentalEnd, bufferLength); i++) {
      fundamentalEnergy += dataArray[i] * dataArray[i];
    }
    const fundamentalRms = Math.sqrt(fundamentalEnergy / (fundamentalEnd - fundamentalStart));
    
    // Calculate energy in harmonics range
    let harmonicsEnergy = 0;
    for (let i = fundamentalEnd; i < Math.min(harmonicsEnd, bufferLength); i++) {
      harmonicsEnergy += dataArray[i] * dataArray[i];
    }
    const harmonicsRms = Math.sqrt(harmonicsEnergy / (harmonicsEnd - fundamentalEnd));
    
    // Combine fundamental and harmonics with emphasis on fundamental
    const voiceLevel = (fundamentalRms * 0.7) + (harmonicsRms * 0.3);
    
    // Filter out non-voice frequencies
    const totalEnergy = dataArray.reduce((sum, val) => sum + val * val, 0);
    const totalRms = Math.sqrt(totalEnergy / bufferLength);
    
    // If voice frequencies are prominent compared to total energy, it's likely human voice
    const voiceRatio = voiceLevel / (totalRms + 1);
    
    return voiceRatio > 0.3 ? voiceLevel : 0; // Only return if voice is prominent
  }

  private playConfirmationSound(): void {
    if (!this.audioFeedback) return;
    
    try {
      // Create 0.5-second pleasant confirmation sound
      const oscillator = this.audioFeedback.createOscillator();
      const gainNode = this.audioFeedback.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioFeedback.destination);
      
      // Pleasant tone (A note, 440 Hz)
      oscillator.frequency.setValueAtTime(440, this.audioFeedback.currentTime);
      oscillator.type = 'sine';
      
      // Quick fade in and out for pleasant sound
      gainNode.gain.setValueAtTime(0, this.audioFeedback.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, this.audioFeedback.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.1, this.audioFeedback.currentTime + 0.45);
      gainNode.gain.linearRampToValueAtTime(0, this.audioFeedback.currentTime + 0.5);
      
      oscillator.start(this.audioFeedback.currentTime);
      oscillator.stop(this.audioFeedback.currentTime + 0.5);
      
      console.log("🔊 Mantra confirmation sound played (0.5s)");
    } catch (error) {
      console.error("Error playing confirmation sound:", error);
    }
  }

  private detectHumanVoice = (): void => {
    if (!this.isListening || !this.analyser) return;

    const currentVoiceLevel = this.getHumanVoiceLevel();
    const now = Date.now();
    
    // Maintain a rolling buffer for baseline calculation
    this.volumeBuffer.push(currentVoiceLevel);
    if (this.volumeBuffer.length > 100) {
      this.volumeBuffer.shift();
    }
    
    // Dynamic threshold based on baseline + sensitivity for human voice
    const dynamicThreshold = Math.max(this.baselineNoise + 8, 12);
    
    console.log(`🗣️ Voice Level: ${currentVoiceLevel.toFixed(2)}, Threshold: ${dynamicThreshold.toFixed(2)}, Mantra Progress: ${this.mantraInProgress}, Silence Timer: ${this.silenceTimer.toFixed(1)}s`);
    
    if (currentVoiceLevel > dynamicThreshold) {
      // Human voice detected
      this.consecutiveSpeechFrames++;
      
      if (!this.mantraInProgress && this.consecutiveSpeechFrames >= 3 && this.isReadyForNextMantra) {
        // Start of new mantra
        this.mantraInProgress = true;
        this.onSpeechDetected();
        console.log(`🎙️ MANTRA STARTED! Voice Level: ${currentVoiceLevel.toFixed(2)}`);
      }
      
      this.lastSpeechTime = now;
      this.silenceTimer = 0; // Reset silence timer while speaking
      
    } else {
      // Silence detected
      if (this.mantraInProgress) {
        this.silenceTimer += 0.1; // Increment silence timer (assuming 100ms intervals)
        
        // Check if silence gap indicates mantra completion (1.5-2 seconds)
        if (this.silenceTimer >= 1.5) {
          // Mantra completed!
          this.mantraInProgress = false;
          this.consecutiveSpeechFrames = 0;
          this.silenceTimer = 0;
          
          if (this.isReadyForNextMantra) {
            this.onSpeechEnded();
            this.playConfirmationSound(); // Play 0.5s confirmation sound
            this.isReadyForNextMantra = false;
            
            // Set ready for next mantra after small delay
            this.mantraReadyTimeout = window.setTimeout(() => {
              this.isReadyForNextMantra = true;
              console.log("✅ Ready for next mantra");
            }, 500);
            
            console.log(`📿 MANTRA COMPLETED! 1.5s+ silence gap detected. Playing confirmation sound.`);
          }
        }
      } else {
        // Not in mantra, reset counters
        this.consecutiveSpeechFrames = Math.max(0, this.consecutiveSpeechFrames - 1);
        this.silenceTimer = 0;
      }
    }
    
    // Continue detection loop at ~100ms intervals for precise timing
    this.animationFrame = setTimeout(this.detectHumanVoice, 100);
  };
}


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
  private isReadyForNextMantra = true; // New flag to control counting
  private mantraReadyTimeout: number | null = null; // New timeout for 2-second wait

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
      
      // Ultra-sensitive settings for very quiet voices
      this.analyser.fftSize = 2048;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;
      this.analyser.smoothingTimeConstant = 0.3;
      
      // Request microphone with maximum sensitivity
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      });
      
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.stream);
      this.mediaStreamSource.connect(this.analyser);
      
      this.isListening = true;
      this.volumeBuffer = [];
      this.baselineNoise = 0;
      this.isReadyForNextMantra = true; // Reset ready state
      
      // Start baseline calibration
      setTimeout(() => this.calibrateBaseline(), 1000);
      this.detectSound();
      
      console.log("🎤 Ultra-sensitive speech detection started - 2 second silence gap between mantras");
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
    
    this.analyser = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.consecutiveSpeechFrames = 0;
    this.volumeBuffer = [];
    this.isReadyForNextMantra = true;
    console.log("Speech detection stopped");
  }

  private calibrateBaseline(): void {
    if (this.volumeBuffer.length > 10) {
      this.baselineNoise = Math.min(...this.volumeBuffer.slice(-10));
      console.log(`📊 Baseline noise calibrated: ${this.baselineNoise.toFixed(2)}`);
    }
  }

  private getVolumeLevel(): number {
    if (!this.analyser) return 0;
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    
    // Calculate RMS (Root Mean Square) for better accuracy
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / bufferLength);
    
    // Focus on voice frequencies (roughly 85Hz - 3000Hz)
    const voiceStart = Math.floor(85 * bufferLength / (this.audioContext!.sampleRate / 2));
    const voiceEnd = Math.floor(3000 * bufferLength / (this.audioContext!.sampleRate / 2));
    
    let voiceSum = 0;
    for (let i = voiceStart; i < Math.min(voiceEnd, bufferLength); i++) {
      voiceSum += dataArray[i] * dataArray[i];
    }
    const voiceRms = Math.sqrt(voiceSum / (voiceEnd - voiceStart));
    
    // Use the higher of general RMS or voice-specific RMS
    return Math.max(rms, voiceRms);
  }

  private detectSound = (): void => {
    if (!this.isListening || !this.analyser) return;

    const currentVolume = this.getVolumeLevel();
    
    // Maintain a rolling buffer for baseline calculation
    this.volumeBuffer.push(currentVolume);
    if (this.volumeBuffer.length > 50) {
      this.volumeBuffer.shift();
    }
    
    // Dynamic threshold based on baseline + sensitivity
    const dynamicThreshold = Math.max(this.baselineNoise + 5, 8);
    
    console.log(`🔊 Volume: ${currentVolume.toFixed(2)}, Threshold: ${dynamicThreshold.toFixed(2)}, Ready: ${this.isReadyForNextMantra}`);
    
    if (currentVolume > dynamicThreshold) {
      // Speech detected
      this.consecutiveSpeechFrames++;
      
      // Only trigger speech detection if we're ready for the next mantra
      if (this.consecutiveSpeechFrames >= 3 && !this.isSpeaking && this.isReadyForNextMantra) {
        this.isSpeaking = true;
        this.onSpeechDetected();
        console.log(`🎙️ SPEECH DETECTED! Volume: ${currentVolume.toFixed(2)}, Ready for mantra: ${this.isReadyForNextMantra}`);
      }
      
      this.lastSpeechTime = Date.now();
      
      // Clear any pending silence timeouts
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
        this.silenceTimeout = null;
      }
    } else {
      // Silence detected
      if (this.isSpeaking && this.consecutiveSpeechFrames > 0) {
        const now = Date.now();
        // End speech after 500ms of silence
        if (now - this.lastSpeechTime > 500) {
          this.isSpeaking = false;
          this.consecutiveSpeechFrames = 0;
          
          // Only count if we're ready for next mantra
          if (this.isReadyForNextMantra) {
            this.onSpeechEnded();
            this.isReadyForNextMantra = false; // Block further counting
            
            // Set 2-second timeout before ready for next mantra
            this.mantraReadyTimeout = window.setTimeout(() => {
              this.isReadyForNextMantra = true;
              console.log("✅ Ready for next mantra after 2 seconds of silence");
            }, 2000);
            
            console.log(`📿 MANTRA COUNTED! Waiting 2 seconds before next count`);
          }
        }
      }
    }
    
    this.animationFrame = requestAnimationFrame(this.detectSound);
  };
}

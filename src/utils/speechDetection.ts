
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
      
      // Start baseline calibration
      setTimeout(() => this.calibrateBaseline(), 1000);
      this.detectSound();
      
      console.log("🎤 Ultra-sensitive speech detection started - detecting even whispers");
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
    
    // Calculate average volume across all frequencies
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;
    
    // Focus on voice frequencies (roughly 85Hz - 3000Hz)
    const voiceStart = Math.floor(85 * bufferLength / (this.audioContext!.sampleRate / 2));
    const voiceEnd = Math.floor(3000 * bufferLength / (this.audioContext!.sampleRate / 2));
    
    let voiceSum = 0;
    for (let i = voiceStart; i < Math.min(voiceEnd, bufferLength); i++) {
      voiceSum += dataArray[i];
    }
    const voiceAverage = voiceSum / (voiceEnd - voiceStart);
    
    // Use the higher of general average or voice-specific average
    return Math.max(average, voiceAverage);
  }

  private detectSound = (): void => {
    if (!this.isListening || !this.analyser) return;

    const currentVolume = this.getVolumeLevel();
    
    // Maintain a rolling buffer for baseline calculation
    this.volumeBuffer.push(currentVolume);
    if (this.volumeBuffer.length > 50) {
      this.volumeBuffer.shift();
    }
    
    // Dynamic threshold based on baseline + very low threshold
    const dynamicThreshold = Math.max(this.baselineNoise + 2, 3);
    
    console.log(`🔊 Volume: ${currentVolume.toFixed(2)}, Threshold: ${dynamicThreshold.toFixed(2)}, Baseline: ${this.baselineNoise.toFixed(2)}`);
    
    if (currentVolume > dynamicThreshold) {
      // Speech detected
      this.consecutiveSpeechFrames++;
      
      // Trigger speech detection after just 1 frame for maximum responsiveness
      if (this.consecutiveSpeechFrames >= 1 && !this.isSpeaking) {
        this.isSpeaking = true;
        this.onSpeechDetected();
        console.log(`🎙️ SPEECH DETECTED! Volume: ${currentVolume.toFixed(2)}, Threshold: ${dynamicThreshold.toFixed(2)}`);
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
        // End speech after very short silence (200ms) for quick response
        if (now - this.lastSpeechTime > 200) {
          this.isSpeaking = false;
          this.consecutiveSpeechFrames = 0;
          this.onSpeechEnded();
          console.log(`✅ SPEECH ENDED after ${now - this.lastSpeechTime}ms of silence`);
        }
      }
    }
    
    this.animationFrame = requestAnimationFrame(this.detectSound);
  };
}

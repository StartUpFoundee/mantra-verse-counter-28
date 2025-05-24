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
  private consecutiveSilenceFrames = 0;
  private consecutiveSpeechFrames = 0;
  private volumeHistory: number[] = [];

  constructor({ onSpeechDetected, onSpeechEnded, minDecibels = -60 }: SpeechDetectionProps) {
    this.onSpeechDetected = onSpeechDetected;
    this.onSpeechEnded = onSpeechEnded;
    this.minDecibels = minDecibels;
  }

  public async start(): Promise<boolean> {
    try {
      if (this.isListening) return true;
      
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.minDecibels = this.minDecibels;
      this.analyser.maxDecibels = -10;
      this.analyser.smoothingTimeConstant = 0.1;
      
      // Enhanced microphone settings for better voice detection
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
      this.volumeHistory = [];
      this.detectSound();
      
      console.log("Enhanced speech detection started - ready for all voice levels");
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
    this.consecutiveSilenceFrames = 0;
    this.consecutiveSpeechFrames = 0;
    this.volumeHistory = [];
    console.log("Speech detection stopped");
  }

  private getVolumeLevel(): number {
    if (!this.analyser) return 0;
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    
    // Calculate RMS (Root Mean Square) for better volume detection
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);
    
    // Focus on human voice frequency range (85Hz - 3000Hz)
    // This roughly corresponds to indices 10-150 in our frequency data
    const voiceRange = dataArray.slice(10, 150);
    const voiceSum = voiceRange.reduce((acc, val) => acc + val, 0);
    const voiceAverage = voiceSum / voiceRange.length;
    
    // Combine RMS and voice-focused detection
    return Math.max(rms, voiceAverage);
  }

  private detectSound = (): void => {
    if (!this.isListening || !this.analyser) return;

    const currentVolume = this.getVolumeLevel();
    
    // Keep a rolling history of volume levels for better detection
    this.volumeHistory.push(currentVolume);
    if (this.volumeHistory.length > 10) {
      this.volumeHistory.shift();
    }
    
    // Calculate dynamic threshold based on background noise
    const backgroundNoise = Math.min(...this.volumeHistory.slice(0, 5)) || 0;
    const dynamicThreshold = Math.max(backgroundNoise + 5, 8); // Minimum threshold of 8
    
    const now = Date.now();
    
    console.log(`Volume: ${currentVolume.toFixed(2)}, Threshold: ${dynamicThreshold.toFixed(2)}`);
    
    if (currentVolume > dynamicThreshold) {
      // Speech detected
      this.consecutiveSpeechFrames++;
      this.consecutiveSilenceFrames = 0;
      
      // Trigger speech detection after just 2 consecutive frames for responsiveness
      if (this.consecutiveSpeechFrames >= 2 && !this.isSpeaking) {
        this.isSpeaking = true;
        this.onSpeechDetected();
        console.log(`Speech STARTED - Volume: ${currentVolume.toFixed(2)}`);
      }
      
      this.lastSpeechTime = now;
      
      // Clear any pending silence timeouts
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
        this.silenceTimeout = null;
      }
    } else {
      // Silence detected
      this.consecutiveSilenceFrames++;
      this.consecutiveSpeechFrames = 0;
      
      // End speech after consistent silence (reduced from 15 to 8 frames)
      if (this.isSpeaking && this.consecutiveSilenceFrames >= 8) {
        if (now - this.lastSpeechTime > 300) { // Reduced from 500ms to 300ms
          this.isSpeaking = false;
          this.onSpeechEnded();
          console.log(`Speech ENDED after ${now - this.lastSpeechTime}ms of silence`);
        }
      }
    }
    
    this.animationFrame = requestAnimationFrame(this.detectSound);
  };
}

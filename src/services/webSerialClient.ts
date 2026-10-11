import { ESPTelemetry } from '../types';

export class WebSerialClient {
  private port: any = null;
  private reader: any = null;
  private isReading: boolean = false;
  private lineBuffer: string = '';

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public async connect(
    onTelemetry: (data: ESPTelemetry) => void,
    onStatusChange: (connected: boolean) => void,
    threshold: number = 1800
  ): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Web Serial API is not supported in this browser. Please use Chrome or Edge.');
    }

    try {
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate: 115200 });
      this.isReading = true;
      onStatusChange(true);

      const textDecoder = new TextDecoderStream();
      this.port.readable.pipeTo(textDecoder.writable);
      this.reader = textDecoder.readable.getReader();

      this.readLoop(onTelemetry, threshold);
    } catch (err) {
      this.disconnect();
      onStatusChange(false);
      throw err;
    }
  }

  private async readLoop(
    onTelemetry: (data: ESPTelemetry) => void,
    currentThreshold: number
  ): Promise<void> {
    try {
      while (this.isReading && this.reader) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          this.lineBuffer += value;
          const lines = this.lineBuffer.split('\n');
          this.lineBuffer = lines.pop() || '';

          for (const line of lines) {
            const parsed = this.parseLine(line.trim(), currentThreshold);
            if (parsed) {
              onTelemetry(parsed);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Serial read loop ended:', err);
    } finally {
      this.isReading = false;
    }
  }

  private parseLine(line: string, threshold: number): ESPTelemetry | null {
    if (!line) return null;

    // Pattern 1: "Gas ADC Value: 514 | Pin Volts: 0.41V | Sensor Volts: 0.66V"
    const adcMatch = line.match(/(?:Gas ADC Value|adc)[:\s]+(\d+)/i);
    if (adcMatch) {
      const adc = parseInt(adcMatch[1], 10);
      const pinVMatch = line.match(/Pin Volts:\s*([\d.]+)V/i);
      const sensorVMatch = line.match(/Sensor Volts:\s*([\d.]+)V/i);

      const pinVoltage = pinVMatch ? parseFloat(pinVMatch[1]) : (adc / 4095) * 3.3;
      const sensorVoltage = sensorVMatch ? parseFloat(sensorVMatch[1]) : pinVoltage / 0.625;

      const isAlarm = adc >= threshold;

      return {
        adc,
        threshold,
        thresholdLow: Math.max(100, threshold - 150),
        alarm: isAlarm,
        ready: true,
        pinVoltage,
        sensorVoltage,
        green_led: !isAlarm,
        red_led: isAlarm,
        buzzer: isAlarm,
      };
    }

    // Pattern 2: Raw JSON from serial
    if (line.startsWith('{') && line.endsWith('}')) {
      try {
        const json = JSON.parse(line);
        if (typeof json.adc === 'number') {
          return {
            adc: json.adc,
            threshold: json.threshold || threshold,
            thresholdLow: json.thresholdLow || Math.max(100, threshold - 150),
            alarm: typeof json.alarm === 'boolean' ? json.alarm : json.adc >= threshold,
            ready: json.ready !== false,
            pinVoltage: json.pinVoltage,
            sensorVoltage: json.sensorVoltage,
            green_led: json.green_led,
            red_led: json.red_led,
            buzzer: json.buzzer,
          };
        }
      } catch {
        // Ignore non-json
      }
    }

    // Pattern 3: Simple raw integer output e.g. "514"
    if (/^\d{1,4}$/.test(line)) {
      const adc = parseInt(line, 10);
      const isAlarm = adc >= threshold;
      return {
        adc,
        threshold,
        alarm: isAlarm,
        ready: true,
        green_led: !isAlarm,
        red_led: isAlarm,
        buzzer: isAlarm,
      };
    }

    return null;
  }

  public async disconnect(): Promise<void> {
    this.isReading = false;
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader.releaseLock();
      }
      if (this.port) {
        await this.port.close();
      }
    } catch {
      // Ignore cleanup errors
    } finally {
      this.reader = null;
      this.port = null;
    }
  }
}

export const webSerialClient = new WebSerialClient();

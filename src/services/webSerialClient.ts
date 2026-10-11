import { ESPTelemetry } from '../types';

export class WebSerialClient {
  private port: any = null;
  private reader: any = null;
  private isReading: boolean = false;
  private lineBuffer: string = '';
  private onRawLineCallback: ((line: string) => void) | null = null;

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public setOnRawLine(callback: ((line: string) => void) | null) {
    this.onRawLineCallback = callback;
  }

  public async connect(
    onTelemetry: (data: ESPTelemetry) => void,
    onStatusChange: (connected: boolean) => void,
    threshold: number = 1800,
    onRawLine?: (line: string) => void
  ): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Web Serial API is not supported in this browser. Please use Chrome or Edge.');
    }

    if (onRawLine) {
      this.onRawLineCallback = onRawLine;
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
            const trimmed = line.trim();
            if (trimmed) {
              if (this.onRawLineCallback) {
                this.onRawLineCallback(trimmed);
              }
              const parsed = this.parseLine(trimmed, currentThreshold);
              if (parsed) {
                onTelemetry(parsed);
              }
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

  public parseLine(line: string, threshold: number): ESPTelemetry | null {
    if (!line) return null;
    const clean = line.trim();

    // Pattern 1: JSON Payload: {"adc": 516, ...}
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const json = JSON.parse(clean);
        if (typeof json.adc === 'number') {
          const adc = json.adc;
          const isAlarm = typeof json.alarm === 'boolean' ? json.alarm : adc >= threshold;
          return {
            adc,
            threshold: json.threshold || threshold,
            thresholdLow: json.thresholdLow || Math.max(100, threshold - 150),
            alarm: isAlarm,
            ready: json.ready !== false,
            pinVoltage: json.pinVoltage,
            sensorVoltage: json.sensorVoltage,
            green_led: json.green_led ?? !isAlarm,
            red_led: json.red_led ?? isAlarm,
            buzzer: json.buzzer ?? isAlarm,
          };
        }
      } catch {
        // ignore invalid json
      }
    }

    // Pattern 2: Universal regex matching ANY serial format:
    // "Gas ADC Value: 516 | Pin Volts: 0.41V | Sensor Volts: 0.66V"
    // "Gas ADC: 516 (0.42V) | Flame: Safe | Status: Normal"
    // "Gas Value: 516"
    // "Gas: 516"
    // "ADC: 516"
    // "MQ-2 ADC: 516"
    // "Raw ADC: 516"
    const adcMatch =
      clean.match(/(?:gas\s*(?:adc\s*)?(?:value)?|adc|raw|reading|sensor)[:\s=]+(\d+)/i) ||
      clean.match(/(?:gas|adc)[^\d]*(\d{1,4})/i);

    if (adcMatch) {
      const adc = parseInt(adcMatch[1], 10);
      if (!isNaN(adc) && adc >= 0 && adc <= 4095) {
        const pinVMatch =
          clean.match(/pin\s*volts?[:\s]*([\d.]+)v?/i) ||
          clean.match(/\(([\d.]+)v\)/i);
        const sensorVMatch = clean.match(/sensor\s*volts?[:\s]*([\d.]+)v?/i);

        const pinVoltage = pinVMatch
          ? parseFloat(pinVMatch[1])
          : Number(((adc / 4095) * 3.3).toFixed(2));
        const sensorVoltage = sensorVMatch
          ? parseFloat(sensorVMatch[1])
          : Number((pinVoltage / 0.625).toFixed(2));

        const isAlarm =
          clean.includes('WARNING') ||
          clean.includes('ALARM') ||
          clean.includes('HIGH') ||
          adc >= threshold;

        const isWarmup =
          clean.includes('WARM') ||
          clean.includes('Warming') ||
          clean.includes('Initializing');

        return {
          adc,
          threshold,
          thresholdLow: Math.max(100, threshold - 150),
          alarm: isAlarm,
          ready: !isWarmup,
          pinVoltage,
          sensorVoltage,
          green_led: !isAlarm && !isWarmup,
          red_led: isAlarm,
          buzzer: isAlarm,
        };
      }
    }

    // Pattern 3: Simple raw integer on a single line: "516"
    if (/^\d{1,4}$/.test(clean)) {
      const adc = parseInt(clean, 10);
      if (adc >= 0 && adc <= 4095) {
        const isAlarm = adc >= threshold;
        const pinVoltage = Number(((adc / 4095) * 3.3).toFixed(2));
        return {
          adc,
          threshold,
          thresholdLow: Math.max(100, threshold - 150),
          alarm: isAlarm,
          ready: true,
          pinVoltage,
          sensorVoltage: Number((pinVoltage / 0.625).toFixed(2)),
          green_led: !isAlarm,
          red_led: isAlarm,
          buzzer: isAlarm,
        };
      }
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

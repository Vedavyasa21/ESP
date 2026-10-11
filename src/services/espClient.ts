import { ESPTelemetry, InferredHardwareState } from '../types';

/**
 * Fetch telemetry from ESP32 /api endpoint.
 * Features:
 * - Cache busting parameter & no-store headers
 * - Timeout handling via AbortController
 * - Error reporting
 */
export async function fetchEspTelemetry(
  endpoint: string,
  timeoutMs: number = 2000
): Promise<ESPTelemetry> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Append cache buster
  const separator = endpoint.includes('?') ? '&' : '?';
  const urlWithCacheBuster = `${endpoint}${separator}_cb=${Date.now()}`;

  try {
    const response = await fetch(urlWithCacheBuster, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate expected structure
    if (typeof data.adc !== 'number' || typeof data.threshold !== 'number') {
      throw new Error('Invalid JSON format: missing numerical adc or threshold');
    }

    const adc = Math.round(data.adc);
    const threshold = Math.round(data.threshold);
    const pinVoltage = typeof data.pinVoltage === 'number'
      ? Number(data.pinVoltage.toFixed(2))
      : Number(((adc / 4095.0) * 3.3).toFixed(2));
    const sensorVoltage = typeof data.sensorVoltage === 'number'
      ? Number(data.sensorVoltage.toFixed(2))
      : Number((pinVoltage / 0.625).toFixed(2));

    return {
      adc,
      threshold,
      thresholdLow: typeof data.thresholdLow === 'number' ? Math.round(data.thresholdLow) : 1650,
      pinVoltage,
      sensorVoltage,
      alarm: Boolean(data.alarm),
      ready: Boolean(data.ready),
      green_led: data.green_led !== undefined ? Boolean(data.green_led) : undefined,
      red_led: data.red_led !== undefined ? Boolean(data.red_led) : undefined,
      buzzer: data.buzzer !== undefined ? Boolean(data.buzzer) : undefined,
      uptime: typeof data.uptime === 'number' ? data.uptime : undefined,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Derives hardware states (Green LED, Red LED, Buzzer).
 * Per the integration requirements:
 * The firmware only returns: adc, threshold, alarm, ready.
 * If direct pins are reported in telemetry (future firmware), we use them.
 * Otherwise, we accurately infer them from documented firmware logic and explicitly
 * flag them as inferred.
 */
export function deriveHardwareStates(
  telemetry: ESPTelemetry | null,
  isOnline: boolean
): InferredHardwareState {
  if (!isOnline || !telemetry) {
    return {
      greenLed: {
        active: false,
        isInferred: true,
        note: 'Device offline',
      },
      redLed: {
        active: false,
        isInferred: true,
        note: 'Device offline',
      },
      buzzer: {
        active: false,
        isInferred: true,
        note: 'Device offline',
      },
    };
  }

  // If future firmware reports explicit hardware pins:
  const hasDirectGreen = telemetry.green_led !== undefined;
  const hasDirectRed = telemetry.red_led !== undefined;
  const hasDirectBuzzer = telemetry.buzzer !== undefined;

  const greenActive = hasDirectGreen
    ? Boolean(telemetry.green_led)
    : telemetry.ready && !telemetry.alarm;

  const redActive = hasDirectRed
    ? Boolean(telemetry.red_led)
    : telemetry.alarm;

  const buzzerActive = hasDirectBuzzer
    ? Boolean(telemetry.buzzer)
    : telemetry.alarm;

  return {
    greenLed: {
      active: greenActive,
      isInferred: !hasDirectGreen,
      note: hasDirectGreen ? 'Direct GPIO 18 report' : 'Inferred: Active when ready & no alarm',
    },
    redLed: {
      active: redActive,
      isInferred: !hasDirectRed,
      note: hasDirectRed ? 'Direct GPIO 19 report' : 'Inferred: Active when threshold breached',
    },
    buzzer: {
      active: buzzerActive,
      isInferred: !hasDirectBuzzer,
      note: hasDirectBuzzer ? 'Direct GPIO 23 report' : 'Inferred: Active during alarm condition',
    },
  };
}

/**
 * Realistic Simulation Engine for preview and UI validation
 * Allows testing the app safely without an active ESP32 or flammable gas.
 */
class SimulationEngine {
  private baseline = 1248;
  private currentAdc = 1248;
  private threshold = 1800;
  private isWarmingUp = false;
  private spikeActiveUntil = 0;

  public triggerGasSpike(durationMs: number = 9000): void {
    this.spikeActiveUntil = Date.now() + durationMs;
  }

  public setWarmUp(warming: boolean): void {
    this.isWarmingUp = warming;
  }

  public getTelemetry(): ESPTelemetry {
    const now = Date.now();
    const isSpike = now < this.spikeActiveUntil;

    if (isSpike) {
      // Simulate elevated gas detection (2000 - 2450)
      const target = 2250 + Math.sin(now / 500) * 150;
      this.currentAdc = Math.round(this.currentAdc * 0.7 + target * 0.3);
    } else {
      // Return to normal baseline with subtle sensor jitter (+- 15)
      const jitter = (Math.random() - 0.5) * 28;
      const target = this.baseline + jitter;
      this.currentAdc = Math.round(this.currentAdc * 0.85 + target * 0.15);
    }

    const finalAdc = Math.max(0, Math.min(4095, this.currentAdc));
    const alarm = !this.isWarmingUp && finalAdc >= this.threshold;
    const pinVoltage = Number(((finalAdc / 4095.0) * 3.3).toFixed(2));
    const sensorVoltage = Number((pinVoltage / 0.625).toFixed(2));

    return {
      adc: finalAdc,
      threshold: this.threshold,
      thresholdLow: 1650,
      pinVoltage,
      sensorVoltage,
      alarm,
      ready: !this.isWarmingUp,
    };
  }
}

export const simulator = new SimulationEngine();

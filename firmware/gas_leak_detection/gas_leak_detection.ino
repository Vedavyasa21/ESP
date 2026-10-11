#include <Arduino.h>

// =============================================================================
//  AERIS · INDUSTRIAL ESP32 GAS & SMOKE DETECTION NODE
// =============================================================================
//  Hardware Pinout:
//  - MQ-2 Analog AO   : GPIO 34 (via 12k/20k Divider, 0.625x attenuation)
//  - Safe LED (Blue/Green) : GPIO 18 (via 220 Ohm resistor)
//  - Alert LED (Red)  : GPIO 19 (via 220 Ohm resistor)
//  - Active Buzzer    : GPIO 23 (via 2N2222 NPN Transistor & 1k Base Resistor)
// =============================================================================

// PIN ASSIGNMENTS
#define MQ2_PIN   34
#define BLUE_LED  18   // Safe Indicator (Steady ON = Safe, Blinking = Warmup)
#define RED_LED   19   // Alert Indicator (Strobes on Alarm)
#define BUZZER    23   // 5V Active Siren (Driven via 2N2222 NPN)

// THRESHOLDS WITH HYSTERESIS
const int GAS_THRESHOLD_HIGH = 1800; // Trip alarm when ADC >= 1800
const int GAS_THRESHOLD_LOW  = 1650; // Clear alarm when ADC < 1650 (prevents chattering)

// TIMING CONSTANTS (Milliseconds)
const unsigned long WARMUP_TIME_MS      = 30000; // 30-second initial heater stabilization
const unsigned long SENSOR_INTERVAL_MS  = 100;   // Read sensor every 100ms
const unsigned long PRINT_INTERVAL_MS   = 1000;  // Telemetry print every 1000ms
const unsigned long ALARM_PULSE_MS      = 200;   // Rapid 200ms strobe/siren pulse during alarm
const unsigned long WARMUP_BLINK_MS     = 500;   // 500ms slow pulse during warmup

// SYSTEM STATE VARIABLES
int   rawADC            = 0;
float pinVoltage        = 0.0;
float sensorVoltage     = 0.0;
bool  isAlarmActive     = false;
bool  isSystemReady     = false;
bool  alarmPulseState   = false;
bool  warmupBlinkState  = false;

unsigned long systemStartTime  = 0;
unsigned long lastSensorRead   = 0;
unsigned long lastSerialPrint  = 0;
unsigned long lastAlarmPulse   = 0;
unsigned long lastWarmupBlink  = 0;

// =============================================================================
// OVERSAMPLED ADC FILTER
// =============================================================================
int readGasSensor() {
  long sum = 0;
  // Average 16 rapid samples for electrical noise suppression
  for (int i = 0; i < 16; i++) {
    sum += analogRead(MQ2_PIN);
    delayMicroseconds(250);
  }
  return (int)(sum / 16);
}

// =============================================================================
// SETUP
// =============================================================================
void setup() {
  Serial.begin(115200);

  // Initialize GPIO Modes
  pinMode(MQ2_PIN, INPUT);
  pinMode(BLUE_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  // Force all outputs OFF at boot
  digitalWrite(BLUE_LED, LOW);
  digitalWrite(RED_LED, LOW);
  digitalWrite(BUZZER, LOW);

  // Configure ESP32 12-Bit ADC (0–4095) with Full 3.3V Attenuation
  analogReadResolution(12);
  analogSetPinAttenuation(MQ2_PIN, ADC_11db);

  systemStartTime = millis();

  Serial.println();
  Serial.println("==================================================");
  Serial.println("     ESP32 INDUSTRIAL GAS & SMOKE DETECTOR        ");
  Serial.println("==================================================");
  Serial.println(" Pin Config: MQ-2(GPIO34) | SAFE(GPIO18) | RED(GPIO19) | BUZZER(GPIO23)");
  Serial.print(" Threshold : HIGH TRIP = ");
  Serial.print(GAS_THRESHOLD_HIGH);
  Serial.print(" | LOW CLEAR = ");
  Serial.println(GAS_THRESHOLD_LOW);
  Serial.println(" Status     : Sensor warming up (30 seconds)...");
  Serial.println("--------------------------------------------------");
}

// =============================================================================
// MAIN LOOP
// =============================================================================
void loop() {
  unsigned long now = millis();

  // 1. Check Warm-Up Readiness
  if (!isSystemReady) {
    if (now - systemStartTime >= WARMUP_TIME_MS) {
      isSystemReady = true;
      Serial.println("\n>>> [SYSTEM READY] Sensor burn-in complete. Monitoring active! <<<\n");
    }
  }

  // 2. Periodic Sensor Sampling
  if (now - lastSensorRead >= SENSOR_INTERVAL_MS) {
    lastSensorRead = now;

    rawADC = readGasSensor();
    pinVoltage = (rawADC / 4095.0f) * 3.3f;
    sensorVoltage = pinVoltage / 0.625f; // Reconstruct MQ-2 voltage from 12k/20k divider

    // Alarm Hysteresis Decision (Only trip once warmed up)
    if (isSystemReady) {
      if (!isAlarmActive && rawADC >= GAS_THRESHOLD_HIGH) {
        isAlarmActive = true;
      } else if (isAlarmActive && rawADC < GAS_THRESHOLD_LOW) {
        isAlarmActive = false;
      }
    }
  }

  // 3. Actuator & Visual Indication Engine
  if (!isSystemReady) {
    // -----------------------------------------------------------------
    // STATE A: WARM-UP (Slow Breathing / Blink on Safe LED, Siren OFF)
    // -----------------------------------------------------------------
    if (now - lastWarmupBlink >= WARMUP_BLINK_MS) {
      lastWarmupBlink = now;
      warmupBlinkState = !warmupBlinkState;
      digitalWrite(BLUE_LED, warmupBlinkState ? HIGH : LOW);
    }
    digitalWrite(RED_LED, LOW);
    digitalWrite(BUZZER, LOW);

  } else if (isAlarmActive) {
    // -----------------------------------------------------------------
    // STATE B: HIGH GAS ALARM (Synchronized Red Strobe + Pulsing Siren)
    // -----------------------------------------------------------------
    digitalWrite(BLUE_LED, LOW); // Safe LED OFF

    if (now - lastAlarmPulse >= ALARM_PULSE_MS) {
      lastAlarmPulse = now;
      alarmPulseState = !alarmPulseState;

      // Both Red LED and Buzzer pulse together for an unmistakable siren
      digitalWrite(RED_LED, alarmPulseState ? HIGH : LOW);
      digitalWrite(BUZZER,  alarmPulseState ? HIGH : LOW);
    }

  } else {
    // -----------------------------------------------------------------
    // STATE C: NORMAL / SAFE (Solid Steady Blue/Green LED, Siren OFF)
    // -----------------------------------------------------------------
    digitalWrite(BLUE_LED, HIGH); // Solid ON: Indicates System Healthy
    digitalWrite(RED_LED, LOW);
    digitalWrite(BUZZER, LOW);
  }

  // 4. Periodic Telemetry Output (Every 1000ms)
  if (now - lastSerialPrint >= PRINT_INTERVAL_MS) {
    lastSerialPrint = now;

    if (!isSystemReady) {
      int remainingSec = (int)((WARMUP_TIME_MS - (now - systemStartTime)) / 1000);
      Serial.print("[WARMUP] Stabilizing... ");
      Serial.print(remainingSec);
      Serial.print("s remaining | Current ADC: ");
      Serial.print(rawADC);
      Serial.print(" | Sensor: ");
      Serial.print(sensorVoltage, 2);
      Serial.println("V");
    } else {
      if (isAlarmActive) {
        Serial.print("[🚨 ALARM] GAS DETECTED! ADC: ");
        Serial.print(rawADC);
        Serial.print(" / 4095 | Pin: ");
        Serial.print(pinVoltage, 2);
        Serial.print("V | Sensor AO: ");
        Serial.print(sensorVoltage, 2);
        Serial.println("V | SIREN: PULSING | RED: FLASHING");
      } else {
        Serial.print("[NORMAL] Gas Safe. ADC: ");
        Serial.print(rawADC);
        Serial.print(" / 4095 | Pin: ");
        Serial.print(pinVoltage, 2);
        Serial.print("V | Sensor AO: ");
        Serial.print(sensorVoltage, 2);
        Serial.println("V | STATUS: ALL CLEAR");
      }
    }
  }
}

#define MQ2_PIN 34
#define GREEN_LED 18
#define RED_LED 19
#define BUZZER 23

// Example threshold: adjust after calibration
int gasThreshold = 1800;

int readGas() {
  long total = 0;

  // Average 20 ADC measurements
  for (int i = 0; i < 20; i++) {
    total += analogRead(MQ2_PIN);
    delay(10);
  }

  return total / 20;
}

void setup() {
  Serial.begin(115200);

  pinMode(MQ2_PIN, INPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, LOW);
  digitalWrite(BUZZER, LOW);

  analogReadResolution(12);
  analogSetPinAttenuation(MQ2_PIN, ADC_11db);

  Serial.println("================================");
  Serial.println("ESP32 GAS LEAKAGE DETECTION");
  Serial.println("MQ-2 Sensor Monitoring System");
  Serial.println("================================");

  Serial.println("Sensor warming up...");
  delay(30000);  // Initial 30-second startup delay
  Serial.println("Monitoring started!");
}

void loop() {
  int gasValue = readGas();

  Serial.print("Gas ADC Value: ");
  Serial.println(gasValue);

  if (gasValue >= gasThreshold) {
    digitalWrite(RED_LED, HIGH);
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(BUZZER, HIGH);

    Serial.println("WARNING! HIGH GAS READING!");
  }
  else {
    digitalWrite(RED_LED, LOW);
    digitalWrite(GREEN_LED, HIGH);
    digitalWrite(BUZZER, LOW);

    Serial.println("Gas reading below threshold");
  }

  Serial.println("----------------------------");
  delay(1000);
}

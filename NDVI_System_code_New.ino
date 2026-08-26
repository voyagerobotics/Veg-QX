#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "Adafruit_AS7341.h"

// =====================================================
// OLED
// =====================================================

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

Adafruit_SSD1306 display(
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  &Wire,
  -1
);

// =====================================================
// AS7341
// =====================================================

Adafruit_AS7341 as7341;

// =====================================================
// LED PINS
// =====================================================

#define RED_LED_PIN      13
#define IR_LED_PIN       14

// IMPORTANT:
// GPIO35 is INPUT ONLY.
// Blue LED must NOT be connected to GPIO35.
//
// Connect Blue LED to GPIO16 instead.
#define BLUE_LED_PIN     12

#define GREEN_LED_PIN    32
#define YELLOW_LED_PIN   33
#define ORANGE_LED_PIN   25

// =====================================================
// IR OBJECT DETECTION SENSOR
// =====================================================

#define IR_SENSOR_OUT    27
#define IR_SENSOR_POWER  26

// =====================================================
// PUSH BUTTON
// Button connected between GPIO4 and GND
// =====================================================

#define BUTTON_PIN       4

// =====================================================
// MEASUREMENT SETTINGS
// =====================================================

#define NUM_SAMPLES      5

#define LED_STABILIZE_MS 120
#define BETWEEN_LED_MS   50
#define BETWEEN_SAMPLE_MS 150

// =====================================================
// VARIABLES
// =====================================================

bool waitingScreenShown = false;


// =====================================================
// FUNCTION DECLARATIONS
// =====================================================

void showWaitingScreen();
void showDetectedScreen();
void showMeasuringScreen(int sampleNumber);

void allLEDsOff();

bool readSensor();

void measureAndDisplayAverage();


// =====================================================
// SETUP
// =====================================================

void setup() {

  Serial.begin(115200);

  // AS7341 + OLED I2C
  Wire.begin(21, 22);

  // -------------------------------------------------
  // LED OUTPUTS
  // -------------------------------------------------

  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(IR_LED_PIN, OUTPUT);

  pinMode(BLUE_LED_PIN, OUTPUT);
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(YELLOW_LED_PIN, OUTPUT);
  pinMode(ORANGE_LED_PIN, OUTPUT);

  allLEDsOff();

  // -------------------------------------------------
  // IR OBJECT SENSOR
  // -------------------------------------------------

  pinMode(IR_SENSOR_OUT, INPUT);

  pinMode(IR_SENSOR_POWER, OUTPUT);
  digitalWrite(IR_SENSOR_POWER, HIGH);

  // -------------------------------------------------
  // PUSH BUTTON
  // -------------------------------------------------

  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // -------------------------------------------------
  // OLED
  // -------------------------------------------------

  if (!display.begin(
        SSD1306_SWITCHCAPVCC,
        0x3C
      )) {

    Serial.println("OLED not found!");

    while (1);
  }

  display.clearDisplay();
  display.setTextColor(WHITE);
  display.setTextSize(1);

  // -------------------------------------------------
  // AS7341
  // -------------------------------------------------

  if (!as7341.begin()) {

    Serial.println(
      "AS7341 not detected! Check wiring."
    );

    while (1);
  }

  Serial.println();
  Serial.println("================================");
  Serial.println("        VegQX SYSTEM READY");
  Serial.println("================================");
  Serial.println("Blue  : GPIO12");
  Serial.println("Green : GPIO32");
  Serial.println("Yellow: GPIO33");
  Serial.println("Orange: GPIO25");
  Serial.println("Red   : GPIO13");
  Serial.println("IR    : GPIO14");
  Serial.println("================================");

  showWaitingScreen();
}


// =====================================================
// MAIN LOOP
// =====================================================

void loop() {

  int sensorState =
    digitalRead(IR_SENSOR_OUT);

  // -------------------------------------------------
  // OBJECT DETECTED
  // -------------------------------------------------

  if (sensorState == LOW) {

    Serial.println();
    Serial.println(
      "Object detected."
    );

    showDetectedScreen();

    waitingScreenShown = false;

    // ------------------------------------------------
    // WAIT FOR PUSH BUTTON
    // ------------------------------------------------

    while (digitalRead(BUTTON_PIN) == HIGH) {

      delay(20);

      // Object removed before measurement
      if (digitalRead(IR_SENSOR_OUT) == HIGH) {

        showWaitingScreen();

        return;
      }
    }

    // ------------------------------------------------
    // BUTTON DEBOUNCE
    // ------------------------------------------------

    delay(100);

    while (digitalRead(BUTTON_PIN) == LOW) {
      delay(10);
    }

    // ------------------------------------------------
    // TURN OFF OBJECT SENSOR
    // ------------------------------------------------

    digitalWrite(
      IR_SENSOR_POWER,
      LOW
    );

    delay(100);

    // ------------------------------------------------
    // START MEASUREMENT
    // ------------------------------------------------

    measureAndDisplayAverage();

    // ------------------------------------------------
    // TURN OBJECT SENSOR BACK ON
    // ------------------------------------------------

    digitalWrite(
      IR_SENSOR_POWER,
      HIGH
    );

    delay(300);

    // ------------------------------------------------
    // WAIT FOR OBJECT REMOVAL
    // ------------------------------------------------

    Serial.println(
      "Waiting for object removal..."
    );

    while (
      digitalRead(IR_SENSOR_OUT) == LOW
    ) {

      delay(50);
    }

    Serial.println(
      "Object removed."
    );
  }

  // -------------------------------------------------
  // NO OBJECT
  // -------------------------------------------------

  else {

    if (!waitingScreenShown) {

      showWaitingScreen();

      waitingScreenShown = true;
    }
  }

  delay(50);
}


// =====================================================
// TURN OFF ALL LEDs
// =====================================================

void allLEDsOff() {

  digitalWrite(
    RED_LED_PIN,
    LOW
  );

  digitalWrite(
    IR_LED_PIN,
    LOW
  );

  digitalWrite(
    BLUE_LED_PIN,
    LOW
  );

  digitalWrite(
    GREEN_LED_PIN,
    LOW
  );

  digitalWrite(
    YELLOW_LED_PIN,
    LOW
  );

  digitalWrite(
    ORANGE_LED_PIN,
    LOW
  );
}


// =====================================================
// WAITING SCREEN
// =====================================================

void showWaitingScreen() {

  display.clearDisplay();

  display.setTextSize(1);

  display.setCursor(10, 20);

  display.println(
    "Place Fruit / Veg"
  );

  display.setCursor(0, 40);

  display.println(
    "Waiting for Object..."
  );

  display.display();
}


// =====================================================
// OBJECT DETECTED SCREEN
// =====================================================

void showDetectedScreen() {

  display.clearDisplay();

  display.setTextSize(1);

  display.setCursor(20, 15);

  display.println(
    "Object Detected"
  );

  display.setCursor(1, 35);

  display.println(
    "Press Button to Start"
  );

  display.display();
}


// =====================================================
// MEASURING SCREEN
// =====================================================

void showMeasuringScreen(
  int sampleNumber
) {

  display.clearDisplay();

  display.setTextSize(1);

  display.setCursor(10, 10);

  display.println(
    "VegQX Measuring..."
  );

  display.setCursor(10, 30);

  display.print(
    "Sample: "
  );

  display.print(
    sampleNumber
  );

  display.print(
    "/"
  );

  display.println(
    NUM_SAMPLES
  );

  display.display();
}


// =====================================================
// READ AS7341
// =====================================================

bool readSensor() {

  return as7341.readAllChannels();
}


// =====================================================
// MEASURE 5 TIMES
// =====================================================

void measureAndDisplayAverage() {

  float ndviSum = 0.0;

  // Arrays for storing five readings

  uint16_t redValues[NUM_SAMPLES];
  uint16_t nirValues[NUM_SAMPLES];

  uint16_t blueValues[NUM_SAMPLES];
  uint16_t greenValues[NUM_SAMPLES];
  uint16_t yellowValues[NUM_SAMPLES];
  uint16_t orangeValues[NUM_SAMPLES];

  float ndviValues[NUM_SAMPLES];

  // =================================================
  // FIVE MEASUREMENTS
  // =================================================

  for (
    int sample = 0;
    sample < NUM_SAMPLES;
    sample++
  ) {

    showMeasuringScreen(
      sample + 1
    );

    Serial.println();
    Serial.print(
      "===== SAMPLE "
    );

    Serial.print(
      sample + 1
    );

    Serial.println(
      " ====="
    );

    // -----------------------------------------------
    // BLUE LED
    // -----------------------------------------------

    allLEDsOff();

    digitalWrite(
      BLUE_LED_PIN,
      HIGH
    );

    delay(
      LED_STABILIZE_MS
    );

    uint16_t blue = 0;

    if (readSensor()) {

      blue =
        as7341.getChannel(
          AS7341_CHANNEL_445nm_F2
        );
    }

    digitalWrite(
      BLUE_LED_PIN,
      LOW
    );

    delay(
      BETWEEN_LED_MS
    );


    // -----------------------------------------------
    // GREEN LED
    // -----------------------------------------------

    allLEDsOff();

    digitalWrite(
      GREEN_LED_PIN,
      HIGH
    );

    delay(
      LED_STABILIZE_MS
    );

    uint16_t green = 0;

    if (readSensor()) {

      green =
        as7341.getChannel(
          AS7341_CHANNEL_515nm_F4
        );
    }

    digitalWrite(
      GREEN_LED_PIN,
      LOW
    );

    delay(
      BETWEEN_LED_MS
    );


    // -----------------------------------------------
    // YELLOW LED
    // -----------------------------------------------

    allLEDsOff();

    digitalWrite(
      YELLOW_LED_PIN,
      HIGH
    );

    delay(
      LED_STABILIZE_MS
    );

    uint16_t yellow = 0;

    if (readSensor()) {

      yellow =
        as7341.getChannel(
          AS7341_CHANNEL_590nm_F6
        );
    }

    digitalWrite(
      YELLOW_LED_PIN,
      LOW
    );

    delay(
      BETWEEN_LED_MS
    );


    // -----------------------------------------------
    // ORANGE LED
    // -----------------------------------------------

    allLEDsOff();

    digitalWrite(
      ORANGE_LED_PIN,
      HIGH
    );

    delay(
      LED_STABILIZE_MS
    );

    uint16_t orange = 0;

    if (readSensor()) {

      orange =
        as7341.getChannel(
          AS7341_CHANNEL_630nm_F7
        );
    }

    digitalWrite(
      ORANGE_LED_PIN,
      LOW
    );

    delay(
      BETWEEN_LED_MS
    );


    // -----------------------------------------------
    // RED LED
    // -----------------------------------------------

    allLEDsOff();

    digitalWrite(
      RED_LED_PIN,
      HIGH
    );

    delay(
      LED_STABILIZE_MS
    );

    uint16_t red = 0;

    if (readSensor()) {

      red =
        as7341.getChannel(
          AS7341_CHANNEL_680nm_F8
        );
    }

    digitalWrite(
      RED_LED_PIN,
      LOW
    );

    delay(
      BETWEEN_LED_MS
    );


    // -----------------------------------------------
    // IR LED
    // -----------------------------------------------

    allLEDsOff();

    digitalWrite(
      IR_LED_PIN,
      HIGH
    );

    delay(
      LED_STABILIZE_MS
    );

    uint16_t nir = 0;

    if (readSensor()) {

      nir =
        as7341.getChannel(
          AS7341_CHANNEL_NIR
        );
    }

    digitalWrite(
      IR_LED_PIN,
      LOW
    );

    // -----------------------------------------------
    // CALCULATE NDVI
    // -----------------------------------------------

    float ndvi = 0.0;

    if ((nir + red) > 0) {

      ndvi =
        ((float)nir - (float)red)
        /
        ((float)nir + (float)red);
    }

    // Store values

    redValues[sample] = red;
    nirValues[sample] = nir;

    blueValues[sample] = blue;
    greenValues[sample] = green;
    yellowValues[sample] = yellow;
    orangeValues[sample] = orange;

    ndviValues[sample] = ndvi;

    ndviSum += ndvi;

    // -----------------------------------------------
    // SERIAL OUTPUT
    // -----------------------------------------------

    Serial.print("BLUE=");
    Serial.print(blue);

    Serial.print(" | GREEN=");
    Serial.print(green);

    Serial.print(" | YELLOW=");
    Serial.print(yellow);

    Serial.print(" | ORANGE=");
    Serial.print(orange);

    Serial.print(" | RED=");
    Serial.print(red);

    Serial.print(" | NIR=");
    Serial.print(nir);

    Serial.print(" | NDVI=");
    Serial.println(
      ndvi,
      4
    );

    delay(
      BETWEEN_SAMPLE_MS
    );
  }


  // =================================================
  // CALCULATE AVERAGE
  // =================================================

  float avgNDVI =
    ndviSum / NUM_SAMPLES;


  // =================================================
  // PRINT COMPLETE DATA
  // =================================================

  Serial.println();
  Serial.println(
    "================================"
  );

  Serial.println(
    "        VEGQX RESULT"
  );

  Serial.println(
    "================================"
  );

  for (
    int i = 0;
    i < NUM_SAMPLES;
    i++
  ) {

    Serial.print(
      "Sample "
    );

    Serial.print(
      i + 1
    );

    Serial.print(
      " -> "
    );

    Serial.print(
      "BLUE="
    );

    Serial.print(
      blueValues[i]
    );

    Serial.print(
      ", GREEN="
    );

    Serial.print(
      greenValues[i]
    );

    Serial.print(
      ", YELLOW="
    );

    Serial.print(
      yellowValues[i]
    );

    Serial.print(
      ", ORANGE="
    );

    Serial.print(
      orangeValues[i]
    );

    Serial.print(
      ", RED="
    );

    Serial.print(
      redValues[i]
    );

    Serial.print(
      ", NIR="
    );

    Serial.print(
      nirValues[i]
    );

    Serial.print(
      ", NDVI="
    );

    Serial.println(
      ndviValues[i],
      4
    );
  }


  Serial.println();

  Serial.print(
    "AVERAGE NDVI="
  );

  Serial.println(
    avgNDVI,
    4
  );

  Serial.println(
    "================================"
  );


  // =================================================
  // OLED RESULT
  // =================================================

  display.clearDisplay();

  display.setTextSize(1);

  display.setCursor(0, 0);

  display.println(
    "VegQX Result"
  );

  display.setCursor(0, 15);

  display.setTextSize(2);

  display.print(
    "NDVI:"
  );

  display.setCursor(60, 15);

  display.println(
    avgNDVI,
    2
  );

  display.setTextSize(1);

  display.setCursor(0, 45);


  if (avgNDVI > 0.8) {

    display.println(
      "Status: High NDVI"
    );

  }

  else if (avgNDVI > 0.4) {

    display.println(
      "Status: Moderate NDVI"
    );

  }

  else {

    display.println(
      "Status: Low NDVI"
    );
  }

  display.display();
}
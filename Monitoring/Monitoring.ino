#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include "Adafruit_BME680.h"

#include "config.h"

#define SEALEVELPRESSURE_HPA (1013.25)

// Sensor
Adafruit_BME680 bme; // I2C

// Sensor Data
long previousMillis;
DynamicJsonDocument payload(200);
int scanrate = 10000; // send every ten seconds

// Wifi & MQTT Client
void callback(char*, byte*, unsigned int);
WiFiClientSecure wifiClient;
//WiFiClient wifiClient;
PubSubClient client(SERVER, SERVERPORT, callback, wifiClient);

void checkSSL(){
  // Make a HTTP request:
  wifiClient.connect("www.howsmyssl.com", 443);
  wifiClient.println("GET https://www.howsmyssl.com/a/check HTTP/1.0");
  wifiClient.println("Host: www.howsmyssl.com");
  wifiClient.println("Connection: close");
  wifiClient.println();

  while (wifiClient.connected()) {
    String line = wifiClient.readStringUntil('\n');
    if (line == "\r") {
      Serial.println("headers received");
      break;
    }
  }
  // if there are incoming bytes available
  // from the server, read them and print them:
  while (wifiClient.available()) {
    char c = wifiClient.read();
    Serial.write(c);
  }

  Serial.println();
  wifiClient.stop();
}

void setupPins(){
  pinMode(WIFIPIN, OUTPUT);
  pinMode(MQTTPIN, OUTPUT);
  digitalWrite(WIFIPIN, LOW);
  digitalWrite(MQTTPIN, LOW);
}

void setupWifi(){
  // Connect to Wifi
  wifiClient.setCACert(ca);


  WiFi.mode(WIFI_STA);
  WiFi.begin(AP_SSID, PASSWORD);
  Serial.println();
  Serial.print("Waiting for WiFi Connection ...");
  while (WiFi.status() != WL_CONNECTED)
  {
    Serial.print(".");
    delay(500);
  }
  Serial.println("");
  Serial.println("WiFi Connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  //checkSSL();
  digitalWrite(WIFIPIN, HIGH);
}

void setupMqtt(){
  // Connect to MQTT broker
  if (client.connect(CLIENT, USERNAME, KEY)) {
    Serial.println("Connected to MQTT broker!");
    client.publish("test", "hello world");
    client.subscribe(CLIENT);
    digitalWrite(MQTTPIN, HIGH);

  } else {
    Serial.print(F("ERROR: Could not connect to MQTT broker! Rc="));
    Serial.println(client.state());
  }
}

void setupBme(){
   // Set up oversampling and filter initialization
  bme.setTemperatureOversampling(BME680_OS_8X);
  bme.setHumidityOversampling(BME680_OS_2X);
  bme.setPressureOversampling(BME680_OS_4X);
  bme.setIIRFilterSize(BME680_FILTER_SIZE_3);
  bme.setGasHeater(320, 150); // 320*C for 150 ms
  Serial.println("BME Setup Complete");
}

void setup() {
  Serial.begin(115200);
  setupPins();

  if (!bme.begin()) {
    Serial.println(F("Could not find valid BME68X sensor!"));
    return;
  }

  setupWifi();
  setupMqtt();
  setupBme();

}

void callback(char* topic, byte* payload, unsigned int length) {
  // Handle message arrived
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i=0;i<length;i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}

void loop() {
  client.loop();
  checkSensors();
  yield();
}

void checkSensors() {
  bool timeToCheck = (millis() - previousMillis) > scanrate;
  if (timeToCheck) {
    if (! bme.performReading()) {
      Serial.println("Failed to perform reading :(");
      return;
    }
    payload["pressure"] = bme.pressure / 100.0;
    payload["gasResistance"] = bme.gas_resistance / 1000.0;
    payload["temperature"] = bme.temperature;
    payload["humidity"] = bme.humidity;

    String payloadString;
    serializeJson(payload, payloadString);
    Serial.println(payloadString);

    client.publish("test", payloadString.c_str());
    previousMillis = millis();
  }
}

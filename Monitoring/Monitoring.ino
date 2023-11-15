#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include "Adafruit_BME680.h"

#include "secrets.h"

#define SEALEVELPRESSURE_HPA (1013.25)
#define AWS_IOT_PUBLISH_TOPIC   "esp32/pub"
#define AWS_IOT_SUBSCRIBE_TOPIC "esp32/sub"

// Sensor
Adafruit_BME680 bme; // I2C

// Sensor Data
long previousMillis;
DynamicJsonDocument payload(200);
int scanrate = 10000; // send every ten seconds

// Wifi & MQTT Client
void callback(char*, byte*, unsigned int);
WiFiClientSecure wifiClient;
PubSubClient client(wifiClient);
const bool useEnterprise = 1;

void setupPins(){
  pinMode(WIFIPIN, OUTPUT);
  pinMode(MQTTPIN, OUTPUT);
  digitalWrite(WIFIPIN, LOW);
  digitalWrite(MQTTPIN, LOW);
}

void setupWifi(){
  // Connect to Wifi
  wifiClient.setCACert(AWS_CERT_CA);
  wifiClient.setCertificate(AWS_CERT_CRT);
  wifiClient.setPrivateKey(AWS_CERT_PRIVATE);
  
  WiFi.mode(WIFI_STA);

  if (useEnterprise) {
    WiFi.begin(AP_SSID_E, WPA2_AUTH_PEAP, ID_E, USERNAME_E, PASSWORD_E);
  } else {
    WiFi.begin(AP_SSID, PASSWORD);
  }
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
  digitalWrite(WIFIPIN, HIGH);
}

void messageHandler(char*, byte*, unsigned int);

void setupMqtt(){
  // Connect to MQTT broker
  client.setServer(AWS_IOT_ENDPOINT, 8883);
  client.setCallback(messageHandler);

  while (!client.connect(THINGNAME))
  {
    Serial.print(".");
    delay(100);
  }
 
  if (!client.connected())
  {
    Serial.println("AWS IoT Timeout!");
    Serial.println(client.state());
    return;
  } else {
    digitalWrite(MQTTPIN, HIGH);
  }
 
  // Subscribe to a topic
  client.subscribe(AWS_IOT_SUBSCRIBE_TOPIC);
  Serial.println("AWS IoT Connected!");

  // send hello message
  StaticJsonDocument<200> doc;
  doc["status"] = "OK";
  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);
  client.publish(AWS_IOT_PUBLISH_TOPIC, jsonBuffer);

}

void messageHandler(char* topic, byte* payload, unsigned int length)
{
  Serial.print("incoming: ");
  Serial.println(topic);
 
  StaticJsonDocument<200> doc;
  deserializeJson(doc, payload);
  const char* message = doc["message"];
  Serial.println(message);
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

    client.publish(AWS_IOT_PUBLISH_TOPIC, payloadString.c_str());
    previousMillis = millis();
  }
}

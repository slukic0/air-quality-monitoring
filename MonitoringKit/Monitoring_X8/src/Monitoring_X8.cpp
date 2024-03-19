/**
 * Copyright (C) 2021 Bosch Sensortec GmbH
 *
 * SPDX-License-Identifier: BSD-3-Clause
 *
 */

/* The new sensor needs to be conditioned before the example can work reliably. You may run this
 * example for 24hrs to let the sensor stabilize.
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <StreamUtils.h>

#include <bsec2.h> // PlatformIO registry for BSEC2 is out of date; this will have to be added manually
#include "commMux.h"

#include <vector>

#include "secrets.h"


String AWS_IOT_DATA_PUBLISH_TOPIC = "";
#define AWS_IOT_DATA_SUBSCRIBE_TOPIC "esp32/sub"

// Use "/data" as default
#ifndef AWS_TOPIC_SUFFIX
#define AWS_TOPIC_SUFFIX "/data"
#endif

/* Macros used */
/* Number of sensors to operate*/
#define NUM_OF_SENS    8
#define PANIC_LED   LED_BUILTIN
#define ERROR_DUR   1000

/* Helper functions declarations */
/**
 * @brief : This function toggles the led when a fault was detected
 */
void errLeds(void);

/**
 * @brief : This function checks the BSEC status, prints the respective error code. Halts in case of error
 * @param[in] bsec  : Bsec2 class object
 */
void checkBsecStatus(Bsec2 bsec);

/**
 * @brief : This function is called by the BSEC library when a new output is available
 * @param[in] input     : BME68X sensor data before processing
 * @param[in] outputs   : Processed BSEC BSEC output data
 * @param[in] bsec      : Instance of BSEC2 calling the callback
 */
void newDataCallback(const bme68xData data, const bsecOutputs outputs, Bsec2 bsec);


// Wifi & MQTT
WiFiClientSecure wifiClient;
PubSubClient client(wifiClient);

void setupWifi();
void setupMqtt();
void messageHandler(char*, byte*, unsigned int);

/* Create an array of objects of the class Bsec2 */
Bsec2 envSensor[NUM_OF_SENS];
commMux communicationSetup[NUM_OF_SENS];
uint8_t bsecMemBlock[NUM_OF_SENS][BSEC_INSTANCE_SIZE];
uint8_t sensor = 0;

/* Desired subscription list of BSEC2 outputs */
bsecSensor sensorList[] = {
    BSEC_OUTPUT_IAQ,
    BSEC_OUTPUT_RAW_TEMPERATURE,
    BSEC_OUTPUT_RAW_PRESSURE,
    BSEC_OUTPUT_RAW_HUMIDITY,
    BSEC_OUTPUT_RAW_GAS,
    BSEC_OUTPUT_STABILIZATION_STATUS,
    BSEC_OUTPUT_RUN_IN_STATUS
};

typedef struct {
  String device;
  int sensor;
  int timestamp;
  float tiaq;
  float tiaqAccuracy;
  float ttemperature;
  float tpressure;
  float thumidity;
  float tgasResistance;
  float tstabilizationStatus;
  float trunInStatus;
} SensorData;

void publishSensorData(SensorData arr[]);

const int SENSOR_DATA_LENGTH = 11;

void printSensorData(SensorData val) {
    Serial.print("device=" + String(val.device) + " ");
    Serial.print("sensor=" + String(val.sensor) + " ");
    Serial.print("timestamp=" + String(val.timestamp) + " ");
    Serial.print("tiaq=" + String(val.tiaq) + " ");
    Serial.print("tiaqAccuracy=" + String(val.tiaqAccuracy) + " ");
    Serial.print("ttemperature=" + String(val.ttemperature) + " ");
    Serial.print("tpressure=" + String(val.tpressure) + " ");
    Serial.print("thumidity=" + String(val.thumidity) + " ");
    Serial.print("tgasResistance=" + String(val.timestamp) + " ");
    Serial.print("tstabilizationStatus=" + String(val.timestamp) + " ");
    Serial.print("trunInStatus=" + String(val.timestamp) + "\n");
}

# define SAMPLING_RATE BSEC_SAMPLE_RATE_LP


void setupWifi() {
  // Connect to Wifi
  wifiClient.setCACert(AWS_CERT_CA);
  wifiClient.setCertificate(AWS_CERT_CRT);
  wifiClient.setPrivateKey(AWS_CERT_PRIVATE);
  
  WiFi.mode(WIFI_STA);

  if (USE_ENTERPRISE) {
    WiFi.begin(AP_SSID_E, WPA2_AUTH_PEAP, ID_E, USERNAME_E, PASSWORD_E);
  } else {
    WiFi.begin(AP_SSID, PASSWORD);
  }
  Serial.println();
  Serial.print("Waiting for WiFi Connection ...");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("");
  Serial.println("WiFi Connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void setupMqtt() {
  // Connect to MQTT broker
  client.setServer(AWS_IOT_ENDPOINT, 8883);
  client.setCallback(messageHandler);

  // Needed if publish intervals exceed 15 seconds
  client.setKeepAlive(70); // + 10 secs for buffer room

  while (!client.connect(THINGNAME)) {
    Serial.print(".");
    delay(100);
  }
 
  if (!client.connected()) {
    Serial.println("AWS IoT Timeout!");
    Serial.println(client.state());
    return;
  }
 
  // Subscribe to a topic
  client.subscribe(AWS_IOT_DATA_SUBSCRIBE_TOPIC);
  Serial.println("AWS IoT Connected!");

  // Send hello message
  JsonDocument doc;
  doc["status"] = "OK";
  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);
  client.publish(AWS_IOT_DATA_PUBLISH_TOPIC.c_str(), jsonBuffer);
}

void messageHandler(char* topic, byte* payload, unsigned int length) {
  Serial.print("incoming: ");
  Serial.println(topic);
 
  JsonDocument doc;
  deserializeJson(doc, payload);
  const char* message = doc["message"];
  Serial.println(message);
}

// Global Variable to get ESP32 MAC
String espId;

/* Entry point for the example */
void setup(void) {
    /* Initialize the communication interfaces */
    Serial.begin(115200);

    uint64_t chipId = ESP.getEfuseMac();
    uint16_t chip = (uint16_t)(chipId >> 32);
    char ssid[23];
    snprintf(ssid, 23, "%04X%08X", chip, (uint32_t)chip);
    espId = (String)ssid; // MAC as a string
    Serial.print("Device MAC: ");
    Serial.println(espId);

    AWS_IOT_DATA_PUBLISH_TOPIC = "device/" + espId + AWS_TOPIC_SUFFIX;

    commMuxBegin(Wire, SPI);
    pinMode(PANIC_LED, OUTPUT);
    delay(100);
    
    setupWifi();
    setupMqtt();

    /* Valid for boards with USB-COM. Wait until the port is open */
    while(!Serial) delay(10);
    
    
    for (uint8_t i = 0; i < NUM_OF_SENS; i++) {        
        /* Sets the Communication interface for the sensors */
        communicationSetup[i] = commMuxSetConfig(Wire, SPI, i, communicationSetup[i]);

        /* Assigning a chunk of memory block to the bsecInstance */
         envSensor[i].allocateMemory(bsecMemBlock[i]);

        /* Initialize the library and interfaces */
        if (!envSensor[i].begin(BME68X_SPI_INTF, commMuxRead, commMuxWrite, commMuxDelay, &communicationSetup[i]))
        {
            checkBsecStatus (envSensor[i]);
        }

        /* Subscribe to the desired BSEC2 outputs */
        if (!envSensor[i].updateSubscription(sensorList, ARRAY_LEN(sensorList), SAMPLING_RATE))
        {
            checkBsecStatus (envSensor[i]);
        }

        /* Whenever new data is available call the newDataCallback function */
        envSensor[i].attachCallback(newDataCallback);
    }

    Serial.println("BSEC library version " + \
            String(envSensor[0].version.major) + "." \
            + String(envSensor[0].version.minor) + "." \
            + String(envSensor[0].version.major_bugfix) + "." \
            + String(envSensor[0].version.minor_bugfix));

    Serial.println("Sampling rate " + String(SAMPLING_RATE));

    if(client.setBufferSize(5120)){ // 5 KB
        Serial.println("Set pubsub buffer size!");
    } else{
        Serial.println("ERROR pubsub setting buffer size!");
    }

    Serial.println("");
}

/* Function that is looped forever */
void loop(void) {
        /* Call the run function often so that the library can 
     * check if it is time to read new data from the sensor  
     * and process it.
     */
    for (sensor = 0; sensor < NUM_OF_SENS; sensor++) {
        if (!envSensor[sensor].run()) {
         checkBsecStatus(envSensor[sensor]);
        }
    }
}

void errLeds(void) {
    while(1) {
        digitalWrite(PANIC_LED, HIGH);
        delay(ERROR_DUR);
        digitalWrite(PANIC_LED, LOW);
        delay(ERROR_DUR);
    }
}

/* Buffer to avoid publishing too many messages */
const int NUMBER_OF_SKIPPED_SAMPLES = NUM_OF_SENS * 19; // Number of samples to skip

void newDataCallback(const bme68xData data, const bsecOutputs outputs, Bsec2 bsec) {
    if (!outputs.nOutputs) {
        return;
    }
    static std::vector<SensorData> v;
    static int counter = 0;
    counter++;

    int timestamp = (int) (outputs.output[0].time_stamp / INT64_C(1000000));

    SensorData sensorValue;
    sensorValue.sensor = sensor;
    sensorValue.timestamp = timestamp;

    for (uint8_t i = 0; i < outputs.nOutputs; i++) {
        const bsecData output  = outputs.output[i];
        switch (output.sensor_id) {
            case BSEC_OUTPUT_IAQ:
                // Serial.println("\tiaq = " + String(output.signal));
                // Serial.println("\tiaq accuracy = " + String((int) output.accuracy));
                sensorValue.tiaq = output.signal;
                sensorValue.tiaqAccuracy = output.accuracy;
                break;
            case BSEC_OUTPUT_RAW_TEMPERATURE:
                // Serial.println("\ttemperature = " + String(output.signal));
                sensorValue.ttemperature = output.signal;
                break;
            case BSEC_OUTPUT_RAW_PRESSURE:
                // Serial.println("\tpressure = " + String(output.signal));
                sensorValue.tpressure = output.signal;
                break;
            case BSEC_OUTPUT_RAW_HUMIDITY:
                // Serial.println("\thumidity = " + String(output.signal));
                sensorValue.thumidity = output.signal;
                break;
            case BSEC_OUTPUT_RAW_GAS:
                // Serial.println("\tgas resistance = " + String(output.signal));
                sensorValue.tgasResistance = output.signal;
                break;
            case BSEC_OUTPUT_STABILIZATION_STATUS:
                // Serial.println("\tstabilization status = " + String(output.signal));
                sensorValue.tstabilizationStatus = output.signal;
                break;
            case BSEC_OUTPUT_RUN_IN_STATUS:
                // Serial.println("\trun in status = " + String(output.signal));
                sensorValue.trunInStatus = output.signal;
                break;
            default:
                break;
        }
    }

    if (counter > NUMBER_OF_SKIPPED_SAMPLES && counter <= NUMBER_OF_SKIPPED_SAMPLES + NUM_OF_SENS) {
        v.push_back(sensorValue);
        if (v.size() == NUM_OF_SENS) {
            SensorData arr[NUM_OF_SENS];

            for (int i=0; i<NUM_OF_SENS; i++){
                arr[i] = v[i];
            }
            v.clear();
            publishSensorData(arr);
            counter = 0;
        }
    }
}

void checkBsecStatus(Bsec2 bsec) {
    if (bsec.status < BSEC_OK) {
        Serial.println("BSEC error code : " + String(bsec.status));
        errLeds(); /* Halt in case of failure */ 
    }
    else if (bsec.status > BSEC_OK) {
        Serial.println("BSEC warning code : " + String(bsec.status));
    }

    if (bsec.sensor.status < BME68X_OK) {
        Serial.println("BME68X error code : " + String(bsec.sensor.status));
        errLeds(); /* Halt in case of failure */
    }
    else if (bsec.sensor.status > BME68X_OK) {
        Serial.println("BME68X warning code : " + String(bsec.sensor.status));
    }
}

/**
 * Encodes an array of SensorData into a JSON and sends it to AWS
*/
void publishSensorData(SensorData arr[]) {    
    JsonDocument doc;
    JsonArray jsonArr = doc["data"].to<JsonArray>();
    doc["deviceId"] = espId;
    doc["recordedTimestamp"] = arr[0].timestamp;

    for (int i=0; i<NUM_OF_SENS; i++) {
        JsonObject obj1 = jsonArr.add<JsonObject>();
        obj1["sensor"] = arr[i].sensor;
        obj1["tiaq"] = arr[i].tiaq;
        obj1["tiaqAccuracy"] = arr[i].tiaqAccuracy;
        obj1["ttemperature"] = arr[i].ttemperature;
        obj1["tpressure"] = arr[i].tpressure;
        obj1["thumidity"] = arr[i].thumidity;
        obj1["tgasResistance"] = arr[i].tgasResistance;
        obj1["tstabilizationStatus"] = arr[i].tstabilizationStatus;
        obj1["trunInStatus"] = arr[i].trunInStatus;
    }
    int jsonLength = measureJson(doc);
    Serial.println("JsonLength: " + String(jsonLength));

    client.beginPublish(AWS_IOT_DATA_PUBLISH_TOPIC.c_str(), jsonLength, false);

    BufferingPrint bufferedClient(client, 512);
    serializeJson(doc, bufferedClient);

    bufferedClient.flush();

    if (client.endPublish()){
        Serial.println("Published!\n");
    } else {
        Serial.println("ERROR PUBLISHING!\n");
    }

    client.flush();
}
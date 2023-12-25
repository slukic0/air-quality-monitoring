/**
 * Copyright (C) 2021 Bosch Sensortec GmbH
 *
 * SPDX-License-Identifier: BSD-3-Clause
 *
 */

/* The new sensor needs to be conditioned before the example can work reliably. You may run this
 * example for 24hrs to let the sensor stabilize.
 */

/**
 * basic.ino sketch :
 * This is an example for illustrating the BSEC virtual outputs using BME688 Development Kit,
 * which has been designed to work with Adafruit ESP32 Feather Board
 * For more information visit : 
 * https://www.bosch-sensortec.com/software-tools/software/bme688-software/
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

#include <bsec2.h>
#include "commMux.h"

#include <vector>

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
const int SENSOR_DATA_LENGTH = 11;

void printSensorData(SensorData val){
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

/* Entry point for the example */
void setup(void)
{
    /* Initialize the communication interfaces */
    Serial.begin(115200);
    commMuxBegin(Wire, SPI);
    pinMode(PANIC_LED, OUTPUT);
    delay(100);
    /* Valid for boards with USB-COM. Wait until the port is open */
    while(!Serial) delay(10);
    
    for (uint8_t i = 0; i < NUM_OF_SENS; i++)
    {        
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
}

/* Function that is looped forever */
void loop(void)
{
        /* Call the run function often so that the library can 
     * check if it is time to read new data from the sensor  
     * and process it.
     */
    for (sensor = 0; sensor < NUM_OF_SENS; sensor++)
    {
        if (!envSensor[sensor].run())
        {
         checkBsecStatus(envSensor[sensor]);
        }
    }
}

void errLeds(void)
{
    while(1)
    {
        digitalWrite(PANIC_LED, HIGH);
        delay(ERROR_DUR);
        digitalWrite(PANIC_LED, LOW);
        delay(ERROR_DUR);
    }
}

/* Buffer to avoid publishing too many messages */
const int SENSOR_DATA_BUFFER_LENGTH = NUM_OF_SENS * 2; // BSEC_SAMPLE_RATE_LP = 1/3 Hz = every 3s
// TODO: Can't serialize more than 16 elements due to stack overflow

void newDataCallback(const bme68xData data, const bsecOutputs outputs, Bsec2 bsec)
{
    if (!outputs.nOutputs)
    {
        return;
    }
    static std::vector<SensorData> v;

    int timestamp = (int) (outputs.output[0].time_stamp / INT64_C(1000000));

    SensorData sensorValue;
    sensorValue.sensor = sensor;
    sensorValue.timestamp = timestamp;

    for (uint8_t i = 0; i < outputs.nOutputs; i++)
    {
        const bsecData output  = outputs.output[i];
        switch (output.sensor_id)
        {
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

    v.push_back(sensorValue);
    
    if (v.size() == SENSOR_DATA_BUFFER_LENGTH) {
        SensorData arr[SENSOR_DATA_BUFFER_LENGTH];
        for (int i=0; i<SENSOR_DATA_BUFFER_LENGTH; i++){
          arr[i] = v[i];
        }
        v.clear();
        publishSensorData(arr);
    }
}

void checkBsecStatus(Bsec2 bsec)
{
    if (bsec.status < BSEC_OK)
    {
        Serial.println("BSEC error code : " + String(bsec.status));
        errLeds(); /* Halt in case of failure */ 
    }
    else if (bsec.status > BSEC_OK)
    {
        Serial.println("BSEC warning code : " + String(bsec.status));
    }

    if (bsec.sensor.status < BME68X_OK)
    {
        Serial.println("BME68X error code : " + String(bsec.sensor.status));
        errLeds(); /* Halt in case of failure */
    }
    else if (bsec.sensor.status > BME68X_OK)
    {
        Serial.println("BME68X warning code : " + String(bsec.sensor.status));
    }
}

/**
 * Encodes an array of SensorData into a JSON and sends it to AWS
*/
void publishSensorData(SensorData arr[]) {
    for (int i=0; i<SENSOR_DATA_BUFFER_LENGTH; i++){
        printSensorData(arr[i]);
    }
    Serial.println("Items: " + String(SENSOR_DATA_BUFFER_LENGTH) + " Size: " + String(SENSOR_DATA_BUFFER_LENGTH * sizeof arr[0]));
    

    const int capacity = JSON_ARRAY_SIZE(SENSOR_DATA_BUFFER_LENGTH) + SENSOR_DATA_BUFFER_LENGTH * JSON_OBJECT_SIZE(SENSOR_DATA_LENGTH);
    StaticJsonDocument<capacity> doc;

    JsonArray jsonArr = doc.createNestedArray();

    for (int i=0; i<SENSOR_DATA_BUFFER_LENGTH; i++){
        JsonObject obj1 = jsonArr.createNestedObject();
        obj1["device"] = arr[i].device;
        obj1["sensor"] = arr[i].sensor;
        obj1["timestamp"] = arr[i].timestamp;
        obj1["tiaq"] = arr[i].tiaq;
        obj1["tiaqAccuracy"] = arr[i].tiaqAccuracy;
        obj1["ttemperature"] = arr[i].ttemperature;
        obj1["tpressure"] = arr[i].tpressure;
        obj1["thumidity"] = arr[i].thumidity;
        obj1["tgasResistance"] = arr[i].tgasResistance;
        obj1["tstabilizationStatus"] = arr[i].tstabilizationStatus;
        obj1["trunInStatus"] = arr[i].trunInStatus;
    }
    String payloadString;
    int jsonLength = measureJson(doc);
    Serial.println("Capacity: " + String(capacity) + " jsonLength: " + String(jsonLength));
    // serializeJson(doc, payloadString);
    // Serial.println("");
}
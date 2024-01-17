/*!
 * Copyright (c) 2021 Bosch Sensortec GmbH. All rights reserved.
 *
 * BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
 * FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 * COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 *
 * @file	sensor_manager.h
 * @date	11 April 2023
 * @version	2.0.9
 * 
 * @brief	Header file for the sensor manager
 * 
 * 
 */

#ifndef SENSOR_MANAGER_H
#define SENSOR_MANAGER_H

/* Include of Arduino Core */
#include <Arduino.h>
#include <SdFat.h>
#include <RTClib.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <Wire.h>
#include "utils.h"
#include "demo_app.h"
#include <bme68xLibrary.h>
#include "commMux.h"

/* I2C-Expander masks */
#define I2C_EXPANDER_ADDR 				0x20
#define I2C_EXPANDER_OUTPUT_REG_ADDR 	0x01
#define I2C_EXPANDER_CONFIG_REG_ADDR 	0x03
#define I2C_EXPANDER_CONFIG_REG_MASK 	0x00
#define SPI_COMM_SPEED 					4000000
#define NUM_BME68X_UNITS				8	
#define HEATER_TIME_BASE				140
#define MAX_HEATER_DURATION				200
#define GAS_WAIT_SHARED					UINT8_C(140)
/* Size of Json document in bytes */
#define JSON_DOC_SIZE 					5000

/*!
 * @brief : Class library that holds the functionality of the sensor manager
 */
class sensorManager
{
private:
	static bme68xSensor 		_sensors[NUM_BME68X_UNITS];
	Bme68x 						bme68xSensors[NUM_BME68X_UNITS];
	bme68x_data 				_fieldData[3];

	StaticJsonDocument<JSON_DOC_SIZE>	_configDoc;
	
	/*!
	 * @brief : This function initializes the given BME688 sensor
	 * 
	 * @param[in] sensorNumber 	: The sensor number
	 * @param[in] sensorId 		: The sensor id
     * 
     * @return 0 on success, lessthan zero otherwise
	 */
	int8_t initializeSensor(uint8_t sensorNumber, uint32_t& sensorId);
	/*!
	 * @brief : This function configures the heater settings of the sensor
	 * 
	 * @param[in] heaterProfileStr 	: The heater profile string id
	 * @param[in] dutyCycleStr 		: The duty cycle string id
	 * @param[in] heaterProfile 	: The heater profile structure
	 * @param[in] sensorNumber 		: The sensor number
     * 
     * @return  bme68x return code
	 */
	int8_t setHeaterProfile(const String& heaterProfileStr, const String& dutyCycleStr, bme68xHeaterProfile& heaterProfile, uint8_t sensorNumber);
	
	/*!
	 * @brief : This function configures the bme688 sensor
	 * 
	 * @param[in] heaterProfile : The heater profile structure
	 * @param[in] sensorNumber 	: The sensor number
     * 
     * @return  bme68x return code
	 */
	int8_t configureSensor(bme68xHeaterProfile& heaterProfile, uint8_t sensorNumber);
public:
	/*!
	 * @brief : This function retrieves the selected sensor.
	 * 
	 * @param[in] num : Sensor number
     * 
     * @return  Pointer to sensor if it exists, else nullptr
	 */
    static inline bme68xSensor* getSensor(uint8_t num)
	{
		bme68xSensor* sensor = nullptr;
		if(num < NUM_BME68X_UNITS)
		{
			sensor = &_sensors[num];
		}
		return sensor;
	};
	
	/*!
	 * @brief : This function selects next readable bme688 sensor in given operation mode
	 * 
	 * @param[inout] num	: Reference to the sensor number
	 * @param[in] mode		: The sensor operation mode
     * 
     * @return  True if available
	 */
	static inline bool selectNextSensor(uint64_t& wakeUpTime, uint8_t& num, uint8_t mode)
	{
		num = (uint8_t)0xFF;
		for (uint8_t i = 0; i < NUM_BME68X_UNITS; i++)
		{
			if ((_sensors[i].mode == mode) && (_sensors[i].wakeUpTime < wakeUpTime))
			{
				wakeUpTime = _sensors[i].wakeUpTime;
				num = i;
			}
		}
		
		if (num < NUM_BME68X_UNITS)
		{
			return true;
		}
		return false;
	}
	
	/*!
	 * @brief : This function schedules the next readable bme688 sensor
	 * 
	 * @param[inout] num : Reference to the sensor number
     * 
     * @return  True if available
	 */
	static inline bool scheduleSensor(uint8_t& num)
	{
		uint64_t wakeUpTime = utils::getTickMs() + 20;
		return (selectNextSensor(wakeUpTime, num, BME68X_PARALLEL_MODE) || selectNextSensor(wakeUpTime, num, BME68X_SLEEP_MODE));
	};
	
    /*!
     * @brief : The constructor of the sensorManager class
     *        	Creates an instance of the class
     */
    sensorManager();
	
	/*!
     * @brief : This function initializes all bme688 sensors. It does not configure the sensor manager for data collection, 
	 *		 	the begin function should be used instead for this purpose.
     */
	demoRetCode initializeAllSensors();
	
	/*!
	 * @brief : This function configures the sensor manager using the provided config file.
	 * 
	 * @param[in] config : sensor configuration file
     * 
     * @return  error code
	 */
    demoRetCode begin(const String& config);
	
	/*!
	 * @brief : This function retrieves the selected sensor data.
	 * 
	 * @param[in] num 	: Sensor number
	 * @param[in] data 	: Pointer to sensor data if it is available, else nullptr
     * 
     * @return  error code
	 */
    demoRetCode collectData(uint8_t num, bme68x_data* data[3]);
};

#endif

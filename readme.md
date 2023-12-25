
# Air Quality Monitoring Project

## Authors

Stefan Lukic  
Filip Lukic  
Pranav Hari

## File Structure

- `./src`: Source code  
- `./examples`: Relevant code examples  
- `./docs`: Relevant datasheets and documentation  

## Setup

### Creating AWS Infrastructure

1. Create AWS account
See the [AWS Docs here](https://docs.aws.amazon.com/accounts/latest/reference/manage-acct-creating.html) to create an account.

2. Setup IAM Access
Follow the [AWS documentation here](https://docs.aws.amazon.com/singlesignon/latest/userguide/get-started-prereqs-considerations.html) to use the AWS IAM Center to create an AWS access portal.

3. Once AWS IAM Center has been correctly configured, you should be able to login to your AWS account using your AWS access portal URL, which can be found in the IAM Center dashboard.
![IAM Center Dashboard](./images/iamCenterDashboard.png)

### Setup AWS IOT Core

How2Electronics has a great [guide](https://how2electronics.com/connecting-esp32-to-amazon-aws-iot-core-using-mqtt/) on how to setup an ESP32 with AWS IOT Core.  

At a high level, you must enable the AWS IOT Core MQTT broker and download the device certificate, device private key, and the Amazon root CA certificate.  
These files can then be used to connect the ESP32 to AWS and publish and subscribe to channels as needed.  

### Monitoring Kit Hardware

#### Current Prototype

The current prototype of the monitoring kit utilizes a Huzzah ESP32 connected to a BME688 sensor using I2C.
Two LEDs are also used to indicate the WIFI and MQTT broker connection status.

Sensor data is periodically encoded into a JSON format, which is then published to a topic by sending the JSON to AWS IOT Core.  

![Prototype Picture](./images/prototype.jpg)

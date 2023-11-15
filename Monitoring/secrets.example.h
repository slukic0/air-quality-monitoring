#include <pgmspace.h>
#define SECRET
 
#define AP_SSID     "*****"
#define PASSWORD    "*****"

static const int WIFIPIN = 21;
static const int MQTTPIN = 14;

#define THINGNAME "*****"

const char AWS_IOT_ENDPOINT[] = "*****";

// Amazon Root CA 1
static const char AWS_CERT_CA[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----

-----END CERTIFICATE-----
)EOF";
 
// Device Certificate
static const char AWS_CERT_CRT[] PROGMEM = R"KEY(
-----BEGIN CERTIFICATE-----

-----END CERTIFICATE-----

 
 
)KEY";
 
// Device Private Key
static const char AWS_CERT_PRIVATE[] PROGMEM = R"KEY(
-----BEGIN RSA PRIVATE KEY-----

-----END RSA PRIVATE KEY-----
 
 
)KEY";
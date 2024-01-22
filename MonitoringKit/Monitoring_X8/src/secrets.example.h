#include <pgmspace.h>
#define SECRET
 
// WPA2 - PSK
#define AP_SSID     "*****"
#define PASSWORD    "*****"

// WPA2 - Enterprise
#define AP_SSID_E   "*****"
#define ID_E        "*****"
#define USERNAME_E  "*****"
#define PASSWORD_E  "*****"

const bool USE_ENTERPISE = 0;

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
// Consume Meraki Alert via Webhook
var body = PD.inputRequest.body;
var emitEvent = true;


// Set Alert Severity
// critical
// error
// warning
// info
// unknown
var severity = "warning";
const alertSeverityMap = {
  "Settings changed": "info",
  "Motion detected": "info",
  "Network usage alert": "warning",
  "Client IP conflict detected": "warning",
  "Cellular came up": "warning",
  "appliances went down": "critical",
  "appliances came up": "critical",
  "switches went down": "critical",
  "switches came up": "critical",
  "APs went down": "critical",
  "APs came up": "critical"
};
let severity = alertSeverityMap[body.alertType];
if(body.alertType == "Uplink status changed" && !body.alertData.uplink && body.networkName != "PLD-Seton") {severity = "warning";}


// Clear irrelavent ip conflict alerts
//ips
if(body.alertType == "Client IP conflict detected" && (body.alertData.conflictingIp.includes("172."))){emitEvent = false;}
if(body.alertType == "Client IP conflict detected" && (body.alertData.conflictingIp.includes("1.1.1.1"))){emitEvent = false;}
if(body.alertType == "Client IP conflict detected" && (body.alertData.conflictingIp.includes("192."))){emitEvent = false;}
if(body.alertType == "Client IP conflict detected" && (body.alertData.conflictingIp.includes("10.100.80.40"))){emitEvent = false;}
//macs
if(body.alertType == "Client IP conflict detected" && (body.alertData.contendingMac.includes("F6:43:BB:20:E6:5A"))){emitEvent = false;}


// Clear irrelavent Rogue AP alerts
var rogueApBlacklist = [
    "meraki-scanning",
    "Meraki Setup",
    "Meraki Setup-scanning",
    "DIRECT-roku-UP6-693338",
    "DIRECT-roku-801-92CE85",
    "DIRECT-roku-82U-11163E",
    "DIRECT-JADESKTOP-IHRHN1TKAQD"
  ];
if ((body.alertType == "Air Marshal - Rogue AP detected") && (rogueApBlacklist.includes(body.alertData.ssidName))) {emitEvent = false;}
if ((body.alertType == "Air Marshal - Rogue AP detected") && (body.alertData.ssidName.includes("Meraki"))) {emitEvent = false;}
if ((body.alertType == "Air Marshal - Rogue AP detected") && (body.alertData.ssidName.includes("roku"))) {emitEvent = false;}


// clear irrelavent dhcp alerts
if ((body.alertType == "New DHCP server detected") && (body.alertData.ip.includes(".126"))) {emitEvent = false;}
if ((body.alertType == "New DHCP server detected") && (body.alertData.ip.includes(".190"))) {emitEvent = false;}
if ((body.alertType == "New DHCP server detected") && (body.alertData.ip.includes(".222"))) {emitEvent = false;}


// Format payload
var cef_event = {
event_type: PD.Trigger,
description: body.alertType + ": " + body.networkName,
severity: severity,
source_origin: body.networkName,
dedup_key: body.alertId,
service_group: body.organizationId,
event_action: PD.Trigger,
details: body
}

if (emitEvent){PD.emitCEFEvents([cef_event]);}
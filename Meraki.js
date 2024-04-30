// Consume Meraki Alert via Webhook
var body = PD.inputRequest.body;
var emitEvent = true;

// Set Alert Severity
var severity = "warning";
// critical
// error
// warning
// info
// unknown

if(body.alertType == "Settings changed") {severity = "info";}
if(body.alertType == "Motion detected") {severity = "info";}
if(body.alertType == "Network usage alert") {severity = "warning";}
if(body.alertType == "Client IP conflict detected") {severity = "warning";}
if(body.alertType == "APs went down") {severity = "critical";}
if(body.alertType == "Uplink status changed" && !body.alertData.uplink) {severity = "critical";}
if(body.alertType == "Cellular came up") {severity = "critical";}


// Clear irrelavent ip conflict alerts
if(body.alertType == "Client IP conflict detected" && (body.alertData.conflictingIp.includes("172."))){emitEvent = false;}
if(body.alertType == "Client IP conflict detected" && (body.alertData.conflictingIp.includes("1.1.1.1"))){emitEvent = false;}
if(body.alertType == "Client IP conflict detected" && (body.alertData.conflictingIp.includes("10.100.80"))){emitEvent = false;}


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
  
  if ((body.alertType == "Air Marshal - Rogue AP detected") && (rogueApBlacklist.includes(body.alertData.ssidName))) {
    emitEvent = false;
  }

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
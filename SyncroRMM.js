// Consume syncro alert via Webhook
let body = PD.inputRequest.body;
let emitEvent = true;
let severity = "warning";
let trigger = body.attributes.properties.trigger;

// Define location if it exists
let location;
if (typeof body.attributes.customer.business_name !== 'undefined') {
    location = body.attributes.customer.business_name;
} else {
    location = body.attributes.computer_name;
}

// Set Severity and rename trigger based on trigger type
switch (trigger) {
    case "agent_offline_trigger":
        severity = "critical";
        trigger = "Server offline";
        break;
    case "Intel Rapid Storage Monitoring":
        severity = "error";
        trigger = "RAID Volume Degraded";
        if (body.attributes.formatted_output.includes("2 new event matches triggered"){
            if (body.attributes.formatted_output.includes("Service started successfully.") ||
               body.attributes.formatted_output.includes("Service has been successfully shut down.") &&
               body.attributes.formatted_output.includes("Started event manager")){
                emitEvent = false;
            }
        }
        break;
    case "Oracle Authentication Error":
    case "low_hd_space_trigger":
        severity = "error";
        trigger = "Low Disk Space";
        break;
    case "CPU Monitoring":
    case "Ram Monitoring":
        severity = "warning";
        break;
    case "Dell Server Administrator":
        severity = "info";
        if (!body.attributes.formatted_output.includes("critical")) {
            emitEvent = false;
        }
        break;
}

// Clear irrelevant alerts
const irrelevantTriggers = ["ps_monitor", "Firewall", "IPv6", "Powered Off VM"];
if (irrelevantTriggers.includes(trigger)) {emitEvent = false;}

// Auto resolution logic, will attempt to close existing alerts if one comes in with "Auto resolved" in the description.
let resolved = body.attributes.resolved;
let description = body.attributes.properties.description;
if (description.toLowerCase().includes("auto resolved")) {
    resolved = "true";
}

// Define event type based on resolution status
let eventType;
if (resolved === "true") {
    eventType = PD.Resolve;
} else {
    eventType = PD.Trigger;
}

// Define the event payload
var normalized_event = {
    event_action: eventType,
    event_type: eventType,
    description: trigger + ": " + body.attributes.computer_name,
    severity: severity,
    source_origin: location,
    incident_key: body.attributes.id,
    dedup_key: body.attributes.id,
    details: {
        asset: body.attribautes.computer_name,
        location: location,
        body: body.attributes.formatted_output,
        link: body.link,
        resolved: resolved,
    }
};

// Emit the event payload
if (emitEvent) {
    PD.emitCEFEvents([normalized_event]);
}

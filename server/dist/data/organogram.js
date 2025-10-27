"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organogram = void 0;
exports.getDepartmentByRole = getDepartmentByRole;
exports.getSupervisor = getSupervisor;
exports.organogram = {
    executive: {
        managingDirector: "Managing Director",
        generalManager: "Goodluck Mbarie",
        projectManager: "Allan",
        operationsManager: "Thompson Aguheva",
    },
    departments: {
        documentQuality: {
            documentControls: "Gideon",
            qaqcEngineer: "Paul",
            storePersonnel: "QAQC Inspector",
        },
        safety: {
            safetyCoordinator: "Bristol Harry",
            firstAiders: "Safety Officers",
            siteLead: "Orobiyi",
        },
        engineering: {
            workshopManager: "Haroon Ahmed Amin",
            engineers: ["Emma", "Chijioke", "Okigbo"],
            electricalEngineer: "Israel",
            electricalSupervisor: "Ayo",
        },
        hvac: {
            supervisors: ["Tope", "Kunle"],
            technicians: ["HVAC Technicians", "Helpers", "Welders", "Scaffolders"],
        },
        logistics: {
            logisticsOfficer: "Mandy Brown",
            materialsCoordinator: "Erasmus Hart Taribo",
            drivers: ["Drivers"],
            foodVendor: "Food Vendor",
        },
        hr: {
            hrManager: "Clement",
            hrGeneralist: "Ufuoma Damilola-Ajewole",
        },
        production: {
            machineOperators: "Fitters",
        },
    },
};
function getDepartmentByRole(role) {
    const roles = {
        "Goodluck Mbarie": "Executive",
        "Thompson Aguheva": "Executive",
        "Allan": "Executive",
        "Gideon": "Document Quality",
        "Paul": "Document Quality",
        "QAQC Inspector": "Document Quality",
        "Bristol Harry": "Safety",
        "Safety Officers": "Safety",
        "Orobiyi": "Safety",
        "Haroon Ahmed Amin": "Engineering",
        "Emma": "Engineering",
        "Chijioke": "Engineering",
        "Okigbo": "Engineering",
        "Israel": "Engineering",
        "Ayo": "Engineering",
        "Tope": "HVAC",
        "Kunle": "HVAC",
        "HVAC Technicians": "HVAC",
        "Helpers": "HVAC",
        "Welders": "HVAC",
        "Scaffolders": "HVAC",
        "Mandy Brown": "Logistics",
        "Erasmus Hart Taribo": "Logistics",
        "Drivers": "Logistics",
        "Food Vendor": "Logistics",
        "Clement": "HR",
        "Ufuoma Damilola-Ajewole": "HR",
        "Fitters": "Production",
    };
    return roles[role] || null;
}
function getSupervisor(role) {
    const supervisors = {
        "Gideon": "Document Quality Manager",
        "Paul": "Document Quality Manager",
        "QAQC Inspector": "Document Quality Manager",
        "Bristol Harry": "Operations Manager",
        "Safety Officers": "Safety Coordinator",
        "Orobiyi": "Safety Coordinator",
        "Haroon Ahmed Amin": "Operations Manager",
        "Emma": "Workshop Manager",
        "Chijioke": "Workshop Manager",
        "Okigbo": "Workshop Manager",
        "Israel": "Workshop Manager",
        "Ayo": "Workshop Manager",
        "Tope": "Operations Manager",
        "Kunle": "Operations Manager",
        "HVAC Technicians": "HVAC Supervisor",
        "Helpers": "HVAC Supervisor",
        "Welders": "HVAC Supervisor",
        "Scaffolders": "HVAC Supervisor",
        "Mandy Brown": "Operations Manager",
        "Erasmus Hart Taribo": "Operations Manager",
        "Drivers": "Logistics Officer",
        "Food Vendor": "Logistics Officer",
        "Clement": "General Manager",
        "Ufuoma Damilola-Ajewole": "HR Manager",
        "Fitters": "Workshop Manager",
    };
    return supervisors[role] || null;
}
//# sourceMappingURL=organogram.js.map
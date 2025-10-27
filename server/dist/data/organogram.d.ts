export declare const organogram: {
    executive: {
        managingDirector: string;
        generalManager: string;
        projectManager: string;
        operationsManager: string;
    };
    departments: {
        documentQuality: {
            documentControls: string;
            qaqcEngineer: string;
            storePersonnel: string;
        };
        safety: {
            safetyCoordinator: string;
            firstAiders: string;
            siteLead: string;
        };
        engineering: {
            workshopManager: string;
            engineers: string[];
            electricalEngineer: string;
            electricalSupervisor: string;
        };
        hvac: {
            supervisors: string[];
            technicians: string[];
        };
        logistics: {
            logisticsOfficer: string;
            materialsCoordinator: string;
            drivers: string[];
            foodVendor: string;
        };
        hr: {
            hrManager: string;
            hrGeneralist: string;
        };
        production: {
            machineOperators: string;
        };
    };
};
export declare function getDepartmentByRole(role: string): string | null;
export declare function getSupervisor(role: string): string | null;
//# sourceMappingURL=organogram.d.ts.map
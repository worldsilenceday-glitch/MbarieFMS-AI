export declare class OrgService {
    /**
     * Get full organogram structure
     */
    static getOrganogram(): Promise<any[]>;
    /**
     * Build hierarchical organogram structure
     */
    private static buildHierarchy;
    /**
     * Get supervisors for a department
     */
    static getDepartmentSupervisors(department: string): Promise<{
        id: string;
        department: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        supervisorId: string | null;
    }[]>;
    /**
     * Get user's supervisor
     */
    static getUserSupervisor(userId: string): Promise<any>;
    /**
     * Get all positions in a department
     */
    static getDepartmentPositions(department: string): Promise<{
        id: string;
        department: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        supervisorId: string | null;
    }[]>;
    /**
     * Assign user to position
     */
    static assignUserToPosition(userId: string, positionId: string): Promise<{
        id: string;
        employeeId: string;
        firstName: string;
        lastName: string;
        email: string;
        jobTitle: string;
        department: string;
        facility: string;
        isActive: boolean;
        positionId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Get position by title
     */
    static getPositionByTitle(title: string): Promise<{
        id: string;
        department: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        supervisorId: string | null;
    } | null>;
    /**
     * Get all departments
     */
    static getDepartments(): Promise<{
        name: string;
        positionCount: number;
    }[]>;
}
//# sourceMappingURL=orgService.d.ts.map
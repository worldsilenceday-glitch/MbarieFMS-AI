import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OrgService {
  /**
   * Get full organogram structure
   */
  static async getOrganogram() {
    try {
      const positions = await prisma.position.findMany({
        include: {
          supervisor: true,
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              position: true,
              department: true
            }
          }
        },
        orderBy: {
          department: 'asc'
        }
      });

      // Build hierarchical structure
      const organogram = this.buildHierarchy(positions);
      return organogram;
    } catch (error) {
      console.error('Error fetching organogram:', error);
      throw error;
    }
  }

  /**
   * Build hierarchical organogram structure
   */
  private static buildHierarchy(positions: any[]) {
    const positionMap = new Map();
    const rootPositions: any[] = [];

    // Create map of positions
    positions.forEach(position => {
      positionMap.set(position.id, {
        ...position,
        children: []
      });
    });

    // Build hierarchy
    positions.forEach(position => {
      if (position.supervisorId) {
        const supervisor = positionMap.get(position.supervisorId);
        if (supervisor) {
          supervisor.children.push(positionMap.get(position.id));
        }
      } else {
        rootPositions.push(positionMap.get(position.id));
      }
    });

    return rootPositions;
  }

  /**
   * Get supervisors for a department
   */
  static async getDepartmentSupervisors(department: string) {
    try {
      const supervisors = await prisma.position.findMany({
        where: {
          department,
          users: {
            some: {}
          }
        },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      return supervisors;
    } catch (error) {
      console.error('Error fetching department supervisors:', error);
      throw error;
    }
  }

  /**
   * Get user's supervisor
   */
  static async getUserSupervisor(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          position: {
            include: {
              supervisor: {
                include: {
                  users: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!user?.position?.supervisor) {
        return null;
      }

      return user.position.supervisor.users[0] || null;
    } catch (error) {
      console.error('Error fetching user supervisor:', error);
      throw error;
    }
  }

  /**
   * Get all positions in a department
   */
  static async getDepartmentPositions(department: string) {
    try {
      const positions = await prisma.position.findMany({
        where: { department },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: {
          title: 'asc'
        }
      });

      return positions;
    } catch (error) {
      console.error('Error fetching department positions:', error);
      throw error;
    }
  }

  /**
   * Assign user to position
   */
  static async assignUserToPosition(userId: string, positionId: string) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { positionId },
        include: {
          position: true
        }
      });

      return user;
    } catch (error) {
      console.error('Error assigning user to position:', error);
      throw error;
    }
  }

  /**
   * Get position by title
   */
  static async getPositionByTitle(title: string) {
    try {
      const position = await prisma.position.findFirst({
        where: { title },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      return position;
    } catch (error) {
      console.error('Error fetching position by title:', error);
      throw error;
    }
  }

  /**
   * Get all departments
   */
  static async getDepartments() {
    try {
      const departments = await prisma.position.groupBy({
        by: ['department'],
        _count: {
          id: true
        }
      });

      return departments.map(dept => ({
        name: dept.department,
        positionCount: dept._count.id
      }));
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }
}

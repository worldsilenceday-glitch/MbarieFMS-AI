import { MaintenanceTask, Technician, MaintenanceSchedule, Equipment, PredictiveAnalysis } from '../../types/maintenance';
import { InventoryItem } from '../../types/inventory';

export class MaintenanceScheduler {
  private tasks: MaintenanceTask[] = [];
  private technicians: Technician[] = [];
  private equipment: Equipment[] = [];
  private schedules: MaintenanceSchedule[] = [];

  /**
   * Initialize scheduler with data
   */
  initialize(
    tasks: MaintenanceTask[],
    technicians: Technician[],
    equipment: Equipment[],
    schedules: MaintenanceSchedule[] = []
  ): void {
    this.tasks = tasks;
    this.technicians = technicians;
    this.equipment = equipment;
    this.schedules = schedules;
  }

  /**
   * Schedule maintenance tasks based on priority and resource availability
   */
  async scheduleMaintenance(
    predictiveAnalysis: PredictiveAnalysis[],
    inventoryItems: InventoryItem[] = []
  ): Promise<{
    scheduledTasks: MaintenanceTask[];
    unscheduledTasks: MaintenanceTask[];
    technicianAssignments: Record<string, MaintenanceTask[]>;
    conflicts: string[];
  }> {
    const unscheduledTasks: MaintenanceTask[] = [];
    const scheduledTasks: MaintenanceTask[] = [];
    const technicianAssignments: Record<string, MaintenanceTask[]> = {};
    const conflicts: string[] = [];

    // Sort tasks by priority (critical first)
    const tasksToSchedule = this.prioritizeTasks(predictiveAnalysis);

    // Get available technicians
    const availableTechs = this.getAvailableTechnicians();

    for (const taskData of tasksToSchedule) {
      try {
        const task = await this.createMaintenanceTask(taskData, inventoryItems);
        const assignedTask = await this.assignTaskToTechnician(task, availableTechs);

        if (assignedTask) {
          scheduledTasks.push(assignedTask);
          
          // Update technician workload
          this.updateTechnicianWorkload(assignedTask.assignedTo, assignedTask.estimatedDuration);
          
          // Track assignments
          if (!technicianAssignments[assignedTask.assignedTo]) {
            technicianAssignments[assignedTask.assignedTo] = [];
          }
          technicianAssignments[assignedTask.assignedTo].push(assignedTask);
        } else {
          unscheduledTasks.push(task);
          conflicts.push(`No available technician for ${task.equipmentName}`);
        }
      } catch (error) {
        console.error(`Failed to schedule task for ${taskData.equipmentName}:`, error);
        unscheduledTasks.push(await this.createMaintenanceTask(taskData, inventoryItems));
        conflicts.push(`Scheduling error for ${taskData.equipmentName}`);
      }
    }

    // Generate schedules
    this.generateSchedules(technicianAssignments);

    return {
      scheduledTasks,
      unscheduledTasks,
      technicianAssignments,
      conflicts
    };
  }

  /**
   * Prioritize tasks based on risk level and predicted failure timeframe
   */
  private prioritizeTasks(predictiveAnalysis: PredictiveAnalysis[]): PredictiveAnalysis[] {
    return predictiveAnalysis
      .filter(analysis => analysis.status !== 'normal')
      .sort((a, b) => {
        // Critical tasks first
        if (a.riskLevel === 'critical' && b.riskLevel !== 'critical') return -1;
        if (b.riskLevel === 'critical' && a.riskLevel !== 'critical') return 1;

        // Then by predicted failure timeframe
        if (a.predictedFailureInDays !== b.predictedFailureInDays) {
          return a.predictedFailureInDays - b.predictedFailureInDays;
        }

        // Then by confidence
        return b.confidence - a.confidence;
      });
  }

  /**
   * Create maintenance task from predictive analysis
   */
  private async createMaintenanceTask(
    analysis: PredictiveAnalysis,
    inventoryItems: InventoryItem[]
  ): Promise<MaintenanceTask> {
    const equipment = this.equipment.find(e => e.id === analysis.equipmentId);
    const requiredParts = this.determineRequiredParts(analysis, equipment, inventoryItems);

    const task: MaintenanceTask = {
      id: `MT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      equipmentId: analysis.equipmentId,
      equipmentName: analysis.equipmentName,
      description: this.generateTaskDescription(analysis, equipment),
      priority: this.mapRiskToPriority(analysis.riskLevel),
      status: 'pending',
      assignedTo: '',
      estimatedDuration: this.estimateTaskDuration(analysis, equipment),
      scheduledDate: new Date(),
      predictedFailureInDays: analysis.predictedFailureInDays,
      requiredParts,
      notes: analysis.recommendedAction,
      createdAt: new Date(),
      updatedAt: new Date(),
      synced: false
    };

    return task;
  }

  /**
   * Assign task to the most suitable available technician
   */
  private async assignTaskToTechnician(
    task: MaintenanceTask,
    availableTechs: Technician[]
  ): Promise<MaintenanceTask | null> {
    if (availableTechs.length === 0) {
      return null;
    }

    // Score technicians based on suitability
    const scoredTechs = availableTechs.map(tech => ({
      tech,
      score: this.calculateTechnicianScore(tech, task)
    }));

    // Sort by score (highest first)
    scoredTechs.sort((a, b) => b.score - a.score);

    // Assign to best available technician
    const bestTech = scoredTechs[0];
    if (bestTech.score > 0) {
      const assignedTask = { ...task };
      assignedTask.assignedTo = bestTech.tech.name;
      assignedTask.status = 'scheduled';
      assignedTask.scheduledDate = this.calculateOptimalScheduleDate(bestTech.tech, task);
      return assignedTask;
    }

    return null;
  }

  /**
   * Calculate technician suitability score for a task
   */
  private calculateTechnicianScore(technician: Technician, task: MaintenanceTask): number {
    let score = 0;

    // Base availability score
    if (technician.isAvailable) {
      score += 40;
    }

    // Workload consideration (lower workload = higher score)
    const workloadPenalty = technician.currentWorkload * 0.3;
    score += Math.max(0, 30 - workloadPenalty);

    // Skill matching
    const equipment = this.equipment.find(e => e.id === task.equipmentId);
    if (equipment && this.hasMatchingSkills(technician, equipment)) {
      score += 20;
    }

    // Priority consideration for critical tasks
    if (task.priority === 'critical') {
      score += 10;
    }

    return score;
  }

  /**
   * Check if technician has skills matching equipment requirements
   */
  private hasMatchingSkills(technician: Technician, equipment: Equipment): boolean {
    const equipmentType = equipment.type.toLowerCase();
    return technician.skills.some(skill => 
      skill.toLowerCase().includes(equipmentType) ||
      equipmentType.includes(skill.toLowerCase())
    );
  }

  /**
   * Calculate optimal schedule date considering technician workload
   */
  private calculateOptimalScheduleDate(technician: Technician, task: MaintenanceTask): Date {
    const now = new Date();
    const workloadDelay = Math.ceil(technician.currentWorkload / 20); // Days delay based on workload
    const priorityDelay = task.priority === 'critical' ? 0 : 
                         task.priority === 'high' ? 1 : 2;
    
    const totalDelay = Math.max(workloadDelay, priorityDelay);
    now.setDate(now.getDate() + totalDelay);
    
    return now;
  }

  /**
   * Update technician workload after assignment
   */
  private updateTechnicianWorkload(technicianName: string, taskDuration: number): void {
    const technician = this.technicians.find(t => t.name === technicianName);
    if (technician) {
      // Convert minutes to workload percentage (8-hour workday)
      const workloadIncrease = (taskDuration / (8 * 60)) * 100;
      technician.currentWorkload = Math.min(100, technician.currentWorkload + workloadIncrease);
      
      // Mark as unavailable if workload is high
      if (technician.currentWorkload > 80) {
        technician.isAvailable = false;
      }
    }
  }

  /**
   * Generate task description based on analysis and equipment
   */
  private generateTaskDescription(analysis: PredictiveAnalysis, equipment?: Equipment): string {
    const baseDescription = `Predictive maintenance for ${analysis.equipmentName}`;
    
    if (equipment) {
      return `${baseDescription} (${equipment.type}) - ${analysis.recommendedAction.split('.')[0]}`;
    }
    
    return `${baseDescription} - ${analysis.recommendedAction.split('.')[0]}`;
  }

  /**
   * Map risk level to task priority
   */
  private mapRiskToPriority(riskLevel: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (riskLevel) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  /**
   * Estimate task duration based on analysis and equipment
   */
  private estimateTaskDuration(analysis: PredictiveAnalysis, equipment?: Equipment): number {
    let baseDuration = 120; // 2 hours default

    if (analysis.riskLevel === 'critical') {
      baseDuration = 240; // 4 hours for critical
    } else if (analysis.riskLevel === 'high') {
      baseDuration = 180; // 3 hours for high
    }

    // Adjust based on equipment complexity
    if (equipment) {
      if (equipment.criticality === 'critical') {
        baseDuration += 60;
      } else if (equipment.criticality === 'high') {
        baseDuration += 30;
      }
    }

    return baseDuration;
  }

  /**
   * Determine required parts for maintenance task
   */
  private determineRequiredParts(
    analysis: PredictiveAnalysis,
    equipment?: Equipment,
    inventoryItems: InventoryItem[] = []
  ): string[] {
    const requiredParts: string[] = [];

    // Add generic maintenance parts based on equipment type
    if (equipment) {
      switch (equipment.type.toLowerCase()) {
        case 'generator':
          requiredParts.push('Fuel Filter', 'Oil Filter', 'Air Filter');
          break;
        case 'ac_unit':
          requiredParts.push('Refrigerant', 'Air Filter', 'Thermostat');
          break;
        case 'pump':
          requiredParts.push('Seal Kit', 'Bearings', 'Gaskets');
          break;
        case 'compressor':
          requiredParts.push('Air Filter', 'Oil', 'Belts');
          break;
      }
    }

    // Check inventory availability and add only available parts
    const availableParts = requiredParts.filter(part => 
      inventoryItems.some(item => 
        item.name.toLowerCase().includes(part.toLowerCase()) && 
        item.quantity > 0
      )
    );

    return availableParts.length > 0 ? availableParts : [];
  }

  /**
   * Get available technicians (not overloaded and marked available)
   */
  private getAvailableTechnicians(): Technician[] {
    return this.technicians.filter(tech => 
      tech.isAvailable && tech.currentWorkload < 80
    );
  }

  /**
   * Generate maintenance schedules for technicians
   */
  private generateSchedules(assignments: Record<string, MaintenanceTask[]>): void {
    this.schedules = [];

    for (const [technicianName, tasks] of Object.entries(assignments)) {
      const technician = this.technicians.find(t => t.name === technicianName);
      if (!technician) continue;

      const totalHours = tasks.reduce((sum, task) => sum + (task.estimatedDuration / 60), 0);
      const efficiency = this.calculateEfficiency(tasks, technician);

      const schedule: MaintenanceSchedule = {
        id: `SCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        technicianId: technician.id,
        technicianName: technician.name,
        tasks,
        date: new Date(),
        totalHours,
        efficiency
      };

      this.schedules.push(schedule);
    }
  }

  /**
   * Calculate schedule efficiency based on task completion estimates
   */
  private calculateEfficiency(tasks: MaintenanceTask[], technician: Technician): number {
    if (tasks.length === 0) return 100;

    const totalEstimated = tasks.reduce((sum, task) => sum + task.estimatedDuration, 0);
    const skillMultiplier = this.getSkillMultiplier(technician, tasks);
    const workloadFactor = Math.max(0.5, 1 - (technician.currentWorkload / 200));

    return Math.min(100, (skillMultiplier * workloadFactor * 100));
  }

  /**
   * Get skill multiplier based on technician skills and task requirements
   */
  private getSkillMultiplier(technician: Technician, tasks: MaintenanceTask[]): number {
    let matchCount = 0;

    for (const task of tasks) {
      const equipment = this.equipment.find(e => e.id === task.equipmentId);
      if (equipment && this.hasMatchingSkills(technician, equipment)) {
        matchCount++;
      }
    }

    return matchCount / tasks.length;
  }

  /**
   * Get all scheduled tasks
   */
  getScheduledTasks(): MaintenanceTask[] {
    return this.tasks.filter(task => task.status === 'scheduled' || task.status === 'in-progress');
  }

  /**
   * Get technician schedules
   */
  getTechnicianSchedules(): MaintenanceSchedule[] {
    return this.schedules;
  }

  /**
   * Reschedule a task
   */
  rescheduleTask(taskId: string, newDate: Date): boolean {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && task.status === 'scheduled') {
      task.scheduledDate = newDate;
      task.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Complete a task and update technician workload
   */
  completeTask(taskId: string, actualDuration?: number): boolean {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && (task.status === 'scheduled' || task.status === 'in-progress')) {
      task.status = 'completed';
      task.completedDate = new Date();
      if (actualDuration) {
        task.actualDuration = actualDuration;
      }
      task.updatedAt = new Date();

      // Update technician workload
      const technician = this.technicians.find(t => t.name === task.assignedTo);
      if (technician) {
        const workloadDecrease = ((actualDuration || task.estimatedDuration) / (8 * 60)) * 100;
        technician.currentWorkload = Math.max(0, technician.currentWorkload - workloadDecrease);
        
        // Mark as available if workload is reasonable
        if (technician.currentWorkload <= 80) {
          technician.isAvailable = true;
        }
      }

      return true;
    }
    return false;
  }
}

// Export singleton instance
export const maintenanceScheduler = new MaintenanceScheduler();

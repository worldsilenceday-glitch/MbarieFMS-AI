const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeDepartment } = require('../middleware/auth');

const prisma = new PrismaClient();

/**
 * @route POST /api/maintenance/analyze
 * @desc Analyze sensor data and predict equipment failures
 * @access Private (Department-based)
 */
router.post('/analyze', authenticateToken, authorizeDepartment(['operations', 'facilities', 'maintenance']), async (req, res) => {
  try {
    const { sensorReadings, equipmentId, department } = req.body;

    if (!sensorReadings || !Array.isArray(sensorReadings)) {
      return res.status(400).json({
        success: false,
        message: 'Sensor readings array is required'
      });
    }

    // Mock predictive analysis (in real implementation, this would use ML models)
    const analysis = await performPredictiveAnalysis(sensorReadings, equipmentId);

    // Log the analysis for audit
    await prisma.maintenanceLog.create({
      data: {
        equipmentId: equipmentId || 'unknown',
        type: 'predictive_analysis',
        description: `Predictive analysis performed for ${equipmentId || 'unknown equipment'}`,
        severity: analysis.riskLevel,
        performedBy: req.user.id,
        department: department || req.user.department,
        metadata: {
          analysis: analysis,
          sensorReadings: sensorReadings.slice(0, 10) // Store first 10 readings
        }
      }
    });

    res.json({
      success: true,
      message: 'Predictive analysis completed successfully',
      data: analysis
    });

  } catch (error) {
    console.error('Predictive analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform predictive analysis',
      error: error.message
    });
  }
});

/**
 * @route POST /api/maintenance/schedule
 * @desc Schedule maintenance tasks based on predictive analysis
 * @access Private (Department-based)
 */
router.post('/schedule', authenticateToken, authorizeDepartment(['operations', 'facilities', 'maintenance']), async (req, res) => {
  try {
    const { predictiveAnalyses, inventoryItems = [], department } = req.body;

    if (!predictiveAnalyses || !Array.isArray(predictiveAnalyses)) {
      return res.status(400).json({
        success: false,
        message: 'Predictive analyses array is required'
      });
    }

    // Get available technicians
    const technicians = await prisma.user.findMany({
      where: {
        department: department || req.user.department,
        role: 'technician',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        skills: true,
        currentWorkload: true,
        isAvailable: true
      }
    });

    // Get equipment data
    const equipmentIds = [...new Set(predictiveAnalyses.map(analysis => analysis.equipmentId))];
    const equipment = await prisma.equipment.findMany({
      where: {
        id: { in: equipmentIds }
      }
    });

    // Schedule maintenance tasks
    const schedulingResult = await scheduleMaintenanceTasks(
      predictiveAnalyses,
      technicians,
      equipment,
      inventoryItems
    );

    // Create maintenance tasks in database
    const createdTasks = [];
    for (const task of schedulingResult.scheduledTasks) {
      const createdTask = await prisma.maintenanceTask.create({
        data: {
          equipmentId: task.equipmentId,
          description: task.description,
          priority: task.priority,
          status: task.status,
          assignedTo: task.assignedTo,
          estimatedDuration: task.estimatedDuration,
          scheduledDate: task.scheduledDate,
          predictedFailureInDays: task.predictedFailureInDays,
          requiredParts: task.requiredParts,
          notes: task.notes,
          createdBy: req.user.id,
          department: department || req.user.department
        }
      });
      createdTasks.push(createdTask);
    }

    // Log scheduling activity
    await prisma.maintenanceLog.create({
      data: {
        equipmentId: 'multiple',
        type: 'task_scheduling',
        description: `Scheduled ${createdTasks.length} maintenance tasks`,
        severity: 'info',
        performedBy: req.user.id,
        department: department || req.user.department,
        metadata: {
          scheduledTasks: createdTasks.length,
          unscheduledTasks: schedulingResult.unscheduledTasks.length,
          conflicts: schedulingResult.conflicts
        }
      }
    });

    res.json({
      success: true,
      message: `Successfully scheduled ${createdTasks.length} maintenance tasks`,
      data: {
        scheduledTasks: createdTasks,
        unscheduledTasks: schedulingResult.unscheduledTasks,
        conflicts: schedulingResult.conflicts,
        technicianAssignments: schedulingResult.technicianAssignments
      }
    });

  } catch (error) {
    console.error('Maintenance scheduling error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule maintenance tasks',
      error: error.message
    });
  }
});

/**
 * @route GET /api/maintenance/status
 * @desc Get maintenance status and dashboard data
 * @access Private (Department-based)
 */
router.get('/status', authenticateToken, authorizeDepartment(['operations', 'facilities', 'maintenance']), async (req, res) => {
  try {
    const { department } = req.query;
    const targetDepartment = department || req.user.department;

    // Get equipment status
    const equipment = await prisma.equipment.findMany({
      where: {
        department: targetDepartment
      },
      include: {
        maintenanceTasks: {
          where: {
            status: { in: ['scheduled', 'in-progress'] }
          },
          orderBy: {
            scheduledDate: 'asc'
          },
          take: 5
        }
      }
    });

    // Get maintenance tasks statistics
    const taskStats = await prisma.maintenanceTask.groupBy({
      by: ['status'],
      where: {
        department: targetDepartment,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      _count: {
        id: true
      }
    });

    // Get critical alerts
    const criticalAlerts = await prisma.maintenanceLog.findMany({
      where: {
        department: targetDepartment,
        severity: 'critical',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Calculate metrics
    const totalEquipment = equipment.length;
    const criticalEquipment = equipment.filter(eq => 
      eq.status === 'critical' || eq.criticality === 'critical'
    ).length;
    
    const pendingTasks = taskStats.find(stat => stat.status === 'pending')?._count?.id || 0;
    const completedTasks = taskStats.find(stat => stat.status === 'completed')?._count?.id || 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalEquipment,
          criticalEquipment,
          pendingTasks,
          completedTasks,
          criticalAlerts: criticalAlerts.length
        },
        equipment: equipment.map(eq => ({
          id: eq.id,
          name: eq.name,
          type: eq.type,
          location: eq.location,
          status: eq.status,
          criticality: eq.criticality,
          lastMaintenance: eq.lastMaintenance,
          nextScheduledMaintenance: eq.nextScheduledMaintenance,
          pendingTasks: eq.maintenanceTasks.length
        })),
        recentAlerts: criticalAlerts.map(alert => ({
          id: alert.id,
          equipmentId: alert.equipmentId,
          type: alert.type,
          description: alert.description,
          severity: alert.severity,
          timestamp: alert.createdAt
        })),
        taskStatistics: taskStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.id;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Maintenance status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve maintenance status',
      error: error.message
    });
  }
});

/**
 * @route GET /api/maintenance/tasks
 * @desc Get maintenance tasks with filtering
 * @access Private (Department-based)
 */
router.get('/tasks', authenticateToken, authorizeDepartment(['operations', 'facilities', 'maintenance']), async (req, res) => {
  try {
    const { 
      department, 
      status, 
      priority, 
      technician, 
      page = 1, 
      limit = 20 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const targetDepartment = department || req.user.department;

    const where = {
      department: targetDepartment
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (technician) where.assignedTo = technician;

    const tasks = await prisma.maintenanceTask.findMany({
      where,
      include: {
        equipment: {
          select: {
            name: true,
            type: true,
            location: true
          }
        }
      },
      orderBy: {
        scheduledDate: 'asc'
      },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.maintenanceTask.count({ where });

    res.json({
      success: true,
      data: {
        tasks: tasks.map(task => ({
          id: task.id,
          equipmentId: task.equipmentId,
          equipmentName: task.equipment.name,
          equipmentType: task.equipment.type,
          equipmentLocation: task.equipment.location,
          description: task.description,
          priority: task.priority,
          status: task.status,
          assignedTo: task.assignedTo,
          estimatedDuration: task.estimatedDuration,
          actualDuration: task.actualDuration,
          scheduledDate: task.scheduledDate,
          completedDate: task.completedDate,
          predictedFailureInDays: task.predictedFailureInDays,
          requiredParts: task.requiredParts,
          notes: task.notes,
          createdAt: task.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get maintenance tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve maintenance tasks',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/maintenance/tasks/:id/complete
 * @desc Mark a maintenance task as completed
 * @access Private (Department-based)
 */
router.put('/tasks/:id/complete', authenticateToken, authorizeDepartment(['operations', 'facilities', 'maintenance']), async (req, res) => {
  try {
    const { id } = req.params;
    const { actualDuration, notes } = req.body;

    const task = await prisma.maintenanceTask.findUnique({
      where: { id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance task not found'
      });
    }

    if (task.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Task is already completed'
      });
    }

    const updatedTask = await prisma.maintenanceTask.update({
      where: { id },
      data: {
        status: 'completed',
        actualDuration: actualDuration || task.estimatedDuration,
        completedDate: new Date(),
        notes: notes || task.notes
      }
    });

    // Update equipment last maintenance date
    await prisma.equipment.update({
      where: { id: task.equipmentId },
      data: {
        lastMaintenance: new Date(),
        status: 'operational'
      }
    });

    // Log completion
    await prisma.maintenanceLog.create({
      data: {
        equipmentId: task.equipmentId,
        type: 'task_completion',
        description: `Completed maintenance task: ${task.description}`,
        severity: 'info',
        performedBy: req.user.id,
        department: task.department,
        metadata: {
          taskId: task.id,
          actualDuration: actualDuration || task.estimatedDuration,
          completedBy: req.user.name
        }
      }
    });

    res.json({
      success: true,
      message: 'Maintenance task completed successfully',
      data: updatedTask
    });

  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete maintenance task',
      error: error.message
    });
  }
});

/**
 * @route GET /api/maintenance/analytics
 * @desc Get maintenance analytics and trends
 * @access Private (Department-based)
 */
router.get('/analytics', authenticateToken, authorizeDepartment(['operations', 'facilities', 'maintenance']), async (req, res) => {
  try {
    const { department, period = '30d' } = req.query;
    const targetDepartment = department || req.user.department;

    // Calculate date range based on period
    const periods = {
      '7d': 7,
      '30d': 30,
      '90d': 90
    };
    
    const days = periods[period] || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get task completion trends
    const completionTrends = await prisma.maintenanceTask.groupBy({
      by: ['createdAt'],
      where: {
        department: targetDepartment,
        status: 'completed',
        completedDate: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Get equipment failure predictions
    const failurePredictions = await prisma.maintenanceTask.groupBy({
      by: ['priority'],
      where: {
        department: targetDepartment,
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    // Get maintenance efficiency metrics
    const efficiencyData = await prisma.maintenanceTask.aggregate({
      where: {
        department: targetDepartment,
        status: 'completed',
        completedDate: {
          gte: startDate
        },
        actualDuration: {
          not: null
        }
      },
      _avg: {
        actualDuration: true,
        estimatedDuration: true
      },
      _count: {
        id: true
      }
    });

    const efficiency = efficiencyData._avg.estimatedDuration && efficiencyData._avg.actualDuration
      ? (efficiencyData._avg.estimatedDuration / efficiencyData._avg.actualDuration) * 100
      : 100;

    res.json({
      success: true,
      data: {
        completionTrends: completionTrends.map(trend => ({
          date: trend.createdAt,
          completedTasks: trend._count.id
        })),
        failurePredictions: failurePredictions.reduce((acc, pred) => {
          acc[pred.priority] = pred._count.id;
          return acc;
        }, {}),
        efficiencyMetrics: {
          averageEfficiency: Math.min(100, efficiency),
          totalCompleted: efficiencyData._count.id,
          averageActualDuration: efficiencyData._avg.actualDuration,
          averageEstimatedDuration: efficiencyData._avg.estimatedDuration
        },
        period: {
          start: startDate,
          end: new Date(),
          days: days
        }
      }
    });

  } catch (error) {
    console.error('Maintenance analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve maintenance analytics',
      error: error.message
    });
  }
});

// Helper functions

/**
 * Perform predictive analysis on sensor data
 */
async function performPredictiveAnalysis(sensorReadings, equipmentId) {
  // Mock implementation - in production, this would use ML models
  const criticalReadings = sensorReadings.filter(reading => 
    reading.status === 'critical' || 
    (reading.value < reading.normalRange.min * 0.8) || 
    (reading.value > reading.normalRange.max * 1.2)
  );

  const warningReadings = sensorReadings.filter(reading => 
    reading.status === 'warning' || 
    (reading.value < reading.normalRange.min * 0.9) || 
    (reading.value > reading.normalRange.max * 1.1)
  );

  let riskLevel = 'low';
  let predictedFailureInDays = 90;
  let confidence = 0.85;

  if (criticalReadings.length >= 2) {
    riskLevel = 'critical';
    predictedFailureInDays = Math.max(1, 7 - criticalReadings.length);
    confidence = 0.95;
  } else if (criticalReadings.length >= 1 || warningReadings.length >= 3) {
    riskLevel = 'high';
    predictedFailureInDays = Math.max(7, 30 - warningReadings.length);
    confidence = 0.88;
  } else if (warningReadings.length >= 1) {
    riskLevel = 'medium';
    predictedFailureInDays = 45;
    confidence = 0.82;
  }

  return {
    equipmentId,
    equipmentName: `Equipment ${equipmentId}`,
    status: riskLevel === 'critical' ? 'critical' : riskLevel === 'high' ? 'warning' : 'normal',
    predictedFailureInDays,
    confidence,
    recommendedAction: generateRecommendedAction(riskLevel, criticalReadings, warningReadings),
    riskLevel,
    contributingFactors: [
      ...criticalReadings.map(r => `Critical ${r.type} reading`),
      ...warningReadings.map(r => `Warning ${r.type} reading`)
    ],
    lastAnalysis: new Date(),
    nextAnalysis: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  };
}

/**
 * Generate recommended action based on risk level and sensor readings
 */
function generateRecommendedAction(riskLevel, criticalReadings, warningReadings) {
  const criticalTypes = [...new Set(criticalReadings.map(r => r.type))];
  const warningTypes = [...new Set(warningReadings.map(r => r.type))];

  if (riskLevel === 'critical') {
    return `IMMEDIATE MAINTENANCE REQUIRED: Critical issues with ${criticalTypes.join(', ')}. Shut down equipment if safe.`;
  } else if (riskLevel === 'high') {
    return `Schedule maintenance within 48 hours. Critical: ${criticalTypes.join(', ')}, Warnings: ${warningTypes.join(', ')}`;
  } else if (riskLevel === 'medium') {
    return `Plan maintenance within 2 weeks. Warning issues: ${warningTypes.join(', ')}`;
  } else {
    return 'Monitor equipment. All readings within normal range.';
  }
}

/**
 * Schedule maintenance tasks based on predictive analysis
 */
async function scheduleMaintenanceTasks(predictiveAnalyses, technicians, equipment, inventoryItems) {
  const scheduledTasks = [];
  const unscheduledTasks = [];
  const conflicts = [];
  const technicianAssignments = {};

  // Filter analyses that need maintenance
  const analysesNeedingMaintenance = predictiveAnalyses.filter(
    analysis => analysis.riskLevel !== 'low'
  );

  // Sort by priority (critical first)
  analysesNeedingMaintenance.sort((a, b) => {
    if (a.riskLevel === 'critical' && b.riskLevel !== 'critical') return -1;
    if (b.riskLevel === 'critical' && a.riskLevel !== 'critical') return 1;
    return a.predictedFailureInDays - b.predictedFailureInDays;
  });

  // Get available technicians
  const availableTechs = technicians.filter(tech => 
    tech.isAvailable && tech.currentWorkload < 80
  );

  for (const analysis of analysesNeedingMaintenance) {
    const eq = equipment.find(e => e.id === analysis.equipmentId);
    const task = createMaintenanceTask(analysis, eq, inventoryItems);
    
    const assignedTask = await assignTaskToTechnician(task, availableTechs, equipment);
    
    if (assignedTask) {
      scheduledTasks.push(assignedTask);
      
      // Update technician workload
      const tech = availableTechs.find(t => t.name === assignedTask.assignedTo);
      if (tech) {
        tech.currentWorkload += (assignedTask.estimatedDuration / (8 * 60)) * 100;
        if (tech.currentWorkload > 80) {
          tech.isAvailable = false;
        }
        
        // Track assignments
        if (!technicianAssignments[tech.id]) {
          technicianAssignments[tech.id] = [];
        }
        technicianAssignments[tech.id].push(assignedTask);
      }
    } else {
      unscheduledTasks.push(task);
      conflicts.push(`No available technician for ${task.equipmentName}`);
    }
  }

  return {
    scheduledTasks,
    unscheduledTasks,
    technicianAssignments,
    conflicts
  };
}

/**
 * Create a maintenance task from predictive analysis
 */
function createMaintenanceTask(analysis, equipment, inventoryItems) {
  const requiredParts = determineRequiredParts(analysis, equipment, inventoryItems);
  
  return {
    equipmentId: analysis.equipmentId,
    equipmentName: analysis.equipmentName,
    description: generateTaskDescription(analysis, equipment),
    priority: mapRiskToPriority(analysis.riskLevel),
    status: 'pending',
    assignedTo: '',
    estimatedDuration: estimateTaskDuration(analysis, equipment),
    scheduledDate: new Date(),
    predictedFailureInDays: analysis.predictedFailureInDays,
    requiredParts,
    notes: analysis.recommendedAction
  };
}

/**
 * Assign task to the most suitable available technician
 */
async function assignTaskToTechnician(task, availableTechs, equipment) {
  if (availableTechs.length === 0) {
    return null;
  }

  // Score technicians based on suitability
  const scoredTechs = availableTechs.map(tech => ({
    tech,
    score: calculateTechnicianScore(tech, task, equipment)
  }));

  // Sort by score (highest first)
  scoredTechs.sort((a, b) => b.score - a.score);

  // Assign to best available technician
  const bestTech = scoredTechs[0];
  if (bestTech.score > 0) {
    const assignedTask = { ...task };
    assignedTask.assignedTo = bestTech.tech.name;
    assignedTask.status = 'scheduled';
    assignedTask.scheduledDate = calculateOptimalScheduleDate(bestTech.tech, task);
    return assignedTask;
  }

  return null;
}

/**
 * Calculate technician suitability score
 */
function calculateTechnicianScore(technician, task, equipment) {
  let score = 0;

  // Base availability score
  if (technician.isAvailable) {
    score += 40;
  }

  // Workload consideration (lower workload = higher score)
  const workloadPenalty = technician.currentWorkload * 0.3;
  score += Math.max(0, 30 - workloadPenalty);

  // Skill matching
  const eq = equipment.find(e => e.id === task.equipmentId);
  if (eq && hasMatchingSkills(technician, eq)) {
    score += 20;
  }

  // Priority consideration for critical tasks
  if (task.priority === 'critical') {
    score += 10;
  }

  return score;
}

/**
 * Check if technician has matching skills for equipment
 */
function hasMatchingSkills(technician, equipment) {
  const equipmentType = equipment.type.toLowerCase();
  return technician.skills.some(skill => 
    skill.toLowerCase().includes(equipmentType) ||
    equipmentType.includes(skill.toLowerCase())
  );
}

/**
 * Calculate optimal schedule date
 */
function calculateOptimalScheduleDate(technician, task) {
  const now = new Date();
  const workloadDelay = Math.ceil(technician.currentWorkload / 20); // Days delay based on workload
  const priorityDelay = task.priority === 'critical' ? 0 : 
                       task.priority === 'high' ? 1 : 2;
  
  const totalDelay = Math.max(workloadDelay, priorityDelay);
  now.setDate(now.getDate() + totalDelay);
  
  return now;
}

/**
 * Generate task description
 */
function generateTaskDescription(analysis, equipment) {
  const baseDescription = `Predictive maintenance for ${analysis.equipmentName}`;
  
  if (equipment) {
    return `${baseDescription} (${equipment.type}) - ${analysis.recommendedAction.split('.')[0]}`;
  }
  
  return `${baseDescription} - ${analysis.recommendedAction.split('.')[0]}`;
}

/**
 * Map risk level to priority
 */
function mapRiskToPriority(riskLevel) {
  switch (riskLevel) {
    case 'critical': return 'critical';
    case 'high': return 'high';
    case 'medium': return 'medium';
    case 'low': return 'low';
    default: return 'medium';
  }
}

/**
 * Estimate task duration
 */
function estimateTaskDuration(analysis, equipment) {
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
 * Determine required parts for maintenance
 */
function determineRequiredParts(analysis, equipment, inventoryItems) {
  const requiredParts = [];

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
 * @route POST /api/maintenance/tasks
 * @desc Create a new maintenance task
 * @access Private (Department-based)
 */
router.post('/tasks', authenticateToken, authorizeDepartment(['operations', 'facilities', 'maintenance']), async (req, res) => {
  try {
    const {
      equipmentId,
      description,
      priority,
      assignedTo,
      estimatedDuration,
      scheduledDate,
      predictedFailureInDays,
      requiredParts,
      notes,
      department
    } = req.body;

    if (!equipmentId || !description) {
      return res.status(400).json({
        success: false,
        message: 'Equipment ID and description are required'
      });
    }

    const task = await prisma.maintenanceTask.create({
      data: {
        equipmentId,
        description,
        priority: priority || 'medium',
        status: 'pending',
        assignedTo: assignedTo || null,
        estimatedDuration: estimatedDuration || 120, // Default 2 hours
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        predictedFailureInDays: predictedFailureInDays || null,
        requiredParts: requiredParts || [],
        notes: notes || '',
        createdBy: req.user.id,
        department: department || req.user.department
      }
    });

    // Log task creation
    await prisma.maintenanceLog.create({
      data: {
        equipmentId,
        type: 'task_creation',
        description: `Created maintenance task: ${description}`,
        severity: 'info',
        performedBy: req.user.id,
        department: department || req.user.department,
        metadata: {
          taskId: task.id,
          priority: task.priority,
          estimatedDuration: task.estimatedDuration
        }
      }
    });

    res.json({
      success: true,
      message: 'Maintenance task created successfully',
      data: task
    });

  } catch (error) {
    console.error('Create maintenance task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create maintenance task',
      error: error.message
    });
  }
});

/**
 * @route POST /api/maintenance/analyses
 * @desc Store predictive analysis results
 * @access Private (Department-based)
 */
router.post('/analyses', authenticateToken, authorizeDepartment(['operations', 'facilities', 'maintenance']), async (req, res) => {
  try {
    const {
      equipmentId,
      equipmentName,
      status,
      predictedFailureInDays,
      confidence,
      recommendedAction,
      riskLevel,
      contributingFactors,
      department
    } = req.body;

    if (!equipmentId || !riskLevel) {
      return res.status(400).json({
        success: false,
        message: 'Equipment ID and risk level are required'
      });
    }

    // Store analysis in maintenance log
    const logEntry = await prisma.maintenanceLog.create({
      data: {
        equipmentId,
        type: 'predictive_analysis',
        description: `Predictive analysis for ${equipmentName || equipmentId}: ${riskLevel.toUpperCase()} risk`,
        severity: riskLevel,
        performedBy: req.user.id,
        department: department || req.user.department,
        metadata: {
          analysis: {
            equipmentId,
            equipmentName,
            status,
            predictedFailureInDays,
            confidence,
            recommendedAction,
            riskLevel,
            contributingFactors,
            timestamp: new Date()
          }
        }
      }
    });

    // Update equipment status if critical
    if (riskLevel === 'critical') {
      await prisma.equipment.update({
        where: { id: equipmentId },
        data: {
          status: 'critical',
          lastAnalysis: new Date()
        }
      });
    }

    res.json({
      success: true,
      message: 'Predictive analysis stored successfully',
      data: {
        logId: logEntry.id,
        analysis: {
          equipmentId,
          equipmentName,
          riskLevel,
          predictedFailureInDays,
          recommendedAction,
          timestamp: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Store analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to store predictive analysis',
      error: error.message
    });
  }
});

/**
 * @route GET /api/maintenance/predict
 * @desc Get predictive maintenance insights
 * @access Private (Department-based)
 */
router.get('/predict', authenticateToken, authorizeDepartment(['operations', 'facilities', 'maintenance']), async (req, res) => {
  try {
    const { department } = req.query;
    const targetDepartment = department || req.user.department;

    // Get recent predictive analyses
    const recentAnalyses = await prisma.maintenanceLog.findMany({
      where: {
        department: targetDepartment,
        type: 'predictive_analysis',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    // Extract analysis data
    const analyses = recentAnalyses.map(log => ({
      id: log.id,
      equipmentId: log.equipmentId,
      equipmentName: log.metadata?.analysis?.equipmentName || log.equipmentId,
      riskLevel: log.severity,
      predictedFailureInDays: log.metadata?.analysis?.predictedFailureInDays || null,
      confidence: log.metadata?.analysis?.confidence || null,
      recommendedAction: log.metadata?.analysis?.recommendedAction || '',
      timestamp: log.createdAt
    }));

    // Calculate insights
    const criticalCount = analyses.filter(a => a.riskLevel === 'critical').length;
    const highCount = analyses.filter(a => a.riskLevel === 'high').length;
    const imminentFailures = analyses.filter(a => a.predictedFailureInDays <= 7).length;

    res.json({
      success: true,
      data: {
        analyses,
        insights: {
          criticalAlerts: criticalCount,
          highPriorityAlerts: highCount,
          imminentFailures,
          totalAnalyses: analyses.length,
          averageConfidence: analyses.length > 0 
            ? analyses.reduce((sum, a) => sum + (a.confidence || 0), 0) / analyses.length 
            : 0
        },
        recommendations: generatePredictiveRecommendations(analyses)
      }
    });

  } catch (error) {
    console.error('Get predictive insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve predictive insights',
      error: error.message
    });
  }
});

/**
 * Generate predictive maintenance recommendations
 */
function generatePredictiveRecommendations(analyses) {
  const recommendations = [];

  const criticalAnalyses = analyses.filter(a => a.riskLevel === 'critical');
  if (criticalAnalyses.length > 0) {
    recommendations.push({
      type: 'critical',
      title: 'Immediate Action Required',
      description: `${criticalAnalyses.length} equipment items at critical risk level`,
      action: 'Schedule emergency maintenance immediately',
      priority: 'critical'
    });
  }

  const highAnalyses = analyses.filter(a => a.riskLevel === 'high');
  if (highAnalyses.length > 0) {
    recommendations.push({
      type: 'high',
      title: 'High Priority Maintenance',
      description: `${highAnalyses.length} equipment items at high risk level`,
      action: 'Schedule maintenance within 48 hours',
      priority: 'high'
    });
  }

  const imminentFailures = analyses.filter(a => a.predictedFailureInDays <= 7);
  if (imminentFailures.length > 0) {
    recommendations.push({
      type: 'imminent',
      title: 'Imminent Failures',
      description: `${imminentFailures.length} equipment items predicted to fail within 7 days`,
      action: 'Prioritize maintenance scheduling',
      priority: 'high'
    });
  }

  // Add general recommendation if no critical issues
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'monitor',
      title: 'Maintenance Status Normal',
      description: 'All equipment operating within normal parameters',
      action: 'Continue routine monitoring',
      priority: 'low'
    });
  }

  return recommendations;
}

module.exports = router;

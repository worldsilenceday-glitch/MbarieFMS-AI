# 🚀 **CLINE PROMPT: Phase 7.7 – Predictive Maintenance + Dynamic Scheduling AI System**

**Project:** Mbarie FMS AI  
**Phase:** 7.7  
**Status:** Core components implemented, requires integration and completion  
**Goal:** Complete the **predictive maintenance intelligence and dynamic scheduling engine** with full offline/voice integration

---

## 🎯 **IMMEDIATE ACTION REQUIRED**

Complete the remaining integration components and ensure full system functionality:

### 1. **CREATE MISSING HOOKS & UTILITIES**
- **File:** `client/src/hooks/useMaintenanceSync.ts`
  - Implement offline sync for maintenance data
  - Integrate with existing `syncUtils` from Phase 7.5
  - Add retry logic and exponential backoff
  - Handle maintenance task synchronization

- **File:** `client/src/utils/maintenanceInsights.ts`
  - AI-based insights for predictive alerts
  - Maintenance optimization recommendations
  - Voice summary generation ("Maintenance summary for today...")

### 2. **ENHANCE VOICE INTEGRATION**
- **File:** `client/src/components/VoiceControls.tsx`
  - Add maintenance-specific voice commands:
    - "What's the maintenance status of the generator?"
    - "Schedule an inspection for pump A3"
    - "Who's assigned to today's maintenance tasks?"
    - "Generate maintenance report"
  - Integrate with `offlineAgent.ts` for NLP mapping

- **File:** `client/src/utils/offlineAgent.ts`
  - Extend intent detection for maintenance commands
  - Add maintenance response handlers
  - Support voice summaries for maintenance reports

### 3. **COMPLETE BACKEND INTEGRATION**
- **File:** `server/src/routes/maintenanceRoutes.js` (EXISTS - NEEDS COMPLETION)
  - Implement all endpoints:
    - `GET /maintenance` - Get maintenance data
    - `POST /maintenance` - Create maintenance tasks
    - `PUT /maintenance/:id` - Update maintenance status
    - `GET /maintenance/predict` - Get predictions
  - Integrate with MongoDB/IndexedDB bridge for offline-first

### 4. **ADD OFFLINE SYNC LOGIC**
- **File:** `client/src/utils/syncUtils.ts` (EXISTS - EXTEND)
  - Add maintenance data sync handlers
  - Queue maintenance updates offline
  - Auto-sync on reconnect
  - Visual sync status indicators

### 5. **ENHANCE DASHBOARD FEATURES**
- **File:** `client/src/components/MaintenanceDashboard.tsx` (EXISTS - ENHANCE)
  - Add real-time sensor data streaming
  - Implement color-coded status indicators:
    - 🟢 Normal
    - 🟠 Warning  
    - 🔴 Critical
  - Add predictive failure badges
  - Voice-based daily briefing mode

### 6. **CREATE TESTING SUITE**
- **File:** `client/test-phase7.7.js` (EXISTS - COMPLETE)
  - Test prediction accuracy (mock model)
  - Schedule optimization logic
  - Voice command triggers
  - Offline sync recovery
  - Dashboard rendering under various network conditions

---

## 🔧 **TECHNICAL SPECIFICATIONS**

### **Core Integration Points:**
1. **Offline Sync:** Use existing `syncUtils` from Phase 7.5
2. **Voice Commands:** Extend `VoiceControls.tsx` and `offlineAgent.ts`
3. **AI Insights:** Leverage existing `maintenanceAI.ts` utilities
4. **Real-time Updates:** Use `useSensorStream` hook for live data
5. **Database:** Integrate with existing MongoDB/IndexedDB architecture

### **Required Environment Variables:**
```env
VITE_MAINTENANCE_SYNC_INTERVAL=60000
VITE_AI_MODEL_MODE=predictive
VITE_MAINTENANCE_API_URL=/api/maintenance
```

### **Voice Command Mapping:**
```typescript
// Add to offlineAgent.ts
const MAINTENANCE_INTENTS = {
  'maintenance status': { intent: 'status', equipment: 'generator' },
  'schedule inspection': { intent: 'schedule', equipment: 'pump A3' },
  'assigned tasks': { intent: 'assign', timeframe: 'today' },
  'maintenance report': { intent: 'report' }
};
```

---

## 🧪 **TESTING REQUIREMENTS**

### **Test Scenarios:**
1. **Predictive Accuracy:** Mock sensor data → Verify failure predictions
2. **Scheduling Logic:** Multiple tasks → Verify optimal technician assignment
3. **Offline Operation:** Disconnect network → Verify local functionality
4. **Voice Integration:** Speak commands → Verify correct responses
5. **Sync Recovery:** Reconnect after offline → Verify data synchronization

### **Expected Test Output:**
```json
{
  "predictive_accuracy": ">85%",
  "scheduling_efficiency": ">90%", 
  "offline_functionality": "100%",
  "voice_recognition": ">95%",
  "sync_reliability": "100%"
}
```

---

## 🚀 **DEPLOYMENT READINESS**

### **Build & Deploy:**
- Update `client/netlify.toml` for new maintenance functions
- Ensure all environment variables are set
- Verify offline service worker includes maintenance routes
- Test deployment with `npm run build && npm run preview`

### **Verification Checklist:**
- [ ] Maintenance dashboard loads with mock data
- [ ] Predictive engine generates accurate failure predictions
- [ ] Scheduler assigns tasks to available technicians
- [ ] Voice commands trigger correct maintenance actions
- [ ] Offline mode functions without network
- [ ] Data syncs correctly when reconnected
- [ ] All tests pass in `test-phase7.7.js`

---

## 📊 **EXPECTED OUTCOME**

After completion, the system should:
- ✅ Predict equipment failures **before** they occur
- ✅ Automatically generate and assign maintenance tasks  
- ✅ Allow hands-free operation via **voice commands**
- ✅ Function **fully offline**, syncing seamlessly when reconnected
- ✅ Display **AI-driven recommendations** in maintenance dashboard
- ✅ Provide **real-time sensor monitoring** and alerts
- ✅ Generate **comprehensive maintenance reports**

---

## 🔮 **NEXT PHASE PREVIEW**

**Phase 7.8: IoT Integration Layer + Sensor Data Pipeline**
- Real-time sensor data ingestion
- Automated fault detection
- IoT device management
- Advanced analytics dashboard

---

## 🎯 **IMMEDIATE NEXT STEPS FOR CLINE:**

1. **Create missing hooks** (`useMaintenanceSync.ts`, `maintenanceInsights.ts`)
2. **Enhance voice integration** in `VoiceControls.tsx` and `offlineAgent.ts`
3. **Complete backend routes** in `maintenanceRoutes.js`
4. **Extend sync utilities** for maintenance data
5. **Run comprehensive tests** with `test-phase7.7.js`
6. **Verify deployment** and update documentation

**Priority:** Complete integration and ensure all components work together seamlessly with offline/voice capabilities.

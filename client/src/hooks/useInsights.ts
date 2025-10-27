import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { AIInsightSummary, UseInsightsState } from "../types/insights";
import toast from "react-hot-toast";

// API base URL - adjust based on your environment
const API_BASE_URL = "http://localhost:3001";

export const useInsights = (): UseInsightsState => {
  const [insights, setInsights] = useState<AIInsightSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);
  
  const socketRef = useRef<Socket | null>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // API request helper
  const apiRequest = async (endpoint: string) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  };

  // Fetch insights from API endpoints
  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch data from all API endpoints
      const [overview, trends, risk, compliance] = await Promise.all([
        apiRequest("/api/ai/insights/overview"),
        apiRequest("/api/ai/insights/trends"),
        apiRequest("/api/ai/insights/risk"),
        apiRequest("/api/ai/insights/compliance")
      ]);

      // Transform API data to match our frontend format
      const transformedInsights: AIInsightSummary[] = [
        // Overview insights
        ...overview.map((item: any) => ({
          id: item.id || `overview-${item.category}`,
          category: item.category as "workflow" | "risk" | "document" | "permit",
          title: item.title,
          value: item.value,
          trend: item.trend,
          icon: item.icon || "TrendingUp",
          color: item.color || "emerald",
          description: item.description
        })),
        
        // Trend insights
        ...trends.map((item: any) => ({
          id: item.id || `trend-${item.category}`,
          category: item.category as "workflow" | "risk" | "document" | "permit",
          title: item.title,
          value: item.value,
          trend: item.trend,
          icon: item.icon || "Activity",
          color: item.color || "blue",
          description: item.description
        })),
        
        // Risk insights
        ...risk.map((item: any) => ({
          id: item.id || `risk-${item.category}`,
          category: item.category as "workflow" | "risk" | "document" | "permit",
          title: item.title,
          value: item.value,
          trend: item.trend,
          icon: item.icon || "Shield",
          color: item.color || "green",
          description: item.description
        })),
        
        // Compliance insights
        ...compliance.map((item: any) => ({
          id: item.id || `compliance-${item.category}`,
          category: item.category as "workflow" | "risk" | "document" | "permit",
          title: item.title,
          value: item.value,
          trend: item.trend,
          icon: item.icon || "Award",
          color: item.color || "purple",
          description: item.description
        }))
      ];

      setInsights(transformedInsights);
      setIsLive(true);
      
      // Show success toast on manual refresh
      if (!isLoading) {
        toast.success("Data refreshed successfully");
      }
    } catch (err: any) {
      console.error("Failed to fetch insights:", err);
      setError(err.message || "Failed to load insights");
      
      // Fallback to mock data if API is not available
      const mockInsights: AIInsightSummary[] = [
        {
          id: "1",
          category: "workflow",
          title: "Workflow Efficiency",
          value: "87%",
          trend: 12,
          icon: "TrendingUp",
          color: "emerald",
          description: "Workflow completion rate improved by 12% this month"
        },
        {
          id: "2",
          category: "risk",
          title: "Risk Score",
          value: "Low",
          trend: -5,
          icon: "Shield",
          color: "green",
          description: "Overall risk decreased by 5%"
        },
        {
          id: "3",
          category: "document",
          title: "Documents Processed",
          value: "1,247",
          trend: 8,
          icon: "FileText",
          color: "blue",
          description: "8% increase in document processing"
        },
        {
          id: "4",
          category: "permit",
          title: "Permit Approvals",
          value: "94%",
          trend: 3,
          icon: "CheckCircle",
          color: "purple",
          description: "Permit approval rate increased by 3%"
        },
        {
          id: "5",
          category: "workflow",
          title: "Avg. Processing Time",
          value: "2.3 days",
          trend: -15,
          icon: "Clock",
          color: "orange",
          description: "Processing time reduced by 15%"
        },
        {
          id: "6",
          category: "risk",
          title: "Compliance Score",
          value: "98%",
          trend: 2,
          icon: "Award",
          color: "emerald",
          description: "Compliance improved by 2%"
        }
      ];
      
      setInsights(mockInsights);
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    socketRef.current = io(API_BASE_URL, {
      transports: ["websocket", "polling"]
    });

    socketRef.current.on("connect", () => {
      console.log("WebSocket connected");
      setIsLive(true);
    });

    socketRef.current.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setIsLive(false);
    });

    // Listen for real-time updates
    socketRef.current.on("insights_update", (data: any) => {
      console.log("Received insights update:", data);
      setInsights(prev => {
        const updated = [...prev];
        const index = updated.findIndex(item => item.id === data.id);
        if (index !== -1) {
          updated[index] = { ...updated[index], ...data };
        }
        return updated;
      });
      toast.success("Insights updated in real-time");
    });

    socketRef.current.on("risk_update", (data: any) => {
      console.log("Received risk update:", data);
      setInsights(prev => {
        const updated = [...prev];
        const riskItems = updated.filter(item => item.category === "risk");
        riskItems.forEach(item => {
          const index = updated.findIndex(i => i.id === item.id);
          if (index !== -1) {
            updated[index] = { ...updated[index], ...data };
          }
        });
        return updated;
      });
      toast.success("Risk data updated");
    });

    socketRef.current.on("workflow_update", (data: any) => {
      console.log("Received workflow update:", data);
      setInsights(prev => {
        const updated = [...prev];
        const workflowItems = updated.filter(item => item.category === "workflow");
        workflowItems.forEach(item => {
          const index = updated.findIndex(i => i.id === item.id);
          if (index !== -1) {
            updated[index] = { ...updated[index], ...data };
          }
        });
        return updated;
      });
      toast.success("Workflow data updated");
    });

    socketRef.current.on("error", (error: any) => {
      console.error("WebSocket error:", error);
      setError("WebSocket connection failed");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Set up automatic refresh every 30 seconds
  const setupAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(() => {
      fetchInsights();
    }, 30000); // 30 seconds

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchInsights]);

  // Initialize everything on component mount
  useEffect(() => {
    fetchInsights();
    const cleanupWebSocket = initializeWebSocket();
    const cleanupAutoRefresh = setupAutoRefresh();

    return () => {
      cleanupWebSocket();
      cleanupAutoRefresh();
    };
  }, [fetchInsights, initializeWebSocket, setupAutoRefresh]);

  return { 
    insights, 
    isLoading, 
    error, 
    refresh: fetchInsights,
    isLive 
  };
};

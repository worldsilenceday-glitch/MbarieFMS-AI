import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      title: "AI Insights Dashboard",
      description: "Get real-time analytics and predictive insights for your facility operations",
      icon: "📊",
      path: "/dashboard",
      color: "bg-blue-500"
    },
    {
      title: "Inventory Management",
      description: "Track materials, manage stock levels, and receive smart alerts",
      icon: "📦",
      path: "/inventory",
      color: "bg-green-500"
    },
    {
      title: "Predictive Maintenance",
      description: "Monitor equipment health and schedule maintenance proactively",
      icon: "🔧",
      path: "/maintenance",
      color: "bg-orange-500"
    },
    {
      title: "AI Chat Assistant",
      description: "Get instant help with facility management tasks and queries",
      icon: "💬",
      path: "/chat-agent",
      color: "bg-purple-500"
    },
    {
      title: "AI Agents",
      description: "Automated workflows and intelligent task management",
      icon: "🤖",
      path: "/ai-agent",
      color: "bg-red-500"
    },
    {
      title: "Organization Editor",
      description: "Manage team structure, positions, and access controls",
      icon: "🏢",
      path: "/admin-org-editor",
      color: "bg-indigo-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">M</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MBARIE FMS</h1>
                <p className="text-gray-600">Facility Management System</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">{currentTime.toLocaleDateString()}</p>
              <p className="text-lg font-semibold text-gray-900">{currentTime.toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Intelligent Facility
            <span className="text-blue-600"> Management</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your facility operations with AI-powered insights, predictive maintenance, 
            and intelligent inventory management. Everything you need in one unified platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/dashboard"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Get Started
            </Link>
            <Link
              to="/chat-agent"
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Try AI Assistant
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover how our AI-powered platform transforms facility management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.path}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border border-gray-100"
            >
              <div className="flex items-start space-x-4">
                <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl`}>
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">24/7</div>
              <div className="text-gray-600">AI Monitoring</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">50+</div>
              <div className="text-gray-600">Facilities</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">AI</div>
              <div className="text-gray-600">Powered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold">M</span>
                </div>
                <span className="text-lg font-semibold">MBARIE FMS</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Intelligent Facility Management System
              </p>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 Mbarie Services Ltd. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

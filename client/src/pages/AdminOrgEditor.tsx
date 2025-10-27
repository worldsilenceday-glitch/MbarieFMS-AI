import React, { useState, useEffect } from 'react';

interface Position {
  id: string;
  title: string;
  department: string;
  supervisor?: Position;
  users: User[];
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
}

const AdminOrgEditor: React.FC = () => {
  const [organogram, setOrganogram] = useState<Position[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganogram();
    fetchPositions();
    fetchUsers();
  }, []);

  const fetchOrganogram = async () => {
    try {
      const response = await fetch('/api/org');
      if (!response.ok) throw new Error('Failed to fetch organogram');
      const data = await response.json();
      setOrganogram(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch organogram');
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/org/positions');
      if (!response.ok) throw new Error('Failed to fetch positions');
      const data = await response.json();
      setPositions(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch positions');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/org/supervisors');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.data?.flatMap((pos: any) => pos.users) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // const assignUserToPosition = async (userId: string, positionId: string) => {
  //   try {
  //     const response = await fetch('/api/org/assign', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ userId, positionId }),
  //     });

  //     if (!response.ok) throw new Error('Failed to assign user');
      
  //     // Refresh data
  //     fetchOrganogram();
  //     fetchUsers();
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'Failed to assign user');
  //   }
  // };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading organogram...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Organization Management</h1>
          <p className="text-gray-600 mt-2">Manage positions and user assignments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Organogram View */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Organogram Structure</h2>
            <div className="space-y-4">
              {organogram.map((position) => (
                <div key={position.id} className="border border-gray-200 rounded p-4">
                  <h3 className="font-semibold text-lg">{position.title}</h3>
                  <p className="text-sm text-gray-600">{position.department}</p>
                  {position.users.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Assigned Users:</p>
                      <ul className="text-sm text-gray-600 ml-4">
                        {position.users.map((user) => (
                          <li key={user.id}>
                            {user.firstName} {user.lastName} ({user.email})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {position.supervisor && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Reports to:</p>
                      <p className="text-sm text-gray-600 ml-4">{position.supervisor.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Assignment Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">User Assignment</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Available Positions</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {positions.map((position) => (
                    <div key={position.id} className="border border-gray-200 rounded p-3">
                      <p className="font-medium">{position.title}</p>
                      <p className="text-sm text-gray-600">{position.department}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Available Users</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {users.map((user) => (
                    <div key={user.id} className="border border-gray-200 rounded p-3">
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-600">{user.position}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Departments Summary */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Departments Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from(new Set(positions.map(p => p.department))).map((dept) => (
              <div key={dept} className="border border-gray-200 rounded p-4 text-center">
                <h3 className="font-semibold">{dept}</h3>
                <p className="text-sm text-gray-600">
                  {positions.filter(p => p.department === dept).length} positions
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrgEditor;

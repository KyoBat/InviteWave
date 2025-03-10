// src/components/events/EventStats.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { eventService } from '../../services';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const EventStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { id } = useParams();
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await eventService.getEventStats(id);
        setStats(data);
      } catch (error) {
        setError('Failed to load event statistics');
        console.error('Error fetching event stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [id]);
  
  if (loading) {
    return <div className="loading">Loading statistics...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  if (!stats) {
    return <div className="not-found">Statistics not available</div>;
  }
  
  // Prepare data for pie chart
  const responseData = [
    { name: 'Yes', value: stats.responses.yes, color: '#4CAF50' },
    { name: 'No', value: stats.responses.no, color: '#F44336' },
    { name: 'Maybe', value: stats.responses.maybe, color: '#FF9800' },
    { name: 'Pending', value: stats.responses.pending, color: '#9E9E9E' }
  ];
  
  const invitationStatusData = [
    { name: 'Sent', value: stats.sent, color: '#2196F3' },
    { name: 'Pending', value: stats.pending, color: '#9E9E9E' },
    { name: 'Failed', value: stats.failed, color: '#F44336' }
  ];
  
  return (
    <div className="event-stats-container">
      <h2>Event Statistics</h2>
      
      <div className="stats-summary">
        <div className="stats-card">
          <h3>Total Invitations</h3>
          <div className="stats-value">{stats.total}</div>
        </div>
        
        <div className="stats-card">
          <h3>Responses</h3>
          <div className="stats-value">{stats.responses.yes + stats.responses.no + stats.responses.maybe}</div>
        </div>
        
        <div className="stats-card">
          <h3>Confirmed Attendees</h3>
          <div className="stats-value">{stats.responses.yes}</div>
        </div>
        
        <div className="stats-card">
          <h3>Response Rate</h3>
          <div className="stats-value">
            {stats.total > 0 
              ? `${Math.round(((stats.responses.yes + stats.responses.no + stats.responses.maybe) / stats.total) * 100)}%` 
              : '0%'}
          </div>
        </div>
      </div>
      
      <div className="stats-charts">
        <div className="chart-container">
          <h3>Response Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={responseData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {responseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Guests']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-container">
          <h3>Invitation Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={invitationStatusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {invitationStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Invitations']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {stats.byCategory && Object.keys(stats.byCategory).length > 0 && (
        <div className="category-stats">
          <h3>Stats by Guest Category</h3>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Total</th>
                <th>Yes</th>
                <th>No</th>
                <th>Maybe</th>
                <th>Pending</th>
                <th>Response Rate</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.byCategory).map(([category, data]) => {
                const responseRate = data.total > 0 
                  ? Math.round(((data.responses.yes + data.responses.no + data.responses.maybe) / data.total) * 100)
                  : 0;
                  
                return (
                  <tr key={category}>
                    <td>{category.charAt(0).toUpperCase() + category.slice(1)}</td>
                    <td>{data.total}</td>
                    <td>{data.responses.yes}</td>
                    <td>{data.responses.no}</td>
                    <td>{data.responses.maybe}</td>
                    <td>{data.responses.pending}</td>
                    <td>{responseRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EventStats;
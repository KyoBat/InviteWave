// src/components/gifts/GiftStats.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer, Legend, Tooltip, 
  XAxis, YAxis, CartesianGrid, 
  LabelList, Sector 
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGift, 
  faCheckCircle, 
  faShoppingBag,
  faChartLine,
  faPercentage,
  faStar,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import giftStatsService from '../../services/giftStatsService';

// Composant graphique circulaire interactif
const ActivePieChart = ({ data, dataKey, nameKey, colors, title }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const {
      cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value, name
    } = props;
    
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} style={{ fontWeight: 'bold' }}>
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">
          {`${name}: ${value}`}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
          {`(${(percent * 100).toFixed(0)}%)`}
        </text>
      </g>
    );
  };

  // Filtrer les données à valeur 0
  const filteredData = data.filter(item => item.value > 0);

  // Afficher un message si aucune donnée
  if (filteredData.length === 0) {
    return (
      <div className="chart-container">
        <h3>{title}</h3>
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3>{title}</h3>
      <div style={{ width: '100%', height: '300px', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={filteredData}
              dataKey={dataKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              onMouseEnter={onPieEnter}
            >
              {filteredData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]} 
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => value} />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Composant principal de statistiques des cadeaux
const GiftStats = () => {
  const [giftStats, setGiftStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { id: eventId } = useParams();
  
  useEffect(() => {
    const fetchAllGiftStats = async () => {
      try {
        setLoading(true);
        
        // Récupérer les statistiques des cadeaux
        const stats = await giftStatsService.getGiftStats(eventId);
        setGiftStats(stats);
        
        // Récupérer les tendances de réservation
        const trends = await giftStatsService.getReservationTrends(eventId);
        setTrendData(trends.trendData);
        
        setError('');
      } catch (error) {
        console.error('Error fetching gift statistics:', error);
        setError('Failed to load gift statistics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllGiftStats();
  }, [eventId]);
  
  if (loading) {
    return <div className="loading">Loading gift statistics...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  if (!giftStats) {
    return <div className="not-found">Gift statistics not available</div>;
  }
  
  // Couleurs pour les graphiques
  const GIFT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];
  const CATEGORY_COLORS = ['#4CAF50', '#2196F3'];
  const STATUS_COLORS = ['#4CAF50', '#FFC107', '#F44336'];
  
  // Données pour les graphiques
  const reservationData = [
    { name: 'Reserved', value: giftStats.reserved },
    { name: 'Available', value: giftStats.available }
  ];
  
  const categoryData = [
    { name: 'Essential', reserved: giftStats.byCategory.essential.reserved, available: giftStats.byCategory.essential.total - giftStats.byCategory.essential.reserved },
    { name: 'Regular', reserved: giftStats.byCategory.regular.reserved, available: giftStats.byCategory.regular.total - giftStats.byCategory.regular.reserved }
  ];
  
  const statusData = [
    { name: 'Available', value: giftStats.byStatus.available },
    { name: 'Partially Reserved', value: giftStats.byStatus.partially },
    { name: 'Fully Reserved', value: giftStats.byStatus.reserved }
  ];
  
  return (
    <div className="gift-stats-container">
      <h2>Gift Statistics</h2>
      
      {/* Statistiques générales */}
      <div className="stats-main-container">
        {/* Colonne de gauche: Métriques clés */}
        <div className="stats-column stats-left-column">
          <div className="stats-dashboard">
            <h3 className="section-title">Gift Summary</h3>
            <div className="stats-cards vertical">
              <div className="stats-card">
                <div className="stats-card-icon">
                  <FontAwesomeIcon icon={faGift} />
                </div>
                <div className="stats-card-content">
                  <h3>Total Gifts</h3>
                  <div className="stats-value">{giftStats.total}</div>
                </div>
              </div>
              
              <div className="stats-card">
                <div className="stats-card-icon">
                  <FontAwesomeIcon icon={faShoppingBag} />
                </div>
                <div className="stats-card-content">
                  <h3>Reserved Gifts</h3>
                  <div className="stats-value">{giftStats.reserved}</div>
                  <div className="stats-subtitle">{giftStats.reservationPercentage}%</div>
                </div>
              </div>
              
              <div className="stats-card">
                <div className="stats-card-icon">
                  <FontAwesomeIcon icon={faStar} />
                </div>
                <div className="stats-card-content">
                  <h3>Popular Category</h3>
                  <div className="stats-value">{giftStats.mostPopularCategory}</div>
                </div>
              </div>

              {/* Carte de détails */}
              <div className="stats-detail-card">
                <h4>Reservation Rates</h4>
                <div className="stats-detail-item">
                  <span className="detail-label">Overall:</span>
                  <span className="detail-value">{giftStats.reservationPercentage}%</span>
                </div>
                <div className="stats-detail-item">
                  <span className="detail-label">Essential Gifts:</span>
                  <span className="detail-value yes-text">{giftStats.byCategory.essential.rate}%</span>
                </div>
                <div className="stats-detail-item">
                  <span className="detail-label">Regular Gifts:</span>
                  <span className="detail-value">{giftStats.byCategory.regular.rate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Colonne de droite: Graphiques */}
        <div className="stats-column stats-right-column">
          <div className="stats-charts-stacked">
            <ActivePieChart 
              data={reservationData} 
              dataKey="value" 
              nameKey="name" 
              colors={GIFT_COLORS} 
              title="Gift Reservation Status"
            />
            
            <ActivePieChart 
              data={statusData} 
              dataKey="value" 
              nameKey="name" 
              colors={STATUS_COLORS} 
              title="Gift Status Distribution"
            />
          </div>
        </div>
      </div>
      
      {/* Graphiques de détail */}
      <div className="stats-charts-row">
        {/* Graphique des catégories */}
        <div className="chart-container">
          <h3>Gifts by Category</h3>
          <div style={{ width: '100%', height: '300px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barSize={40}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Gifts']} />
                <Legend />
                <Bar dataKey="reserved" stackId="a" fill="#8884d8" name="Reserved">
                  <LabelList dataKey="reserved" position="inside" fill="#fff" />
                </Bar>
                <Bar dataKey="available" stackId="a" fill="#82ca9d" name="Available">
                  <LabelList dataKey="available" position="inside" fill="#fff" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Graphique des tendances */}
        {trendData.length > 0 && (
          <div className="chart-container">
            <h3>Reservation Trends</h3>
            <div style={{ width: '100%', height: '300px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Reservations']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Reservations" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
      
      {/* Graphique des cadeaux les plus populaires */}
      {giftStats.topReserved.length > 0 && (
        <div className="chart-container full-width">
          <h3>Most Popular Gifts</h3>
          <div style={{ width: '100%', height: '400px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={giftStats.topReserved}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip 
                  formatter={(value, name, props) => {
                    const item = props.payload;
                    return [
                      `${item.reservations} reservations (${item.percentage}%)`
                    ];
                  }} 
                />
                <Bar dataKey="reservations" fill="#8884d8">
                  <LabelList dataKey="reservations" position="right" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftStats;
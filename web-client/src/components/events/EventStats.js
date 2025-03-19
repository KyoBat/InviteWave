// src/components/events/EventStats.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { eventService } from '../../services';
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer, Legend, Tooltip, 
  XAxis, YAxis, CartesianGrid, 
  LabelList, Sector 
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faCheckCircle, faTimesCircle, 
  faQuestionCircle, faClock, faGift, faShoppingBag,
  faStar, faChartLine, faPercentage, faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/EventStats.css';
import giftStatsService from '../../services/giftStatsService';

// Fonction pour créer un Pie Chart avec animation au survol
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

  // Filtrer les données à valeur 0 pour éviter les segments vides
  const filteredData = data.filter(item => item.value > 0);

  // Si aucune donnée valide, afficher un message
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

const EventStats = () => {
  const [stats, setStats] = useState(null);
  const [giftStats, setGiftStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { id } = useParams();
  
  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        // Fetch event stats
        const eventStatsData = await eventService.getEventStats(id);
        setStats(eventStatsData);
        
        // Récupérer les statistiques des cadeaux avec le service
        try {
          const giftStatsData = await giftStatsService.getGiftStats(id);
          setGiftStats(giftStatsData);
          
          // Récupérer les tendances de réservation si disponibles
          try {
            const trendsResponse = await giftStatsService.getReservationTrends(id);
            if (trendsResponse && trendsResponse.trendData) {
              setTrendData(trendsResponse.trendData);
            }
          } catch (trendError) {
            console.error('Error fetching trend data:', trendError);
            setTrendData([]);
          }
          
        } catch (giftError) {
          console.error('Error fetching gift stats:', giftError);
          // Ne pas bloquer le reste de l'interface si les statistiques des cadeaux échouent
          setGiftStats({
            total: 0,
            reserved: 0,
            available: 0,
            reservationPercentage: 0,
            byCategory: {
              essential: { total: 0, reserved: 0, rate: 0 },
              regular: { total: 0, reserved: 0, rate: 0 }
            },
            byStatus: {
              available: 0,
              partially: 0,
              reserved: 0
            },
            topReserved: []
          });
        }
      } catch (error) {
        setError('Failed to load statistics');
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllStats();
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
  
  // Couleurs pour les graphiques - palette cohérente et accessible
  const RESPONSE_COLORS = ['#4CAF50', '#F44336', '#FF9800', '#9E9E9E'];
  const INVITATION_COLORS = ['#2196F3', '#9E9E9E', '#F44336'];
  const GIFT_COLORS = ['#8884d8', '#82ca9d'];
  const STATUS_COLORS = ['#4CAF50', '#FF9800', '#F44336']; // Vert, Orange, Rouge
  
  // Préparer les données pour les graphiques
  const responseData = [
    { name: 'Yes', value: stats.responses.yes, icon: faCheckCircle },
    { name: 'No', value: stats.responses.no, icon: faTimesCircle },
    { name: 'Maybe', value: stats.responses.maybe, icon: faQuestionCircle },
    { name: 'Pending', value: stats.responses.pending, icon: faClock }
  ];
  
  const invitationStatusData = [
    { name: 'Sent', value: stats.sent, icon: faUsers },
    { name: 'Pending', value: stats.pending, icon: faClock },
    { name: 'Failed', value: stats.failed, icon: faTimesCircle }
  ];
  
  // Données pour les cadeaux
  const giftStatusData = [
    { name: 'Reserved', value: giftStats?.reserved || 0 },
    { name: 'Available', value: giftStats?.available || 0 }
  ];
  
  // Données pour le graphique à barres des catégories de cadeaux
  const giftCategoryData = giftStats?.byCategory ? Object.entries(giftStats.byCategory).map(([category, data]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    reserved: data.reserved,
    available: data.total - data.reserved
  })) : [];
  
  // Données pour le graphique des cadeaux les plus réservés
  const topGiftsData = giftStats?.topReserved || [];
  
  // Données pour la distribution des statuts des cadeaux
  const giftStatusDistributionData = [
    { name: 'Available', value: giftStats?.byStatus?.available || 0 },
    { name: 'Partially', value: giftStats?.byStatus?.partially || 0 },
    { name: 'Reserved', value: giftStats?.byStatus?.reserved || 0 }
  ];
  
  return (
    <div className="event-stats-container">
      <h2>Event Statistics</h2>
      
      {/* Nouvelle mise en page divisée pour les statistiques d'événement */}
      <div className="stats-main-container">
        {/* Colonne de gauche: Cartes de statistiques */}
        <div className="stats-column stats-left-column">
          <div className="stats-dashboard">
            <h3 className="section-title">Guest Statistics</h3>
            <div className="stats-cards vertical">
              <div className="stats-card">
                <div className="stats-card-icon">
                  <FontAwesomeIcon icon={faUsers} />
                </div>
                <div className="stats-card-content">
                  <h3>Total Invitations</h3>
                  <div className="stats-value">{stats.total}</div>
                </div>
              </div>
              
              <div className="stats-card">
                <div className="stats-card-icon">
                  <FontAwesomeIcon icon={faCheckCircle} />
                </div>
                <div className="stats-card-content">
                  <h3>Confirmed Attendees</h3>
                  <div className="stats-value">{stats.responses.yes}</div>
                </div>
              </div>

              {/* Carte de détails des réponses */}
              <div className="stats-detail-card">
                <h4>Response Summary</h4>
                <div className="stats-detail-item">
                  <span className="detail-label">Yes:</span>
                  <span className="detail-value yes-text">{stats.responses.yes}</span>
                </div>
                <div className="stats-detail-item">
                  <span className="detail-label">No:</span>
                  <span className="detail-value no-text">{stats.responses.no}</span>
                </div>
                <div className="stats-detail-item">
                  <span className="detail-label">Maybe:</span>
                  <span className="detail-value maybe-text">{stats.responses.maybe}</span>
                </div>
                <div className="stats-detail-item">
                  <span className="detail-label">Pending:</span>
                  <span className="detail-value pending-text">{stats.responses.pending}</span>
                </div>
                <div className="stats-detail-item">
                  <span className="detail-label">Response rate:</span>
                  <span className="detail-value">
                    {stats.total > 0 
                      ? `${Math.round(((stats.responses.yes + stats.responses.no + stats.responses.maybe) / stats.total) * 100)}%` 
                      : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Colonne de droite: Graphiques */}
        <div className="stats-column stats-right-column">
          <div className="stats-charts-stacked">
            <ActivePieChart 
              data={responseData} 
              dataKey="value" 
              nameKey="name" 
              colors={RESPONSE_COLORS} 
              title="Response Distribution"
            />
            
            <ActivePieChart 
              data={invitationStatusData} 
              dataKey="value" 
              nameKey="name" 
              colors={INVITATION_COLORS} 
              title="Invitation Status"
            />
          </div>
        </div>
      </div>
      
      {/* Section des statistiques de cadeaux */}
      <div className="gift-stats-section">
        <h2>Gift Statistics</h2>
        
        <div className="stats-main-container">
          {/* Colonne de gauche: Résumé des cadeaux */}
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
                    <div className="stats-value">{giftStats?.total || 0}</div>
                  </div>
                </div>
                
                <div className="stats-card">
                  <div className="stats-card-icon">
                    <FontAwesomeIcon icon={faShoppingBag} />
                  </div>
                  <div className="stats-card-content">
                    <h3>Reserved Gifts</h3>
                    <div className="stats-value">{giftStats?.reserved || 0}</div>
                    <div className="stats-subtitle">
                      {giftStats?.total > 0 
                        ? `${Math.round((giftStats.reserved / giftStats.total) * 100)}%` 
                        : '0%'}
                    </div>
                  </div>
                </div>
                
                {/* Carte catégorie populaire */}
                {giftStats?.mostPopularCategory && (
                  <div className="stats-card">
                    <div className="stats-card-icon">
                      <FontAwesomeIcon icon={faStar} />
                    </div>
                    <div className="stats-card-content">
                      <h3>Popular Category</h3>
                      <div className="stats-value">{giftStats.mostPopularCategory}</div>
                    </div>
                  </div>
                )}

                {/* Carte des taux de réservation améliorée */}
                <div className="stats-detail-card">
                  <h4>Reservation Rates</h4>
                  <div className="stats-detail-item">
                    <span className="detail-label">Total Gifts:</span>
                    <span className="detail-value">{giftStats?.total || 0}</span>
                  </div>
                  <div className="stats-detail-item">
                    <span className="detail-label">Reserved:</span>
                    <span className="detail-value yes-text">{giftStats?.reserved || 0}</span>
                  </div>
                  <div className="stats-detail-item">
                    <span className="detail-label">Available:</span>
                    <span className="detail-value">{giftStats?.available || 0}</span>
                  </div>
                  <div className="stats-detail-item">
                    <span className="detail-label">Overall rate:</span>
                    <span className="detail-value">
                      {giftStats?.total > 0 
                        ? `${Math.round((giftStats.reserved / giftStats.total) * 100)}%` 
                        : '0%'}
                    </span>
                  </div>
                  {giftStats?.byCategory?.essential && (
                    <div className="stats-detail-item">
                      <span className="detail-label">Essential Gifts:</span>
                      <span className="detail-value yes-text">{giftStats.byCategory.essential.rate || 0}%</span>
                    </div>
                  )}
                  {giftStats?.byCategory?.regular && (
                    <div className="stats-detail-item">
                      <span className="detail-label">Regular Gifts:</span>
                      <span className="detail-value">{giftStats.byCategory.regular.rate || 0}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Colonne de droite: Graphique des cadeaux */}
          <div className="stats-column stats-right-column">
            <div className="stats-charts-stacked">
              {/* Premier graphique: Statut des réservations */}
              <div className="chart-container" style={{ marginBottom: '20px' }}>
                <h3>Gift Reservation Status</h3>
                <div style={{ width: '100%', height: '250px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={giftStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {giftStatusData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={GIFT_COLORS[index % GIFT_COLORS.length]} 
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
              
              {/* Deuxième graphique: Cadeaux par catégorie */}
              {giftCategoryData.length > 0 && (
                <div className="chart-container">
                  <h3>Gifts by Category</h3>
                  <div style={{ width: '100%', height: '250px', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={giftCategoryData}
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
              )}
              
              {/* Troisième graphique: Distribution des statuts */}
              {giftStatusDistributionData.some(item => item.value > 0) && (
                <div className="chart-container">
                  <h3>Gift Status Distribution</h3>
                  <div style={{ width: '100%', height: '250px', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={giftStatusDistributionData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {giftStatusDistributionData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={STATUS_COLORS[index % STATUS_COLORS.length]} 
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
              )}
            </div>
          </div>
        </div>
        
        {/* Graphiques de tendances */}
        {trendData && trendData.length > 0 && (
          <div className="chart-container full-width" style={{ marginTop: '30px' }}>
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
        
        {/* Graphique des cadeaux les plus populaires */}
        {topGiftsData.length > 0 && (
          <div className="chart-container full-width" style={{ marginTop: '30px' }}>
            <h3>Most Popular Gifts</h3>
            <div style={{ width: '100%', height: '300px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topGiftsData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip formatter={(value) => [value, 'Reservations']} />
                  <Bar dataKey="reservations" fill="#8884d8">
                    <LabelList dataKey="reservations" position="right" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
      
      {/* Tableau des statistiques par catégorie d'invités */}
      {stats.byCategory && Object.keys(stats.byCategory).length > 0 && (
        <div className="category-stats">
          <h3>Stats by Guest Category</h3>
          <div className="table-container">
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
                      <td className="category-name">{category.charAt(0).toUpperCase() + category.slice(1)}</td>
                      <td>{data.total}</td>
                      <td className="yes-cell">{data.responses.yes}</td>
                      <td className="no-cell">{data.responses.no}</td>
                      <td className="maybe-cell">{data.responses.maybe}</td>
                      <td className="pending-cell">{data.responses.pending}</td>
                      <td className="rate-cell">
                        <div className="progress-bar-container">
                          <div 
                            className="progress-bar" 
                            style={{ width: `${responseRate}%`, backgroundColor: '#4CAF50' }}
                          ></div>
                          <span className="progress-text">{responseRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventStats;
// src/components/events/QuickStats.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartPie, 
  faUser, 
  faGift, 
  faCalendar, 
  faExternalLinkAlt,
  faCheckCircle,
  faShoppingBag,
  faTag,
  faStar,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import giftStatsService from '../../services/giftStatsService';

const QuickStats = ({ eventId, stats = {} }) => {
  const [giftStats, setGiftStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Valeurs par défaut si les stats d'invités ne sont pas fournies
  const {
    totalGuests = 0,
    attending = 0,
    declined = 0,
    maybe = 0,
    notResponded = 0
  } = stats;
  
  useEffect(() => {
    const fetchGiftStats = async () => {
      try {
        setLoading(true);
        const response = await giftStatsService.getQuickGiftStats(eventId);
        setGiftStats(response);
      } catch (error) {
        console.error('Error fetching gift statistics:', error);
        // Utiliser des valeurs par défaut si l'API échoue
        setGiftStats({
          totalGifts: stats.totalGifts || 0,
          reservedGifts: stats.reservedGifts || 0,
          availableGifts: stats.availableGifts || 0,
          reservationPercentage: stats.reservationPercentage || 0,
          mostPopularCategory: stats.mostPopularCategory || 'None',
          overallStatus: 'Unknown'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchGiftStats();
  }, [eventId, stats]);
  
  // Récupérer les valeurs de statistiques de cadeaux (soit du service, soit des props)
  const totalGifts = giftStats?.totalGifts || stats.totalGifts || 0;
  const reservedGifts = giftStats?.reservedGifts || stats.reservedGifts || 0;
  const availableGifts = giftStats?.availableGifts || (totalGifts - reservedGifts) || 0;
  const reservationPercentage = giftStats?.reservationPercentage || stats.reservationPercentage || 0;
  const mostPopularCategory = giftStats?.mostPopularCategory || stats.mostPopularCategory || 'None';
  const overallStatus = giftStats?.overallStatus || 'Unknown';
  
  // Déterminer la classe de statut pour l'affichage
  const getStatusClass = (status) => {
    switch(status) {
      case 'Excellent':
        return 'status-excellent';
      case 'Good':
        return 'status-good';
      case 'Fair':
        return 'status-fair';
      case 'Needs Attention':
        return 'status-attention';
      default:
        return 'status-unknown';
    }
  };
  
  return (
    <div className="quick-stats-container">
      <div className="quick-stats-header">
        <h3>
          <FontAwesomeIcon icon={faChartPie} className="icon-primary" />
          Quick Stats
        </h3>
        <Link 
          to={`/events/${eventId}/stats`}
          className="view-all-link"
        >
          View all statistics
          <FontAwesomeIcon icon={faExternalLinkAlt} className="icon-small" />
        </Link>
      </div>
      
      <div className="quick-stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <FontAwesomeIcon icon={faUser} className="icon-primary" />
            <h4>Guests</h4>
          </div>
          <div className="stat-card-content">
            <div className="stat-item">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{totalGuests}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Attending:</span>
              <span className="stat-value status-positive">{attending}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Awaiting:</span>
              <span className="stat-value status-pending">{notResponded}</span>
            </div>
            {maybe > 0 && (
              <div className="stat-item">
                <span className="stat-label">Maybe:</span>
                <span className="stat-value status-maybe">{maybe}</span>
              </div>
            )}
            {declined > 0 && (
              <div className="stat-item">
                <span className="stat-label">Declined:</span>
                <span className="stat-value status-negative">{declined}</span>
              </div>
            )}
            {totalGuests > 0 && (
              <div className="stat-item stat-percentage">
                <span className="stat-label">Response rate:</span>
                <span className="stat-value status-info">
                  {Math.round(((attending + declined + maybe) / totalGuests) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <FontAwesomeIcon icon={faGift} className="icon-primary" />
            <h4>Gifts</h4>
            {!loading && overallStatus !== 'Unknown' && (
              <span className={`status-badge ${getStatusClass(overallStatus)}`}>
                {overallStatus}
              </span>
            )}
          </div>
          <div className="stat-card-content">
            <div className="stat-item">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{totalGifts}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Reserved:</span>
              <span className="stat-value status-positive">{reservedGifts}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Available:</span>
              <span className="stat-value status-info">{availableGifts}</span>
            </div>
            <div className="stat-item stat-percentage">
              <span className="stat-label">Reservation:</span>
              <span className="stat-value">
                {reservationPercentage}%
              </span>
            </div>
            {mostPopularCategory !== 'None' && (
              <div className="stat-item">
                <span className="stat-label">
                  <FontAwesomeIcon icon={faStar} className="icon-small" />
                  Popular:
                </span>
                <span className="stat-value status-highlight">{mostPopularCategory}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="quick-stats-footer">
        <Link 
          to={`/events/${eventId}/stats`}
          className="view-stats-button"
        >
          <FontAwesomeIcon icon={faCalendar} className="icon-small" />
          View Detailed Statistics
        </Link>
      </div>
    </div>
  );
};

export default QuickStats;
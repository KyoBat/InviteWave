// src/services/giftStatsService.js
import { getGiftItems } from './gift';

/**
 * Service pour récupérer et analyser les statistiques des cadeaux
 */
const giftStatsService = {
  /**
   * Récupère les statistiques complètes des cadeaux pour un événement
   * @param {string} eventId - ID de l'événement
   * @returns {Promise<Object>} - Objet contenant les statistiques des cadeaux
   */
  getGiftStats: async (eventId) => {
    try {
      // Récupérer tous les cadeaux de l'événement
      const response = await getGiftItems(eventId);
      
      if (!response || !response.data || !Array.isArray(response.data.data)) {
        throw new Error('Invalid response format from API');
      }
      
      const gifts = response.data.data;
      
      // Initialiser les statistiques
      const stats = {
        total: gifts.length,
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
      };
      
      // Calculer les statistiques de base
      gifts.forEach(gift => {
        // Quantité disponible/réservée
        const reserved = gift.quantityReserved || 0;
        const total = gift.quantity || 0;
        
        stats.reserved += reserved;
        stats.available += (total - reserved);
        
        // Statistiques par catégorie
        const category = gift.isEssential ? 'essential' : 'regular';
        stats.byCategory[category].total += total;
        stats.byCategory[category].reserved += reserved;
        
        // Statistiques par statut
        if (gift.status) {
          stats.byStatus[gift.status] = (stats.byStatus[gift.status] || 0) + 1;
        }
        
        // Collecter les données pour les cadeaux les plus réservés
        if (gift.reservations && gift.reservations.length > 0) {
          stats.topReserved.push({
            name: gift.name,
            reservations: gift.reservations.length,
            quantity: gift.quantity,
            quantityReserved: gift.quantityReserved,
            percentage: Math.round((gift.quantityReserved / gift.quantity) * 100)
          });
        }
      });
      
      // Calculer le pourcentage global de réservation
      const totalQuantity = stats.reserved + stats.available;
      stats.reservationPercentage = totalQuantity > 0 
        ? Math.round((stats.reserved / totalQuantity) * 100) 
        : 0;
      
      // Trier les cadeaux les plus réservés par nombre de réservations
      stats.topReserved.sort((a, b) => b.reservations - a.reservations);
      
      // Limiter à 10 résultats maximum
      stats.topReserved = stats.topReserved.slice(0, 10);
      
      // Ajouter des statistiques avancées
      stats.mostPopularCategory = stats.byCategory.essential.reserved > stats.byCategory.regular.reserved
        ? 'Essential'
        : 'Regular';
      
      // Taux de réservation par catégorie
      stats.byCategory.essential.rate = stats.byCategory.essential.total > 0 
        ? Math.round((stats.byCategory.essential.reserved / stats.byCategory.essential.total) * 100) 
        : 0;
        
      stats.byCategory.regular.rate = stats.byCategory.regular.total > 0 
        ? Math.round((stats.byCategory.regular.reserved / stats.byCategory.regular.total) * 100) 
        : 0;
      
      // Ajouter des statistiques additionnelles pour les insights
      stats.insights = {
        completionRate: Math.round(stats.reservationPercentage),
        mostReservedGift: stats.topReserved.length > 0 ? stats.topReserved[0].name : 'None',
        leastReservedCategory: stats.byCategory.essential.rate <= stats.byCategory.regular.rate ? 'Essential' : 'Regular',
        needsAttention: stats.reservationPercentage < 50
      };
      
      // Calculer le nombre moyen de réservations par cadeau
      const giftsWithReservations = gifts.filter(gift => gift.reservations && gift.reservations.length > 0);
      stats.averageReservationsPerGift = giftsWithReservations.length > 0
        ? Math.round((stats.reserved / giftsWithReservations.length) * 10) / 10
        : 0;
      
      // Identifier le statut global de la liste de cadeaux
      if (stats.reservationPercentage >= 80) {
        stats.overallStatus = 'Excellent';
      } else if (stats.reservationPercentage >= 50) {
        stats.overallStatus = 'Good';
      } else if (stats.reservationPercentage >= 30) {
        stats.overallStatus = 'Fair';
      } else {
        stats.overallStatus = 'Needs Attention';
      }
      
      return stats;
    } catch (error) {
      console.error('Error retrieving gift statistics:', error);
      throw error;
    }
  },
  
  /**
   * Récupère des statistiques simplifiées pour le widget QuickStats
   * @param {string} eventId - ID de l'événement
   * @returns {Promise<Object>} - Statistiques simplifiées
   */
  getQuickGiftStats: async (eventId) => {
    try {
      const stats = await giftStatsService.getGiftStats(eventId);
      
      return {
        totalGifts: stats.total,
        reservedGifts: stats.reserved,
        availableGifts: stats.available,
        reservationPercentage: stats.reservationPercentage,
        mostPopularCategory: stats.mostPopularCategory,
        overallStatus: stats.overallStatus,
        needsAttention: stats.insights.needsAttention
      };
    } catch (error) {
      console.error('Error retrieving quick gift statistics:', error);
      return {
        totalGifts: 0,
        reservedGifts: 0,
        availableGifts: 0,
        reservationPercentage: 0,
        overallStatus: 'Unknown'
      };
    }
  },
  
  /**
   * Analyse les tendances de réservation des cadeaux dans le temps
   * @param {string} eventId - ID de l'événement
   * @returns {Promise<Object>} - Données de tendance
   */
  getReservationTrends: async (eventId) => {
    try {
      const response = await getGiftItems(eventId);
      
      if (!response || !response.data || !Array.isArray(response.data.data)) {
        throw new Error('Invalid response format from API');
      }
      
      const gifts = response.data.data;
      
      // Créer un dictionnaire des réservations groupées par date
      const reservationsByDate = {};
      
      gifts.forEach(gift => {
        if (gift.reservations && Array.isArray(gift.reservations)) {
          gift.reservations.forEach(reservation => {
            if (reservation.createdAt) {
              // Extraire la date (sans l'heure)
              const date = new Date(reservation.createdAt).toISOString().split('T')[0];
              
              if (!reservationsByDate[date]) {
                reservationsByDate[date] = 0;
              }
              
              reservationsByDate[date] += reservation.quantity || 1;
            }
          });
        }
      });
      
      // Convertir en tableau pour le graphique
      const trendData = Object.entries(reservationsByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Calculer les statistiques de tendance
      const totalReservations = trendData.reduce((sum, item) => sum + item.count, 0);
      const peakDay = trendData.length > 0 
        ? trendData.reduce((max, item) => item.count > max.count ? item : max, { count: 0 }).date 
        : null;
      const peakCount = trendData.length > 0 
        ? trendData.reduce((max, item) => item.count > max.count ? item : max, { count: 0 }).count 
        : 0;
      
      // Calculer la moyenne journalière
      const avgDailyReservations = trendData.length > 0
        ? Math.round((totalReservations / trendData.length) * 10) / 10
        : 0;
      
      // Calculer la tendance (croissance ou décroissance)
      let trend = 'stable';
      if (trendData.length >= 3) {
        // Comparer la moyenne des 3 derniers jours avec la moyenne des jours précédents
        const recentDays = trendData.slice(-3);
        const previousDays = trendData.slice(0, -3);
        
        if (recentDays.length > 0 && previousDays.length > 0) {
          const recentAvg = recentDays.reduce((sum, item) => sum + item.count, 0) / recentDays.length;
          const previousAvg = previousDays.reduce((sum, item) => sum + item.count, 0) / previousDays.length;
          
          if (recentAvg > previousAvg * 1.2) {
            trend = 'increasing';
          } else if (recentAvg < previousAvg * 0.8) {
            trend = 'decreasing';
          }
        }
      }
      
      return {
        trendData,
        totalDays: trendData.length,
        totalReservations,
        peakDay,
        peakCount,
        averageDailyReservations: avgDailyReservations,
        trend,
        lastUpdateDate: trendData.length > 0 ? trendData[trendData.length - 1].date : null
      };
    } catch (error) {
      console.error('Error retrieving reservation trends:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les catégories de cadeaux les plus populaires
   * @param {string} eventId - ID de l'événement
   * @returns {Promise<Array>} - Tableau des catégories triées par popularité
   */
  getPopularCategories: async (eventId) => {
    try {
      const stats = await giftStatsService.getGiftStats(eventId);
      
      // Convertir les catégories en tableau pour faciliter le tri
      const categories = Object.entries(stats.byCategory).map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        total: data.total,
        reserved: data.reserved,
        rate: data.rate,
        popularity: data.reserved * (data.rate / 100) // Formule de popularité combinant réservations et taux
      }));
      
      // Trier par popularité
      categories.sort((a, b) => b.popularity - a.popularity);
      
      return categories;
    } catch (error) {
      console.error('Error retrieving popular categories:', error);
      return [];
    }
  },
  
  /**
   * Compare les statistiques de cadeaux entre deux événements
   * @param {string} eventId1 - ID du premier événement
   * @param {string} eventId2 - ID du second événement
   * @returns {Promise<Object>} - Comparaison des statistiques
   */
  compareEventGiftStats: async (eventId1, eventId2) => {
    try {
      const stats1 = await giftStatsService.getGiftStats(eventId1);
      const stats2 = await giftStatsService.getGiftStats(eventId2);
      
      return {
        event1: {
          total: stats1.total,
          reserved: stats1.reserved,
          reservationPercentage: stats1.reservationPercentage
        },
        event2: {
          total: stats2.total,
          reserved: stats2.reserved,
          reservationPercentage: stats2.reservationPercentage
        },
        difference: {
          total: stats2.total - stats1.total,
          reserved: stats2.reserved - stats1.reserved,
          reservationPercentage: stats2.reservationPercentage - stats1.reservationPercentage
        }
      };
    } catch (error) {
      console.error('Error comparing event gift statistics:', error);
      throw error;
    }
  },
  
  /**
   * Génère des recommandations pour améliorer les réservations de cadeaux
   * @param {string} eventId - ID de l'événement
   * @returns {Promise<Array>} - Tableau de recommandations
   */
  getGiftRecommendations: async (eventId) => {
    try {
      const stats = await giftStatsService.getGiftStats(eventId);
      const recommendations = [];
      
      // Recommandations basées sur le taux de réservation global
      if (stats.reservationPercentage < 30) {
        recommendations.push({
          type: 'critical',
          message: 'Le taux de réservation est très bas. Envisagez d\'envoyer un rappel aux invités.'
        });
      } else if (stats.reservationPercentage < 50) {
        recommendations.push({
          type: 'warning',
          message: 'Le taux de réservation pourrait être amélioré. Partagez la liste de cadeaux avec plus d\'invités.'
        });
      }
      
      // Recommandations basées sur les catégories
      if (stats.byCategory.essential.rate < 50) {
        recommendations.push({
          type: 'warning',
          message: 'Les cadeaux essentiels ne sont pas assez réservés. Mettez-les en avant auprès des invités.'
        });
      }
      
      // Recommandations basées sur les données de tendance
      if (stats.insights && stats.insights.needsAttention) {
        recommendations.push({
          type: 'info',
          message: 'Considérez l\'ajout de cadeaux plus abordables pour augmenter le taux de réservation.'
        });
      }
      
      // Si pas de problèmes majeurs
      if (recommendations.length === 0 && stats.reservationPercentage >= 70) {
        recommendations.push({
          type: 'success',
          message: 'Votre liste de cadeaux fonctionne bien! La plupart des cadeaux sont réservés.'
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error generating gift recommendations:', error);
      return [];
    }
  }
};

export default giftStatsService;
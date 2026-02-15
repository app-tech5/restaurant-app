import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Icon, Rating } from 'react-native-elements';
import { ScreenHeader, EmptyState } from '../components';
import { colors, constants } from '../global';
import i18n from '../i18n';

const ReviewsScreen = ({ navigation }) => {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);

  // Données simulées d'avis clients
  const sampleReviews = [
    {
      id: '1',
      customer: i18n.t('reviews.sampleReviews.review1.customer'),
      rating: i18n.t('reviews.sampleReviews.review1.rating'),
      comment: i18n.t('reviews.sampleReviews.review1.comment'),
      date: i18n.t('reviews.sampleReviews.review1.date'),
      verified: true,
      helpful: 12,
    },
    {
      id: '2',
      customer: i18n.t('reviews.sampleReviews.review2.customer'),
      rating: i18n.t('reviews.sampleReviews.review2.rating'),
      comment: i18n.t('reviews.sampleReviews.review2.comment'),
      date: i18n.t('reviews.sampleReviews.review2.date'),
      verified: true,
      helpful: 8,
    },
    {
      id: '3',
      customer: i18n.t('reviews.sampleReviews.review3.customer'),
      rating: i18n.t('reviews.sampleReviews.review3.rating'),
      comment: i18n.t('reviews.sampleReviews.review3.comment'),
      date: i18n.t('reviews.sampleReviews.review3.date'),
      verified: true,
      helpful: 15,
    },
    {
      id: '4',
      customer: i18n.t('reviews.sampleReviews.review4.customer'),
      rating: i18n.t('reviews.sampleReviews.review4.rating'),
      comment: i18n.t('reviews.sampleReviews.review4.comment'),
      date: i18n.t('reviews.sampleReviews.review4.date'),
      verified: false,
      helpful: 3,
    },
    {
      id: '5',
      customer: i18n.t('reviews.sampleReviews.review5.customer'),
      rating: i18n.t('reviews.sampleReviews.review5.rating'),
      comment: i18n.t('reviews.sampleReviews.review5.comment'),
      date: i18n.t('reviews.sampleReviews.review5.date'),
      verified: true,
      helpful: 9,
    },
  ];

  useEffect(() => {
    // Simulation du chargement des avis
    const loadReviews = async () => {
      setLoading(true);
      // Simulation d'un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 1000));
      setReviews(sampleReviews);
      setLoading(false);
    };

    loadReviews();
  }, []);

  useEffect(() => {
    // Appliquer les filtres et le tri
    let filtered = [...reviews];

    // Appliquer le filtre
    switch (filter) {
      case 'recent':
        // Les 3 plus récents
        filtered = filtered.slice(0, 3);
        break;
      case 'positive':
        filtered = filtered.filter(review => review.rating >= 4);
        break;
      case 'negative':
        filtered = filtered.filter(review => review.rating <= 2);
        break;
      default:
        break;
    }

    // Appliquer le tri
    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'highest':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
    }

    setFilteredReviews(filtered);
  }, [reviews, filter, sortBy]);

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getRatingLabel = (rating) => {
    if (rating >= 4.5) return i18n.t('reviews.rating.excellent');
    if (rating >= 3.5) return i18n.t('reviews.rating.veryGood');
    if (rating >= 2.5) return i18n.t('reviews.rating.good');
    if (rating >= 1.5) return i18n.t('reviews.rating.average');
    return i18n.t('reviews.rating.poor');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filterOptions = [
    { key: 'all', label: i18n.t('reviews.filters.all') },
    { key: 'recent', label: i18n.t('reviews.filters.recent') },
    { key: 'positive', label: i18n.t('reviews.filters.positive') },
    { key: 'negative', label: i18n.t('reviews.filters.negative') },
  ];

  const sortOptions = [
    { key: 'newest', label: i18n.t('reviews.sort.newest') },
    { key: 'oldest', label: i18n.t('reviews.sort.oldest') },
    { key: 'highest', label: i18n.t('reviews.sort.highest') },
    { key: 'lowest', label: i18n.t('reviews.sort.lowest') },
  ];

  const renderFilterTab = (option) => (
    <TouchableOpacity
      key={option.key}
      style={[
        styles.filterTab,
        filter === option.key && styles.activeFilterTab
      ]}
      onPress={() => setFilter(option.key)}
    >
      <Text style={[
        styles.filterTabText,
        filter === option.key && styles.activeFilterTabText
      ]}>
        {option.label}
      </Text>
    </TouchableOpacity>
  );

  const renderSortButton = () => (
    <TouchableOpacity
      style={styles.sortButton}
      onPress={() => {
        const currentIndex = sortOptions.findIndex(option => option.key === sortBy);
        const nextIndex = (currentIndex + 1) % sortOptions.length;
        setSortBy(sortOptions[nextIndex].key);
      }}
    >
      <Icon name="sort" type="material" size={16} color={colors.primary} />
      <Text style={styles.sortButtonText}>
        {sortOptions.find(option => option.key === sortBy)?.label}
      </Text>
    </TouchableOpacity>
  );

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.customer}</Text>
          {item.verified && (
            <View style={styles.verifiedBadge}>
              <Icon name="verified" type="material" size={12} color={colors.success} />
              <Text style={styles.verifiedText}>{i18n.t('reviews.reviewItem.verified')}</Text>
            </View>
          )}
        </View>
        <View style={styles.reviewMeta}>
          <Rating
            readonly
            startingValue={item.rating}
            imageSize={16}
            ratingColor={colors.warning}
            ratingBackgroundColor={colors.grey[300]}
          />
          <Text style={styles.reviewDate}>{formatDate(item.date)}</Text>
        </View>
      </View>

      <Text style={styles.reviewComment}>{item.comment}</Text>

      <View style={styles.reviewFooter}>
        <TouchableOpacity style={styles.helpfulButton}>
          <Icon name="thumb-up" type="material" size={14} color={colors.grey[500]} />
          <Text style={styles.helpfulText}>
            {i18n.t('reviews.reviewItem.helpful')} ({item.helpful})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStatsHeader = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.averageRating}>{getAverageRating()}</Text>
        <Rating
          readonly
          startingValue={parseFloat(getAverageRating())}
          imageSize={20}
          ratingColor={colors.warning}
          ratingBackgroundColor={colors.grey[300]}
        />
        <Text style={styles.statLabel}>{i18n.t('reviews.averageRating')}</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.totalReviews}>
          {reviews.length}
        </Text>
        <Text style={styles.statLabel}>
          {i18n.t('reviews.totalReviews', { count: reviews.length })}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title={i18n.t('reviews.title')}
          showBackButton
          onLeftPress={() => navigation.goBack()}
        />
        <EmptyState
          icon="refresh"
          title={i18n.t('common.loading')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={i18n.t('reviews.title')}
        showBackButton
        onLeftPress={() => navigation.goBack()}
        rightComponent={renderSortButton()}
      />

      {/* Statistiques */}
      {renderStatsHeader()}

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        {filterOptions.map(renderFilterTab)}
      </View>

      {/* Liste des avis */}
      <FlatList
        data={filteredReviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="star-outline"
            title={i18n.t('reviews.empty.title')}
            subtitle={i18n.t('reviews.empty.subtitle')}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grey[50],
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    margin: constants.SPACING.md,
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.md,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.grey[200],
    marginHorizontal: constants.SPACING.md,
  },
  averageRating: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  totalReviews: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: constants.SPACING.md,
    marginBottom: constants.SPACING.md,
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.xs,
  },
  filterTab: {
    flex: 1,
    paddingVertical: constants.SPACING.sm,
    alignItems: 'center',
    borderRadius: constants.BORDER_RADIUS,
  },
  activeFilterTab: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: colors.white,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: constants.SPACING.md,
    paddingVertical: constants.SPACING.sm,
  },
  sortButtonText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: constants.SPACING.xs,
    fontWeight: '500',
  },
  listContainer: {
    padding: constants.SPACING.md,
    flexGrow: 1,
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.md,
    marginBottom: constants.SPACING.md,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: constants.SPACING.sm,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 12,
    color: colors.success,
    marginLeft: 4,
    fontWeight: '500',
  },
  reviewMeta: {
    alignItems: 'flex-end',
  },
  reviewDate: {
    fontSize: 12,
    color: colors.grey[500],
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
    marginBottom: constants.SPACING.sm,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: constants.SPACING.sm,
    paddingVertical: constants.SPACING.xs,
    borderRadius: constants.BORDER_RADIUS,
    backgroundColor: colors.grey[100],
  },
  helpfulText: {
    fontSize: 12,
    color: colors.grey[600],
    marginLeft: 4,
  },
});

export default ReviewsScreen;

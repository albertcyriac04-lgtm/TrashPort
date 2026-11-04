import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Pickup {
  id: number;
  display_id: number;
  status: string;
  weight_kg: string;
  fee: string;
  collector_earnings: string;
  schedule_date: string;
  citizen_details: { name: string; email: string };
  address_details: { address_line1: string; city: string };
  category_details: { name: string };
}

export default function PickupsScreen() {
  const { isAuthenticated } = useAuth();
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (isAuthenticated) {
      loadPickups();
    }
  }, [isAuthenticated, filter]);

  const loadPickups = async () => {
    try {
      const response = await api.get('/pickup-requests/', {
        params: { collector: 'me', status: filter !== 'all' ? filter : undefined },
      });
      setPickups(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load pickups:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPickups();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#2196F3';
      case 'ASSIGNED': return '#FF9800';
      case 'IN_TRANSIT': return '#9C27B0';
      case 'COMPLETED': return '#4CAF50';
      case 'CANCELLED': return '#F44336';
      default: return '#999';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AWAITING_PAYMENT': return 'Awaiting Payment';
      case 'ON_ROUTE': return 'On Route';
      case 'PICKED_UP': return 'Picked Up';
      default: return status.charAt(0) + status.slice(1).toLowerCase();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2d', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (!isAuthenticated) return null;

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'PENDING', 'ASSIGNED', 'IN_TRANSIT', 'COMPLETED'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterTab,
              filter === f && styles.filterTabActive,
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === f && styles.filterTabTextActive,
              ]}
            >
              {f === 'all' ? 'All' : getStatusLabel(f)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pickups List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : pickups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trash-outline" size={64} color="#DDD" />
          <Text style={styles.emptyText}>
            {filter === 'all' ? 'No pickups found' : `No ${getStatusLabel(filter).toLowerCase()} pickups`}
          </Text>
          <Text style={styles.emptySubtext}>Pull to refresh</Text>
        </View>
      ) : (
        <FlatList
          data={pickups}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.pickupCard}
              onPress={() => router.push(`/pickup/${item.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.pickupHeader}>
                <View style={styles.pickupId}>
                  <Text style={styles.pickupIdLabel}>Pickup #{item.display_id}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(item.status)}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: getStatusColor(item.status) },
                      ]}
                    >
                      {getStatusLabel(item.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.pickupEarnings}>₹{item.collector_earnings}</Text>
              </View>

              <View style={styles.pickupDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={16} color="#999" style={{ marginRight: 8 }} />
                  <Text style={styles.detailText}>{item.citizen_details?.name || 'Unknown'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={16} color="#999" style={{ marginRight: 8 }} />
                  <Text style={styles.detailText}>
                    {item.address_details?.address_line1}, {item.address_details?.city}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color="#999" style={{ marginRight: 8 }} />
                  <Text style={styles.detailText}>{formatDate(item.schedule_date)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="pricetag-outline" size={16} color="#999" style={{ marginRight: 8 }} />
                  <Text style={styles.detailText}>
                    {item.category_details?.name} • {item.weight_kg} kg
                  </Text>
                </View>
              </View>

              {item.status === 'ASSIGNED' && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    Alert.alert(
                      'Start Pickup',
                      'Mark this pickup as in transit?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Start', onPress: () => updatePickupStatus(item.id, 'IN_TRANSIT') },
                      ]
                    );
                  }}
                >
                  <Ionicons name="play-outline" size={16} color="white" style={{ marginRight: 6 }} />
                  <Text style={styles.actionButtonText}>Start Pickup</Text>
                </TouchableOpacity>
              )}

              {item.status === 'IN_TRANSIT' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonComplete]}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/pickup/${item.id}/complete`);
                  }}
                >
                  <Ionicons name="checkmark-outline" size={16} color="white" style={{ marginRight: 6 }} />
                  <Text style={styles.actionButtonText}>Complete</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="trash-outline" size={64} color="#DDD" />
              <Text style={styles.emptyText}>No pickups found</Text>
            </View>
          }
        />
      )}
    </ScrollView>
  );
}

const updatePickupStatus = async (pickupId: number, status: string) => {
  try {
    await api.patch(`/pickup-requests/${pickupId}/`, { status });
    Alert.alert('Success', 'Pickup status updated');
  } catch (error) {
    Alert.alert('Error', 'Failed to update status');
  }
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#2E7D32',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  filterTabTextActive: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#BBB',
    marginTop: 4,
  },
  pickupCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pickupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickupId: {
    flex: 1,
  },
  pickupIdLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pickupEarnings: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  pickupDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#555',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    padding: 12,
  },
  actionButtonComplete: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});

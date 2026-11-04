import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { collectorProfileApi } from '@/services/api';
import { CollectorProfile } from '@/types/user';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<CollectorProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    pendingPickups: 0,
    completedToday: 0,
    totalEarnings: '0.00',
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
    }
  }, [isAuthenticated]);

  const loadProfile = async () => {
    try {
      const response = await collectorProfileApi.getMe();
      setProfile(response.data.collector_profile || null);
      // Mock stats - in real app, these would come from API
      setStats({
        pendingPickups: 3,
        completedToday: 2,
        totalEarnings: response.data.collector_profile?.wallet_balance || '0.00',
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
      }
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>
            Good {getTimeOfDay()}, {user?.name?.split(' ')[0] || 'Collector'}! 👋
          </Text>
          <Text style={styles.subGreeting}>Ready for today's collections?</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'C'}</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Pending Pickups"
            value={stats.pendingPickups}
            icon="trash-outline"
            color="#FF9800"
            onPress={() => router.push('/(tabs)/pickups?filter=pending')}
          />
          <StatCard
            title="Completed Today"
            value={stats.completedToday}
            icon="checkmark-circle-outline"
            color="#4CAF50"
            onPress={() => router.push('/(tabs)/pickups?filter=completed')}
          />
          <StatCard
            title="Total Earnings"
            value={`₹${stats.totalEarnings}`}
            icon="cash-outline"
            color="#2E7D32"
            onPress={() => router.push('/(tabs)/earnings')}
          />
        </View>
      </View>

      {/* Vehicle Info */}
      {profile && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Vehicle</Text>
            <TouchableOpacity onPress={() => router.push('/(collector)/vehicle')}>
              <Text style={styles.viewAll}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleIcon}>
              <Ionicons name={getVehicleIcon(profile.vehicle_type)} size={32} color="#2E7D32" />
            </View>
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleType}>{profile.vehicle_type || 'Not set'}</Text>
              <Text style={styles.vehicleNumber}>{profile.vehicle_number || 'No vehicle number'}</Text>
              <View style={styles.capacityRow}>
                <CapacityBadge
                  label="Weight"
                  value={profile.vehicle_capacity_kg ? `${profile.vehicle_capacity_kg} kg` : 'Not set'}
                />
                <CapacityBadge
                  label="Pickups"
                  value={profile.vehicle_capacity_pickups ? `${profile.vehicle_capacity_pickups} pickups` : 'Not set'}
                />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Hub Info */}
      {profile && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned Hub</Text>
          <View style={styles.hubCard}>
            <Ionicons name="location-outline" size={20} color="#2E7D32" style={{ marginRight: 12 }} />
            <View>
              <Text style={styles.hubName}>{profile.hub_name}</Text>
              <Text style={styles.hubCity}>{profile.hub_city}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <ActionButton
            title="View Pickups"
            icon="list-outline"
            color="#2196F3"
            onPress={() => router.push('/(tabs)/pickups')}
          />
          <ActionButton
            title="My Earnings"
            icon="cash-outline"
            color="#4CAF50"
            onPress={() => router.push('/(tabs)/earnings')}
          />
          <ActionButton
            title="Profile Settings"
            icon="settings-outline"
            color="#9C27B0"
            onPress={() => router.push('/(collector)/profile')}
          />
          <ActionButton
            title="Support"
            icon="help-circle-outline"
            color="#FF9800"
            onPress={() => Alert.alert('Support', 'Contact: support@trashport.shop')}
          />
        </View>
      </View>

      {/* Verification Status */}
      {profile && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Status</Text>
          <View style={[
            styles.statusCard,
            profile.is_verified ? styles.statusVerified : styles.statusPending
          ]}>
            <Ionicons
              name={profile.is_verified ? 'shield-checkmark-outline' : 'time-outline'}
              size={24}
              color={profile.is_verified ? '#4CAF50' : '#FF9800'}
              style={{ marginRight: 12 }}
            />
            <View>
              <Text style={styles.statusTitle}>
                {profile.is_verified ? 'Verified Collector' : 'Verification Pending'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {profile.is_verified
                  ? 'You can accept pickup requests'
                  : 'Admin approval required to start collecting'}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

function getVehicleIcon(type: string) {
  const lower = type.toLowerCase();
  if (lower.includes('truck')) return 'truck-outline';
  if (lower.includes('van')) return 'car-outline';
  if (lower.includes('three') || lower.includes('rickshaw')) return 'bicycle-outline';
  if (lower.includes('pickup')) return 'truck-outline';
  return 'car-outline';
}

const StatCard = ({ title, value, icon, color, onPress }: any) => (
  <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </TouchableOpacity>
);

const CapacityBadge = ({ label, value }: any) => (
  <View style={styles.capacityBadge}>
    <Text style={styles.capacityLabel}>{label}</Text>
    <Text style={styles.capacityValue}>{value}</Text>
  </View>
);

const ActionButton = ({ title, icon, color, onPress }: any) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.actionTitle}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subGreeting: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  statsContainer: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  viewAll: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  vehicleCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  vehicleIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  vehicleNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  capacityRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  capacityBadge: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  capacityLabel: {
    fontSize: 11,
    color: '#999',
  },
  capacityValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  hubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  hubName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  hubCity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusVerified: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  statusPending: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
});

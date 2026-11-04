import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Earning {
  id: number;
  pickup_id: number;
  amount: string;
  date: string;
  status: 'pending' | 'credited' | 'withdrawn';
  pickup_display_id: number;
}

interface Withdrawal {
  id: number;
  amount: string;
  upi_id: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export default function EarningsScreen() {
  const { isAuthenticated } = useAuth();
  const [walletBalance, setWalletBalance] = useState('0.00');
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadEarnings();
    }
  }, [isAuthenticated]);

  const loadEarnings = async () => {
    try {
      const [profileRes, earningsRes, withdrawalsRes] = await Promise.all([
        api.get('/collector-profile/me/'),
        api.get('/collector/earnings/'),
        api.get('/collector/withdrawals/'),
      ]);
      setWalletBalance(profileRes.data.collector_profile?.wallet_balance || '0.00');
      setEarnings(earningsRes.data.results || earningsRes.data || []);
      setWithdrawals(withdrawalsRes.data.results || withdrawalsRes.data || []);
    } catch (error) {
      console.error('Failed to load earnings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEarnings();
  };

  const handleWithdraw = async () => {
    if (!upiId || !withdrawAmount) {
      alert('Please enter UPI ID and amount');
      return;
    }
    if (parseFloat(withdrawAmount) > parseFloat(walletBalance)) {
      alert('Insufficient balance');
      return;
    }
    try {
      await api.post('/collector/withdraw/', { upi_id: upiId, amount: withdrawAmount });
      setShowWithdrawModal(false);
      setUpiId('');
      setWithdrawAmount('');
      loadEarnings();
    } catch (error) {
      alert('Withdrawal failed');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2d', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount: string) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  if (!isAuthenticated) return null;

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Wallet Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(walletBalance)}</Text>
        <TouchableOpacity
          style={styles.withdrawButton}
          onPress={() => setShowWithdrawModal(true)}
          disabled={parseFloat(walletBalance) <= 0}
        >
          <Ionicons name="cash-outline" size={18} color="white" style={{ marginRight: 6 }} />
          <Text style={styles.withdrawButtonText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      {/* Earnings History */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Earnings History</Text>
        </View>
        {loading && earnings.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
          </View>
        ) : earnings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cash-outline" size={64} color="#DDD" />
            <Text style={styles.emptyText}>No earnings yet</Text>
            <Text style={styles.emptySubtext}>Complete pickups to earn money</Text>
          </View>
        ) : (
          <FlatList
            data={earnings}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.earningCard}>
                <View style={styles.earningHeader}>
                  <View>
                    <Text style={styles.earningPickupId}>Pickup #{item.pickup_display_id}</Text>
                    <Text style={styles.earningDate}>{formatDate(item.date)}</Text>
                  </View>
                  <View style={[
                    styles.earningAmount,
                    item.status === 'credited' && styles.earningCredited,
                    item.status === 'withdrawn' && styles.earningWithdrawn,
                  ]}>
                    <Text style={styles.earningAmountText}>+{formatCurrency(item.amount)}</Text>
                    <Text style={[
                      styles.earningStatus,
                      item.status === 'credited' && styles.statusCredited,
                      item.status === 'pending' && styles.statusPending,
                      item.status === 'withdrawn' && styles.statusWithdrawn,
                    ]}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Withdrawals History */}
      {withdrawals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Withdrawals</Text>
          <FlatList
            data={withdrawals}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.withdrawalCard}>
                <View style={styles.withdrawalHeader}>
                  <View>
                    <Text style={styles.withdrawalUpi}>To: {item.upi_id}</Text>
                    <Text style={styles.withdrawalDate}>{formatDate(item.created_at)}</Text>
                  </View>
                  <View style={[
                    styles.withdrawalAmount,
                    item.status === 'completed' && styles.withdrawalCompleted,
                    item.status === 'failed' && styles.withdrawalFailed,
                  ]}>
                    <Text style={styles.withdrawalAmountText}>-{formatCurrency(item.amount)}</Text>
                    <Text style={[
                      styles.withdrawalStatus,
                      item.status === 'completed' && styles.statusCompleted,
                      item.status === 'pending' && styles.statusPending,
                      item.status === 'failed' && styles.statusFailed,
                    ]}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          />
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  balanceCard: {
    backgroundColor: '#2E7D32',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  withdrawButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 12,
  },
  withdrawButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
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
  earningCard: {
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
  earningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningPickupId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  earningDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  earningAmount: {
    alignItems: 'flex-end',
  },
  earningAmountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  earningCredited: {},
  earningWithdrawn: {},
  earningStatus: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusCredited: {
    backgroundColor: '#E8F5E9',
    color: '#4CAF50',
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
    color: '#FF9800',
  },
  statusWithdrawn: {
    backgroundColor: '#E3F2FD',
    color: '#2196F3',
  },
  withdrawalCard: {
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
  withdrawalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  withdrawalUpi: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  withdrawalDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  withdrawalAmount: {
    alignItems: 'flex-end',
  },
  withdrawalAmountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
  },
  withdrawalCompleted: {},
  withdrawalFailed: {},
  withdrawalStatus: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusCompleted: {
    backgroundColor: '#E8F5E9',
    color: '#4CAF50',
  },
  statusFailed: {
    backgroundColor: '#FFEBEE',
    color: '#F44336',
  },
});

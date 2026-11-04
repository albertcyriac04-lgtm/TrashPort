import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { collectorProfileApi } from '@/services/api';
import { CollectorProfile, UpdateVehicleData } from '@/types/user';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, updateProfile, logout, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<CollectorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    vehicle_number: '',
    vehicle_type: '',
    vehicle_capacity_kg: '',
    vehicle_capacity_pickups: '',
    license_number: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
    }
  }, [isAuthenticated]);

  const loadProfile = async () => {
    try {
      const response = await collectorProfileApi.getMe();
      const profileData = response.data.collector_profile;
      setProfile(profileData);
      if (profileData) {
        setFormData({
          name: user?.name || '',
          phone_number: user?.phone_number || '',
          vehicle_number: profileData.vehicle_number || '',
          vehicle_type: profileData.vehicle_type || '',
          vehicle_capacity_kg: profileData.vehicle_capacity_kg?.toString() || '',
          vehicle_capacity_pickups: profileData.vehicle_capacity_pickups?.toString() || '',
          license_number: profileData.license_number || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: UpdateVehicleData = {
        vehicle_number: formData.vehicle_number,
        vehicle_type: formData.vehicle_type,
        vehicle_capacity_kg: formData.vehicle_capacity_kg ? parseFloat(formData.vehicle_capacity_kg) : undefined,
        vehicle_capacity_pickups: formData.vehicle_capacity_pickups ? parseInt(formData.vehicle_capacity_pickups) : undefined,
        license_number: formData.license_number,
      };
      await updateProfile(data);
      setEditMode(false);
      loadProfile();
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: logout, style: 'destructive' },
    ]);
  };

  const getStatusColor = () => profile?.is_verified ? '#4CAF50' : '#FF9800';
  const getStatusText = () => profile?.is_verified ? 'Verified Collector' : 'Verification Pending';

  if (!isAuthenticated) return null;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'C'}</Text>
          </View>
          {editMode && (
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera-outline" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.name}>{user?.name || 'Collector'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}20` }]}>
          <Ionicons
            name={profile?.is_verified ? 'shield-checkmark-outline' : 'time-outline'}
            size={14}
            color={getStatusColor()}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
        </View>
      </View>

      {/* Personal Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          {editMode ? (
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(val) => setFormData(prev => ({ ...prev, name: val }))}
              autoCapitalize="words"
            />
          ) : (
            <Text style={styles.value}>{user?.name || 'Not set'}</Text>
          )}
        </View>
        <View style={styles.divider} />
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email || 'Not set'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          {editMode ? (
            <TextInput
              style={styles.input}
              value={formData.phone_number}
              onChangeText={(val) => setFormData(prev => ({ ...prev, phone_number: val }))}
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.value}>{user?.phone_number || 'Not set'}</Text>
          )}
        </View>
      </View>

      {/* Vehicle Details */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Vehicle Details</Text>
          {editMode ? (
            <TouchableOpacity onPress={() => setEditMode(false)} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setEditMode(true)} style={styles.editButton}>
              <Ionicons name="create-outline" size={18} color="#2E7D32" style={{ marginRight: 4 }} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Vehicle Number</Text>
          {editMode ? (
            <TextInput
              style={styles.input}
              value={formData.vehicle_number}
              onChangeText={(val) => setFormData(prev => ({ ...prev, vehicle_number: val }))}
              placeholder="KL-01-AB-1234"
              autoCapitalize="characters"
            />
          ) : (
            <Text style={styles.value}>{profile?.vehicle_number || 'Not set'}</Text>
          )}
        </View>
        <View style={styles.divider} />
        <View style={styles.formGroup}>
          <Text style={styles.label}>Vehicle Type</Text>
          {editMode ? (
            <TextInput
              style={styles.input}
              value={formData.vehicle_type}
              onChangeText={(val) => setFormData(prev => ({ ...prev, vehicle_type: val }))}
              placeholder="Truck, Van, Three-wheeler, Pickup"
              autoCapitalize="words"
            />
          ) : (
            <Text style={styles.value}>{profile?.vehicle_type || 'Not set'}</Text>
          )}
        </View>
        <View style={styles.divider} />
        <View style={styles.twoColumn}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Capacity (kg)</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={formData.vehicle_capacity_kg}
                onChangeText={(val) => setFormData(prev => ({ ...prev, vehicle_capacity_kg: val }))}
                placeholder="500"
                keyboardType="decimal-pad"
              />
            ) : (
              <Text style={styles.value}>
                {profile?.vehicle_capacity_kg ? `${profile.vehicle_capacity_kg} kg` : 'Not set'}
              </Text>
            )}
          </View>
          <View style={styles.dividerVertical} />
          <View style={styles.formGroup}>
            <Text style={styles.label}>Capacity (Pickups)</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={formData.vehicle_capacity_pickups}
                onChangeText={(val) => setFormData(prev => ({ ...prev, vehicle_capacity_pickups: val }))}
                placeholder="5"
                keyboardType="numeric"
              />
            ) : (
              <Text style={styles.value}>
                {profile?.vehicle_capacity_pickups ? `${profile.vehicle_capacity_pickups} pickups` : 'Not set'}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.formGroup}>
          <Text style={styles.label}>License Number</Text>
          {editMode ? (
            <TextInput
              style={styles.input}
              value={formData.license_number}
              onChangeText={(val) => setFormData(prev => ({ ...prev, license_number: val }))}
              placeholder="DL-1234567890"
              autoCapitalize="characters"
            />
          ) : (
            <Text style={styles.value}>{profile?.license_number || 'Not set'}</Text>
          )}
        </View>
        {editMode && (
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Hub Info */}
      {profile && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assigned Hub</Text>
          <View style={styles.hubInfo}>
            <Ionicons name="location-outline" size={24} color="#2E7D32" style={{ marginRight: 12 }} />
            <View>
              <Text style={styles.hubName}>{profile.hub_name}</Text>
              <Text style={styles.hubCity}>{profile.hub_city}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Wallet Balance */}
      {profile && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Wallet Balance</Text>
          <Text style={styles.walletBalance}>₹{parseFloat(profile.wallet_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          <Text style={styles.walletNote}>Withdraw earnings to your UPI ID from the Earnings tab</Text>
        </View>
      )}

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#F44336" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#2E7D32',
    fontWeight: '500',
    fontSize: 14,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelButtonText: {
    color: '#999',
    fontWeight: '500',
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  dividerVertical: {
    width: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 12,
  },
  twoColumn: {
    flexDirection: 'row',
  },
  hubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  walletBalance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginVertical: 16,
  },
  walletNote: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#81C784',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 8,
  },
  logoutText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },
});

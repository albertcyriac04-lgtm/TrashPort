import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { collectorProfileApi } from '@/services/api';
import { CollectorProfile, UpdateVehicleData } from '@/types/user';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function VehicleScreen() {
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<CollectorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
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
      await collectorProfileApi.updateMe(data);
      setEditMode(false);
      loadProfile();
      Alert.alert('Success', 'Vehicle details updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update vehicle details');
    } finally {
      setSaving(false);
    }
  };

  const getVehicleIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('truck')) return 'truck-outline';
    if (lower.includes('van')) return 'car-outline';
    if (lower.includes('three') || lower.includes('rickshaw')) return 'bicycle-outline';
    if (lower.includes('pickup')) return 'truck-outline';
    return 'car-outline';
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Vehicle Visual Card */}
      <View style={styles.visualCard}>
        <View style={styles.vehicleIconLarge}>
          <Ionicons name={getVehicleIcon(profile?.vehicle_type || '')} size={64} color="white" />
        </View>
        <View style={styles.vehicleInfoLarge}>
          <Text style={styles.vehicleTypeLarge}>{profile?.vehicle_type || 'Vehicle Not Set'}</Text>
          <Text style={styles.vehicleNumberLarge}>{profile?.vehicle_number || 'No registration number'}</Text>
        </View>
        {editMode ? (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => { setEditMode(false); loadProfile(); }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.editButtonLarge}
            onPress={() => setEditMode(true)}
          >
            <Ionicons name="create-outline" size={18} color="white" style={{ marginRight: 6 }} />
            <Text style={styles.editButtonTextLarge}>Edit Details</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Capacity Cards */}
      <View style={styles.capacityContainer}>
        <View style={styles.capacityCard}>
          <Ionicons name="scale-outline" size={28} color="#2E7D32" style={{ marginBottom: 8 }} />
          <Text style={styles.capacityValue}>
            {profile?.vehicle_capacity_kg ? `${profile.vehicle_capacity_kg} kg` : 'Not set'}
          </Text>
          <Text style={styles.capacityLabel}>Weight Capacity</Text>
        </View>
        <View style={styles.capacityCard}>
          <Ionicons name="cube-outline" size={28} color="#2E7D32" style={{ marginBottom: 8 }} />
          <Text style={styles.capacityValue}>
            {profile?.vehicle_capacity_pickups ? `${profile.vehicle_capacity_pickups} pickups` : 'Not set'}
          </Text>
          <Text style={styles.capacityLabel}>Pickup Capacity</Text>
        </View>
      </View>

      {/* Form Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Registration Details</Text>
        <View style={styles.formCard}>
          <FormField
            label="Vehicle Number"
            value={formData.vehicle_number}
            onChangeText={(val) => setFormData(prev => ({ ...prev, vehicle_number: val }))}
            placeholder="KL-01-AB-1234"
            autoCapitalize="characters"
            editable={editMode}
            icon="id-card-outline"
          />
          <Divider />
          <FormField
            label="Vehicle Type"
            value={formData.vehicle_type}
            onChangeText={(val) => setFormData(prev => ({ ...prev, vehicle_type: val }))}
            placeholder="Truck, Van, Three-wheeler, Pickup"
            autoCapitalize="words"
            editable={editMode}
            icon="car-outline"
          />
          <Divider />
          <FormField
            label="License Number"
            value={formData.license_number}
            onChangeText={(val) => setFormData(prev => ({ ...prev, license_number: val }))}
            placeholder="DL-1234567890"
            autoCapitalize="characters"
            editable={editMode}
            icon="card-outline"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Capacity Details</Text>
        <View style={styles.formCard}>
          <FormField
            label="Weight Capacity (kg)"
            value={formData.vehicle_capacity_kg}
            onChangeText={(val) => setFormData(prev => ({ ...prev, vehicle_capacity_kg: val }))}
            placeholder="500"
            keyboardType="decimal-pad"
            editable={editMode}
            icon="scale-outline"
          />
          <Divider />
          <FormField
            label="Pickup Capacity (per trip)"
            value={formData.vehicle_capacity_pickups}
            onChangeText={(val) => setFormData(prev => ({ ...prev, vehicle_capacity_pickups: val }))}
            placeholder="5"
            keyboardType="numeric"
            editable={editMode}
            icon="cube-outline"
          />
        </View>
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
            <Text style={styles.saveButtonText}>Save Vehicle Details</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Info Note */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color="#2196F3" style={{ marginRight: 10 }} />
        <Text style={styles.infoText}>
          Accurate vehicle details help optimize route planning and ensure you're assigned pickups within your vehicle's capacity.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const FormField = ({ label, value, onChangeText, placeholder, autoCapitalize, editable, keyboardType, icon }: any) => (
  <View style={styles.formField}>
    <View style={styles.formFieldLeft}>
      <Ionicons name={icon} size={20} color="#999" style={{ marginRight: 12 }} />
      <View>
        <Text style={styles.formLabel}>{label}</Text>
        {editable ? (
          <TextInput
            style={styles.formInput}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            autoCapitalize={autoCapitalize}
            keyboardType={keyboardType}
          />
        ) : (
          <Text style={styles.formValue}>{value || 'Not set'}</Text>
        )}
      </View>
    </View>
  </View>
);

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  visualCard: {
    backgroundColor: '#2E7D32',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  vehicleIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vehicleInfoLarge: {
    flex: 1,
  },
  vehicleTypeLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  vehicleNumberLarge: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  editButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  editButtonTextLarge: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  capacityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  capacityCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  capacityValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  capacityLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  formField: {
    padding: 16,
  },
  formFieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  formValue: {
    fontSize: 16,
    color: '#333',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    width: 200,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  saveButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    padding: 16,
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 20,
  },
});

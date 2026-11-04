import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Picker } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { hubsApi } from '@/services/api';
import { Hub } from '@/types/user';
import { router } from 'expo-router';

export default function RegisterScreen() {
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    vehicle_number: '',
    vehicle_type: '',
    vehicle_capacity_kg: '',
    vehicle_capacity_pickups: '5',
    license_number: '',
    hub_id: '',
  });
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [error, setError] = useState('');
  const [loadingHubs, setLoadingHubs] = useState(true);

  React.useEffect(() => {
    loadHubs();
  }, []);

  const loadHubs = async () => {
    try {
      const response = await hubsApi.getAll();
      setHubs(response.data);
    } catch (err) {
      console.error('Failed to load hubs:', err);
    } finally {
      setLoadingHubs(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    if (!formData.email || !formData.name || !formData.phone_number || !formData.password || !formData.hub_id) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError('');
    try {
      const data = {
        ...formData,
        vehicle_capacity_kg: formData.vehicle_capacity_kg ? parseFloat(formData.vehicle_capacity_kg) : undefined,
        vehicle_capacity_pickups: parseInt(formData.vehicle_capacity_pickups) || 5,
        hub_id: parseInt(formData.hub_id),
      };
      await register(data);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>🗑️</Text>
          <Text style={styles.appName}>TrashPort Collector</Text>
          <Text style={styles.tagline}>Create Collector Account</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Register as Collector</Text>
          <Text style={styles.subtitle}>Fill in your details to get started</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(val) => handleChange('name', val)}
              placeholder="John Doe"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(val) => handleChange('email', val)}
              placeholder="collector@trashport.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone_number}
              onChangeText={(val) => handleChange('phone_number', val)}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(val) => handleChange('password', val)}
              placeholder="Minimum 8 characters"
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              value={formData.confirmPassword}
              onChangeText={(val) => handleChange('confirmPassword', val)}
              placeholder="Confirm your password"
              secureTextEntry
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vehicle Details (Optional)</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Number</Text>
            <TextInput
              style={styles.input}
              value={formData.vehicle_number}
              onChangeText={(val) => handleChange('vehicle_number', val)}
              placeholder="KL-01-AB-1234"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Type</Text>
            <TextInput
              style={styles.input}
              value={formData.vehicle_type}
              onChangeText={(val) => handleChange('vehicle_type', val)}
              placeholder="Truck, Van, Three-wheeler, Pickup"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.twoColumn}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Capacity (kg)</Text>
              <TextInput
                style={styles.input}
                value={formData.vehicle_capacity_kg}
                onChangeText={(val) => handleChange('vehicle_capacity_kg', val)}
                placeholder="500"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Capacity (Pickups)</Text>
              <TextInput
                style={styles.input}
                value={formData.vehicle_capacity_pickups}
                onChangeText={(val) => handleChange('vehicle_capacity_pickups', val)}
                placeholder="5"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>License Number</Text>
            <TextInput
              style={styles.input}
              value={formData.license_number}
              onChangeText={(val) => handleChange('license_number', val)}
              placeholder="DL-1234567890"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Collection Hub *</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Hub</Text>
            {loadingHubs ? (
              <View style={styles.input}>
                <Text style={{ color: '#999' }}>Loading hubs...</Text>
              </View>
            ) : (
              <Picker
                selectedValue={formData.hub_id}
                onValueChange={(val) => handleChange('hub_id', val)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                mode="dropdown"
              >
                <Picker.Item label="Select a collection hub" value="" />
                {hubs.map((hub) => (
                  <Picker.Item key={hub.id} label={`${hub.name} (${hub.city_name})`} value={hub.id.toString()} />
                ))}
              </Picker>
            )}
          </View>

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.back()}
          >
            <Text style={styles.loginLinkText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 64,
    marginBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  twoColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  picker: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  pickerItem: {
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: '#81C784',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  loginLinkText: {
    color: '#2E7D32',
    fontSize: 14,
  },
});

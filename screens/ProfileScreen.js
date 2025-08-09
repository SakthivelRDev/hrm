import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  StatusBar,
  Image,
  ScrollView
} from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    employeeId: '',
    jobRole: '',
    schedule: '',
    siteLocation: '',
    active: true,
    createdAt: null,
    uid: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userData.name || !userData.email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }
    
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          name: userData.name,
          ...(userData.phone && { phone: userData.phone }), // Only update phone if it exists
          ...(userData.role === 'employee' && {
            employeeId: userData.employeeId,
            jobRole: userData.jobRole,
            schedule: userData.schedule,
            siteLocation: userData.siteLocation
          })
        });
        Alert.alert('Success', 'Profile updated successfully');
        setIsEditing(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const updateField = (field, value) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return '#FF9800';
      case 'admin': return '#2196F3';
      case 'employee': return '#4CAF50';
      default: return '#757575';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'employee': return 'Employee';
      default: return 'User';
    }
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logo}>
            <Text style={styles.logoGreen}>RR THULA</Text>
            <Text style={styles.logoBlue}>SI</Text>
          </Text>
          <Text style={styles.tagline}>My Profile</Text>
        </View>

        {/* Profile Avatar & Role */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatar, { backgroundColor: getRoleColor(userData.role) }]}>
              <Text style={styles.avatarText}>{getInitials(userData.name)}</Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(userData.role) }]}>
              <Text style={styles.roleText}>{getRoleDisplayName(userData.role)}</Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: userData.active ? '#4CAF50' : '#f44336' }]} />
            <Text style={styles.statusText}>{userData.active ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>

        <View style={styles.form}>
          {/* Basic Info */}
          <InputField
            label="Full Name"
            value={userData.name}
            onChangeText={(value) => updateField('name', value)}
            editable={isEditing}
            required
          />

          <InputField
            label="Email"
            value={userData.email}
            onChangeText={(value) => updateField('email', value)}
            editable={false} // Email usually shouldn't be editable
            keyboardType="email-address"
          />

          {/* Phone field - only show if user has phone or is employee */}
          {(userData.phone || userData.role === 'employee') && (
            <InputField
              label="Phone Number"
              value={userData.phone || ''}
              onChangeText={(value) => updateField('phone', value)}
              editable={isEditing}
              keyboardType="phone-pad"
            />
          )}

          {/* Employee-specific fields */}
          {userData.role === 'employee' && (
            <>
              <InputField
                label="Employee ID"
                value={userData.employeeId || ''}
                onChangeText={(value) => updateField('employeeId', value)}
                editable={false} // Employee ID is unique and cannot be edited
              />

              <InputField
                label="Job Role"
                value={userData.jobRole || ''}
                onChangeText={(value) => updateField('jobRole', value)}
                editable={isEditing}
              />

              <InputField
                label="Schedule"
                value={userData.schedule || ''}
                onChangeText={(value) => updateField('schedule', value)}
                editable={isEditing}
              />

              <InputField
                label="Site Location"
                value={userData.siteLocation || ''}
                onChangeText={(value) => updateField('siteLocation', value)}
                editable={isEditing}
              />
            </>
          )}

          {/* Admin/Super Admin specific info */}
          {(userData.role === 'admin' || userData.role === 'super_admin') && (
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Account Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Role:</Text>
                <Text style={styles.infoValue}>{getRoleDisplayName(userData.role)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account Created:</Text>
                <Text style={styles.infoValue}>
                  {userData.createdAt ? 
                    new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : 
                    'N/A'
                  }
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>User ID:</Text>
                <Text style={styles.infoValue}>{userData.uid}</Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {!isEditing ? (
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editingButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => {
                    setIsEditing(false);
                    fetchUserData(); // Reset changes
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sign Out Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Reusable Input Component
const InputField = ({ label, value, onChangeText, editable = true, keyboardType = 'default', required = false }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>
      {label} {required && <Text style={styles.required}>*</Text>}
    </Text>
    <TextInput
      style={[styles.input, !editable && styles.inputDisabled]}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      placeholder={`Enter ${label.toLowerCase()}`}
      placeholderTextColor="#999"
      keyboardType={keyboardType}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  logoGreen: {
    color: '#4CAF50',
  },
  logoBlue: {
    color: '#2196F3',
  },
  tagline: {
    fontSize: 18,
    color: '#2196F3',
    marginBottom: 8,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  required: {
    color: '#f44336',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  editingButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingBottom: 30,
  },
  signOutButton: {
    backgroundColor: '#f44336',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
  },
});
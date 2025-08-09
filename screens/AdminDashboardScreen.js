import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

export default function AdminDashboardScreen() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      // Check if a user is logged in to get siteLocation
      if (!auth.currentUser) {
        throw new Error('No user logged in');
      }

      // Fetch the logged-in user's siteLocation (no role or active check)
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }
      const userSiteLocation = userDoc.data().siteLocation.toLowerCase();

      // Query pending employees with matching siteLocation
      const q = query(
        collection(db, 'users'),
        where('active', '==', false),
        where('role', '==', 'employee'),
        where('siteLocation', '==', userSiteLocation)
      );
      const querySnapshot = await getDocs(q);

      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPendingUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', error.message === 'No user logged in' ? 'Please log in to access this dashboard.' : 'Could not fetch pending users');
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { active: true });
      Alert.alert('Success', 'User approved successfully');
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Approval error:', error);
      Alert.alert('Error', 'Failed to approve user');
    }
  };

  const renderUser = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.detail}>Email: {item.email}</Text>
      <Text style={styles.detail}>Phone: {item.phone}</Text>
      <Text style={styles.detail}>Job Role: {item.jobRole}</Text>
      <Text style={styles.detail}>Site: {item.siteLocation}</Text>
      <Text style={styles.detail}>Schedule: {item.schedule}</Text>
      <TouchableOpacity style={styles.button} onPress={() => approveUser(item.id)}>
        <Text style={styles.buttonText}>Approve</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Employees</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" />
      ) : (
        <FlatList
          data={pendingUsers}
          keyExtractor={item => item.id}
          renderItem={renderUser}
          ListEmptyComponent={<Text style={styles.empty}>No pending users</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  card: {
    backgroundColor: '#f2f2f2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  name: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  detail: { fontSize: 14, color: '#333', marginBottom: 2 },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    marginTop: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 30, fontSize: 16, color: '#999' },
});
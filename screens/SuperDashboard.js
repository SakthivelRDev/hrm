import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Alert, Modal, SafeAreaView 
} from 'react-native';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function SuperDashboardScreen() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const q = query(collection(db, 'users'), where('active', '==', false));
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingUsers(users);
    } catch (error) {
      Alert.alert('Error', 'Could not fetch pending users');
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), { active: true });
      Alert.alert('Success', 'User approved!');
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      setSelectedUser(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to approve user');
    }
  };

  const rejectUser = async (userId) => {
    Alert.alert('Confirm', 'Reject this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'users', userId));
            Alert.alert('Success', 'User rejected');
            setPendingUsers(prev => prev.filter(user => user.id !== userId));
            setSelectedUser(null);
          } catch (error) {
            Alert.alert('Error', 'Failed to reject user');
          }
        }
      }
    ]);
  };

  const getRoleData = (role) => {
    const data = {
      employee: { icon: '👤', color: '#4CAF50', label: 'Employee' },
      admin: { icon: '👨‍💼', color: '#FF9800', label: 'Admin' },
      super_admin: { icon: '🔑', color: '#9C27B0', label: 'Super Admin' }
    };
    return data[role] || data.employee;
  };

  const getUsersByRole = () => {
    const employees = pendingUsers.filter(u => u.role === 'employee');
    const admins = pendingUsers.filter(u => u.role === 'admin');
    const superAdmins = pendingUsers.filter(u => u.role === 'super_admin');
    return { employees, admins, superAdmins };
  };

  const RoleCard = ({ title, users, icon, color }) => (
    <TouchableOpacity style={[styles.roleCard, { borderLeftColor: color }]}>
      <View style={styles.roleHeader}>
        <Text style={styles.roleIcon}>{icon}</Text>
        <View style={styles.roleInfo}>
          <Text style={styles.roleTitle}>{title}</Text>
          <Text style={styles.roleCount}>{users.length} pending</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: color }]}>
          <Text style={styles.countText}>{users.length}</Text>
        </View>
      </View>
      
      {users.slice(0, 2).map(user => (
        <TouchableOpacity 
          key={user.id}
          style={styles.userPreview}
          onPress={() => setSelectedUser(user)}
        >
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </TouchableOpacity>
      ))}
      
      {users.length > 2 && (
        <Text style={styles.moreUsers}>+{users.length - 2} more users</Text>
      )}
    </TouchableOpacity>
  );

  const UserModal = () => {
    if (!selectedUser) return null;
    const roleData = getRoleData(selectedUser.role);

    return (
      <Modal visible={!!selectedUser} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalUserInfo}>
                <Text style={styles.modalIcon}>{roleData.icon}</Text>
                <View>
                  <Text style={styles.modalName}>{selectedUser.name}</Text>
                  <View style={[styles.modalRoleBadge, { backgroundColor: roleData.color }]}>
                    <Text style={styles.modalRoleText}>{roleData.label}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedUser(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalDetails}>
              <Text style={styles.modalDetail}>📧 {selectedUser.email}</Text>
              {selectedUser.role === 'employee' && (
                <>
                  <Text style={styles.modalDetail}>📱 {selectedUser.phone || 'N/A'}</Text>
                  <Text style={styles.modalDetail}>💼 {selectedUser.jobRole || 'N/A'}</Text>
                  <Text style={styles.modalDetail}>📍 {selectedUser.siteLocation || 'N/A'}</Text>
                  <Text style={styles.modalDetail}>⏰ {selectedUser.schedule || 'N/A'}</Text>
                </>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.approveBtn]}
                onPress={() => approveUser(selectedUser.id)}
              >
                <Text style={styles.modalButtonText}>✓ Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.rejectBtn]}
                onPress={() => rejectUser(selectedUser.id)}
              >
                <Text style={styles.modalButtonText}>✕ Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { employees, admins, superAdmins } = getUsersByRole();
  const totalPending = pendingUsers.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Approvals</Text>
        <Text style={styles.subtitle}>{totalPending} pending requests</Text>
      </View>

      {totalPending === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>No pending requests</Text>
        </View>
      ) : (
        <FlatList
          data={[
            { key: 'employees', title: 'Employees', users: employees, ...getRoleData('employee') },
            { key: 'admins', title: 'Admins', users: admins, ...getRoleData('admin') },
            { key: 'superAdmins', title: 'Super Admins', users: superAdmins, ...getRoleData('super_admin') }
          ].filter(item => item.users.length > 0)}
          renderItem={({ item }) => (
            <RoleCard 
              title={item.title}
              users={item.users}
              icon={item.icon}
              color={item.color}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <UserModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666' },
  list: { padding: 15 },
  roleCard: { 
    backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 15,
    borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 3, elevation: 3
  },
  roleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  roleIcon: { fontSize: 24, marginRight: 12 },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  roleCount: { fontSize: 12, color: '#666', marginTop: 2 },
  countBadge: { 
    borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center'
  },
  countText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  userPreview: { 
    padding: 10, backgroundColor: '#f8f9fa', borderRadius: 6, marginBottom: 8
  },
  userName: { fontSize: 14, fontWeight: '600', color: '#333' },
  userEmail: { fontSize: 12, color: '#666', marginTop: 2 },
  moreUsers: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 5 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 10 },
  emptyText: { fontSize: 16, color: '#666' },
  modalOverlay: { 
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20
  },
  modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalUserInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  modalIcon: { fontSize: 32, marginRight: 15 },
  modalName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  modalRoleBadge: { 
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 4
  },
  modalRoleText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  closeButton: { fontSize: 24, color: '#666', padding: 5 },
  modalDetails: { marginBottom: 25 },
  modalDetail: { fontSize: 15, color: '#555', marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalButton: { 
    flex: 1, padding: 15, borderRadius: 8, alignItems: 'center'
  },
  approveBtn: { backgroundColor: '#4CAF50' },
  rejectBtn: { backgroundColor: '#f44336' },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
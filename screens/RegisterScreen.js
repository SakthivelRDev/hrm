import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar,
} from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function RegisterScreen({ navigation }) {
  const [role, setRole] = useState('employee'); // 'employee', 'admin', 'super_admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [schedule, setSchedule] = useState('');
  const [superAdminEmail, setSuperAdminEmail] = useState('');
  const [superAdminPassword, setSuperAdminPassword] = useState('');

  const passwordsMatch = !confirmPassword || password === confirmPassword;

  useEffect(() => {
    if (role === 'employee') {
      generateEmployeeId().then(setEmployeeId);
    } else {
      setEmployeeId('');
    }
  }, [role]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    // Clear super admin fields if not registering as super admin
    if (newRole !== 'super_admin') {
      setSuperAdminEmail('');
      setSuperAdminPassword('');
    }
  };

  const generateEmployeeId = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'employee'),
        orderBy('employeeId', 'desc'),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const lastEmployee = querySnapshot.docs[0].data();
        const lastId = lastEmployee.employeeId;
        const num = parseInt(lastId.replace('EMP', ''), 10) + 1;
        return `EMP${num.toString().padStart(4, '0')}`;
      }
      return 'EMP0001'; // Default starting ID if no employees exist
    } catch (error) {
      console.error('Error generating employee ID:', error);
      return 'EMP0001'; // Fallback to default in case of error
    }
  };

  const handleRegister = async () => {
    // Validation for required fields
    if (!email || !password || !confirmPassword || !name) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (role === 'employee' && (!phone || !jobRole || !siteLocation || !schedule)) {
      Alert.alert('Error', 'Please fill in all required fields for employee registration');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!passwordsMatch) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      const trimmedEmail = email.trim();

      // Verify existing super admin credentials only for admin or super_admin roles
      if (role !== 'employee' && (!superAdminEmail || !superAdminPassword)) {
        Alert.alert('Error', 'Please provide existing super admin credentials');
        return;
      }

      if (role !== 'employee') {
        // Sign in with super admin credentials
        const { user: superAdminUser } = await signInWithEmailAndPassword(
          auth,
          superAdminEmail.trim(),
          superAdminPassword
        );

        // Check if the user is a super admin
        const superAdminDoc = await getDoc(doc(db, 'users', superAdminUser.uid));
        if (!superAdminDoc.exists() || superAdminDoc.data().role !== 'super_admin' || !superAdminDoc.data().active) {
          await signOut(auth);
          Alert.alert('Error', 'Invalid super admin credentials or role');
          return;
        }

        // Sign out the super admin to proceed with new user registration
        await signOut(auth);
      }

      // Create the new user
      const { user } = await createUserWithEmailAndPassword(auth, trimmedEmail, password);

      // Save user details in Firestore
      const userData = {
        uid: user.uid,
        email: trimmedEmail,
        name,
        role,
        active: false, // All new users (including super_admin) are inactive by default
        createdAt: new Date(),
      };

      // Add employee-specific fields
      if (role === 'employee') {
        const newEmployeeId = await generateEmployeeId();
        userData.phone = phone;
        userData.employeeId = newEmployeeId;
        userData.jobRole = jobRole;
        userData.siteLocation = siteLocation.toLowerCase(); // Case-insensitive site location
        userData.schedule = schedule;
      }

      // Add admin-specific fields
      if (role === 'admin') {
        userData.siteLocation = siteLocation.toLowerCase(); // Case-insensitive site location
      }

      await setDoc(doc(db, 'users', user.uid), userData);
      console.log('Created Firestore document for user:', userData); // Debug: Log created document

      await signOut(auth);

      Alert.alert(
        'Registration Successful',
        role === 'super_admin'
          ? 'Super Admin account created. Awaiting approval from an existing super admin.'
          : role === 'admin'
          ? 'Admin account created. Awaiting super admin approval.'
          : 'Employee registered. Waiting for admin approval.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'This email is already registered. Please use a different email.');
      } else {
        Alert.alert('Registration Failed', error.message);
      }
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.header}>
          <Text style={styles.logo}>
            <Text style={styles.logoGreen}>RR THULA</Text>
            <Text style={styles.logoBlue}>SI</Text>
          </Text>
          <Text style={styles.tagline}>Attendance partner!</Text>
          <Text style={styles.subtitle}>Create your account</Text>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Registering as:</Text>
          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={[styles.roleButton, role === 'employee' && styles.roleButtonSelected]}
              onPress={() => handleRoleChange('employee')}
            >
              <Text style={styles.roleButtonText}>Employee</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, role === 'admin' && styles.roleButtonSelected]}
              onPress={() => handleRoleChange('admin')}
            >
              <Text style={styles.roleButtonText}>Admin</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, role === 'super_admin' && styles.roleButtonSelected]}
              onPress={() => handleRoleChange('super_admin')}
            >
              <Text style={styles.roleButtonText}>Super Admin</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.form}>
          <CustomInput label="Full Name" value={name} onChangeText={setName} />
          {role === 'employee' && (
            <>
              <View style={styles.displayGroup}>
                <Text style={styles.label}>Employee ID</Text>
                <Text style={styles.displayText}>{employeeId || 'Generating...'}</Text>
              </View>
              <CustomInput
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <CustomInput
                label="Job Role"
                value={jobRole}
                onChangeText={setJobRole}
              />
              <CustomInput
                label="Site Location"
                value={siteLocation}
                onChangeText={setSiteLocation}
              />
              <CustomInput
                label="Working Schedule"
                value={schedule}
                onChangeText={setSchedule}
              />
            </>
          )}
          {role === 'admin' && (
            <>
              <CustomInput
                label="Site Location"
                value={siteLocation}
                onChangeText={setSiteLocation}
              />
            </>
          )}
          {(role === 'admin' || role === 'super_admin') && (
            <>
              <CustomInput
                label="Existing Super Admin Email"
                value={superAdminEmail}
                onChangeText={setSuperAdminEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <CustomInput
                label="Existing Super Admin Password"
                value={superAdminPassword}
                onChangeText={setSuperAdminPassword}
                secureTextEntry
              />
            </>
          )}
          <CustomInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <CustomInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <CustomInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          {!passwordsMatch && <Text style={styles.errorText}>Passwords do not match</Text>}

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={styles.footerLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const CustomInput = ({ label, ...props }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} placeholderTextColor="#999" {...props} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', paddingHorizontal: 24 },
  header: { alignItems: 'center', marginTop: 80, marginBottom: 40 },
  logo: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  logoGreen: { color: '#4CAF50' },
  logoBlue: { color: '#2196F3' },
  tagline: { fontSize: 18, color: '#2196F3', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666' },
  form: { flex: 1 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: '#666', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  inputError: { borderColor: '#f44336' },
  errorText: { color: '#f44336', fontSize: 12, marginBottom: 10 },
  registerButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: { fontSize: 14, color: '#666' },
  footerLink: { fontSize: 14, color: '#2196F3', fontWeight: '600' },
  switchContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  roleButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  roleButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  displayGroup: {
    marginBottom: 16,
  },
  displayText: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#333',
  },
});
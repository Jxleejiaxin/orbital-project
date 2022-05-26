import { KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { authentication } from '../firebase-config';
import { createUserWithEmailAndPassword} from 'firebase/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/core';

const LoginScreen = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const navigation = useNavigation()

    useEffect(() => {
        const unsubscribe = authentication.onAuthStateChanged(user => {
            if (user) {
                navigation.replace("Home")
            }
        })

        return unsubscribe
    }, [])

    const handleSignUp = () => {
        createUserWithEmailAndPassword(authentication, email, password)
        .then(userCredentials => {
            const user = userCredentials.user;
            console.log('Signed up:', user.email);
        })
        .catch(error => alert(error.message))
    }

    const handleLogin = () => {
        signInWithEmailAndPassword(authentication, email, password)
        .then(userCredentials => {
            const user = userCredentials.user;
            console.log('Logged in:', user.email);
        })
        .catch(error => alert(error.message))
    }

  return (
    <KeyboardAvoidingView
    style={styles.container}
    behavior="padding"
    >
      <View style={styles.inputContainer}>
          <TextInput
          placeholder="Email"
          value ={email}
          onChangeText={ text => setEmail(text)}
          style={styles.input}
          />
          <TextInput
          placeholder="Password"
          value ={password}
          onChangeText={ text => setPassword(text)}
          style={styles.input}
          secureTextEntry
          />
      </View>

      <View style={styles.buttonContainer}>
          <TouchableOpacity
          onPress={handleLogin}
          style={styles.button}
          >
              <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
          onPress={handleSignUp}
          style={[styles.button, styles.buttonOutline]}
          >
              <Text style={styles.buttonOutlineText}>Sign up</Text>
          </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputContainer: {
        width: '80%'
    },
    input: {
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 5,
    },
    buttonContainer: {
        width: '60%',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    button: {
        borderRadius: 10,
        width: '100%',
        padding: 15,
        backgroundColor:'#0782F9',
        alignItems: 'center',
    },
    buttonOutline: {
        backgroundColor: 'white',
        marginTop: 5,
        borderColor: '#0782F9',
        borderWidth: 2,
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize:16,
    },
    buttonOutlineText: {
        color: '#0782F9',
        fontWeight: '700',
        fontSize:16,
    },
})
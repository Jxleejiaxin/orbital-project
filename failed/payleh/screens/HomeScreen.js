import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";
import { authentication } from "../firebase-config";
import { useNavigation } from "@react-navigation/core";

const HomeScreen = () => {
const navigation = useNavigation()

  const handleSignOut = () => {
      authentication
      .signOut()
      .then( () => {
          navigation.replace("Login")
      })
      .catch(error => alert(error.message))
  };
  return (
    <View style={styles.container}>
      <Text>Email: {authentication.currentUser?.email}</Text>
      <TouchableOpacity
      onPress={handleSignOut}
      style ={styles.button}>
          <Text>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    button: {
        borderRadius: 10,
        width: '100%',
        padding: 15,
        backgroundColor:'#0782F9',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize:16,
    },
});

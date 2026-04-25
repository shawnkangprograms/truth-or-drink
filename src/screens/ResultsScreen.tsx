import { View, Text, StyleSheet } from 'react-native';

export default function ResultsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Results Screen</Text>
    </View>
  ); 
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F0F0' },
  text: { fontSize: 20, fontWeight: 'bold', color: '#6B4EFF' },
});
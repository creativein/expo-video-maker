import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useProjects } from '@/store/projects';

export default function NewProjectScreen() {
  const router = useRouter();
  const { createProject } = useProjects();
  const [title, setTitle] = useState('');

  const handleCreate = () => {
    if (!title.trim()) return;
    const projectId = createProject(title);
    router.push(`/project/${projectId}/edit`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Project Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter project title"
        placeholderTextColor="#666"
      />
      <Pressable
        style={[styles.button, !title.trim() && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={!title.trim()}>
        <Text style={styles.buttonText}>Create Project</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#404040',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
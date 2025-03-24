import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useProjects } from '@/store/projects';
import { Play, CreditCard as Edit2 } from 'lucide-react-native';

export default function ProjectsScreen() {
  const router = useRouter();
  const { projects } = useProjects();

  return (
    <View style={styles.container}>
      {projects.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No projects yet</Text>
          <Text style={styles.emptySubtext}>
            Create a new project to get started
          </Text>
          <Pressable
            style={styles.createButton}
            onPress={() => router.push('/new-project')}>
            <Text style={styles.buttonText}>Create Project</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.projectCard}
              onPress={() => router.push(`/project/${item.id}`)}>
              <View style={styles.projectInfo}>
                <Text style={styles.projectTitle}>{item.title}</Text>
                <Text style={styles.projectDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.actions}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => router.push(`/project/${item.id}/edit`)}>
                  <Edit2 size={20} color="#fff" />
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.playButton]}
                  onPress={() => router.push(`/project/${item.id}/preview`)}>
                  <Play size={20} color="#fff" />
                </Pressable>
              </View>
            </Pressable>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#888',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  projectCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectInfo: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  projectDate: {
    fontSize: 14,
    color: '#888',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#404040',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#007AFF',
  },
});
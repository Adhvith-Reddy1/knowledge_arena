import { TopicCategory } from '@/types';

export const TOPIC_CATEGORIES: TopicCategory[] = [
  {
    category: 'Biology',
    color: 'emerald',
    topics: [
      { id: 'cell-biology', name: 'Cell Biology', description: 'Organelles, cell division, membrane transport' },
      { id: 'genetics', name: 'Genetics & Heredity', description: 'Mendelian genetics, DNA replication, gene expression' },
      { id: 'molecular-biology', name: 'Molecular Biology', description: 'Transcription, translation, protein folding' },
      { id: 'evolution', name: 'Evolution', description: 'Natural selection, speciation, phylogenetics' },
      { id: 'ecology', name: 'Ecology', description: 'Population dynamics, food webs, nutrient cycles' },
      { id: 'neuroscience', name: 'Neuroscience', description: 'Neural signaling, synaptic transmission, brain regions' },
      { id: 'immunology', name: 'Immunology', description: 'Immune cells, antibodies, adaptive immunity' },
      { id: 'biochemistry', name: 'Biochemistry', description: 'Metabolism, enzymes, ATP synthesis' },
    ],
  },
  {
    category: 'AI & Computer Science',
    color: 'violet',
    topics: [
      { id: 'ml-theory', name: 'Machine Learning Theory', description: 'Bias-variance, optimization, generalization bounds' },
      { id: 'deep-learning', name: 'Deep Learning', description: 'Neural networks, backpropagation, architectures' },
      { id: 'random-forests', name: 'Random Forests & Ensembles', description: 'Bagging, boosting, feature importance' },
      { id: 'nlp', name: 'Natural Language Processing', description: 'Tokenization, embeddings, transformers' },
      { id: 'computer-vision', name: 'Computer Vision', description: 'CNNs, feature detection, object recognition' },
      { id: 'reinforcement-learning', name: 'Reinforcement Learning', description: 'MDPs, Q-learning, policy gradients' },
      { id: 'algorithms', name: 'Algorithms & Data Structures', description: 'Sorting, graphs, dynamic programming' },
      { id: 'probability-stats', name: 'Probability & Statistics', description: 'Distributions, hypothesis testing, Bayesian inference' },
      { id: 'databases', name: 'Databases', description: 'SQL, indexing, transactions, normalization' },
      { id: 'cryptography', name: 'Cryptography', description: 'Encryption, hashing, public-key cryptography' },
    ],
  },
];

export function getTopicById(id: string) {
  for (const cat of TOPIC_CATEGORIES) {
    const topic = cat.topics.find(t => t.id === id);
    if (topic) return { ...topic, category: cat.category, color: cat.color };
  }
  return null;
}

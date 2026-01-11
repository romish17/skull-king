import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

const STORAGE_KEY = 'skull-king-mobile-state';
const MAX_PLAYERS = 8;

const defaultCards = [
  {
    id: 'pirate',
    label: 'Pirate capturé',
    description: 'Bonus pour chaque pirate gagné',
    value: 20,
    group: 'Base',
  },
  {
    id: 'mermaid',
    label: 'Sirène victorieuse',
    description: 'Bonus si la sirène bat le Skull King',
    value: 50,
    group: 'Base',
  },
  {
    id: 'skull-king',
    label: 'Skull King capturé',
    description: 'Bonus par Skull King gagné',
    value: 30,
    group: 'Base',
  },
  {
    id: 'tigress-pirate',
    label: 'Tigresse (mode pirate)',
    description: 'Bonus si la Tigresse est jouée comme pirate',
    value: 20,
    group: 'Base',
  },
  {
    id: 'tigress-escape',
    label: 'Tigresse (mode fuite)',
    description: 'Petit bonus si la Tigresse est jouée en fuite',
    value: 10,
    group: 'Base',
  },
  {
    id: 'kraken',
    label: 'Kraken',
    description: "Carte d'extension: annule la levée, ajustez selon vos règles.",
    value: 0,
    group: 'Extension',
  },
  {
    id: 'whale',
    label: 'Baleine',
    description: "Carte d'extension: bonus selon vos variantes.",
    value: 10,
    group: 'Extension',
  },
  {
    id: 'white-whale',
    label: 'Baleine blanche',
    description: "Carte d'extension: effets spéciaux, bonus personnalisable.",
    value: 20,
    group: 'Extension',
  },
  {
    id: 'loot',
    label: 'Butin',
    description: "Carte d'extension: ajoutez un bonus maison.",
    value: 10,
    group: 'Extension',
  },
];

const clampNumber = (value, min = 0, max = 99) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.min(Math.max(parsed, min), max);
};

const ensureScoreEntry = (player, round) => {
  if (!player.scores[round]) {
    player.scores[round] = { bid: 0, tricks: 0, bonus: 0 };
  }
  return player.scores[round];
};

const calculateRoundScore = (roundScore, roundNumber) => {
  const { bid, tricks, bonus } = roundScore;
  if (bid === 0) {
    const value = roundNumber * 10;
    return tricks === 0 ? value + bonus : -value + bonus;
  }
  if (bid === tricks) {
    return bid * 20 + bonus;
  }
  return -Math.abs(bid - tricks) * 10 + bonus;
};

const totalScore = (player) => {
  return Object.entries(player.scores).reduce((total, [round, roundScore]) => {
    return total + calculateRoundScore(roundScore, Number(round));
  }, 0);
};

const createDefaultPlayers = () => [
  { id: crypto.randomUUID(), name: 'Capitaine Anne', scores: {} },
  { id: crypto.randomUUID(), name: 'Barbe Noire', scores: {} },
  { id: crypto.randomUUID(), name: 'Mousse Jack', scores: {} },
];

export default function App() {
  const [players, setPlayers] = useState(createDefaultPlayers);
  const [rounds, setRounds] = useState(10);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundPhase, setRoundPhase] = useState('bids');
  const [cards, setCards] = useState(defaultCards);
  const [activeBonus, setActiveBonus] = useState(null);

  const saveState = useCallback(async () => {
    const payload = {
      players,
      rounds,
      currentRound,
      roundPhase,
      cards,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [players, rounds, currentRound, roundPhase, cards]);

  const loadState = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      if (saved?.players && saved?.cards) {
        setPlayers(saved.players);
        setRounds(saved.rounds ?? 10);
        setCurrentRound(saved.currentRound ?? 1);
        setRoundPhase(saved.roundPhase ?? 'bids');
        setCards(saved.cards);
      }
    } catch (error) {
      console.warn('Échec de chargement', error);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    saveState();
  }, [saveState]);

  const updatePlayer = (id, updates) => {
    setPlayers((prev) =>
      prev.map((player) => (player.id === id ? { ...player, ...updates } : player))
    );
  };

  const updateScore = (id, updates) => {
    setPlayers((prev) =>
      prev.map((player) => {
        if (player.id !== id) return player;
        const next = { ...player, scores: { ...player.scores } };
        const roundScore = ensureScoreEntry(next, currentRound);
        next.scores[currentRound] = { ...roundScore, ...updates };
        return next;
      })
    );
  };

  const addPlayer = () => {
    if (players.length >= MAX_PLAYERS) {
      Alert.alert('Le navire est plein !');
      return;
    }
    setPlayers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: `Pirate ${prev.length + 1}`,
        scores: {},
      },
    ]);
  };

  const removePlayer = (id) => {
    if (players.length <= 2) return;
    setPlayers((prev) => prev.filter((player) => player.id !== id));
  };

  const resetGame = () => {
    Alert.alert('Réinitialiser', 'Réinitialiser tous les scores ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Réinitialiser',
        style: 'destructive',
        onPress: () => {
          setPlayers((prev) => prev.map((player) => ({ ...player, scores: {} })));
          setCurrentRound(1);
          setRoundPhase('bids');
        },
      },
    ]);
  };

  const togglePhase = () => {
    setRoundPhase((prev) => (prev === 'bids' ? 'results' : 'bids'));
  };

  const completeRound = () => {
    if (roundPhase !== 'results') {
      Alert.alert('Passe d’abord en phase résultats.');
      return;
    }
    if (currentRound >= rounds) {
      Alert.alert('Dernière manche atteinte.');
      return;
    }
    setCurrentRound((prev) => prev + 1);
    setRoundPhase('bids');
  };

  const roundOptions = useMemo(() => Array.from({ length: rounds }, (_, i) => i + 1), [rounds]);
  const roundLabel = roundPhase === 'bids' ? 'Annonces' : 'Résultats';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ExpoStatusBar style="light" />
      <FlatList
        ListHeaderComponent={
          <View style={styles.container}>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>Capitaine du score</Text>
              <Text style={styles.title}>Skull King</Text>
              <Text style={styles.subtitle}>
                Compteur de points mobile avec un thème pirate et les cartes d'extension.
              </Text>
              <View style={styles.heroActions}>
                <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={addPlayer}>
                  <Text style={styles.primaryButtonText}>Ajouter un joueur</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.ghostButton]} onPress={resetGame}>
                  <Text style={styles.buttonText}>Réinitialiser</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Équipage</Text>
              <Text style={styles.panelSubtitle}>
                Ajoute jusqu'à 8 joueurs. Les scores sont sauvegardés sur cet appareil.
              </Text>
              {players.map((player) => (
                <View key={player.id} style={styles.playerCard}>
                  <TextInput
                    style={styles.playerInput}
                    value={player.name}
                    onChangeText={(text) => updatePlayer(player.id, { name: text || 'Pirate mystère' })}
                  />
                  <Text style={styles.playerTotal}>{totalScore(player)} pts</Text>
                  <TouchableOpacity
                    style={[styles.button, styles.ghostButton]}
                    onPress={() => removePlayer(player.id)}
                    disabled={players.length <= 2}
                  >
                    <Text style={styles.buttonText}>Retirer</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Manche en cours</Text>
              <Text style={styles.panelSubtitle}>
                Saisis les annonces, puis les plis et bonus avant de clôturer.
              </Text>
              <View style={styles.roundRow}>
                <View style={styles.roundColumn}>
                  <Text style={styles.label}>Manche</Text>
                  <View style={styles.roundPickerRow}>
                    {roundOptions.map((round) => (
                      <TouchableOpacity
                        key={round}
                        style={[
                          styles.roundBadge,
                          round === currentRound && styles.roundBadgeActive,
                        ]}
                        onPress={() => {
                          setCurrentRound(round);
                          setRoundPhase('bids');
                        }}
                      >
                        <Text style={styles.roundBadgeText}>{round}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.roundColumn}>
                  <Text style={styles.label}>Ronde maximale</Text>
                  <View style={styles.roundPickerRow}>
                    {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((count) => (
                      <TouchableOpacity
                        key={count}
                        style={[styles.roundBadge, count === rounds && styles.roundBadgeActive]}
                        onPress={() => {
                          setRounds(count);
                          if (currentRound > count) {
                            setCurrentRound(count);
                            setRoundPhase('bids');
                          }
                        }}
                      >
                        <Text style={styles.roundBadgeText}>{count}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.roundActions}>
                <Text style={styles.phaseText}>Phase : {roundLabel}</Text>
                <View style={styles.phaseButtons}>
                  <TouchableOpacity style={[styles.button, styles.ghostButton]} onPress={togglePhase}>
                    <Text style={styles.buttonText}>
                      {roundPhase === 'bids' ? 'Passer aux résultats' : 'Retour aux annonces'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={completeRound}
                    disabled={roundPhase === 'bids'}
                  >
                    <Text style={styles.primaryButtonText}>Clôturer la manche</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {players.map((player) => {
                const roundScore = ensureScoreEntry(player, currentRound);
                return (
                  <View key={`${player.id}-${currentRound}`} style={styles.scoreRow}>
                    <Text style={styles.scoreName}>{player.name}</Text>
                    <View style={styles.scoreInputs}>
                      <TextInput
                        style={[styles.scoreInput, roundPhase !== 'bids' && styles.disabledInput]}
                        keyboardType="number-pad"
                        editable={roundPhase === 'bids'}
                        value={String(roundScore.bid)}
                        onChangeText={(text) =>
                          updateScore(player.id, {
                            bid: clampNumber(text, 0, currentRound),
                          })
                        }
                        placeholder="Annonce"
                        placeholderTextColor="#a9b4c0"
                      />
                      <TextInput
                        style={[styles.scoreInput, roundPhase !== 'results' && styles.disabledInput]}
                        keyboardType="number-pad"
                        editable={roundPhase === 'results'}
                        value={String(roundScore.tricks)}
                        onChangeText={(text) =>
                          updateScore(player.id, {
                            tricks: clampNumber(text, 0, currentRound),
                          })
                        }
                        placeholder="Plis"
                        placeholderTextColor="#a9b4c0"
                      />
                      <TextInput
                        style={[styles.scoreInput, roundPhase !== 'results' && styles.disabledInput]}
                        keyboardType="number-pad"
                        editable={roundPhase === 'results'}
                        value={String(roundScore.bonus)}
                        onFocus={() => setActiveBonus({ playerId: player.id })}
                        onChangeText={(text) =>
                          updateScore(player.id, {
                            bonus: Number(text) || 0,
                          })
                        }
                        placeholder="Bonus"
                        placeholderTextColor="#a9b4c0"
                      />
                    </View>
                    <Text style={styles.scoreValue}>
                      Score : {calculateRoundScore(roundScore, currentRound)}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Cartes spéciales & extensions</Text>
              <Text style={styles.panelSubtitle}>
                Appuie sur une carte pour ajouter son bonus au champ actif.
              </Text>
              <View style={styles.cardGrid}>
                {cards.map((card) => (
                  <TouchableOpacity
                    key={card.id}
                    style={styles.cardButton}
                    onPress={() => {
                      if (!activeBonus?.playerId) {
                        Alert.alert('Sélectionne un champ bonus dans la manche.');
                        return;
                      }
                      updateScore(activeBonus.playerId, {
                        bonus: (players.find((p) => p.id === activeBonus.playerId)?.scores[
                          currentRound
                        ]?.bonus || 0) + card.value,
                      });
                    }}
                  >
                    <Text style={styles.cardLabel}>{card.label}</Text>
                    <Text style={styles.cardValue}>
                      {card.group} · {card.value >= 0 ? '+' : ''}
                      {card.value} pts
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Barème des cartes</Text>
              <Text style={styles.panelSubtitle}>
                Modifie les valeurs pour coller à votre extension ou variante maison.
              </Text>
              {cards.map((card) => (
                <View key={`setting-${card.id}`} style={styles.settingRow}>
                  <View style={styles.settingLabel}>
                    <Text style={styles.settingTitle}>{card.label}</Text>
                    <Text style={styles.settingSubtitle}>{card.description}</Text>
                  </View>
                  <TextInput
                    style={styles.settingInput}
                    keyboardType="number-pad"
                    value={String(card.value)}
                    onChangeText={(text) => {
                      const value = Number(text) || 0;
                      setCards((prev) =>
                        prev.map((item) => (item.id === card.id ? { ...item, value } : item))
                      );
                    }}
                  />
                </View>
              ))}
            </View>
          </View>
        }
        data={[]}
        renderItem={null}
        keyExtractor={() => 'empty'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b131b',
  },
  container: {
    paddingBottom: 32,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 193, 91, 0.25)',
  },
  eyebrow: {
    color: '#f5c15b',
    letterSpacing: 4,
    textTransform: 'uppercase',
    fontSize: 12,
    marginBottom: 6,
  },
  title: {
    fontSize: 36,
    color: '#f4f1e8',
    fontWeight: '700',
  },
  subtitle: {
    color: '#a9b4c0',
    marginTop: 8,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  panel: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#101c27',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(245, 193, 91, 0.25)',
  },
  panelTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f4f1e8',
  },
  panelSubtitle: {
    color: '#a9b4c0',
    marginTop: 4,
    marginBottom: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 193, 91, 0.4)',
  },
  primaryButton: {
    backgroundColor: '#f5c15b',
    borderColor: '#f5c15b',
  },
  primaryButtonText: {
    color: '#1a1a1a',
    fontWeight: '700',
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    color: '#f4f1e8',
    fontWeight: '600',
  },
  playerCard: {
    backgroundColor: '#162533',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 193, 91, 0.2)',
    marginBottom: 12,
  },
  playerInput: {
    color: '#f4f1e8',
    fontSize: 16,
    marginBottom: 8,
  },
  playerTotal: {
    color: '#f5c15b',
    fontWeight: '700',
    marginBottom: 8,
  },
  roundRow: {
    gap: 12,
  },
  roundColumn: {
    marginBottom: 12,
  },
  label: {
    color: '#a9b4c0',
    fontSize: 12,
    marginBottom: 6,
  },
  roundPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roundBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 193, 91, 0.2)',
    backgroundColor: '#162533',
  },
  roundBadgeActive: {
    backgroundColor: '#f5c15b',
    borderColor: '#f5c15b',
  },
  roundBadgeText: {
    color: '#f4f1e8',
    fontSize: 12,
  },
  roundActions: {
    marginTop: 10,
    gap: 8,
  },
  phaseText: {
    color: '#f5c15b',
    fontWeight: '700',
  },
  phaseButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scoreRow: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#162533',
    borderWidth: 1,
    borderColor: 'rgba(245, 193, 91, 0.2)',
  },
  scoreName: {
    color: '#f4f1e8',
    fontWeight: '600',
  },
  scoreInputs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  scoreInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(245, 193, 91, 0.2)',
    borderRadius: 10,
    paddingVertical: 8,
    textAlign: 'center',
    color: '#f4f1e8',
  },
  disabledInput: {
    opacity: 0.4,
  },
  scoreValue: {
    color: '#f5c15b',
    fontWeight: '700',
    marginTop: 8,
  },
  cardGrid: {
    gap: 10,
  },
  cardButton: {
    backgroundColor: '#162533',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 193, 91, 0.3)',
  },
  cardLabel: {
    color: '#f4f1e8',
    fontWeight: '600',
  },
  cardValue: {
    color: '#f5c15b',
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    backgroundColor: '#162533',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 193, 91, 0.2)',
  },
  settingLabel: {
    flex: 1,
  },
  settingTitle: {
    color: '#f4f1e8',
    fontWeight: '600',
  },
  settingSubtitle: {
    color: '#a9b4c0',
    fontSize: 12,
    marginTop: 4,
  },
  settingInput: {
    width: 70,
    borderWidth: 1,
    borderColor: 'rgba(245, 193, 91, 0.2)',
    borderRadius: 10,
    textAlign: 'center',
    color: '#f4f1e8',
    paddingVertical: 6,
  },
});

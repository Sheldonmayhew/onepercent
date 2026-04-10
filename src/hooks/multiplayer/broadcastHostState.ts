import { supabase } from '../../lib/supabase';
import { useGameStore } from '../../stores/gameStore';
import type { BroadcastPlayer, GameBroadcast } from '../../stores/multiplayerStore';
import { getRoundDefinition } from '../../roundTypes/registry';
import {
  getHostChannel,
  setHostChannel,
  getHostBeforeUnloadHandler,
  setHostBeforeUnloadHandler,
  getLastBroadcastRoute,
  setLastBroadcastRoute,
  readyPlayers,
  getReadyPlayersRound,
  setReadyPlayersRound,
} from './hostChannel';

export function resetBroadcastRoute() {
  setLastBroadcastRoute(null);
}

export function broadcastHostState(route?: string) {
  const hostChannel = getHostChannel();
  if (!hostChannel) return;
  const store = useGameStore.getState();
  if (!store.session) return;

  const s = store.session;

  const playerRoute = route ?? getLastBroadcastRoute() ?? '/player/lobby';
  setLastBroadcastRoute(playerRoute);

  if (playerRoute.includes('/play') && !s.timerStarted && s.currentRound !== getReadyPlayersRound()) {
    readyPlayers.clear();
    setReadyPlayersRound(s.currentRound);
  }

  const tiers = [90, 80, 70, 60, 50, 40, 30, 20, 10, 5, 1];
  const difficulty = tiers[s.currentRound] ?? 90;
  const points = store.getCurrentPoints();

  const players: BroadcastPlayer[] = s.players.map((p) => ({
    id: p.id,
    name: p.name,
    colour: p.colour,
    avatar: p.avatar,
    score: p.score,
    hasAnswered: p.hasAnswered,
    answerTimestamp: p.answerTimestamp,
    eliminated: p.eliminated,
    selectedCategory: p.selectedCategory,
  }));

  const currentRoundType = s.roundTypeSequence?.[s.currentRound] ?? 'point_builder';
  const roundDef = getRoundDefinition(currentRoundType);

  const roundQuestions = s.selectedQuestions[s.currentRound];
  const currentQ = roundQuestions?.[s.currentQuestionInRound];
  const questionsInRound = roundQuestions?.length ?? 1;
  const lastRound = s.roundHistory[s.roundHistory.length - 1];

  const broadcast: GameBroadcast = {
    route: playerRoute,
    players,
    timerStarted: s.timerStarted,
    packName: store.availablePacks
      .filter((p) => s.settings.packIds.includes(p.pack_id))
      .map((p) => p.name)
      .join(', ') || s.pack.name,
    teamMode: s.settings.teamMode,
    teams: s.teams,
  };

  if (playerRoute.includes('/play') && currentQ) {
    broadcast.round = {
      index: s.currentRound,
      difficulty,
      points,
      totalRounds: tiers.length,
      timerDuration: roundDef.timer.duration,
      categoryName: currentQ.category ?? s.pack?.name,
      roundType: currentRoundType,
      roundState: s.activeRoundState,
      questionFormat: currentQ.question_format,
      questionInRound: s.currentQuestionInRound,
      questionsInRound,
      question: {
        question: currentQ.question,
        type: currentQ.type,
        options: currentQ.options,
        image_url: currentQ.image_url,
        sequence_items: currentQ.sequence_items,
        correct_answers: currentQ.correct_answers,
        ranking_criterion: currentQ.ranking_criterion,
        reveal_delay_ms: currentQ.reveal_delay_ms,
        reveal_chunks: currentQ.reveal_chunks,
        categories: currentQ.categories,
      },
    };
  }

  if (playerRoute.includes('/reveal') && lastRound) {
    const q = lastRound.question;
    let correctAnswer: string;

    if (q.question_format === 'multi_select' && q.correct_answers && q.options) {
      correctAnswer = q.correct_answers.map((i) => q.options![i]).join(', ');
    } else if (q.question_format === 'ranking' && q.ranking_order && q.options) {
      correctAnswer = q.ranking_order.map((i) => q.options![i]).join(' → ');
    } else if (q.type === 'multiple_choice' || q.type === 'image_based') {
      correctAnswer = q.options?.[Number(q.correct_answer)] ?? String(q.correct_answer);
    } else {
      correctAnswer = String(q.correct_answer);
    }

    broadcast.reveal = {
      correctAnswer,
      explanation: lastRound.question.explanation,
      correctPlayerIds: lastRound.correctPlayers,
      incorrectPlayerIds: lastRound.incorrectPlayers,
      roundType: currentRoundType,
    };

    // Include round data so TV display has it even if it missed the /play broadcast
    if (currentQ) {
      broadcast.round = {
        index: s.currentRound,
        difficulty,
        points,
        totalRounds: tiers.length,
        timerDuration: roundDef.timer.duration,
        categoryName: currentQ.category ?? s.pack?.name,
        roundType: currentRoundType,
        roundState: s.activeRoundState,
        questionFormat: currentQ.question_format,
        questionInRound: s.currentQuestionInRound,
        questionsInRound,
        question: {
          question: currentQ.question,
          type: currentQ.type,
          options: currentQ.options,
          image_url: currentQ.image_url,
          sequence_items: currentQ.sequence_items,
          correct_answers: currentQ.correct_answers,
          ranking_criterion: currentQ.ranking_criterion,
          reveal_delay_ms: currentQ.reveal_delay_ms,
          reveal_chunks: currentQ.reveal_chunks,
          categories: currentQ.categories,
        },
      };
    }
  }

  hostChannel.send({ type: 'broadcast', event: 'game_state', payload: broadcast });
}

export function endHostGame() {
  resetBroadcastRoute();

  const handler = getHostBeforeUnloadHandler();
  if (handler) {
    window.removeEventListener('beforeunload', handler);
    setHostBeforeUnloadHandler(null);
  }

  const hostChannel = getHostChannel();
  if (!hostChannel) return;
  setHostChannel(null);
  hostChannel.send({ type: 'broadcast', event: 'game_ended', payload: {} });
  setTimeout(() => supabase.removeChannel(hostChannel), 300);
}

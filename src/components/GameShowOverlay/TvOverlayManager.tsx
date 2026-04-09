import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useMultiplayerStore } from '../../stores/multiplayerStore';
import { getRoundDefinition } from '../../roundTypes/registry';
import HostPanel from './HostPanel/HostPanel';
import TvLeaderboard from './Leaderboard/TvLeaderboard';
import AudioSettings from './AudioSettings';
import RoundTransition from './Transitions/RoundTransition';
import { musicManager } from './Audio/MusicManager';
import { crowdSfxManager } from './Audio/CrowdSfxManager';
import type { RoundTypeId } from '../../types';
import type { BroadcastPlayer } from '../../stores/multiplayerStore';
import type { Tier } from './HostPanel/ttsEngine';

function getPhase(route: string): string {
  if (route.includes('/round-intro')) return 'round-intro';
  if (route.includes('/play')) return 'play';
  if (route.includes('/reveal')) return 'reveal';
  if (route.includes('/results')) return 'results';
  return 'lobby';
}

function getTier(roundTypeId: RoundTypeId | undefined): Tier {
  if (!roundTypeId) return 'warmup';
  return getRoundDefinition(roundTypeId).tier;
}

interface TvOverlayManagerProps {
  children: ReactNode;
}

interface TransitionData {
  roundIndex: number;
  players: BroadcastPlayer[];
  scoreUpdates?: { playerId: string; delta: number }[];
}

export default function TvOverlayManager({ children }: TvOverlayManagerProps) {
  const gameState = useMultiplayerStore((s) => s.gameState);
  const [showTransition, setShowTransition] = useState(false);
  const lastPhaseRef = useRef('');
  const lastRoundRef = useRef(-1);
  const transitionDataRef = useRef<TransitionData | null>(null);

  // Initialize audio managers
  useEffect(() => {
    musicManager.init();
    crowdSfxManager.init();
    return () => {
      musicManager.destroy();
      crowdSfxManager.destroy();
    };
  }, []);

  // React to phase changes for music and crowd SFX
  useEffect(() => {
    if (!gameState) return;

    const phase = getPhase(gameState.route);
    const roundType = gameState.round?.roundType ?? gameState.reveal?.roundType;
    const tier = getTier(roundType as RoundTypeId | undefined);
    const roundIndex = gameState.round?.index ?? -1;
    const phaseKey = `${phase}_${roundIndex}`;

    if (phaseKey === lastPhaseRef.current) return;
    lastPhaseRef.current = phaseKey;

    // Start music on first round intro
    if (phase === 'round-intro') {
      // Show transition overlay when advancing to a new round (not the first)
      if (lastRoundRef.current >= 0 && roundIndex > lastRoundRef.current && transitionDataRef.current) {
        setShowTransition(true);
        musicManager.setMode('transition');
      }

      musicManager.play(tier);
      if (!showTransition) {
        musicManager.setMode('play');
      }

      // Start heartbeat loop for gauntlet rounds
      if (tier === 'gauntlet') {
        crowdSfxManager.startLoop('heartbeat');
      } else {
        crowdSfxManager.stopLoop();
      }
    }

    // Tension drum before reveals
    if (phase === 'reveal') {
      musicManager.briefSilence(1500);
      crowdSfxManager.play('tension_drum');
    }

    // Trigger crowd reactions on reveal
    if (phase === 'reveal' && gameState.reveal) {
      const correct = gameState.reveal.correctPlayerIds.length;
      const incorrect = gameState.reveal.incorrectPlayerIds.length;
      const total = correct + incorrect;

      setTimeout(() => {
        if (correct === 0) {
          crowdSfxManager.play('aww');
        } else if (correct >= total * 0.6) {
          crowdSfxManager.play('cheer');
        } else if (correct <= 2 && total > 4) {
          crowdSfxManager.play('gasp');
        } else {
          crowdSfxManager.play('ooh');
        }
      }, 3000); // After answer reveal animation

      // Check for steals
      const steals = gameState.reveal.scoreUpdates?.filter((u) => u.stealFromId);
      if (steals && steals.length > 0) {
        setTimeout(() => crowdSfxManager.play('gasp'), 4500);
      }
    }

    lastRoundRef.current = roundIndex;

    // Results phase
    if (phase === 'results') {
      crowdSfxManager.stopLoop();
      crowdSfxManager.play('applause');
      musicManager.stop();
    }
  }, [gameState]);

  // Store transition data when reveal arrives
  useEffect(() => {
    if (!gameState) return;

    const phase = getPhase(gameState.route);

    // When reveal data arrives, store it for the transition
    if (phase === 'reveal' && gameState.reveal && gameState.round) {
      transitionDataRef.current = {
        roundIndex: gameState.round.index,
        players: gameState.players,
        scoreUpdates: gameState.reveal.scoreUpdates?.map((u) => ({
          playerId: u.playerId,
          delta: u.delta,
        })),
      };
    }
  }, [gameState]);

  const handleTransitionComplete = useCallback(() => {
    setShowTransition(false);
    transitionDataRef.current = null;
    musicManager.setMode('play');
  }, []);

  return (
    <div className="relative">
      {/* Layer 1: Existing round content */}
      {children}

      {/* Layer 2: Host Panel */}
      <HostPanel />

      {/* Layer 3: Leaderboard */}
      <TvLeaderboard />

      {/* Audio Settings */}
      <AudioSettings />

      {/* Layer 4: Transition Overlay */}
      <AnimatePresence>
        {showTransition && transitionDataRef.current && (
          <RoundTransition
            roundIndex={transitionDataRef.current.roundIndex}
            players={transitionDataRef.current.players}
            scoreUpdates={transitionDataRef.current.scoreUpdates}
            onComplete={handleTransitionComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

import { createHashRouter, RouterProvider } from 'react-router-dom';
import App from './App';

// Retry wrapper for lazy imports — handles stale chunks after redeployment
function retryImport<T>(factory: () => Promise<T>, retries = 2): Promise<T> {
  return factory().catch((err) => {
    if (retries > 0) {
      return new Promise<T>((resolve) =>
        setTimeout(() => resolve(retryImport(factory, retries - 1)), 500)
      );
    }
    // All retries failed — force reload to get fresh assets
    window.location.reload();
    throw err;
  });
}

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // Index route → Landing
      {
        index: true,
        lazy: () => retryImport(() => import('./routes/Landing')),
      },

      // Quick-play routes
      {
        path: 'quick-play/categories',
        lazy: () => retryImport(() => import('./routes/CategorySelect')),
      },
      {
        path: 'quick-play/round-intro',
        lazy: () => retryImport(() => import('./routes/RoundIntroPage')),
      },
      {
        path: 'quick-play/play',
        lazy: () => retryImport(() => import('./routes/Play')),
      },
      {
        path: 'quick-play/reveal',
        lazy: () => retryImport(() => import('./routes/Reveal')),
      },
      {
        path: 'quick-play/results',
        lazy: () => retryImport(() => import('./routes/ResultsPage')),
      },

      // Host routes
      {
        path: 'host/mode',
        lazy: () => retryImport(() => import('./routes/ModeSelect')),
      },
      {
        path: 'host/categories',
        lazy: () => retryImport(() => import('./routes/CategorySelect')),
      },
      {
        path: 'host/lobby',
        lazy: () => retryImport(() => import('./routes/HostLobby')),
      },
      {
        path: 'host/round-intro',
        lazy: () => retryImport(() => import('./routes/RoundIntroPage')),
      },
      {
        path: 'host/play',
        lazy: () => retryImport(() => import('./routes/Play')),
      },
      {
        path: 'host/reveal',
        lazy: () => retryImport(() => import('./routes/Reveal')),
      },
      {
        path: 'host/results',
        lazy: () => retryImport(() => import('./routes/ResultsPage')),
      },

      // Join route
      {
        path: 'join',
        lazy: () => retryImport(() => import('./routes/Join')),
      },

      // Player routes
      {
        path: 'player/lobby',
        lazy: () => retryImport(() => import('./routes/PlayerLobby')),
      },
      {
        path: 'player/round-intro',
        lazy: () => retryImport(() => import('./routes/PlayerRoundIntro')),
      },
      {
        path: 'player/play',
        lazy: () => retryImport(() => import('./routes/PlayerPlay')),
      },
      {
        path: 'player/reveal',
        lazy: () => retryImport(() => import('./routes/PlayerReveal')),
      },
      {
        path: 'player/results',
        lazy: () => retryImport(() => import('./routes/PlayerResults')),
      },
      {
        path: 'player/play-again',
        lazy: () => retryImport(() => import('./routes/PlayerPlayAgain')),
      },

      // TV spectator routes
      {
        path: 'tv',
        lazy: () => retryImport(() => import('./routes/TvJoin')),
      },
      {
        path: 'tv/display',
        lazy: () => retryImport(() => import('./routes/TvDisplay')),
      },

      // Mock preview gallery (dev only)
      {
        path: 'mock',
        lazy: () => retryImport(() => import('./mock/MockGallery')),
      },
    ],
  },
]);

export default function Root() {
  return <RouterProvider router={router} />;
}

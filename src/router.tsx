import { createHashRouter, RouterProvider } from 'react-router-dom';
import App from './App';

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // Index route → Landing
      {
        index: true,
        lazy: () => import('./routes/Landing'),
      },

      // Quick-play routes
      {
        path: 'quick-play/categories',
        lazy: () => import('./routes/CategorySelect'),
      },
      {
        path: 'quick-play/round-intro',
        lazy: () => import('./routes/RoundIntroPage'),
      },
      {
        path: 'quick-play/play',
        lazy: () => import('./routes/Play'),
      },
      {
        path: 'quick-play/reveal',
        lazy: () => import('./routes/Reveal'),
      },
      {
        path: 'quick-play/results',
        lazy: () => import('./routes/ResultsPage'),
      },

      // Host routes
      {
        path: 'host/mode',
        lazy: () => import('./routes/ModeSelect'),
      },
      {
        path: 'host/categories',
        lazy: () => import('./routes/CategorySelect'),
      },
      {
        path: 'host/lobby',
        lazy: () => import('./routes/HostLobby'),
      },
      {
        path: 'host/round-intro',
        lazy: () => import('./routes/RoundIntroPage'),
      },
      {
        path: 'host/play',
        lazy: () => import('./routes/Play'),
      },
      {
        path: 'host/reveal',
        lazy: () => import('./routes/Reveal'),
      },
      {
        path: 'host/results',
        lazy: () => import('./routes/ResultsPage'),
      },

      // Join route
      {
        path: 'join',
        lazy: () => import('./routes/Join'),
      },

      // Player routes
      {
        path: 'player/lobby',
        lazy: () => import('./routes/PlayerLobby'),
      },
      {
        path: 'player/round-intro',
        lazy: () => import('./routes/PlayerRoundIntro'),
      },
      {
        path: 'player/play',
        lazy: () => import('./routes/PlayerPlay'),
      },
      {
        path: 'player/reveal',
        lazy: () => import('./routes/PlayerReveal'),
      },
      {
        path: 'player/results',
        lazy: () => import('./routes/PlayerResults'),
      },
    ],
  },
]);

export default function Root() {
  return <RouterProvider router={router} />;
}

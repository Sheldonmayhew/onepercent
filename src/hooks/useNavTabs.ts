import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { NavTab } from '../components/BottomNavBar';

/**
 * Shared tab navigation logic for pages that show BottomNavBar.
 * Returns the current active tab, whether profile is open, and the tab change handler.
 */
export function useNavTabs(currentTab: NavTab) {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  const handleTabChange = useCallback((tab: NavTab) => {
    if (tab === currentTab && tab !== 'profile') return;

    setShowProfile(false);

    switch (tab) {
      case 'play':
        navigate('/');
        break;
      case 'host':
        if (currentTab !== 'host') navigate('/host/mode');
        break;
      case 'join':
        if (currentTab !== 'join') navigate('/join');
        break;
      case 'tv':
        if (currentTab !== 'tv') navigate('/tv');
        break;
      case 'profile':
        setShowProfile((prev) => !prev);
        break;
    }
  }, [navigate, currentTab]);

  const closeProfile = useCallback(() => setShowProfile(false), []);

  return { showProfile, handleTabChange, closeProfile };
}

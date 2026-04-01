import { ExperienceProvider, useExperience } from '@/context/ExperienceContext';
import AdminPanel from '@/components/AdminPanel';
import LandingScreen from '@/screens/LandingScreen';
import BuilderScreen from '@/screens/BuilderScreen';
import SimulationScreen from '@/screens/SimulationScreen';
import ExplanationScreen from '@/screens/ExplanationScreen';

function ExperienceRouter() {
  const { screen } = useExperience();

  return (
    <>
      {screen === 'landing' && <LandingScreen />}
      {screen === 'builder' && <BuilderScreen />}
      {screen === 'simulation' && <SimulationScreen />}
      {screen === 'explanation' && <ExplanationScreen />}
      <AdminPanel />
    </>
  );
}

const Index = () => (
  <ExperienceProvider>
    <ExperienceRouter />
  </ExperienceProvider>
);

export default Index;

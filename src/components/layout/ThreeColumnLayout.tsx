import LeftPanel from './LeftPanel';
import CenterPanel from './CenterPanel';
import RightPanel from './RightPanel';

export default function ThreeColumnLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <LeftPanel />
      <CenterPanel />
      <RightPanel />
    </div>
  );
}
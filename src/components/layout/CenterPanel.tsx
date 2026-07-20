import WaterfallChart from '@/components/chart/WaterfallChart';
import Toolbar from '@/components/toolbar/Toolbar';

export default function CenterPanel() {
  return (
    <div className="flex-1 min-w-0 bg-canvas flex flex-col">
      <Toolbar />
      <div className="flex-1">
        <WaterfallChart />
      </div>
    </div>
  );
}
import WaterfallChart from '@/components/chart/WaterfallChart';
import Toolbar from '@/components/toolbar/Toolbar';

export default function CenterPanel() {
  return (
    <div className="flex-1 bg-white flex flex-col">
      <Toolbar />
      <div className="flex-1">
        <WaterfallChart />
      </div>
    </div>
  );
}
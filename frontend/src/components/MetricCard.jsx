import MiniChart from './MiniChart';

const MetricCard = ({ title, value, status, themeColor, chartData, chartType }) => {
  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-emerald-50 p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-semibold text-gray-900 mt-1">{value}</h3>
        </div>
        {status && (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: `${themeColor}1A`, color: themeColor }}
          >
            {status}
          </span>
        )}
      </div>
      <MiniChart data={chartData} color={themeColor} type={chartType} />
    </div>
  );
};

export default MetricCard;

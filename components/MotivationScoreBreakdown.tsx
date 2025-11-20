'use client';

interface MotivationScoreBreakdownProps {
  totalScore: number;
  domComponent: number;
  reductionComponent: number;
  offMarketComponent: number;
  statusComponent: number;
  marketComponent: number;
}

export default function MotivationScoreBreakdown({
  totalScore,
  domComponent,
  reductionComponent,
  offMarketComponent,
  statusComponent,
  marketComponent,
}: MotivationScoreBreakdownProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-red-600';
    if (score >= 80) return 'text-orange-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-green-600';
    return 'text-gray-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-red-600';
    if (score >= 80) return 'bg-orange-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'bg-green-600';
    return 'bg-gray-600';
  };

  const ScoreBar = ({ label, score, maxScore, description }: { label: string; score: number; maxScore: number; description: string }) => {
    const percentage = (score / maxScore) * 100;

    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-semibold text-gray-900">{score.toFixed(1)} / {maxScore}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-indigo-600 h-3 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Total Score Gauge */}
      <div className="text-center pb-6 border-b border-gray-200">
        <div className="inline-flex flex-col items-center">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(totalScore / 100) * 351.86} 351.86`}
                className={getScoreColor(totalScore)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(totalScore)}`}>
                  {totalScore.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">out of 100</div>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-semibold text-gray-900">Motivation Score</h3>
            <p className="text-sm text-gray-600">
              {totalScore >= 90 && 'Extremely High Motivation'}
              {totalScore >= 80 && totalScore < 90 && 'Very High Motivation'}
              {totalScore >= 70 && totalScore < 80 && 'High Motivation'}
              {totalScore >= 60 && totalScore < 70 && 'Moderate Motivation'}
              {totalScore < 60 && 'Low Motivation'}
            </p>
          </div>
        </div>
      </div>

      {/* Component Breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Score Breakdown</h4>

        <ScoreBar
          label="Days on Market"
          score={domComponent}
          maxScore={25}
          description="Longer time on market indicates higher seller motivation"
        />

        <ScoreBar
          label="Price Reductions"
          score={reductionComponent}
          maxScore={30}
          description="Multiple or significant price drops show willingness to negotiate"
        />

        <ScoreBar
          label="Off-Market Duration"
          score={offMarketComponent}
          maxScore={20}
          description="Recently delisted properties may be more motivated"
        />

        <ScoreBar
          label="Status Changes"
          score={statusComponent}
          maxScore={15}
          description="Failed deals or expirations indicate urgency"
        />

        <ScoreBar
          label="Market Conditions"
          score={marketComponent}
          maxScore={10}
          description="Property performance vs. market average"
        />
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
        <p className="font-semibold mb-2">How to Use This Score:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>80-100:</strong> Excellent wholesale opportunity - highly motivated seller</li>
          <li><strong>60-79:</strong> Good prospect - worth pursuing</li>
          <li><strong>Below 60:</strong> Lower priority - seller may not be motivated</li>
        </ul>
      </div>
    </div>
  );
}

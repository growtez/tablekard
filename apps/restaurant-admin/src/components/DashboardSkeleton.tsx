import React from 'react';

const SkeletonPulse = ({ className }: { className: string }) => (
  <div className={`bg-tk-border/40 rounded animate-pulse ${className}`}></div>
);

const DashboardSkeleton: React.FC = () => {
  return (
    <>
      {/* Shrink-0 header area — mirrors the real dashboard */}
      <div className="flex-shrink-0">
        {/* Title row: "Dashboard" + toggle  |  time / date */}
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-4">
            <SkeletonPulse className="h-7 w-36 rounded-lg" />
            <SkeletonPulse className="w-7 h-7 !rounded-full" />
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <SkeletonPulse className="h-5 w-20 rounded" />
            <SkeletonPulse className="h-4 w-48 rounded hidden sm:block" />
          </div>
        </div>

        {/* 4 stat cards — grid-cols-2 lg:grid-cols-4, max-w-[850px] */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-[850px] w-full pt-1 mb-6 mt-4 sm:mt-0">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-tk-bg-card p-3 sm:p-2.5 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-2">
                <SkeletonPulse className="h-3 w-20 sm:w-24 rounded" />
                {i !== 3 && <SkeletonPulse className="w-6 h-6 sm:w-7 sm:h-7 !rounded-full" />}
              </div>
              <div className="flex justify-between items-end">
                <SkeletonPulse className="h-5 sm:h-6 w-16 sm:w-20 rounded-md" />
                <SkeletonPulse className="h-3 w-10 sm:w-14 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <hr className="border-tk-border mb-4" />

        {/* Tabs & Controls row */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-2">
          {/* Tabs */}
          <div className="flex gap-4 sm:gap-8 pt-1 w-full xl:w-auto flex-1 pb-1">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonPulse key={i} className={`h-5 rounded ${i === 1 ? 'w-28' : i === 2 ? 'w-24' : i === 3 ? 'w-22' : 'w-24'}`} />
            ))}
          </div>

          {/* Controls: view toggle + sort + search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pb-2 w-full xl:w-auto xl:ml-4">
            <SkeletonPulse className="h-[32px] w-[72px] !rounded-full shrink-0 self-start sm:self-auto" />
            <SkeletonPulse className="h-[36px] sm:h-[32px] w-full sm:w-[160px] !rounded-full shrink-0" />
            <SkeletonPulse className="h-[36px] sm:h-[32px] w-full sm:w-[240px] !rounded-full shrink-0" />
          </div>
        </div>
      </div>

      {/* Orders table skeleton */}
      <div className="flex-1 min-h-0 overflow-hidden w-full">
        <table className="w-full text-left border-collapse table-fixed min-w-[950px]">
          <thead>
            <tr className="bg-tk-bg-hover">
              {['6%', '17%', '17%', '25%', '35%'].map((w, i) => (
                <th key={i} className="py-3 px-4 border-b-2 border-tk-border" style={{ width: w }}>
                  <SkeletonPulse className={`h-4 rounded ${i === 0 ? 'w-8 mx-auto' : i === 4 ? 'w-28' : 'w-24'}`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map((row) => (
              <tr key={row} className="border-b border-tk-border">
                <td className="py-3 px-4 text-center">
                  <SkeletonPulse className="h-4 w-5 rounded mx-auto" />
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1.5">
                    <SkeletonPulse className="h-4 w-20 rounded" />
                    <SkeletonPulse className="h-3 w-14 rounded" />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1.5">
                    <SkeletonPulse className="h-4 w-24 rounded" />
                    <SkeletonPulse className="h-3 w-16 rounded" />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1.5">
                    <SkeletonPulse className="h-4 w-16 rounded" />
                    <SkeletonPulse className="h-5 w-20 !rounded-md" />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-4 px-2">
                    {[1, 2, 3, 4].map((dot) => (
                      <React.Fragment key={dot}>
                        <SkeletonPulse className="w-6 h-6 !rounded-full shrink-0" />
                        {dot < 4 && <SkeletonPulse className="h-[2px] flex-1" />}
                      </React.Fragment>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default DashboardSkeleton;

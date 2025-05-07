import { Suspense } from 'react';
import { 
  LineChart, AreaChart, BarChart, PieChart, ComposedChart,
  Line, Area, Bar, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

import { LoadingFallback } from './LoadingFallback';

// Các component trực tiếp từ recharts
export { LineChart, AreaChart, BarChart, PieChart, ComposedChart };
export { Line, Area, Bar, Pie, Cell };
export { XAxis, YAxis, CartesianGrid, Tooltip, Legend };
export { ResponsiveContainer };

// Wrapper components với Suspense
export function LazyChart({
  type = 'line',
  data,
  width = '100%',
  height = 300,
  children,
  ...rest
}: {
  type: 'line' | 'area' | 'bar' | 'pie' | 'composed';
  data: any[];
  width?: number | string;
  height?: number | string;
  children?: React.ReactNode;
  [key: string]: any;
}) {
  // Chart component dựa trên type
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data} {...rest}>
            {children}
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={data} {...rest}>
            {children}
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart data={data} {...rest}>
            {children}
          </BarChart>
        );
      case 'pie':
        return (
          <PieChart {...rest}>
            <Pie 
              data={data} 
              dataKey="value"
              nameKey="name" 
              cx="50%" 
              cy="50%" 
            />
            {children}
          </PieChart>
        );
      case 'composed':
        return (
          <ComposedChart data={data} {...rest}>
            {children}
          </ComposedChart>
        );
      default:
        return (
          <LineChart data={data} {...rest}>
            {children}
          </LineChart>
        );
    }
  };

  return (
    <Suspense fallback={<LoadingFallback height={height as number} showSpinner={true} />}>
      <ResponsiveContainer width={width} height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </Suspense>
  );
}

// Helper function để tạo chart
export function createChartComponent({
  data,
  width = '100%',
  height = 300,
  chartType = 'line',
  ...rest
}: {
  data: any[];
  width?: number | string;
  height?: number | string;
  chartType?: 'line' | 'area' | 'bar' | 'pie' | 'composed';
  [key: string]: any;
}) {
  return (
    <LazyChart 
      type={chartType} 
      data={data} 
      width={width} 
      height={height} 
      {...rest} 
    />
  );
}
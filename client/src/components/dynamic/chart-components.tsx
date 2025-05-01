import { memo, lazy, Suspense, useMemo } from 'react';
import { 
  LineChart, AreaChart, BarChart, PieChart, ComposedChart,
  Line, Area, Bar, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

import { LoadingFallback } from './LoadingFallback';

// Re-export các components với wrapper để tối ưu re-render
// Giải pháp này tránh TypeScript error có thể gặp khi memo trực tiếp
export function OptimizedLineChart(props: React.ComponentProps<typeof LineChart>) {
  // Sử dụng useMemo thay vì memo HOC để tương thích TypeScript tốt hơn
  return useMemo(() => <LineChart {...props} />, 
    // Phụ thuộc vào data và width để tái render khi chúng thay đổi
    [props.data, props.width, props.height, props.children]
  );
}

export function OptimizedAreaChart(props: React.ComponentProps<typeof AreaChart>) {
  return useMemo(() => <AreaChart {...props} />, 
    [props.data, props.width, props.height, props.children]
  );
}

export function OptimizedBarChart(props: React.ComponentProps<typeof BarChart>) {
  return useMemo(() => <BarChart {...props} />, 
    [props.data, props.width, props.height, props.children]
  );
}

export function OptimizedPieChart(props: React.ComponentProps<typeof PieChart>) {
  return useMemo(() => <PieChart {...props} />, 
    [props.data, props.width, props.height, props.children]
  );
}

export function OptimizedComposedChart(props: React.ComponentProps<typeof ComposedChart>) {
  return useMemo(() => <ComposedChart {...props} />, 
    [props.data, props.width, props.height, props.children]
  );
}

export function OptimizedResponsiveContainer(props: React.ComponentProps<typeof ResponsiveContainer>) {
  return useMemo(() => <ResponsiveContainer {...props} />, 
    [props.width, props.height, props.children]
  );
}

// Data components tối ưu
export function OptimizedLine(props: React.ComponentProps<typeof Line>) {
  return useMemo(() => <Line {...props} />, 
    [props.dataKey, props.name, props.stroke, props.type, props.dot]
  );
}

export function OptimizedArea(props: React.ComponentProps<typeof Area>) {
  return useMemo(() => <Area {...props} />, 
    [props.dataKey, props.name, props.fill, props.stroke, props.type]
  );
}

export function OptimizedBar(props: React.ComponentProps<typeof Bar>) {
  return useMemo(() => <Bar {...props} />, 
    [props.dataKey, props.name, props.fill, props.radius]
  );
}

// Các component phụ tối ưu
export function OptimizedXAxis(props: React.ComponentProps<typeof XAxis>) {
  return useMemo(() => <XAxis {...props} />, 
    [props.dataKey, props.tick, props.tickFormatter]
  );
}

export function OptimizedYAxis(props: React.ComponentProps<typeof YAxis>) {
  return useMemo(() => <YAxis {...props} />, 
    [props.domain, props.tick, props.tickFormatter, props.width]
  );
}

export function OptimizedCartesianGrid(props: React.ComponentProps<typeof CartesianGrid>) {
  return useMemo(() => <CartesianGrid {...props} />, 
    [props.strokeDasharray, props.stroke]
  );
}

export function OptimizedTooltip(props: React.ComponentProps<typeof Tooltip>) {
  return useMemo(() => <Tooltip {...props} />, 
    [props.content, props.formatter]
  );
}

export function OptimizedLegend(props: React.ComponentProps<typeof Legend>) {
  return useMemo(() => <Legend {...props} />, 
    [props.content, props.formatter]
  );
}

// Lazy components with dynamic imports
// Dùng React.lazy và dynamic import cho tải theo yêu cầu
const LazyAreaChartComponent = lazy(() => 
  Promise.resolve({ default: (props: any) => <OptimizedAreaChart {...props} /> })
);

const LazyLineChartComponent = lazy(() => 
  Promise.resolve({ default: (props: any) => <OptimizedLineChart {...props} /> })
);

const LazyBarChartComponent = lazy(() => 
  Promise.resolve({ default: (props: any) => <OptimizedBarChart {...props} /> })
);

const LazyPieChartComponent = lazy(() => 
  Promise.resolve({ default: (props: any) => <OptimizedPieChart {...props} /> })
);

const LazyComposedChartComponent = lazy(() => 
  Promise.resolve({ default: (props: any) => <OptimizedComposedChart {...props} /> })
);

// Wrapper components for lazy loading with Suspense
// Các wrapper này đảm bảo hiển thị loading state khi chart đang tải
export function LazyAreaChart(props: React.ComponentProps<typeof AreaChart>) {
  return (
    <Suspense fallback={<LoadingFallback height={200} />}>
      <LazyAreaChartComponent {...props} />
    </Suspense>
  );
}

export function LazyLineChart(props: React.ComponentProps<typeof LineChart>) {
  return (
    <Suspense fallback={<LoadingFallback height={200} />}>
      <LazyLineChartComponent {...props} />
    </Suspense>
  );
}

export function LazyBarChart(props: React.ComponentProps<typeof BarChart>) {
  return (
    <Suspense fallback={<LoadingFallback height={200} />}>
      <LazyBarChartComponent {...props} />
    </Suspense>
  );
}

export function LazyPieChart(props: React.ComponentProps<typeof PieChart>) {
  return (
    <Suspense fallback={<LoadingFallback height={200} />}>
      <LazyPieChartComponent {...props} />
    </Suspense>
  );
}

export function LazyComposedChart(props: React.ComponentProps<typeof ComposedChart>) {
  return (
    <Suspense fallback={<LoadingFallback height={200} />}>
      <LazyComposedChartComponent {...props} />
    </Suspense>
  );
}

// Hàm factory helper để tạo chart với cấu hình đơn giản
export function createChartComponent({ 
  data, 
  width = '100%',
  height = 300,
  chartType = 'line',
  ...rest 
}: {
  data: any[],
  width?: number | string,
  height?: number | string,
  chartType?: 'line' | 'area' | 'bar' | 'pie' | 'composed',
  [key: string]: any
}) {
  const ChartComponent = (() => {
    switch(chartType) {
      case 'line': return LazyLineChart;
      case 'area': return LazyAreaChart;
      case 'bar': return LazyBarChart;
      case 'pie': return LazyPieChart;
      case 'composed': return LazyComposedChart;
      default: return LazyLineChart;
    }
  })();

  return (
    <OptimizedResponsiveContainer width={width} height={height}>
      <ChartComponent data={data} {...rest} />
    </OptimizedResponsiveContainer>
  );
}
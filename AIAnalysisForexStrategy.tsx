/**
 * AIAnalysisForexStrategy.tsx
 * 
 * File đóng gói toàn bộ tính năng phân tích chiến lược giao dịch forex sử dụng Gemini AI
 * Tích hợp đơn giản vào bất kỳ ứng dụng React nào với các dependencies tối thiểu
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

// Types và Interfaces
interface StrategyCondition {
  id: string;
  label: string;
  order: number;
  description?: string;
  indicator?: string;
  timeframe?: string;
  expectedValue?: string;
}

interface TradingStrategy {
  id: string;
  userId: string;
  name: string;
  description: string;
  rules: StrategyCondition[];
  entryConditions: StrategyCondition[];
  exitConditions: StrategyCondition[];
  timeframes: string[];
  riskRewardRatio: number;
  notes?: string;
  createdAt: Date;
}

interface Trade {
  id: number;
  userId: number;
  pair: string;
  direction: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  closeDate?: Date | null;
  exitPrice?: number | null;
  result?: string | null;
  pips?: number | null;
  profitLoss?: number | null;
  strategy: string;
  techPattern?: string | null;
  emotion?: string | null;
  isOpen?: boolean;
  discipline?: {
    followedPlan: boolean;
    enteredEarly: boolean;
    revenge: boolean;
    overLeveraged: boolean;
    movedStopLoss: boolean;
  };
  followedPlan: boolean;
  enteredEarly: boolean;
  revenge: boolean;
  overLeveraged: boolean;
  movedStopLoss: boolean;
  marketCondition?: string | null;
  sessionType?: string | null;
  hasNews: boolean;
  notes?: string | null;
  status?: string;
  riskRewardRatio?: number;
  isRevenge?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AnalysisResult {
  isLoading: boolean;
  error: string | null;
  data: any | null;
}

interface ConditionSuggestion {
  id: string;
  title: string;
  description: string;
  condition: {
    label: string;
    indicator?: string;
    timeframe?: string;
    expectedValue?: string;
    description?: string;
  };
  confidence: number;
  impact: string;
}

// UI Components
const Card = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
};

const CardDescription = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p className={`text-sm text-muted-foreground ${className}`} {...props}>
      {children}
    </p>
  );
};

const CardContent = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardFooter = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`flex items-center p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
};

const Button = ({ 
  children, 
  variant = 'default', 
  size = 'default', 
  className = '', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'default' | 'outline' | 'ghost'; 
  size?: 'default' | 'sm' | 'lg' 
}) => {
  const baseClass = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  };
  
  const sizeClasses = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 rounded-md',
    lg: 'h-11 px-8 rounded-md'
  };
  
  return (
    <button 
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ 
  children, 
  variant = 'default', 
  className = '', 
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { 
  variant?: 'default' | 'outline' | 'secondary'
}) => {
  const baseClass = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none';
  
  const variantClasses = {
    default: 'border-transparent bg-primary text-primary-foreground',
    outline: 'text-foreground',
    secondary: 'border-transparent bg-secondary text-secondary-foreground'
  };
  
  return (
    <div className={`${baseClass} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

const Select = ({ 
  children, 
  className = '', 
  ...props 
}: React.SelectHTMLAttributes<HTMLSelectElement>) => {
  return (
    <select className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}>
      {children}
    </select>
  );
};

const Separator = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={`shrink-0 bg-border h-[1px] w-full ${className}`} {...props} />;
};

const Progress = ({ value = 0, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { value?: number }) => {
  return (
    <div className={`relative h-2 w-full overflow-hidden rounded-full bg-secondary ${className}`} {...props}>
      <div
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  );
};

// SVG Icons
const Icons = {
  sparkles: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-.6.8L8 20.5l.8-.5V17l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  ),
  analyze: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  loading: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      className="animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  refreshCw: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
    </svg>
  ),
  info: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),
  plus: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  alertTriangle: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),
};

// Gemini API Service
const geminiService = (() => {
  let genAI: GoogleGenerativeAI | null = null;
  const MODEL_NAME = "gemini-pro";
  
  const generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 64,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
  ];

  const initialize = (apiKey: string) => {
    genAI = new GoogleGenerativeAI(apiKey);
  };

  const analyzeStrategy = async (strategy: TradingStrategy, trades: Trade[] = []) => {
    try {
      if (!genAI) {
        throw new Error('Gemini API chưa được khởi tạo - cần API key');
      }

      const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig,
        safetySettings,
      });

      const strategyStr = JSON.stringify(strategy, null, 2);
      const tradesStr = trades.length ? JSON.stringify(trades.slice(0, 20), null, 2) : '[]';

      const prompt = `
      # Phân tích Chiến lược Giao dịch Forex

      ## Chiến lược cần phân tích
      \`\`\`json
      ${strategyStr}
      \`\`\`

      ## Dữ liệu Giao dịch Gần đây (20 giao dịch gần nhất)
      \`\`\`json
      ${tradesStr}
      \`\`\`

      Là chuyên gia phân tích giao dịch Forex, hãy phân tích chi tiết chiến lược này, đánh giá hiệu quả của nó, và cung cấp phản hồi chi tiết.
      
      Phản hồi theo định dạng JSON:
      {
        "analysis": {
          "overallAssessment": "Đánh giá tổng thể về chiến lược",
          "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
          "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"],
          "riskManagement": "Đánh giá cách quản lý rủi ro",
          "consistency": "Đánh giá tính nhất quán",
          "adaptability": "Khả năng thích ứng với các điều kiện thị trường khác nhau",
          "timeframeAlignment": "Đánh giá sự phù hợp giữa các khung thời gian sử dụng"
        },
        "performanceEstimate": {
          "winRate": 65, // % từ 0-100
          "riskRewardEvaluation": "Đánh giá tỷ lệ risk:reward",
          "profitPotential": "Đánh giá tiềm năng lợi nhuận",
          "improvementAreas": ["Lĩnh vực cần cải thiện 1", "Lĩnh vực cần cải thiện 2"]
        },
        "conditionAnalysis": {
          // Phân tích cho từng điều kiện trong chiến lược
          "rules": [
            {
              "id": "rule-id", // ID của rule từ chiến lược gốc
              "assessment": "Đánh giá chi tiết về quy tắc này",
              "impact": "high", // low, medium, hoặc high
              "recommendation": "Khuyến nghị cụ thể cho quy tắc này"
            }
          ],
          "entryConditions": [
            {
              "id": "entry-id", // ID từ chiến lược gốc
              "assessment": "Đánh giá chi tiết về điều kiện vào lệnh",
              "impact": "medium", // low, medium, hoặc high
              "recommendation": "Khuyến nghị cụ thể cho điều kiện này"
            }
          ],
          "exitConditions": [
            {
              "id": "exit-id", // ID từ chiến lược gốc
              "assessment": "Đánh giá chi tiết về điều kiện thoát lệnh",
              "impact": "high", // low, medium, hoặc high
              "recommendation": "Khuyến nghị cụ thể cho điều kiện này"
            }
          ]
        }
      }
      `;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          return JSON.parse(jsonStr);
        }
        
        throw new Error('Không thể phân tích phản hồi từ AI');
      } catch (parseError) {
        console.error('Lỗi khi phân tích phản hồi từ AI:', parseError);
        throw new Error('Không thể phân tích phản hồi từ AI');
      }
    } catch (error) {
      console.error('Lỗi khi gọi Gemini API:', error);
      throw error;
    }
  };

  const generateConditionSuggestions = async (strategy: TradingStrategy, trades: Trade[] = []) => {
    try {
      if (!genAI) {
        throw new Error('Gemini API chưa được khởi tạo - cần API key');
      }

      const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig,
        safetySettings,
      });

      const strategyStr = JSON.stringify(strategy, null, 2);
      const tradesStr = trades.length ? JSON.stringify(trades.slice(0, 20), null, 2) : '[]';

      const prompt = `
      # Tạo Gợi ý Điều kiện Mới cho Chiến lược Forex

      ## Chiến lược hiện tại
      \`\`\`json
      ${strategyStr}
      \`\`\`

      ## Dữ liệu Giao dịch Gần đây (20 giao dịch)
      \`\`\`json
      ${tradesStr}
      \`\`\`

      Là chuyên gia phân tích giao dịch Forex, hãy đề xuất 3 điều kiện mới có thể cải thiện chiến lược này.
      
      Phản hồi theo định dạng JSON:
      {
        "suggestedConditions": [
          {
            "id": "suggestion-1",
            "title": "Tiêu đề điều kiện mới",
            "description": "Mô tả lý do tại sao nên thêm điều kiện này",
            "condition": {
              "label": "Nhãn điều kiện",
              "indicator": "Chỉ báo sử dụng (RSI, MACD, v.v)",
              "timeframe": "Khung thời gian (M15, H1, D1, v.v)",
              "expectedValue": "Giá trị kỳ vọng cụ thể",
              "description": "Mô tả chi tiết cách thiết lập và sử dụng điều kiện này"
            },
            "confidence": 85, // % từ 0-100
            "impact": "high" // low, medium, hoặc high
          }
          // thêm 2 điều kiện gợi ý khác tương tự
        ]
      }

      Đảm bảo các ID của điều kiện đã phân tích phải khớp với ID trong chiến lược gốc và gợi ý phải thực sự giá trị, không chung chung.
      `;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          return JSON.parse(jsonStr);
        }
        
        throw new Error('Không thể phân tích phản hồi từ AI');
      } catch (parseError) {
        console.error('Lỗi khi phân tích phản hồi từ AI:', parseError);
        throw new Error('Không thể phân tích phản hồi từ AI');
      }
    } catch (error) {
      console.error('Lỗi khi gọi Gemini API:', error);
      throw error;
    }
  };

  return {
    initialize,
    analyzeStrategy,
    generateConditionSuggestions
  };
})();

// Hook đơn giản để phân tích với Gemini
function useGeminiAnalysis() {
  const [strategyAnalysis, setStrategyAnalysis] = useState<AnalysisResult>({
    isLoading: false,
    error: null,
    data: null
  });

  const [suggestionAnalysis, setSuggestionAnalysis] = useState<AnalysisResult>({
    isLoading: false,
    error: null,
    data: null
  });

  // Phân tích chiến lược sử dụng Gemini
  const analyzeStrategyWithGemini = async (strategy: TradingStrategy, trades: Trade[] = []) => {
    try {
      setStrategyAnalysis({ isLoading: true, error: null, data: null });
      const result = await geminiService.analyzeStrategy(strategy, trades);
      setStrategyAnalysis({ isLoading: false, error: null, data: result });
      return result;
    } catch (error: any) {
      setStrategyAnalysis({ 
        isLoading: false, 
        error: 'Lỗi phân tích chiến lược: Có thể đã vượt quá giới hạn API Gemini. Vui lòng thử lại sau.', 
        data: null 
      });
      throw error;
    }
  };

  // Tạo gợi ý điều kiện mới
  const generateSuggestionsWithGemini = async (strategy: TradingStrategy, trades: Trade[] = []) => {
    try {
      setSuggestionAnalysis({ isLoading: true, error: null, data: null });
      const result = await geminiService.generateConditionSuggestions(strategy, trades);
      setSuggestionAnalysis({ isLoading: false, error: null, data: result });
      return result;
    } catch (error: any) {
      setSuggestionAnalysis({
        isLoading: false,
        error: 'Lỗi khi tạo gợi ý: Có thể đã vượt quá giới hạn API Gemini. Vui lòng thử lại sau.',
        data: null
      });
      throw error;
    }
  };

  return {
    strategyAnalysis,
    suggestionAnalysis,
    analyzeStrategyWithGemini,
    generateSuggestionsWithGemini
  };
}

// GeminiPanel Component
function GeminiPanel({
  strategyAnalysis,
  suggestionAnalysis,
  onRefreshAnalysis,
  onAddSuggestion
}: {
  strategyAnalysis: AnalysisResult;
  suggestionAnalysis: AnalysisResult;
  onRefreshAnalysis: () => void;
  onAddSuggestion: (suggestion: any) => void;
}) {
  
  // Display loading state
  if (strategyAnalysis.isLoading || suggestionAnalysis.isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Icons.loading className="h-10 w-10 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">Đang phân tích với Gemini AI...</p>
          <p className="text-xs text-muted-foreground">Quá trình này có thể mất vài giây</p>
        </CardContent>
      </Card>
    );
  }

  // Display error state
  if (strategyAnalysis.error || suggestionAnalysis.error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <Icons.alertTriangle className="h-10 w-10 text-red-500 mx-auto mb-2" />
            <h3 className="font-medium text-lg mb-1">Phân tích không thành công</h3>
            <p className="text-muted-foreground text-sm">
              {strategyAnalysis.error || suggestionAnalysis.error}
            </p>
          </div>
          <Button 
            onClick={onRefreshAnalysis} 
            className="w-full"
          >
            <Icons.refreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Check if both analyses have data
  const hasAnalysisData = strategyAnalysis.data && strategyAnalysis.data.analysis;
  const hasSuggestionData = suggestionAnalysis.data && suggestionAnalysis.data.suggestedConditions;

  // Render analysis
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Icons.sparkles className="h-5 w-5 mr-2 text-primary" />
          Phân tích Gemini AI
        </CardTitle>
        <CardDescription>
          Phân tích chiến lược và gợi ý cải thiện từ Google Gemini AI
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="space-y-4 mt-4">
          {/* Strategy analysis section */}
          <div>
            <h3 className="font-medium text-base mb-3 flex items-center">
              <Icons.analyze className="h-5 w-5 mr-2 text-primary" />
              Phân tích Chiến lược
            </h3>
            
            {!hasAnalysisData && (
              <div className="text-center p-4 border rounded-md">
                <Icons.info className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Không có dữ liệu phân tích</p>
              </div>
            )}
            
            {hasAnalysisData && (
              <div className="space-y-4">
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                  <h4 className="text-sm font-medium mb-2">Đánh giá tổng thể</h4>
                  <p className="text-sm text-muted-foreground">
                    {strategyAnalysis.data.analysis.overallAssessment}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="border rounded-md p-3">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <span className="text-green-600 mr-1">✓</span> Điểm mạnh
                    </h4>
                    <ul className="space-y-1">
                      {strategyAnalysis.data.analysis.strengths.map((strength: string, index: number) => (
                        <li key={`strength-${index}`} className="text-sm text-muted-foreground flex items-start">
                          <span className="text-green-500 mr-1 text-xs">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Weaknesses */}
                  <div className="border rounded-md p-3">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <span className="text-red-600 mr-1">✗</span> Điểm yếu
                    </h4>
                    <ul className="space-y-1">
                      {strategyAnalysis.data.analysis.weaknesses.map((weakness: string, index: number) => (
                        <li key={`weakness-${index}`} className="text-sm text-muted-foreground flex items-start">
                          <span className="text-red-500 mr-1 text-xs">•</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Performance estimate */}
                {strategyAnalysis.data.performanceEstimate && (
                  <div className="border rounded-md p-3">
                    <h4 className="text-sm font-medium mb-3">Ước tính hiệu suất</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs">Tỷ lệ thắng ước tính</span>
                          <span className="text-xs font-medium">
                            {strategyAnalysis.data.performanceEstimate.winRate}%
                          </span>
                        </div>
                        <Progress value={strategyAnalysis.data.performanceEstimate.winRate} />
                      </div>
                      
                      <div>
                        <p className="text-xs mb-1">Đánh giá Risk:Reward</p>
                        <p className="text-xs text-muted-foreground">
                          {strategyAnalysis.data.performanceEstimate.riskRewardEvaluation}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs mb-1">Tiềm năng lợi nhuận</p>
                        <p className="text-xs text-muted-foreground">
                          {strategyAnalysis.data.performanceEstimate.profitPotential}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Suggested conditions section */}
          <div>
            <h3 className="font-medium text-base mb-3 flex items-center">
              <Icons.sparkles className="h-5 w-5 mr-2 text-primary" />
              Gợi ý Điều kiện Mới
            </h3>
            
            {!hasSuggestionData && (
              <div className="text-center p-4 border rounded-md">
                <Icons.info className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Không có gợi ý điều kiện mới</p>
              </div>
            )}
            
            {hasSuggestionData && (
              <div className="space-y-3">
                {suggestionAnalysis.data.suggestedConditions.map((suggestion: ConditionSuggestion) => (
                  <div 
                    key={suggestion.id} 
                    className="border rounded-md p-3 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium mb-1">{suggestion.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{suggestion.description}</p>
                        
                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge variant="outline" className="text-xs bg-primary/5 border-primary/10">
                            {suggestion.condition.indicator || 'Quy tắc chung'}
                          </Badge>
                          
                          {suggestion.condition.timeframe && (
                            <Badge variant="outline" className="text-xs bg-primary/5 border-primary/10">
                              {suggestion.condition.timeframe}
                            </Badge>
                          )}
                          
                          <Badge variant="outline" className="text-xs bg-primary/5 border-primary/10">
                            Độ tin cậy {suggestion.confidence}%
                          </Badge>
                          
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              suggestion.impact === 'high' ? 'bg-green-50 border-green-200 text-green-700' :
                              suggestion.impact === 'medium' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                              'bg-gray-50 border-gray-200 text-gray-700'
                            }`}
                          >
                            Tác động {
                              suggestion.impact === 'high' ? 'cao' :
                              suggestion.impact === 'medium' ? 'trung bình' : 'thấp'
                            }
                          </Badge>
                        </div>
                        
                        <p className="text-xs">
                          <span className="font-medium">Điều kiện:</span>{' '}
                          {suggestion.condition.label}
                        </p>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs flex-shrink-0 h-8"
                        onClick={() => onAddSuggestion(suggestion)}
                      >
                        <Icons.plus className="h-3 w-3 mr-1" />
                        Thêm
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 flex justify-between border-t">
        <Button variant="outline" size="sm" className="text-xs" onClick={onRefreshAnalysis}>
          <Icons.refreshCw className="h-4 w-4 mr-2" />
          Làm mới Phân tích
        </Button>
        <div className="text-xs text-muted-foreground">
          Được hỗ trợ bởi Google Gemini AI
        </div>
      </CardFooter>
    </Card>
  );
}

// AIStrategyConditions Component
function AIStrategyConditions({
  strategy,
  onSave
}: {
  strategy?: TradingStrategy;
  onSave?: (updatedStrategy: TradingStrategy) => void;
}) {
  const currentStrategy = strategy || {
    id: '',
    userId: '',
    name: '',
    description: '',
    rules: [],
    entryConditions: [],
    exitConditions: [],
    timeframes: [],
    riskRewardRatio: 0,
    createdAt: new Date()
  };
  
  const [showGeminiPanel, setShowGeminiPanel] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Sử dụng hook Gemini Analysis
  const {
    strategyAnalysis,
    suggestionAnalysis,
    analyzeStrategyWithGemini,
    generateSuggestionsWithGemini
  } = useGeminiAnalysis();
  
  // Initialize Gemini API
  const initializeGeminiAPI = useCallback(() => {
    if (apiKey) {
      try {
        geminiService.initialize(apiKey);
        setIsInitialized(true);
        return true;
      } catch (error) {
        console.error('Lỗi khởi tạo Gemini API:', error);
        return false;
      }
    }
    return false;
  }, [apiKey]);
  
  // Handle strategy analysis with Gemini (using real strategy & trade data)
  const handleAnalyzeWithGemini = async () => {
    // If not initialized yet, initialize with API key
    if (!isInitialized) {
      const success = initializeGeminiAPI();
      if (!success) {
        alert('Vui lòng nhập API key Gemini hợp lệ để tiếp tục');
        return;
      }
    }
    
    try {
      // Show Gemini panel immediately so user sees loading state
      setShowGeminiPanel(true);
      
      // For demo purposes, we'll use empty trades array
      // In a real implementation, you would pass actual trades
      const trades: Trade[] = [];
      
      // Run both analyses in parallel
      await Promise.all([
        analyzeStrategyWithGemini(currentStrategy, trades),
        generateSuggestionsWithGemini(currentStrategy, trades)
      ]);
    } catch (error) {
      console.error('Error analyzing with Gemini:', error);
      // Keep panel displayed so user can see error message
    }
  };
  
  // Handle adding a suggestion to the strategy
  const handleAddSuggestion = (suggestion: ConditionSuggestion) => {
    if (!strategy) return;

    // Create new condition from suggestion
    const newCondition: StrategyCondition = {
      id: `${suggestion.id}-${Date.now()}`,
      label: suggestion.condition.label,
      order: strategy.rules.length, // Add at the end
      description: suggestion.condition.description,
      indicator: suggestion.condition.indicator,
      timeframe: suggestion.condition.timeframe,
      expectedValue: suggestion.condition.expectedValue
    };
    
    // Determine where to add the condition based on the title
    let updatedStrategy = { ...strategy };
    const title = suggestion.title.toLowerCase();
    
    if (title.includes('entry') || title.includes('enter')) {
      updatedStrategy.entryConditions = [
        ...updatedStrategy.entryConditions,
        newCondition
      ];
    } else if (title.includes('exit') || title.includes('close')) {
      updatedStrategy.exitConditions = [
        ...updatedStrategy.exitConditions,
        newCondition
      ];
    } else {
      updatedStrategy.rules = [
        ...updatedStrategy.rules,
        newCondition
      ];
    }
    
    // Call save callback with updated strategy
    if (onSave) {
      onSave(updatedStrategy);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* API Key input */}
      {!isInitialized && (
        <Card>
          <CardHeader>
            <CardTitle>API Key Gemini</CardTitle>
            <CardDescription>
              Nhập API key từ Google AI Studio để sử dụng phân tích Gemini AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập Gemini API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button onClick={initializeGeminiAPI}>
                Xác nhận
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Main content - only show if strategy exists */}
      {strategy && (
        <>
          {/* Strategy Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icons.analyze className="h-5 w-5 text-primary" />
                {strategy.name}
              </CardTitle>
              <CardDescription>
                {strategy.description || 'Không có mô tả'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Quy tắc ({strategy.rules.length})</h3>
                  <ul className="space-y-1">
                    {strategy.rules.map((rule, index) => (
                      <li key={rule.id} className="text-sm text-muted-foreground flex items-start">
                        <span className="mr-1">{index + 1}.</span>
                        <span>{rule.label}</span>
                      </li>
                    ))}
                    {strategy.rules.length === 0 && (
                      <li className="text-sm text-muted-foreground">Không có quy tắc nào</li>
                    )}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Điều kiện vào lệnh ({strategy.entryConditions.length})</h3>
                  <ul className="space-y-1">
                    {strategy.entryConditions.map((condition, index) => (
                      <li key={condition.id} className="text-sm text-muted-foreground flex items-start">
                        <span className="mr-1">{index + 1}.</span>
                        <span>{condition.label}</span>
                      </li>
                    ))}
                    {strategy.entryConditions.length === 0 && (
                      <li className="text-sm text-muted-foreground">Không có điều kiện nào</li>
                    )}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Điều kiện thoát lệnh ({strategy.exitConditions.length})</h3>
                  <ul className="space-y-1">
                    {strategy.exitConditions.map((condition, index) => (
                      <li key={condition.id} className="text-sm text-muted-foreground flex items-start">
                        <span className="mr-1">{index + 1}.</span>
                        <span>{condition.label}</span>
                      </li>
                    ))}
                    {strategy.exitConditions.length === 0 && (
                      <li className="text-sm text-muted-foreground">Không có điều kiện nào</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Analyze with Gemini button */}
          {!showGeminiPanel && (
            <Button
              className="relative group w-full overflow-hidden rounded-lg
                        bg-gradient-to-r from-blue-600 via-purple-600 to-pink-700
                        border-0 shadow-xl hover:shadow-2xl transition-all duration-500
                        transform hover:scale-105 hover:-translate-y-1 px-8 py-4"
              onClick={handleAnalyzeWithGemini}
            >
              {/* Background effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm"></div>
              
              {/* Icon và text */}
              <Icons.sparkles className="h-5 w-5 mr-3 text-white animate-pulse group-hover:animate-spin transition-all duration-300" />
              <span className="font-semibold text-white tracking-wide relative z-10 text-base">
                Phân tích với Gemini AI
              </span>
              
              {/* Shine effect */}
              <div className="absolute inset-0 -top-2 -left-2 w-6 h-full bg-white/30 skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000 ease-out"></div>
            </Button>
          )}
          
          {/* Panel phân tích Gemini AI */}
          {showGeminiPanel && (
            <GeminiPanel
              strategyAnalysis={strategyAnalysis}
              suggestionAnalysis={suggestionAnalysis}
              onRefreshAnalysis={handleAnalyzeWithGemini}
              onAddSuggestion={handleAddSuggestion}
            />
          )}
        </>
      )}
    </div>
  );
}

// Main AIStrategyAnalysisTab Component
export default function AIStrategyAnalysisTab() {
  const [strategies, setStrategies] = useState<(TradingStrategy & { id: string })[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('');
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Handler for strategy selection
  const handleStrategyChange = (value: string) => {
    setSelectedStrategyId(value);
    const selected = strategies.find(s => s.id === value) || null;
    setSelectedStrategy(selected);
  };
  
  // Demo strategy for testing
  useEffect(() => {
    setIsLoading(true);
    
    // Demo strategies - in a real app, this would be fetched from API
    const demoStrategies = [
      {
        id: 'demo-strategy-1',
        userId: 'user-1',
        name: 'Breakout with MA Cross',
        description: 'Strategy for finding breakout points combined with MA cross confirmation',
        rules: [
          {
            id: 'rule-1',
            label: 'Only trade during European hours',
            order: 0,
            description: 'Avoid trading during low volatility periods'
          },
          {
            id: 'rule-2',
            label: 'Only trade when ADX > 25',
            order: 1,
            indicator: 'ADX',
            expectedValue: 'Above Level',
            description: 'Ensure trend is strong enough'
          }
        ],
        entryConditions: [
          {
            id: 'entry-1',
            label: 'Price breakout from consolidation zone',
            order: 0,
            indicator: 'Price Action',
            timeframe: 'H1',
            expectedValue: 'Breakout',
            description: 'Consolidation zone must last at least 10 candles'
          },
          {
            id: 'entry-2',
            label: 'EMA 20 crosses above EMA 50',
            order: 1,
            indicator: 'EMA',
            timeframe: 'M15',
            expectedValue: 'Cross Up',
            description: 'Confirms short-term uptrend'
          }
        ],
        exitConditions: [
          {
            id: 'exit-1',
            label: 'Price hits Target Profit',
            order: 0,
            description: 'Automatically take profit at 2R'
          },
          {
            id: 'exit-2',
            label: 'RSI in overbought zone',
            order: 1,
            indicator: 'RSI',
            timeframe: 'M15',
            expectedValue: 'Overbought',
            description: 'Exit when RSI > 70 in an uptrend'
          }
        ],
        timeframes: ['M15', 'H1', 'H4'],
        riskRewardRatio: 2,
        createdAt: new Date()
      },
      {
        id: 'demo-strategy-2',
        userId: 'user-1',
        name: 'Trend Following with Ichimoku',
        description: 'Utilizes Ichimoku Cloud indicators to identify trend direction and strength',
        rules: [
          {
            id: 'rule-1',
            label: 'Trade only in direction of Ichimoku Cloud',
            order: 0,
            description: 'Price above cloud for bullish, below for bearish'
          }
        ],
        entryConditions: [
          {
            id: 'entry-1',
            label: 'Tenkan-sen crosses Kijun-sen',
            order: 0,
            indicator: 'Ichimoku',
            timeframe: 'H4',
            expectedValue: 'Cross',
            description: 'Cross must occur above/below cloud matching direction'
          }
        ],
        exitConditions: [
          {
            id: 'exit-1',
            label: 'Price crosses Kijun-sen in opposite direction',
            order: 0,
            indicator: 'Ichimoku',
            timeframe: 'H4',
            expectedValue: 'Reverse Cross',
            description: 'Signals potential trend reversal'
          }
        ],
        timeframes: ['H1', 'H4', 'D1'],
        riskRewardRatio: 2.5,
        createdAt: new Date()
      }
    ];
    
    setTimeout(() => {
      setStrategies(demoStrategies);
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="space-y-6">
      {/* Strategy selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Icons.analyze className="h-5 w-5 mr-2 text-primary" />
            Chọn Chiến lược để Phân tích AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
          ) : strategies.length > 0 ? (
            <Select
              value={selectedStrategyId}
              onChange={(e) => handleStrategyChange(e.target.value)}
            >
              <option value="">Chọn chiến lược để phân tích</option>
              {strategies.map(strategy => (
                <option key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </option>
              ))}
            </Select>
          ) : (
            <div className="text-muted-foreground text-center py-8">
              <Icons.info className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">Không có Chiến lược</h3>
              <p className="text-sm">Hãy tạo chiến lược trong phần Quản lý Chiến lược trước.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Strategy Conditions component */}
      <div>
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
            <div className="h-20 w-full bg-gray-200 animate-pulse rounded"></div>
            <div className="h-40 w-full bg-gray-200 animate-pulse rounded"></div>
          </div>
        ) : selectedStrategy ? (
          <AIStrategyConditions
            strategy={selectedStrategy}
            onSave={(updatedStrategy) => {
              console.log('Strategy updated:', updatedStrategy);
              alert("Chiến lược đã được cập nhật với đề xuất từ AI.");
            }}
          />
        ) : (
          <div className="text-center p-8 border rounded-md">
            <Icons.info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Chọn một chiến lược để bắt đầu phân tích AI</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Export dịch vụ Gemini để có thể sử dụng riêng
export { geminiService, useGeminiAnalysis, AIStrategyConditions, GeminiPanel };
/**
 * Balance Calculation Rules
 * 
 * Tài liệu này định nghĩa các quy tắc tính toán Account Balance trong toàn bộ ứng dụng.
 * Các quy tắc này cần được tuân thủ trong mọi tính toán liên quan đến số dư tài khoản.
 * 
 * Đây là hướng dẫn áp dụng cho tất cả các nhà phát triển hiện tại và tương lai.
 */

/**
 * QUY TẮC TÍNH TOÁN SỐ DƯ TÀI KHOẢN:
 * 
 * 1. Khi chưa có giao dịch:
 *    - Current Balance = Initial Balance
 *    - KHÔNG hiển thị thông tin P&L và phần trăm
 *    - KHÔNG hiển thị "lỗ" khi Initial Balance thay đổi
 * 
 * 2. Khi đã có giao dịch:
 *    - Current Balance = Initial Balance + Tổng P&L của tất cả giao dịch đã đóng
 *    - Hiển thị thông tin P&L và phần trăm lãi/lỗ
 *    - P&L = Current Balance - Initial Balance
 *    - P&L Percentage = (P&L / Initial Balance) * 100
 * 
 * 3. Xử lý thay đổi Initial Balance:
 *    - Khi người dùng thay đổi Initial Balance trong Settings, chỉ thay đổi điểm tham chiếu
 *    - Toàn bộ P&L được tính lại dựa trên Initial Balance mới
 *    - Initial Balance chỉ là điểm tham chiếu, KHÔNG ảnh hưởng đến các giao dịch đã thực hiện
 *
 * 4. Quy tắc hiển thị:
 *    - Khi chưa có giao dịch: Hiển thị "No trade history yet" thay vì P&L
 *    - Khi đã có giao dịch: Hiển thị đầy đủ thông tin P&L với định dạng tiền tệ và phần trăm
 * 
 * 5. Profit Factor:
 *    - Profit Factor = Tổng lợi nhuận từ giao dịch thắng / Tổng lỗ từ giao dịch thua (giá trị tuyệt đối)
 *    - Khi không có giao dịch thua (totalLoss = 0), Profit Factor là Infinity (∞)
 *    - Profit Factor chỉ được tính trên các giao dịch đã đóng
 */

/**
 * Kiểm tra xem một giao dịch có phải là giao dịch đã đóng hay không
 * @param trade Giao dịch cần kiểm tra
 * @returns true nếu là giao dịch đã đóng, ngược lại false
 */
export function isClosedTrade(trade: any): boolean {
  // Phải có giá đóng và ngày đóng
  if (!trade.exitPrice || !trade.closeDate) return false;
  
  // Trạng thái phải đóng (không phải OPEN, hoặc isOpen = false)
  if (trade.status === "OPEN") return false;
  if ('isOpen' in trade && trade.isOpen === true) return false;
  
  return true;
}

/**
 * Lọc danh sách trades để lấy các giao dịch đã đóng
 * @param trades Danh sách giao dịch
 * @returns Danh sách các giao dịch đã đóng
 */
export function getClosedTrades(trades: any[]): any[] {
  return trades.filter(trade => isClosedTrade(trade));
}

/**
 * Kiểm tra xem account có giao dịch đã đóng nào không
 * @param trades Danh sách giao dịch
 * @returns true nếu có ít nhất một giao dịch đã đóng, ngược lại false
 */
export function hasClosedTrades(trades: any[]): boolean {
  return trades.some(trade => isClosedTrade(trade));
}

/**
 * Tính toán Current Balance dựa trên Initial Balance và danh sách giao dịch
 * @param initialBalance Số dư ban đầu
 * @param trades Danh sách tất cả giao dịch
 * @returns Số dư hiện tại
 */
export function calculateCurrentBalance(initialBalance: number, trades: any[]): number {
  // Nếu không có giao dịch nào đã đóng, current balance = initial balance
  if (!hasClosedTrades(trades)) {
    return initialBalance;
  }
  
  // Lọc các giao dịch đã đóng sử dụng hàm helper
  const closedTrades = getClosedTrades(trades);
  
  // Tính tổng P&L
  const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
  
  // Current Balance = Initial Balance + Tổng P&L
  return initialBalance + totalPnL;
}

/**
 * Tính toán P&L dựa trên Initial Balance và Current Balance
 * @param initialBalance Số dư ban đầu
 * @param currentBalance Số dư hiện tại
 * @param trades Danh sách tất cả giao dịch (để kiểm tra có giao dịch nào không)
 * @returns Đối tượng chứa thông tin P&L và phần trăm
 */
export function calculatePnL(initialBalance: number, currentBalance: number, trades: any[]): {
  profitLoss: number;
  profitLossPercentage: number;
} {
  // Nếu không có giao dịch nào, trả về P&L = 0
  if (!hasClosedTrades(trades)) {
    return {
      profitLoss: 0,
      profitLossPercentage: 0
    };
  }
  
  const profitLoss = currentBalance - initialBalance;
  const profitLossPercentage = (profitLoss / initialBalance) * 100;
  
  return {
    profitLoss,
    profitLossPercentage
  };
}

/**
 * Tính Profit Factor dựa trên danh sách giao dịch
 * @param trades Danh sách giao dịch
 * @returns Profit Factor
 */
export function calculateProfitFactor(trades: any[]): number {
  // Chỉ tính profit factor trên các giao dịch đã đóng
  const closedTrades = getClosedTrades(trades);
  
  if (closedTrades.length === 0) return 0;
  
  const winningTrades = closedTrades.filter(trade => (trade.profitLoss || 0) > 0);
  const losingTrades = closedTrades.filter(trade => (trade.profitLoss || 0) < 0);
  
  const totalProfit = winningTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
  const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0));
  
  // Xử lý trường hợp đặc biệt: không có giao dịch thua
  if (totalLoss === 0) {
    return totalProfit > 0 ? Number.POSITIVE_INFINITY : 0;
  }
  
  return totalProfit / totalLoss;
}

/**
 * Định dạng Profit Factor cho hiển thị
 * @param profitFactor Giá trị Profit Factor
 * @returns Chuỗi đã định dạng
 */
export function formatProfitFactor(profitFactor: number): string {
  if (!Number.isFinite(profitFactor)) return '∞';
  if (profitFactor > 999.99) return '>999.99';
  return profitFactor.toFixed(2);
}
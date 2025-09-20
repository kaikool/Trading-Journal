
import { Trade } from "@/types";
import { format } from 'date-fns';

// Helper function to safely escape CSV fields
const escapeCSV = (field: any): string => {
    if (field === null || field === undefined) {
        return '""';
    }
    const stringField = String(field);
    // If the field contains a comma, double quote, or newline, enclose it in double quotes
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        // Within a quoted field, any double quote must be escaped by another double quote
        const escapedField = stringField.replace(/"/g, '""');
        return `"${escapedField}"`;
    }
    return `"${stringField}"`;
};

// Helper to format values based on their type
const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    // Check if it's a Firestore Timestamp-like object
    if (value && typeof value.toDate === 'function') {
        return format(value.toDate(), 'yyyy-MM-dd HH:mm:ss');
    }
    if (Array.isArray(value)) {
        return value.join('; '); // Use semicolon to avoid conflict with CSV comma
    }
    return String(value);
};

export const exportTradesToCSV = (trades: Trade[]) => {
    if (!trades || trades.length === 0) {
        alert("No trades to export.");
        return;
    }

    // Define headers in a logical order
    const headers = [
        'id', 'pair', 'direction', 'status', 'result',
        'lotSize', 'pips', 'profitLoss', 'commission', 'fee',
        'entryPrice', 'exitPrice', 'stopLoss', 'takeProfit',
        'riskRewardRatio', 'createdAt', 'closeDate',
        'strategy', 'sessionType', 'emotion', 'marketCondition', 'techPattern',
        'followedPlan', 'enteredEarly', 'revenge', 'overLeveraged', 'movedStopLoss', 'hasNews',
        'notes', 'closingNote',
        'entryImage', 'exitImage', 'entryImageM15', 'exitImageM15',
        'usedRules', 'usedEntryConditions'
    ];

    const csvRows = [headers.join(',')];

    for (const trade of trades) {
        const row = headers.map(header => {
            const value = formatValue((trade as any)[header]);
            return escapeCSV(value);
        });
        csvRows.push(row.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
        link.setAttribute('href', url);
        link.setAttribute('download', `trading_history_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

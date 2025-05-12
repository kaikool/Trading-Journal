/**
 * Extended Goal interface cho type-checking
 * 
 * Interface này giúp TypeScript nhận biết đúng kiểu dữ liệu
 * khi làm việc với goals từ Firebase
 */
import { Goal, Milestone } from './index';

// Định nghĩa interface cho Goal với milestones
export interface GoalWithMilestones extends Goal {
  milestones: Milestone[];
}
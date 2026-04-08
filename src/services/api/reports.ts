import { post } from '@/services/api/client';

export type ReportCategory =
  | 'incorrect_legal'
  | 'not_accessible'
  | 'private_property'
  | 'score_too_high'
  | 'score_too_low'
  | 'other';

type SpotReport = {
  id: string;
  spot_id: string;
  category: ReportCategory;
  comment: string | null;
  created_at: string;
};

export const reportSpot = async (
  spotId: string,
  category: ReportCategory,
  comment?: string,
): Promise<SpotReport> => {
  const body: Record<string, unknown> = {
    spot_id: spotId,
    category,
  };
  if (comment) {
    body.comment = comment;
  }
  return post<SpotReport>('/reports', body);
};

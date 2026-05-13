import { activityRepository } from "@/repositories/activity.repository";

export const activityService = {
  async ping(tenantId: string, userId: string, currentPage: string | null) {
    return activityRepository.upsertPing(tenantId, userId, currentPage);
  },
};

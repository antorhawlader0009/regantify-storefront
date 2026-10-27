/*
 * A buyer's video on their own review, shared by every template. One per review, at most 15 MB, only on stores on the Advance plan and only
 * for a buyer the server allows (getReviewPhotoEligibility's canAddVideo). The file is sent as it is (a browser can't shrink video cheaply),
 * so the size is checked here before uploading and again on the server (server/src/reviews/review-video.ts holds the same numbers).
 */

export const MAX_REVIEW_VIDEO_MB = 15;
const MAX_REVIEW_VIDEO_BYTES = MAX_REVIEW_VIDEO_MB * 1024 * 1024;

/** The kinds the server keeps (it checks the first bytes too). */
export const REVIEW_VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm';

/** Why a picked file can't be used, or null when it is fine. */
export function reviewVideoProblem(file: File): 'type' | 'size' | null {
  const okType = /^video\/(mp4|quicktime|webm)$/.test(file.type) || /\.(mp4|mov|webm)$/i.test(file.name);
  if (!okType) return 'type';
  if (file.size > MAX_REVIEW_VIDEO_BYTES) return 'size';
  return null;
}

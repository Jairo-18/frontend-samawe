export interface ReviewUser {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface ReviewReply {
  reviewReplyId: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
}

export interface Review {
  reviewId: number;
  title: string;
  comment: string;
  score: number;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
  replies: ReviewReply[];
}

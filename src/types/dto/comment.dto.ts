export interface CreateCommentDTO {
  content: string;
  parentId?: number;
}

export interface UpdateCommentDTO {
  content: string;
}

export interface CommentAuthorDTO {
  id: number;
  username?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
}

export interface CommentResponseDTO {
  id: number;
  author: CommentAuthorDTO;
  content: string;
  likesCount: number;
  isLiked: boolean;
  replies: CommentResponseDTO[];
  createdAt: Date;
  updatedAt: Date;
}

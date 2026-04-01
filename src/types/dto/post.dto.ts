import { MediaType } from '../../constants/enums';

export interface PostMediaDTO {
  url: string;
  thumbnailUrl?: string;
  type: MediaType;
  order?: number;
  fileSize?: number;
  mimeType?: string;
}

export interface CreatePostDTO {
  caption?: string;
  location?: string;
  media?: Array<{
    url: string;
    type: MediaType;
    order?: number;
  }>;
}

export interface UpdatePostDTO {
  caption?: string;
  location?: string;
  media?: Array<{
    url: string;
    type: MediaType;
    order?: number;
  }>;
}

export interface PostAuthorDTO {
  id: number;
  username?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
}

export interface PostResponseDTO {
  id: number;
  author: PostAuthorDTO;
  caption?: string | null;
  location?: string | null;
  media: PostMediaDTO[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: Date;
  updatedAt: Date;
}
